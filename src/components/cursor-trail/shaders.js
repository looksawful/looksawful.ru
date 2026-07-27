/**
 * Shared full-screen vertex shader.
 *
 * Every simulation operation is executed by drawing one 2×2 plane that fills
 * clip space. The fragment shader then runs once for every pixel of the active
 * render target.
 *
 * `uv` is provided by THREE.PlaneGeometry. It ranges from 0 to 1 and is passed
 * to the fragment shader through `vUv`.
 *
 * The plane already occupies normalized device coordinates, so no model, view,
 * or projection matrices are needed here.
 */
const v = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/**
 * Shared precision declarations used by the fragment shaders.
 *
 * Fluid simulation repeatedly stores and reads numerical fields. High float
 * precision reduces accumulated errors in velocity and pressure calculations.
 */
const p = `precision highp float;`;
const s = `precision mediump sampler2D;`;

export default {
  /**
   * SPLAT
   *
   * Adds a localized Gaussian impulse to an existing texture.
   *
   * The same shader is used twice for every pointer movement:
   *
   * 1. Add pointer velocity to the velocity texture.
   * 2. Add visible density to the dye texture.
   *
   * `uTarget`      Existing field that will be modified.
   * `aspectRatio` Corrects distance so a splat remains circular on a
   *               rectangular viewport.
   * `radius`      Controls Gaussian width. Larger values create wider splats.
   * `color`       Value added to the target. For velocity, XY store force. For
   *               dye, RGB store visible density.
   * `point`       Splat center in normalized UV coordinates.
   */
  splat: [
    v,
    `
${p}
${s}

uniform sampler2D uTarget;
uniform float aspectRatio;
uniform float radius;
uniform vec3 color;
uniform vec2 point;

varying vec2 vUv;

void main() {
  // Vector from the pointer position to the current fragment.
  vec2 p = vUv - point;

  // UV space is always square, even when the viewport is not. Multiplying X by
  // the viewport aspect ratio keeps the visible impulse approximately circular.
  p.x *= aspectRatio;

  // Squared distance is enough for the Gaussian and avoids an unnecessary
  // square-root operation.
  float distanceSquared = dot(p, p);

  // At the center the exponent is zero, so the influence is 1. Farther away
  // the influence approaches zero smoothly.
  float influence = exp(-distanceSquared / radius);

  // Preserve the existing field and add the new local impulse.
  vec3 result = texture2D(uTarget, vUv).xyz + influence * color;

  gl_FragColor = vec4(result, 1.0);
}
`,
  ],

  /**
   * ADVECTION
   *
   * Transports a source field through the velocity field using backward
   * semi-Lagrangian advection.
   *
   * For every output pixel, the shader reads velocity, traces backward in time,
   * and samples the source texture at the previous position. This avoids holes
   * that would occur with forward particle-like movement.
   *
   * `uVelocity`   Flow field. R = horizontal velocity, G = vertical velocity.
   * `uSource`     Field being transported: velocity itself or dye.
   * `texelSize`   1 / texture dimensions. Converts velocity to UV displacement.
   * `dt`          Time step in seconds.
   * `dissipation` Multiplier that gradually removes energy or dye.
   */
  advection: [
    v,
    `
${p}
${s}

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

varying vec2 vUv;

void main() {
  vec2 velocity = texture2D(uVelocity, vUv).xy;

  // Find where the value currently reaching this pixel was located one time
  // step earlier.
  vec2 previousPosition = vUv - dt * velocity * texelSize;

  vec3 sourceValue = texture2D(uSource, previousPosition).rgb;

  gl_FragColor = vec4(dissipation * sourceValue, 1.0);
}
`,
  ],

  /**
   * DIVERGENCE
   *
   * Measures local compression or expansion of the velocity field.
   *
   * An incompressible fluid should have divergence equal to zero. Positive
   * divergence behaves like a source; negative divergence behaves like a sink.
   * The pressure solver uses this field to remove both.
   *
   * The `vel` helper implements reflective boundary conditions. When a sample
   * crosses a wall, its coordinate is clamped and the perpendicular velocity
   * component is inverted so fluid does not flow through the edge.
   */
  divergence: [
    v,
    `
${p}
${s}

uniform sampler2D uVelocity;
uniform vec2 texelSize;

varying vec2 vUv;

vec2 vel(vec2 uv) {
  // Component multipliers. They remain +1 inside the domain and become -1 for
  // the component perpendicular to a crossed boundary.
  vec2 edgeSign = vec2(1.0);

  if (uv.x < 0.0) {
    uv.x = 0.0;
    edgeSign.x = -1.0;
  }

  if (uv.x > 1.0) {
    uv.x = 1.0;
    edgeSign.x = -1.0;
  }

  if (uv.y < 0.0) {
    uv.y = 0.0;
    edgeSign.y = -1.0;
  }

  if (uv.y > 1.0) {
    uv.y = 1.0;
    edgeSign.y = -1.0;
  }

  return edgeSign * texture2D(uVelocity, uv).xy;
}

void main() {
  vec2 L = vUv - vec2(texelSize.x, 0.0);
  vec2 R = vUv + vec2(texelSize.x, 0.0);
  vec2 T = vUv + vec2(0.0, texelSize.y);
  vec2 B = vUv - vec2(0.0, texelSize.y);

  // Centered finite-difference approximation:
  // dVx/dx + dVy/dy.
  float divergenceValue = 0.5 * (
    vel(R).x -
    vel(L).x +
    vel(T).y -
    vel(B).y
  );

  // Divergence is a scalar, so only the red channel is required.
  gl_FragColor = vec4(divergenceValue, 0.0, 0.0, 1.0);
}
`,
  ],

  /**
   * CURL
   *
   * Calculates the signed rotational tendency of the 2D velocity field.
   * In two dimensions curl has one useful scalar component perpendicular to the
   * screen. Positive and negative values represent opposite rotation directions.
   *
   * The result is consumed by the vorticity-confinement pass.
   */
  curl: [
    v,
    `
${p}
${s}

uniform sampler2D uVelocity;
uniform vec2 texelSize;

varying vec2 vUv;

void main() {
  vec2 L = vUv - vec2(texelSize.x, 0.0);
  vec2 R = vUv + vec2(texelSize.x, 0.0);
  vec2 T = vUv + vec2(0.0, texelSize.y);
  vec2 B = vUv - vec2(0.0, texelSize.y);

  // Approximation of dVy/dx - dVx/dy.
  float curlValue =
    texture2D(uVelocity, R).y -
    texture2D(uVelocity, L).y -
    texture2D(uVelocity, T).x +
    texture2D(uVelocity, B).x;

  gl_FragColor = vec4(curlValue, 0.0, 0.0, 1.0);
}
`,
  ],

  /**
   * PRESSURE
   *
   * Performs one Jacobi iteration for the pressure Poisson equation:
   *
   *   Laplacian(pressure) = divergence
   *
   * One pass is only an approximation. FluidSimulation runs this shader many
   * times while swapping two pressure textures. More iterations improve the
   * incompressibility correction but cost more GPU time.
   */
  pressure: [
    v,
    `
${p}
${s}

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;

varying vec2 vUv;

void main() {
  // Clamp neighbor coordinates to keep all pressure samples inside the texture.
  vec2 L = clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0);
  vec2 R = clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0);
  vec2 T = clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0);
  vec2 B = clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0);

  float pressureValue = (
    texture2D(uPressure, L).x +
    texture2D(uPressure, R).x +
    texture2D(uPressure, T).x +
    texture2D(uPressure, B).x -
    texture2D(uDivergence, vUv).x
  ) * 0.25;

  gl_FragColor = vec4(pressureValue, 0.0, 0.0, 1.0);
}
`,
  ],

  /**
   * VORTICITY CONFINEMENT
   *
   * Semi-Lagrangian advection is stable but numerically diffusive: it removes
   * small vortices. This pass restores rotational detail by applying a force
   * toward areas with stronger curl.
   *
   * It computes the gradient of absolute curl, normalizes that direction, then
   * multiplies it by the signed local curl and `curlStrength`. The sign preserves
   * clockwise versus counter-clockwise rotation.
   */
  vorticity: [
    v,
    `
${p}
${s}

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 texelSize;
uniform float curlStrength;
uniform float dt;

varying vec2 vUv;

void main() {
  vec2 L = vUv - vec2(texelSize.x, 0.0);
  vec2 R = vUv + vec2(texelSize.x, 0.0);
  vec2 T = vUv + vec2(0.0, texelSize.y);
  vec2 B = vUv - vec2(0.0, texelSize.y);

  // Gradient of curl magnitude. Absolute values make the direction depend on
  // vortex strength rather than rotation sign.
  vec2 curlGradient = vec2(
    abs(texture2D(uCurl, T).x) - abs(texture2D(uCurl, B).x),
    abs(texture2D(uCurl, R).x) - abs(texture2D(uCurl, L).x)
  );

  // The small epsilon prevents normalize(vec2(0.0)) from producing NaN values.
  vec2 forceDirection = normalize(curlGradient + 0.0001);
  float localCurl = texture2D(uCurl, vUv).x;
  vec2 force = forceDirection * curlStrength * localCurl;
  vec2 velocity = texture2D(uVelocity, vUv).xy;

  gl_FragColor = vec4(velocity + force * dt, 0.0, 1.0);
}
`,
  ],

  /**
   * PRESSURE-GRADIENT SUBTRACTION
   *
   * Projects velocity toward a divergence-free field:
   *
   *   velocityNew = velocity - gradient(pressure)
   *
   * This is the final stage of the incompressibility solve. Pressure created by
   * the repeated Jacobi passes pushes against local sources and sinks.
   */
  gradientSubtract: [
    v,
    `
${p}
${s}

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;

varying vec2 vUv;

void main() {
  float pL = texture2D(
    uPressure,
    clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0)
  ).x;

  float pR = texture2D(
    uPressure,
    clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0)
  ).x;

  float pT = texture2D(
    uPressure,
    clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0)
  ).x;

  float pB = texture2D(
    uPressure,
    clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0)
  ).x;

  vec2 pressureGradient = vec2(pR - pL, pT - pB);
  vec2 velocity = texture2D(uVelocity, vUv).xy;

  gl_FragColor = vec4(velocity - pressureGradient, 0.0, 1.0);
}
`,
  ],

  /**
   * CLEAR / DECAY
   *
   * Multiplies an entire texture by one scalar:
   *
   * - 0.0 clears it completely.
   * - 1.0 copies it unchanged.
   * - A value between 0 and 1 keeps part of the previous field.
   *
   * Here it decays the previous pressure estimate before the next solve.
   */
  clear: [
    v,
    `
${p}
${s}

uniform sampler2D uTexture;
uniform float value;

varying vec2 vUv;

void main() {
  gl_FragColor = value * texture2D(uTexture, vUv);
}
`,
  ],

  /**
   * DISPLAY
   *
   * Converts the final dye texture into a constant-color alpha mask.
   *
   * `threshold` determines how much dye must exist before a pixel becomes
   * visible. `edgeSoftness` selects either a hard step or a smooth transition.
   * `inkColor` is the visible RGB color; the dye controls only opacity.
   */
  display: [
    v,
    `
${p}
${s}

uniform sampler2D uTexture;
uniform float threshold;
uniform float edgeSoftness;
uniform vec3 inkColor;

varying vec2 vUv;

void main() {
  // Convert the RGB dye vector into one display intensity and restrict it to the
  // expected alpha interval.
  float density = clamp(
    length(texture2D(uTexture, vUv).rgb),
    0.0,
    1.0
  );

  float alpha = edgeSoftness > 0.0
    ? smoothstep(
        threshold - edgeSoftness * 0.5,
        threshold + edgeSoftness * 0.5,
        density
      )
    : step(threshold, density);

  gl_FragColor = vec4(inkColor, alpha);
}
`,
  ],
};
