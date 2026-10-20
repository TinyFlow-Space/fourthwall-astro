// Natural Earth 1:110m land boundaries, sampled into an equal-distance point grid.
// Public-domain geographic data: https://www.naturalearthdata.com/about/terms-of-use/
import coordinates from "@/data/home/globe-points.json";

type Point = [number, number, number];
const radians = Math.PI / 180;
const spherePoint = (lat: number, lon: number): Point => [
  Math.cos(lat * radians) * Math.sin(lon * radians),
  Math.sin(lat * radians),
  Math.cos(lat * radians) * Math.cos(lon * radians),
];
const land: Point[] = [];
for (let i = 0; i < coordinates.length; i += 2)
  land.push(spherePoint(coordinates[i] / 10, coordinates[i + 1] / 10));
const hubs = [
  [40.7, -74],
  [37.8, -122.4],
  [51.5, -0.1],
  [52.5, 13.4],
  [35.7, 139.7],
  [19.4, -99.1],
  [41.9, -87.6],
  [33.7, -84.4],
  [32.8, -96.8],
  [40.4, -3.7],
  [45.5, 9.2],
  [33.4, -112.1],
  [39.7, -105],
  [53.3, -6.3],
  [55.7, 12.6],
  [59.3, 18.1],
  [37.9, 23.7],
].map(([lat, lon]) => spherePoint(lat, lon));
const labelPoints = [
  spherePoint(8, 15),
  spherePoint(8, 135),
  spherePoint(8, -105),
];
const instances = new Map<HTMLElement, () => void>();

function initialize(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>(".globe-canvas")!;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};
  const labels = Array.from(root.querySelectorAll<HTMLElement>(".globe-label"));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  let width = 0,
    height = 0,
    yaw = -0.25,
    pitch = 0.12,
    velocity = 0;
  let visible = false,
    frame = 0,
    previousTime = 0,
    pointer: number | null = null;
  let startX = 0,
    startY = 0,
    lastX = 0,
    lastY = 0,
    dragging = false;

  let sinYaw = 0,
    cosYaw = 1,
    sinPitch = 0,
    cosPitch = 1;
  let labelWidths = labels.map((label) => label.offsetWidth);
  const project = (point: Point, elevation = 1): Point => {
    const [x, y, z] = point;
    const rx = x * cosYaw + z * sinYaw;
    const rz = z * cosYaw - x * sinYaw;
    const ry = y * cosPitch - rz * sinPitch;
    const depth = y * sinPitch + rz * cosPitch;
    const radius = width * 0.39;
    return [
      width / 2 + rx * radius * elevation,
      height / 2 - ry * radius * elevation,
      depth,
    ];
  };
  function draw() {
    if (!ctx || !width || !height) return;
    sinYaw = Math.sin(yaw);
    cosYaw = Math.cos(yaw);
    sinPitch = Math.sin(pitch);
    cosPitch = Math.cos(pitch);
    const radius = width * 0.39;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    const shading = ctx.createRadialGradient(
      width * 0.4,
      height * 0.3,
      0,
      width / 2,
      height / 2,
      radius,
    );
    shading.addColorStop(0, "#030303");
    shading.addColorStop(0.82, "#090909");
    shading.addColorStop(0.97, "#161616");
    shading.addColorStop(1, "#333333");
    ctx.fillStyle = shading;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    // Hide points on the back of the globe.
    for (const point of land) {
      const [x, y, z] = project(point);
      if (z <= 0.02) continue;
      ctx.fillStyle = `rgba(173,173,173,${0.28 + z * 0.45})`;
      ctx.beginPath();
      ctx.arc(
        x,
        y,
        Math.max(0.8, width / 400) * (0.55 + z * 0.45),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    hubs.forEach((hub, index) => {
      const [x, y, z] = project(hub);
      if (z <= 0) return;
      ctx.fillStyle = `rgba(255,255,255,${z})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.1, width / 320), 0, Math.PI * 2);
      ctx.fill();
      // Rotate shipping arcs with the globe.
      const target = hubs[(index + 1) % hubs.length];
      ctx.beginPath();
      let started = false;
      for (let step = 0; step <= 24; step++) {
        const t = step / 24;
        const p = hub.map((v, i) => v * (1 - t) + target[i] * t) as Point;
        const length = Math.hypot(...p);
        const q = project(
          p.map((v) => v / length) as Point,
          1 + Math.sin(t * Math.PI) * 0.055,
        );
        if (q[2] <= 0) {
          started = false;
          continue;
        }
        if (started) ctx.lineTo(q[0], q[1]);
        else ctx.moveTo(q[0], q[1]);
        started = true;
      }
      ctx.strokeStyle = `rgba(240,240,240,${z * 0.55})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });
    labels.forEach((label, index) => {
      const [x, y, z] = project(labelPoints[index], 1.06);
      const left = Math.max(
        8,
        Math.min(width - labelWidths[index] - 8, x - labelWidths[index] / 2),
      );
      label.style.transform = `translate(${left.toFixed(1)}px,${(y - 12).toFixed(1)}px)`;
      label.style.opacity = String(Math.max(0, Math.min(1, (z - 0.5) * 3)));
    });
  }
  function tick(time: number) {
    frame = 0;
    const dt = Math.min((time - (previousTime || time)) / 1000, 0.05);
    previousTime = time;
    if (!dragging) {
      yaw += velocity * dt;
      velocity *= Math.exp(-5 * dt);
      if (!reduced.matches && pointer === null) yaw += dt * 0.055;
    }
    draw();
    if (
      visible &&
      !document.hidden &&
      (!reduced.matches || Math.abs(velocity) > 0.001)
    )
      frame = requestAnimationFrame(tick);
  }
  function requestDraw() {
    if (!frame && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function resize() {
    labelWidths = labels.map((label) => label.offsetWidth);
    width = root.clientWidth;
    height = root.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
    requestDraw();
  }
  function resetPointer() {
    if (pointer !== null && root.hasPointerCapture(pointer))
      root.releasePointerCapture(pointer);
    pointer = null;
    dragging = false;
    root.classList.remove("is-dragging");
  }
  function updateMode() {
    root.classList.add("is-interactive");
    root.tabIndex = 0;
    resetPointer();
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    resize();
  }
  root.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      velocity = 0;
    },
    { signal: events.signal },
  );
  root.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== pointer) return;
      const dx = event.clientX - startX,
        dy = event.clientY - startY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < 6) return;
        if (event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) {
          resetPointer();
          return;
        }
        dragging = true;
        root.setPointerCapture(event.pointerId);
        root.classList.add("is-dragging");
      }
      const delta = ((event.clientX - lastX) * 4) / width;
      yaw += delta;
      pitch = Math.max(
        -0.65,
        Math.min(0.65, pitch + ((event.clientY - lastY) * 2) / width),
      );
      velocity = reduced.matches ? 0 : Math.max(-2, Math.min(2, delta * 30));
      lastX = event.clientX;
      lastY = event.clientY;
      requestDraw();
    },
    { signal: events.signal },
  );
  root.addEventListener(
    "pointerleave",
    () => {
      if (!dragging) resetPointer();
    },
    { signal: events.signal },
  );
  for (const event of [
    "pointerup",
    "pointercancel",
    "lostpointercapture",
  ] as const)
    root.addEventListener(event, resetPointer, { signal: events.signal });
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      velocity = 0;
      if (event.key === "ArrowLeft") yaw -= 0.18;
      if (event.key === "ArrowRight") yaw += 0.18;
      if (event.key === "ArrowUp") pitch = Math.min(0.65, pitch + 0.1);
      if (event.key === "ArrowDown") pitch = Math.max(-0.65, pitch - 0.1);
      requestDraw();
    },
    { signal: events.signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      previousTime = 0;
      requestDraw();
    },
    { signal: events.signal },
  );
  reduced.addEventListener("change", requestDraw, { signal: events.signal });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) {
      previousTime = 0;
      requestDraw();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      resetPointer();
    }
  });
  intersection.observe(root);
  updateMode();
  return () => {
    events.abort();
    resizeObserver.disconnect();
    intersection.disconnect();
    cancelAnimationFrame(frame);
    resetPointer();
  };
}
export function initShippingGlobes(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".shipping-globe").forEach((globe) => {
    if (!instances.has(globe)) instances.set(globe, initialize(globe));
  });
}
document.addEventListener("astro:before-swap", () => {
  instances.forEach((cleanup) => cleanup());
  instances.clear();
});
