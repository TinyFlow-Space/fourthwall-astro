/** A gently rippling dot grid, with the same motion at every viewport size. */
export function initDotField(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const spacing = 16;
  const radius = 0.9;
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = false;
  let elapsed = 0;
  let previousTime: number | null = null;

  function draw(time: number) {
    context!.clearRect(0, 0, width, height);
    context!.fillStyle = "#ffffff";
    for (let y = -spacing; y < height + spacing; y += spacing) {
      const position = y / height;
      // Fade away behind the heading and along the bottom edge.
      const fade = Math.min(1, Math.max(0, (position - 0.16) / 0.23)) *
        Math.min(1, Math.max(0, (1 - position) / 0.12));
      for (let x = -spacing; x < width + spacing; x += spacing) {
        // Coordinate-based phases keep the wavelength consistent on phones
        // and desktops, rather than stretching the effect to the viewport.
        const phase = x * 0.009 + y * 0.014 - time * 1.4;
        const wave = Math.sin(phase);
        // Quarter-cycle offsets keep the dots moving through wave crests;
        // opposing waves previously produced noticeable stationary beats.
        const offsetX = Math.cos(phase) * 1.5;
        const offsetY = wave * 3;
        const highlight = (wave + 1) / 2;
        context!.globalAlpha = fade * (0.12 + highlight * 0.12);
        context!.beginPath();
        context!.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
        context!.fill();
      }
    }
    context!.globalAlpha = 1;
  }

  function animate(now: number) {
    if (previousTime !== null) elapsed += (now - previousTime) / 1000;
    previousTime = now;
    draw(elapsed);
    frame = requestAnimationFrame(animate);
  }

  function syncPlayback() {
    if (visible && !document.hidden && !motion.matches) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
      if (motion.matches) draw(0);
    }
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(motion.matches ? 0 : elapsed);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  });
  visibilityObserver.observe(canvas);
  document.addEventListener("visibilitychange", syncPlayback);
  motion.addEventListener("change", syncPlayback);
  window.addEventListener("resize", resize);
  resize();

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", syncPlayback);
    motion.removeEventListener("change", syncPlayback);
    window.removeEventListener("resize", resize);
  };
}
