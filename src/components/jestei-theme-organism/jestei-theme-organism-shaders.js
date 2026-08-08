export const VERTEX_SHADER = String.raw`
      varying vec3 vLocalPosition;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        vLocalPosition = position;

        vec4 worldPosition =
          modelMatrix *
          vec4(position, 1.0);

        vWorldNormal =
          normalize(
            mat3(modelMatrix) *
            normal
          );

        vWorldPosition =
          worldPosition.xyz;

        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;
      }
    `;

export const FRAGMENT_SHADER = String.raw`
      uniform float uIntroMode;
      uniform float uIntroRaw;
      uniform float uCycleTime;
      uniform float uCellSize;
      uniform float uLineWidth;
      uniform vec3 uBoundsMin;
      uniform vec3 uBoundsMax;
      uniform vec3 uSharedStart;
      uniform vec3 uSharedEnd;
      uniform vec3 uColorBlack;
      uniform vec3 uColorEvent;
      uniform vec3 uColorBasic;
      uniform vec3 uColorPro;
      uniform vec3 uColorFeature;
      uniform samplerCube uEnvironment;
      uniform float uEnvironmentIntensity;
      uniform float uRoughness;
      uniform float uTextureScale;

      varying vec3 vLocalPosition;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      const float CYCLE_LENGTH = 5.0;
      const float EVENT_EPSILON = 0.0005;
      const float FILL_STEP_LAG = 0.034;
      const float FILL_GROWTH_SPAN = 0.105;

      vec2 gridLines(vec2 coordinate) {
        vec2 scaled =
          coordinate /
          uCellSize;

        vec2 distanceToLine =
          abs(fract(scaled - 0.5) - 0.5) /
          max(
            fwidth(scaled),
            vec2(0.0001)
          );

        return 1.0 -
          smoothstep(
            vec2(uLineWidth),
            vec2(uLineWidth + 1.0),
            distanceToLine
          );
      }

      float cellFill(
        vec2 coordinate,
        float progress
      ) {
        vec2 cell =
          fract(
            coordinate /
            uCellSize
          );

        float distanceFromEdge =
          2.0 *
          min(
            min(
              cell.x,
              1.0 - cell.x
            ),
            min(
              cell.y,
              1.0 - cell.y
            )
          );

        float antialias =
          max(
            fwidth(distanceFromEdge) * 1.5,
            0.002
          );

        return 1.0 -
          smoothstep(
            progress,
            progress + antialias,
            distanceFromEdge
          );
      }

      float routeOrder(
        vec3 uvw,
        float routeIndex
      ) {
        float diagonal =
          0.5 *
          (
            uvw.x +
            uvw.y
          );

        float interior =
          diagonal *
          (1.0 - diagonal);

        float routeOffset =
          (
            routeIndex - 1.5
          ) * 0.022;

        float depthOffset =
          (
            uvw.z - 0.5
          ) * 0.075;

        float wave =
          sin(
            (
              uvw.x * 1.00 +
              uvw.y * 1.18 +
              uvw.z * 0.72 +
              routeIndex * 0.21
            ) * 18.0
          ) * 0.026;

        return
          diagonal +
          interior *
          (
            routeOffset +
            depthOffset +
            wave
          );
      }

      float cycleAge(
        float currentTime,
        float eventTime
      ) {
        return mod(
          currentTime -
          eventTime +
          CYCLE_LENGTH,
          CYCLE_LENGTH
        );
      }

      float circularDistance(
        float a,
        float b
      ) {
        float direct =
          abs(a - b);

        return min(
          direct,
          CYCLE_LENGTH - direct
        );
      }

      float hash31(vec3 point) {
        point =
          fract(
            point * 0.1031
          );

        point +=
          dot(
            point,
            point.yzx + 33.33
          );

        return fract(
          (
            point.x + point.y
          ) * point.z
        );
      }

      float valueNoise(vec3 point) {
        vec3 cell =
          floor(point);

        vec3 local =
          fract(point);

        local =
          local *
          local *
          (
            3.0 -
            2.0 * local
          );

        float n000 =
          hash31(
            cell +
            vec3(0.0, 0.0, 0.0)
          );

        float n100 =
          hash31(
            cell +
            vec3(1.0, 0.0, 0.0)
          );

        float n010 =
          hash31(
            cell +
            vec3(0.0, 1.0, 0.0)
          );

        float n110 =
          hash31(
            cell +
            vec3(1.0, 1.0, 0.0)
          );

        float n001 =
          hash31(
            cell +
            vec3(0.0, 0.0, 1.0)
          );

        float n101 =
          hash31(
            cell +
            vec3(1.0, 0.0, 1.0)
          );

        float n011 =
          hash31(
            cell +
            vec3(0.0, 1.0, 1.0)
          );

        float n111 =
          hash31(
            cell +
            vec3(1.0, 1.0, 1.0)
          );

        float nx00 =
          mix(
            n000,
            n100,
            local.x
          );

        float nx10 =
          mix(
            n010,
            n110,
            local.x
          );

        float nx01 =
          mix(
            n001,
            n101,
            local.x
          );

        float nx11 =
          mix(
            n011,
            n111,
            local.x
          );

        float nxy0 =
          mix(
            nx00,
            nx10,
            local.y
          );

        float nxy1 =
          mix(
            nx01,
            nx11,
            local.y
          );

        return mix(
          nxy0,
          nxy1,
          local.z
        );
      }

      vec3 shadeSurface(
        vec3 baseColor,
        vec3 normal,
        vec3 worldPosition
      ) {
        vec3 viewDirection =
          normalize(
            cameraPosition -
            worldPosition
          );

        vec3 keyDirection =
          normalize(
            vec3(
              -0.52,
              0.78,
              0.34
            )
          );

        vec3 fillDirection =
          normalize(
            vec3(
              0.66,
              0.24,
              0.52
            )
          );

        float keyLight =
          max(
            dot(
              normal,
              keyDirection
            ),
            0.0
          );

        float fillLight =
          max(
            dot(
              normal,
              fillDirection
            ),
            0.0
          );

        float textureNoise =
          valueNoise(
            vLocalPosition *
            uTextureScale
          );

        float fineNoise =
          valueNoise(
            vLocalPosition *
            uTextureScale *
            4.0
          );

        float textureValue =
          mix(
            textureNoise,
            fineNoise,
            0.24
          );

        float localRoughness =
          clamp(
            uRoughness +
            (
              textureValue - 0.5
            ) * 0.16,
            0.18,
            0.82
          );

        vec3 halfDirection =
          normalize(
            keyDirection +
            viewDirection
          );

        float specularPower =
          mix(
            180.0,
            42.0,
            localRoughness
          );

        float directSpecular =
          pow(
            max(
              dot(
                normal,
                halfDirection
              ),
              0.0
            ),
            specularPower
          );

        vec3 reflectionDirection =
          reflect(
            -viewDirection,
            normal
          );

        vec3 environmentColor =
          textureCube(
            uEnvironment,
            reflectionDirection
          ).rgb;

        float environmentLuminance =
          dot(
            environmentColor,
            vec3(
              0.2126,
              0.7152,
              0.0722
            )
          );

        float fresnel =
          pow(
            1.0 -
            max(
              dot(
                normal,
                viewDirection
              ),
              0.0
            ),
            4.0
          );

        float diffuseLevel =
          0.54 +
          keyLight * 0.40 +
          fillLight * 0.06;

        vec3 diffuseColor =
          baseColor *
          diffuseLevel;

        float neutralReflection =
          environmentLuminance *
          uEnvironmentIntensity *
          (
            1.0 -
            localRoughness
          ) *
          (
            0.035 +
            fresnel * 0.11
          );

        float neutralSpecular =
          directSpecular *
          (
            1.0 -
            localRoughness
          ) *
          0.14;

        vec3 shadedColor =
          diffuseColor +
          vec3(
            neutralReflection +
            neutralSpecular
          );

        return clamp(
          shadedColor,
          0.0,
          1.0
        );
      }

      void main() {
        vec3 smoothNormal =
          normalize(vWorldNormal);

        vec3 normal =
          normalize(
            cross(
              dFdx(vWorldPosition),
              dFdy(vWorldPosition)
            )
          );

        if (
          dot(
            normal,
            smoothNormal
          ) < 0.0
        ) {
          normal *= -1.0;
        }

        vec3 absoluteNormal =
          abs(normal);

        vec3 size =
          max(
            uBoundsMax -
            uBoundsMin,
            vec3(0.0001)
          );

        vec3 uvw =
          clamp(
            (
              vLocalPosition -
              uBoundsMin
            ) /
            size,
            0.0,
            1.0
          );

        float maskA = 0.0;
        float maskB = 0.0;
        float maskC = 0.0;
        float maskD = 0.0;
        vec2 surfaceCoordinate =
          vLocalPosition.xy;

        if (
          absoluteNormal.z >=
          absoluteNormal.x &&
          absoluteNormal.z >=
          absoluteNormal.y
        ) {
          surfaceCoordinate =
            vLocalPosition.xy;

          vec2 lines =
            gridLines(
              surfaceCoordinate
            );

          maskA = lines.y;
          maskB = lines.x;
        } else if (
          absoluteNormal.x >=
          absoluteNormal.y
        ) {
          surfaceCoordinate =
            vLocalPosition.zy;

          vec2 lines =
            gridLines(
              surfaceCoordinate
            );

          maskC = lines.y;
          maskD = lines.x;
        } else {
          surfaceCoordinate =
            vLocalPosition.xz;

          vec2 lines =
            gridLines(
              surfaceCoordinate
            );

          maskC = lines.y;
          maskD = lines.x;
        }

        float selectedMask = maskA;
        float selectedOrder =
          routeOrder(uvw, 0.0);
        float speedFactor = 0.72;

        if (maskB > selectedMask) {
          selectedMask = maskB;
          selectedOrder =
            routeOrder(uvw, 1.0);
          speedFactor = 0.84;
        }

        if (maskC > selectedMask) {
          selectedMask = maskC;
          selectedOrder =
            routeOrder(uvw, 2.0);
          speedFactor = 0.94;
        }

        if (maskD > selectedMask) {
          selectedMask = maskD;
          selectedOrder =
            routeOrder(uvw, 3.0);
          speedFactor = 1.00;
        }

        selectedOrder =
          clamp(
            selectedOrder,
            0.0,
            1.0
          );

        if (uIntroMode > 0.5) {
          float introProgress =
            clamp(
              uIntroRaw /
              speedFactor,
              0.0,
              1.0
            );

          float introAge =
            introProgress -
            selectedOrder;

          float introLineReveal =
            1.0 -
            smoothstep(
              introProgress,
              introProgress + 0.0045,
              selectedOrder
            );

          float introFillProgress =
            smoothstep(
              FILL_STEP_LAG,
              FILL_STEP_LAG +
              FILL_GROWTH_SPAN,
              introAge
            );

          float introFillMask =
            cellFill(
              surfaceCoordinate,
              introFillProgress
            );

          float introSurfaceMask =
            max(
              selectedMask *
              introLineReveal,
              introFillMask *
              step(
                FILL_STEP_LAG,
                introAge
              )
            );

          if (introSurfaceMask < 0.02) {
            discard;
          }

          float introTip =
            1.0 -
            smoothstep(
              0.003,
              0.018,
              abs(
                selectedOrder -
                introProgress
              )
            );

          vec3 introColor =
            mix(
              uColorBlack,
              min(
                uColorBlack + vec3(0.16),
                vec3(1.0)
              ),
              introTip
            );

          introColor =
            shadeSurface(
              introColor,
              normal,
              vWorldPosition
            );

          gl_FragColor =
            vec4(
              introColor,
              1.0
            );

          #include <colorspace_fragment>
          return;
        }

        float activeSpan =
          1.0 -
          2.0 * EVENT_EPSILON;

        float eventBasic =
          EVENT_EPSILON +
          activeSpan *
          speedFactor *
          selectedOrder;

        float eventEvent =
          1.0 +
          EVENT_EPSILON +
          activeSpan *
          speedFactor *
          (
            1.0 -
            selectedOrder
          );

        float eventPro =
          2.0 +
          EVENT_EPSILON +
          activeSpan *
          speedFactor *
          selectedOrder;

        float eventFeature =
          3.0 +
          EVENT_EPSILON +
          activeSpan *
          speedFactor *
          (
            1.0 -
            selectedOrder
          );

        float eventBlack =
          4.0 +
          EVENT_EPSILON +
          activeSpan *
          speedFactor *
          selectedOrder;

        float ageEvent =
          cycleAge(
            uCycleTime,
            eventEvent
          );

        float ageBasic =
          cycleAge(
            uCycleTime,
            eventBasic
          );

        float agePro =
          cycleAge(
            uCycleTime,
            eventPro
          );

        float ageFeature =
          cycleAge(
            uCycleTime,
            eventFeature
          );

        float ageBlack =
          cycleAge(
            uCycleTime,
            eventBlack
          );

        vec3 currentColor =
          uColorBlack;

        float youngestAge =
          ageBlack;

        if (ageEvent < youngestAge) {
          youngestAge = ageEvent;
          currentColor = uColorEvent;
        }

        if (ageBasic < youngestAge) {
          youngestAge = ageBasic;
          currentColor = uColorBasic;
        }

        if (agePro < youngestAge) {
          youngestAge = agePro;
          currentColor = uColorPro;
        }

        if (ageFeature < youngestAge) {
          youngestAge = ageFeature;
          currentColor = uColorFeature;
        }

        float fillProgress =
          smoothstep(
            FILL_STEP_LAG,
            FILL_STEP_LAG +
            FILL_GROWTH_SPAN,
            youngestAge
          );

        float fillMask =
          cellFill(
            surfaceCoordinate,
            fillProgress
          ) *
          step(
            FILL_STEP_LAG,
            youngestAge
          );

        float surfaceMask =
          max(
            selectedMask,
            fillMask
          );

        if (surfaceMask < 0.02) {
          discard;
        }

        float tip =
          1.0 -
          smoothstep(
            0.0025,
            0.018,
            min(
              min(
                circularDistance(
                  uCycleTime,
                  eventEvent
                ),
                circularDistance(
                  uCycleTime,
                  eventBasic
                )
              ),
              min(
                min(
                  circularDistance(
                    uCycleTime,
                    eventPro
                  ),
                  circularDistance(
                    uCycleTime,
                    eventFeature
                  )
                ),
                circularDistance(
                  uCycleTime,
                  eventBlack
                )
              )
            )
          );

        vec3 tipColor =
          min(
            currentColor * 1.16 +
            vec3(0.012),
            vec3(1.0)
          );

        currentColor =
          mix(
            currentColor,
            tipColor,
            tip * 0.62
          );

        currentColor =
          mix(
            vec3(1.0),
            currentColor,
            surfaceMask
          );

        currentColor =
          shadeSurface(
            currentColor,
            normal,
            vWorldPosition
          );

        gl_FragColor =
          vec4(
            currentColor,
            1.0
          );

        #include <colorspace_fragment>
      }
    `;
