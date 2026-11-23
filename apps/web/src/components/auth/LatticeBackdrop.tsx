import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

/**
 * Auth backdrop: the Geoboard peg lattice laid out as a floor in perspective.
 * The floor scrolls toward the viewer and flows through gaussian bells in the
 * distance (drawn as hairline curve slices); square plane frames drift and turn
 * above it. Pegs wobble where the pointer passes, and the wobble travels with
 * the pegs that were touched.
 *
 * Light mode: band-blue pegs. Dark mode: white pegs.
 * Reduced motion: one still frame; the pointer only lifts pegs, no oscillation.
 */

// Floor lattice: equidistant pegs, wrapped in z so the scroll never ends.
const SPACING = 0.55;
const COLS = 160;
const ROWS = 100;
const DEPTH = ROWS * SPACING;
const Z_NEAR = 10;
const Z_FAR = Z_NEAR - DEPTH;
const SCROLL_SPEED = 0.55; // world units per second

const MAX_IMPULSES = 12;

interface Bell {
  x: number;
  z: number;
  sigma: number;
  amp: number;
  phase: number;
}

// Bells stand still in the world; the floor flows through them.
const BELLS: Bell[] = [
  { x: -10.5, z: -15, sigma: 2.5, amp: 4.4, phase: 0 },
  { x: 11, z: -20, sigma: 3.1, amp: 5.6, phase: 2.1 },
  { x: 0, z: -36, sigma: 5.2, amp: 9, phase: 4.2 },
];
const BELL_SLICES = 7; // per direction
const BELL_SEGMENTS = 40;

interface Frame {
  x: number;
  y: number;
  u: number; // position along the floor, travels with the scroll
  size: number;
  tilt: number;
  spin: number;
  phase: number;
}

const FRAMES: Frame[] = [
  { x: -7.5, y: 4.2, u: -4, size: 2.2, tilt: 0.9, spin: 0.12, phase: 0.4 },
  { x: 8.5, y: 5.4, u: -17, size: 3, tilt: 0.5, spin: -0.09, phase: 1.7 },
  { x: -14, y: 7.5, u: -30, size: 3.8, tilt: 1.2, spin: 0.07, phase: 3.0 },
  { x: 15, y: 4.2, u: -42, size: 3.2, tilt: 0.7, spin: -0.11, phase: 4.4 },
];
// Each frame: 4 edges + 2 inner lines each way = 8 segments.
const FRAME_SEGMENTS = 8;

const dotVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uZFar;
  uniform float uDepth;
  uniform float uSize;
  uniform float uScale;
  uniform float uMinSize;
  uniform vec4 uBells[3];
  uniform vec4 uImpulses[${MAX_IMPULSES}];
  uniform vec4 uHover;
  attribute vec2 aGrid;
  varying float vAlpha;
  varying float vGlow;

  float wrapZ(float u) { return uZFar + mod(u - uZFar + uScroll, uDepth); }

  void main() {
    float x = aGrid.x;
    float z = wrapZ(aGrid.y);
    float y = 0.0;

    for (int i = 0; i < 3; i++) {
      vec4 b = uBells[i];
      vec2 d = vec2(x - b.x, z - b.y);
      y += b.w * exp(-dot(d, d) / (2.0 * b.z * b.z));
    }

    float glow = 0.0;
    for (int i = 0; i < ${MAX_IMPULSES}; i++) {
      vec4 p = uImpulses[i];
      float t = uTime - p.z;
      if (p.w <= 0.0 || t < 0.0 || t > 3.5) continue;
      vec2 d = vec2(x - p.x, z - wrapZ(p.y));
      float dist = length(d);
      float env = p.w * exp(-dist * dist / 2.4) * exp(-t * 1.6);
      y += env * 0.38 * sin(t * 12.0 - dist * 2.4);
      glow += env * 0.7;
    }

    vec2 hd = vec2(x - uHover.x, z - uHover.y);
    float h = uHover.z * exp(-dot(hd, hd) / 1.8);
    y += h * 0.24;
    glow += h;

    vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_Position = projectionMatrix * mv;

    float far = smoothstep(uZFar + 4.0, uZFar + 24.0, z);
    float near = 1.0 - smoothstep(uZFar + uDepth - 3.0, uZFar + uDepth, z);
    vGlow = clamp(glow, 0.0, 1.0);

    float size = uSize * (1.0 + 0.7 * vGlow) * uScale / -mv.z;
    // Sub-pixel pegs fade instead of shrinking into shimmering noise.
    float fade = clamp(size / uMinSize, 0.0, 1.0);
    gl_PointSize = clamp(size, uMinSize, uMinSize * 6.0);
    vAlpha = far * near * fade;
  }
`;

const dotFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vGlow;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.3, d);
    float alpha = disc * vAlpha * mix(uOpacity, 1.0, vGlow);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

const lineVertex = /* glsl */ `
  uniform float uZFar;
  uniform float uDepth;
  attribute float aAlpha;
  varying float vAlpha;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float far = smoothstep(uZFar, uZFar + 16.0, position.z);
    float near = 1.0 - smoothstep(uZFar + uDepth - 4.0, uZFar + uDepth, position.z);
    vAlpha = aAlpha * far * near;
  }
`;

const lineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float alpha = vAlpha * uOpacity;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

interface Palette {
  color: string;
  dotOpacity: number;
  lineOpacity: number;
  additive: boolean;
}

function readPalette(isDark: boolean): Palette {
  if (isDark) return { color: "#ffffff", dotOpacity: 0.42, lineOpacity: 0.22, additive: true };
  const blue = getComputedStyle(document.documentElement).getPropertyValue("--color-band-blue").trim();
  return { color: blue || "#3a6ea5", dotOpacity: 0.5, lineOpacity: 0.34, additive: false };
}

function bellAt(b: Bell, t: number, spread: number) {
  return {
    x: b.x * spread + 1.1 * Math.sin(t * 0.09 + b.phase),
    z: b.z,
    sigma: b.sigma * (0.9 + 0.1 * Math.sin(t * 0.23 + b.phase * 1.3)),
    amp: b.amp * (0.78 + 0.22 * Math.sin(t * 0.31 + b.phase)),
  };
}

function wrapZ(u: number, scroll: number) {
  const m = (u - Z_FAR + scroll) % DEPTH;
  return Z_FAR + (m < 0 ? m + DEPTH : m);
}

export default function LatticeBackdrop({ isDark }: { isDark: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<(isDark: boolean) => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the plain ground stays.
    }
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(48, 1, 0.1, 120);
    camera.position.set(0, 3.2, 9);

    // ---- Floor pegs ----
    const grid = new Float32Array(COLS * ROWS * 2);
    for (let r = 0, i = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++, i += 2) {
        grid[i] = (c - (COLS - 1) / 2) * SPACING;
        grid[i + 1] = Z_FAR + r * SPACING;
      }
    }
    const dotGeometry = new BufferGeometry();
    dotGeometry.setAttribute("aGrid", new BufferAttribute(grid, 2));
    // `position` is required by three for draw-range bookkeeping; the shader ignores it.
    dotGeometry.setAttribute("position", new BufferAttribute(new Float32Array(COLS * ROWS * 3), 3));
    dotGeometry.boundingSphere = null;

    // [x, floor u, start time, amplitude]; amplitude 0 = unused slot.
    const impulses = Array.from(
      { length: MAX_IMPULSES },
      () => [0, 0, -100, 0] as [number, number, number, number],
    );
    const dotUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uZFar: { value: Z_FAR },
      uDepth: { value: DEPTH },
      uSize: { value: 0.05 },
      uScale: { value: 1 },
      uMinSize: { value: 1.5 },
      uBells: { value: BELLS.map(() => [0, 0, 1, 0]).flat() },
      uImpulses: { value: impulses.flat() },
      uHover: { value: [0, 0, 0, 0] },
      uColor: { value: new Color() },
      uOpacity: { value: 0.5 },
    };
    const dotMaterial = new ShaderMaterial({
      uniforms: dotUniforms,
      vertexShader: dotVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const dots = new Points(dotGeometry, dotMaterial);
    dots.frustumCulled = false;
    scene.add(dots);

    // ---- Hairlines: bell slices + plane frames ----
    const bellVerts = BELLS.length * BELL_SLICES * 2 * BELL_SEGMENTS * 2;
    const frameVerts = FRAMES.length * FRAME_SEGMENTS * 2;
    const lineCount = bellVerts + frameVerts;
    const linePositions = new Float32Array(lineCount * 3);
    const lineAlphas = new Float32Array(lineCount);
    const lineGeometry = new BufferGeometry();
    const linePosAttr = new BufferAttribute(linePositions, 3).setUsage(DynamicDrawUsage);
    const lineAlphaAttr = new BufferAttribute(lineAlphas, 1).setUsage(DynamicDrawUsage);
    lineGeometry.setAttribute("position", linePosAttr);
    lineGeometry.setAttribute("aAlpha", lineAlphaAttr);
    const lineUniforms = {
      uZFar: { value: Z_FAR },
      uDepth: { value: DEPTH },
      uColor: { value: new Color() },
      uOpacity: { value: 0.3 },
    };
    const lineMaterial = new ShaderMaterial({
      uniforms: lineUniforms,
      vertexShader: lineVertex,
      fragmentShader: lineFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const lines = new LineSegments(lineGeometry, lineMaterial);
    lines.frustumCulled = false;
    scene.add(lines);

    const applyTheme = (dark: boolean) => {
      const p = readPalette(dark);
      dotUniforms.uColor.value.set(p.color);
      lineUniforms.uColor.value.set(p.color);
      dotUniforms.uOpacity.value = p.dotOpacity;
      lineUniforms.uOpacity.value = p.lineOpacity;
      const blending = p.additive ? AdditiveBlending : NormalBlending;
      dotMaterial.blending = blending;
      lineMaterial.blending = blending;
      dotMaterial.needsUpdate = true;
      lineMaterial.needsUpdate = true;
    };
    applyTheme(isDark);

    // Writes one bell's wireframe: gaussian curves sliced along x and along z.
    let cursor = 0;
    const pushVertex = (x: number, y: number, z: number, a: number) => {
      linePositions[cursor * 3] = x;
      linePositions[cursor * 3 + 1] = y;
      linePositions[cursor * 3 + 2] = z;
      lineAlphas[cursor] = a;
      cursor++;
    };

    const writeBells = (t: number) => {
      for (const base of BELLS) {
        const b = bellAt(base, t, spread);
        const reach = 2.7 * b.sigma;
        const height = (dx: number, dz: number) =>
          b.amp * Math.exp(-(dx * dx + dz * dz) / (2 * b.sigma * b.sigma));
        const alphaOf = (y: number) => 0.15 + 0.85 * Math.sqrt(y / b.amp);
        for (let axis = 0; axis < 2; axis++) {
          for (let s = 0; s < BELL_SLICES; s++) {
            const offset = ((s - (BELL_SLICES - 1) / 2) / ((BELL_SLICES - 1) / 2)) * reach * 0.72;
            for (let k = 0; k < BELL_SEGMENTS; k++) {
              for (let e = 0; e < 2; e++) {
                const along = -reach + ((k + e) / BELL_SEGMENTS) * 2 * reach;
                const dx = axis === 0 ? along : offset;
                const dz = axis === 0 ? offset : along;
                const y = height(dx, dz);
                pushVertex(b.x + dx, y, b.z + dz, alphaOf(y));
              }
            }
          }
        }
      }
    };

    const writeFrames = (t: number, scroll: number) => {
      for (const f of FRAMES) {
        const z = wrapZ(f.u, scroll);
        const h = f.size / 2;
        const yaw = f.phase + t * f.spin;
        const pitch = f.tilt + 0.25 * Math.sin(t * 0.2 + f.phase);
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const cp = Math.cos(pitch), sp = Math.sin(pitch);
        const bob = 0.3 * Math.sin(t * 0.35 + f.phase);
        const map = (lx: number, lz: number): [number, number, number] => {
          // Tilt the square about x, then turn it about y.
          const ty = -lz * sp;
          const tz = lz * cp;
          return [f.x * spread + lx * cy + tz * sy, f.y + bob + ty, z - lx * sy + tz * cy];
        };
        const seg = (a: [number, number], b: [number, number], alpha: number) => {
          const p = map(a[0], a[1]);
          const q = map(b[0], b[1]);
          pushVertex(p[0], p[1], p[2], alpha);
          pushVertex(q[0], q[1], q[2], alpha);
        };
        // Outline
        seg([-h, -h], [h, -h], 0.8);
        seg([h, -h], [h, h], 0.8);
        seg([h, h], [-h, h], 0.8);
        seg([-h, h], [-h, -h], 0.8);
        // Inner lattice thirds
        const third = f.size / 6;
        seg([-third, -h], [-third, h], 0.35);
        seg([third, -h], [third, h], 0.35);
        seg([-h, -third], [h, -third], 0.35);
        seg([-h, third], [h, third], 0.35);
      }
    };

    // ---- Sizing ----
    // Portrait screens are mostly card: pull the bells and frames toward the
    // middle and tilt down so the horizon and bell tops sit above the card.
    let spread = 1;
    let dpr = 1;
    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;
      const portrait = aspect < 0.8;
      camera.fov = portrait ? 62 : aspect < 1.2 ? 54 : 48;
      camera.position.y = portrait ? 4.5 : 3.2;
      camera.lookAt(0, portrait ? -8 : aspect < 1.2 ? -3 : 0, -16);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      spread = portrait ? 0.45 : aspect < 1.2 ? 0.7 : 1;
      const fovRad = (camera.fov * Math.PI) / 180;
      dotUniforms.uScale.value = (h * dpr) / (2 * Math.tan(fovRad / 2));
      dotUniforms.uMinSize.value = 1.4 * dpr;
    };
    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) render();
    });
    resizeObserver.observe(host);

    // ---- Pointer → floor ----
    const raycaster = new Raycaster();
    const floor = new Plane(new Vector3(0, 1, 0), 0);
    const ndc = new Vector2();
    const hit = new Vector3();
    const hover = { x: 0, z: 0, active: false, strength: 0, lastMove: -10 };
    let lastImpulse = { x: 1e9, z: 1e9, t: -10 };
    let nextImpulse = 0;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;

    let time = 0;
    let scroll = 0;

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(floor, hit) || hit.z < Z_FAR + 8) {
        hover.active = false;
        if (!running) render();
        return;
      }
      hover.x = hit.x;
      hover.z = hit.z;
      hover.active = true;
      hover.lastMove = time;

      if (reduced) {
        hover.strength = 1;
        render();
        return;
      }
      const dx = hit.x - lastImpulse.x;
      const dz = hit.z - lastImpulse.z;
      if (dx * dx + dz * dz > 0.5 || time - lastImpulse.t > 0.35) {
        const slot = impulses[nextImpulse]!;
        // Stored in floor coordinates so the wobble rides along with its pegs.
        slot[0] = hit.x;
        slot[1] = hit.z - scroll;
        slot[2] = time;
        slot[3] = e.pointerType === "touch" ? 1.2 : 1;
        nextImpulse = (nextImpulse + 1) % MAX_IMPULSES;
        lastImpulse = { x: hit.x, z: hit.z, t: time };
      }
    };
    const onLeave = () => {
      hover.active = false;
      if (!running) render();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    // ---- Frame ----
    const render = () => {
      dotUniforms.uTime.value = time;
      dotUniforms.uScroll.value = scroll;
      const bells = dotUniforms.uBells.value;
      BELLS.forEach((base, i) => {
        const b = bellAt(base, time, spread);
        bells[i * 4] = b.x;
        bells[i * 4 + 1] = b.z;
        bells[i * 4 + 2] = b.sigma;
        bells[i * 4 + 3] = b.amp;
      });
      const flat = dotUniforms.uImpulses.value;
      impulses.forEach((p, i) => {
        flat[i * 4] = p[0];
        flat[i * 4 + 1] = p[1];
        flat[i * 4 + 2] = p[2];
        flat[i * 4 + 3] = p[3];
      });
      const hv = dotUniforms.uHover.value;
      hv[0] = hover.x;
      hv[1] = hover.z;
      hv[2] = hover.active ? hover.strength : 0;

      cursor = 0;
      writeBells(time);
      writeFrames(time, scroll);
      linePosAttr.needsUpdate = true;
      lineAlphaAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    let running = false;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      time += dt;
      scroll = (scroll + dt * SCROLL_SPEED) % DEPTH;
      // The lift under the pointer eases in while it moves and settles when it rests.
      const target = hover.active && time - hover.lastMove < 1.4 ? 1 : 0;
      hover.strength += (target - hover.strength) * Math.min(1, dt * 6);
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onMotionChange = () => {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        impulses.forEach((p) => (p[3] = 0));
        render();
      } else {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    // Reduced motion freezes on a frame where the bells stand tall.
    if (reduced) {
      time = 4.5;
      render();
    } else {
      start();
    }

    themeRef.current = (dark: boolean) => {
      applyTheme(dark);
      if (!running) render();
    };

    return () => {
      stop();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
      themeRef.current = () => {};
      dotGeometry.dispose();
      dotMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    themeRef.current(isDark);
  }, [isDark]);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none fixed inset-0" />;
}
