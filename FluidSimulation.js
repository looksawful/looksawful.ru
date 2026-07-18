import * as THREE from "three";
import shaders from "./shaders.js";

const MAX_PIXEL_RATIO = 2;
const RESIZE_DELAY = 120;

function createDoubleTarget(createTarget, width, height, format) {
  return {
    read: createTarget(width, height, format),
    write: createTarget(width, height, format),

    swap() {
      const current = this.read;

      this.read = this.write;
      this.write = current;
    },
  };
}

export class FluidSimulation {
  constructor(canvas, config, { root = canvas.parentElement } = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("FluidSimulation requires a canvas element.");
    }

    if (!(root instanceof HTMLElement)) {
      throw new TypeError("FluidSimulation requires a root element.");
    }

    this.canvas = canvas;
    this.root = root;
    this.config = config;

    this.running = true;
    this.frame = 0;
    this.resizeTimer = 0;
    this.lastTime = 0;

    this.inViewport = this._isRootInViewport();

    this.documentVisible = !document.hidden;

    this.simTexel = new THREE.Vector2();

    this.dyeTexel = new THREE.Vector2();

    this.splatPoint = new THREE.Vector2();

    this.velocityColor = new THREE.Vector3();

    this.dyeColor = new THREE.Vector3(3, 3, 3);

    this._tick = this._tick.bind(this);

    this._scheduleResize = this._scheduleResize.bind(this);

    this._handleDocumentVisibility = this._handleDocumentVisibility.bind(this);

    this._setupRenderer();
    this._setupScene();
    this._setupTargets();
    this._setupMaterials();
    this._setupInput();
    this._setupVisibility();
    this._updatePlayback();
  }

  _isRootInViewport() {
    const rect = this.root.getBoundingClientRect();

    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });

    this.renderer.setClearColor(0x000000, 0);

    this._applyResize(false);

    this.resizeObserver = window.ResizeObserver ? new ResizeObserver(this._scheduleResize) : null;

    this.resizeObserver?.observe(this.root);

    window.addEventListener("resize", this._scheduleResize, {
      passive: true,
    });
  }

  _scheduleResize() {
    if (!this.running) {
      return;
    }

    window.clearTimeout(this.resizeTimer);

    this.resizeTimer = window.setTimeout(() => {
      this.resizeTimer = 0;

      this._applyResize(true);
    }, RESIZE_DELAY);
  }

  _applyResize(rebuildTargets) {
    if (!this.renderer) {
      return;
    }

    const rect = this.root.getBoundingClientRect();

    const cssWidth = Math.max(1, Math.round(rect.width));

    const cssHeight = Math.max(1, Math.round(rect.height));

    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

    const nextWidth = Math.max(1, Math.round(cssWidth * pixelRatio));

    const nextHeight = Math.max(1, Math.round(cssHeight * pixelRatio));

    const sizeChanged = nextWidth !== this.width || nextHeight !== this.height;

    this.renderer.setPixelRatio(pixelRatio);

    this.renderer.setSize(cssWidth, cssHeight, false);

    this.dpr = pixelRatio;
    this.width = nextWidth;
    this.height = nextHeight;

    if (!sizeChanged || !rebuildTargets || !this.velocity) {
      return;
    }

    this._stopLoop();

    this.renderer.setRenderTarget(null);

    this._disposeTargets();
    this._setupTargets();
    this._updatePlayback();
  }

  _setupScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.quad = new THREE.Mesh(this.geometry);

    this.scene.add(this.quad);
  }

  _createTarget(width, height, format) {
    return new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format,

      minFilter: THREE.LinearFilter,

      magFilter: THREE.LinearFilter,

      wrapS: THREE.ClampToEdgeWrapping,

      wrapT: THREE.ClampToEdgeWrapping,

      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
  }

  _setupTargets() {
    const { simResolution, dyeResolution } = this.config;

    const aspect = this.width / this.height;

    this.simSize = {
      w: simResolution,

      h: Math.max(1, Math.round(simResolution / aspect)),
    };

    this.dyeSize = {
      w: dyeResolution,

      h: Math.max(1, Math.round(dyeResolution / aspect)),
    };

    const createTarget = this._createTarget.bind(this);

    /*
     * Velocity использует только два
     * канала: X и Y.
     */
    this.velocity = createDoubleTarget(
      createTarget,
      this.simSize.w,
      this.simSize.h,
      THREE.RGFormat,
    );

    /*
     * Dye остаётся RGBA, потому что
     * display-шейдер использует RGB.
     */
    this.dye = createDoubleTarget(createTarget, this.dyeSize.w, this.dyeSize.h, THREE.RGBAFormat);

    /*
     * Divergence, curl и pressure
     * используют только красный канал.
     */
    this.divergence = createTarget(this.simSize.w, this.simSize.h, THREE.RedFormat);

    this.curl = createTarget(this.simSize.w, this.simSize.h, THREE.RedFormat);

    this.pressure = createDoubleTarget(
      createTarget,
      this.simSize.w,
      this.simSize.h,
      THREE.RedFormat,
    );

    this._clearTargets();

    this.simTexel.set(1 / this.simSize.w, 1 / this.simSize.h);

    this.dyeTexel.set(1 / this.dyeSize.w, 1 / this.dyeSize.h);
  }

  _clearTargets() {
    const previousTarget = this.renderer.getRenderTarget();
    const previousColor = this.renderer.getClearColor(new THREE.Color());
    const previousAlpha = this.renderer.getClearAlpha();

    this.renderer.setClearColor(0x000000, 0);

    const targets = [
      this.velocity.read,
      this.velocity.write,
      this.dye.read,
      this.dye.write,
      this.divergence,
      this.curl,
      this.pressure.read,
      this.pressure.write,
    ];

    for (const target of targets) {
      this.renderer.setRenderTarget(target);
      this.renderer.clear(true, false, false);
    }

    this.renderer.setRenderTarget(previousTarget);
    this.renderer.setClearColor(previousColor, previousAlpha);
  }

  _setupMaterials() {
    const makeMaterial = ([vertexShader, fragmentShader], uniforms) =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      });

    const textureUniform = () => ({
      value: null,
    });

    const numberUniform = (value = 0) => ({
      value,
    });

    const vectorUniform = () => ({
      value: new THREE.Vector2(),
    });

    this.material = {
      splat: makeMaterial(shaders.splat, {
        uTarget: textureUniform(),

        aspectRatio: numberUniform(),

        radius: numberUniform(),

        color: {
          value: new THREE.Vector3(),
        },

        point: {
          value: new THREE.Vector2(),
        },
      }),

      advection: makeMaterial(shaders.advection, {
        uVelocity: textureUniform(),

        uSource: textureUniform(),

        texelSize: vectorUniform(),

        dt: numberUniform(),

        dissipation: numberUniform(),
      }),

      divergence: makeMaterial(shaders.divergence, {
        uVelocity: textureUniform(),

        texelSize: vectorUniform(),
      }),

      curl: makeMaterial(shaders.curl, {
        uVelocity: textureUniform(),

        texelSize: vectorUniform(),
      }),

      vorticity: makeMaterial(shaders.vorticity, {
        uVelocity: textureUniform(),

        uCurl: textureUniform(),

        texelSize: vectorUniform(),

        curlStrength: numberUniform(),

        dt: numberUniform(),
      }),

      pressure: makeMaterial(shaders.pressure, {
        uPressure: textureUniform(),

        uDivergence: textureUniform(),

        texelSize: vectorUniform(),
      }),

      gradientSubtract: makeMaterial(shaders.gradientSubtract, {
        uPressure: textureUniform(),

        uVelocity: textureUniform(),

        texelSize: vectorUniform(),
      }),

      clear: makeMaterial(shaders.clear, {
        uTexture: textureUniform(),

        value: numberUniform(),
      }),

      display: makeMaterial(shaders.display, {
        uTexture: textureUniform(),

        threshold: numberUniform(),

        edgeSoftness: numberUniform(),

        inkColor: {
          value: new THREE.Color(),
        },
      }),
    };
  }

  _setupInput() {
    this.mouse = {
      x: 0,
      y: 0,

      velocityX: 0,
      velocityY: 0,

      moved: false,
      initialized: false,
    };

    this._resetPointer = () => {
      this.mouse.initialized = false;
      this.mouse.moved = false;
      this.mouse.velocityX = 0;
      this.mouse.velocityY = 0;
    };

    this._onPointerMove = (event) => {
      if (!this.inViewport || !this.documentVisible) {
        return;
      }

      const rect = this.root.getBoundingClientRect();

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        this._resetPointer();
        return;
      }

      const nextX = (event.clientX - rect.left) * this.dpr;

      const nextY = (event.clientY - rect.top) * this.dpr;

      if (!this.mouse.initialized) {
        this.mouse.x = nextX;
        this.mouse.y = nextY;

        this.mouse.initialized = true;

        return;
      }

      this.mouse.velocityX = (nextX - this.mouse.x) * this.config.forceStrength;

      this.mouse.velocityY = (nextY - this.mouse.y) * this.config.forceStrength;

      this.mouse.x = nextX;
      this.mouse.y = nextY;
      this.mouse.moved = true;
    };

    window.addEventListener("pointermove", this._onPointerMove, {
      passive: true,
    });

    window.addEventListener("blur", this._resetPointer);
  }

  _setupVisibility() {
    if ("IntersectionObserver" in window) {
      this.intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          this.inViewport = Boolean(entry?.isIntersecting);

          if (!this.inViewport) {
            this._resetPointer();
          }

          this._updatePlayback();
        },
        {
          threshold: 0.01,
        },
      );

      this.intersectionObserver.observe(this.root);
    }

    document.addEventListener("visibilitychange", this._handleDocumentVisibility);
  }

  _handleDocumentVisibility() {
    this.documentVisible = !document.hidden;

    if (!this.documentVisible) {
      this._resetPointer();
    }

    this._updatePlayback();
  }

  _shouldAnimate() {
    return this.running && this.inViewport && this.documentVisible;
  }

  _updatePlayback() {
    if (this._shouldAnimate()) {
      this._startLoop();
    } else {
      this._stopLoop();
    }
  }

  _startLoop() {
    if (this.frame || !this._shouldAnimate()) {
      return;
    }

    this.lastTime = performance.now();

    this.frame = requestAnimationFrame(this._tick);
  }

  _stopLoop() {
    if (!this.frame) {
      return;
    }

    cancelAnimationFrame(this.frame);

    this.frame = 0;
  }

  _tick(time) {
    this.frame = 0;

    if (!this._shouldAnimate()) {
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.016);

    this.lastTime = time;

    if (this.mouse.moved) {
      this._splat(this.mouse.x, this.mouse.y, this.mouse.velocityX, this.mouse.velocityY);

      this.mouse.moved = false;
    }

    this._simulate(dt);
    this._render();

    this.frame = requestAnimationFrame(this._tick);
  }

  _pass(material, target) {
    this.quad.material = material;

    this.renderer.setRenderTarget(target ?? null);

    this.renderer.render(this.scene, this.camera);
  }

  _splat(x, y, velocityX, velocityY) {
    const splatUniforms = this.material.splat.uniforms;

    this.splatPoint.set(x / this.width, 1 - y / this.height);

    this.velocityColor.set(velocityX, -velocityY, 0);

    splatUniforms.aspectRatio.value = this.width / this.height;

    splatUniforms.radius.value = this.config.splatRadius / 100;

    splatUniforms.point.value.copy(this.splatPoint);

    splatUniforms.uTarget.value = this.velocity.read.texture;

    splatUniforms.color.value.copy(this.velocityColor);

    this._pass(this.material.splat, this.velocity.write);

    this.velocity.swap();

    splatUniforms.uTarget.value = this.dye.read.texture;

    splatUniforms.color.value.copy(this.dyeColor);

    this._pass(this.material.splat, this.dye.write);

    this.dye.swap();
  }

  _simulate(dt) {
    const materials = this.material;

    const curlUniforms = materials.curl.uniforms;

    curlUniforms.uVelocity.value = this.velocity.read.texture;

    curlUniforms.texelSize.value.copy(this.simTexel);

    this._pass(materials.curl, this.curl);

    const vorticityUniforms = materials.vorticity.uniforms;

    vorticityUniforms.uVelocity.value = this.velocity.read.texture;

    vorticityUniforms.uCurl.value = this.curl.texture;

    vorticityUniforms.texelSize.value.copy(this.simTexel);

    vorticityUniforms.curlStrength.value = this.config.curl;

    vorticityUniforms.dt.value = dt;

    this._pass(materials.vorticity, this.velocity.write);

    this.velocity.swap();

    const divergenceUniforms = materials.divergence.uniforms;

    divergenceUniforms.uVelocity.value = this.velocity.read.texture;

    divergenceUniforms.texelSize.value.copy(this.simTexel);

    this._pass(materials.divergence, this.divergence);

    const clearUniforms = materials.clear.uniforms;

    clearUniforms.uTexture.value = this.pressure.read.texture;

    clearUniforms.value.value = this.config.pressureDecay;

    this._pass(materials.clear, this.pressure.write);

    this.pressure.swap();

    const pressureUniforms = materials.pressure.uniforms;

    pressureUniforms.uDivergence.value = this.divergence.texture;

    pressureUniforms.texelSize.value.copy(this.simTexel);

    for (let index = 0; index < this.config.pressureIterations; index += 1) {
      pressureUniforms.uPressure.value = this.pressure.read.texture;

      this._pass(materials.pressure, this.pressure.write);

      this.pressure.swap();
    }

    const gradientUniforms = materials.gradientSubtract.uniforms;

    gradientUniforms.uPressure.value = this.pressure.read.texture;

    gradientUniforms.uVelocity.value = this.velocity.read.texture;

    gradientUniforms.texelSize.value.copy(this.simTexel);

    this._pass(materials.gradientSubtract, this.velocity.write);

    this.velocity.swap();

    const advectionUniforms = materials.advection.uniforms;

    advectionUniforms.uVelocity.value = this.velocity.read.texture;

    advectionUniforms.uSource.value = this.velocity.read.texture;

    advectionUniforms.texelSize.value.copy(this.simTexel);

    advectionUniforms.dt.value = dt;

    advectionUniforms.dissipation.value = this.config.velocityDissipation;

    this._pass(materials.advection, this.velocity.write);

    this.velocity.swap();

    advectionUniforms.uVelocity.value = this.velocity.read.texture;

    advectionUniforms.uSource.value = this.dye.read.texture;

    advectionUniforms.texelSize.value.copy(this.dyeTexel);

    advectionUniforms.dt.value = dt;

    advectionUniforms.dissipation.value = this.config.dyeDissipation;

    this._pass(materials.advection, this.dye.write);

    this.dye.swap();
  }

  _render() {
    const displayUniforms = this.material.display.uniforms;

    displayUniforms.uTexture.value = this.dye.read.texture;

    displayUniforms.threshold.value = this.config.threshold;

    displayUniforms.edgeSoftness.value = this.config.edgeSoftness;

    displayUniforms.inkColor.value.copy(this.config.inkColor);

    this._pass(this.material.display, null);
  }

  _disposeTargets() {
    const targets = [
      this.velocity?.read,
      this.velocity?.write,

      this.dye?.read,
      this.dye?.write,

      this.divergence,
      this.curl,

      this.pressure?.read,
      this.pressure?.write,
    ];

    for (const target of targets) {
      target?.dispose();
    }

    this.velocity = null;
    this.dye = null;
    this.divergence = null;
    this.curl = null;
    this.pressure = null;
  }

  destroy() {
    if (!this.running) {
      return;
    }

    this.running = false;

    this._stopLoop();

    window.clearTimeout(this.resizeTimer);

    this.resizeTimer = 0;

    window.removeEventListener("pointermove", this._onPointerMove);

    window.removeEventListener("blur", this._resetPointer);

    window.removeEventListener("resize", this._scheduleResize);

    document.removeEventListener("visibilitychange", this._handleDocumentVisibility);

    this.resizeObserver?.disconnect();

    this.intersectionObserver?.disconnect();

    this.renderer.setRenderTarget(null);

    this._disposeTargets();

    for (const material of Object.values(this.material)) {
      material.dispose();
    }

    this.scene.remove(this.quad);
    this.scene.clear();

    this.geometry.dispose();

    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();

    /*
     * Уменьшает backing buffer canvas
     * после удаления WebGL-контекста.
     */
    this.canvas.width = 1;
    this.canvas.height = 1;

    this.material = null;
    this.quad = null;
    this.geometry = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.mouse = null;
    this.root = null;
    this.canvas = null;
  }
}
