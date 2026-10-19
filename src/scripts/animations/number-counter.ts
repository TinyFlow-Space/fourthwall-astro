const SELECTOR = ".stat-counter[data-count]";
const DURATION = 1500;
const instances = new WeakMap<ParentNode, () => void>();
const completed = new WeakSet<HTMLElement>();

/** Animate existing counters once when visible. Returns cleanup. */
export function initNumberCounters(root: ParentNode = document) {
  const existing = instances.get(root);
  if (existing) return existing;

  const states = new Map<
    HTMLElement,
    {
      target: string;
      value: number;
      format: Intl.NumberFormat;
      start: number | null;
    }
  >();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;

  function finish(element: HTMLElement) {
    const state = states.get(element);
    if (!state) return;
    element.textContent = state.target;
    completed.add(element);
    observer?.unobserve(element);
    states.delete(element);
  }

  function tick(now: number) {
    frame = 0;
    let running = false;
    states.forEach((state, element) => {
      if (state.start === null) return;
      const progress = Math.min(1, (now - state.start) / DURATION);
      if (progress >= 1 || reducedMotion.matches) {
        finish(element);
        return;
      }
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = state.format.format(state.value * eased);
      running = true;
    });
    if (running) frame = requestAnimationFrame(tick);
  }

  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            const state = states.get(element);
            if (!state || state.start !== null) return;
            observer!.unobserve(element);
            state.start = performance.now();
            if (!frame) frame = requestAnimationFrame(tick);
          });
        })
      : null;

  function register(element: HTMLElement) {
    if (states.has(element) || completed.has(element)) return;
    const target = element.dataset.count ?? "";
    // Plain or comma-grouped numbers; retain decimal precision and final text.
    if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(target)) return;
    const value = Number(target.replaceAll(",", ""));
    const decimals = target.split(".")[1]?.length ?? 0;
    if (!Number.isFinite(value) || decimals > 20) return;
    states.set(element, {
      target,
      value,
      start: null,
      format: new Intl.NumberFormat("en-US", {
        useGrouping: target.includes(","),
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    });
    if (!observer || reducedMotion.matches) {
      finish(element);
      return;
    }
    element.textContent = "0";
    observer.observe(element);
  }

  if (root instanceof HTMLElement && root.matches(SELECTOR)) register(root);
  root.querySelectorAll<HTMLElement>(SELECTOR).forEach(register);

  const cleanup = () => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
    states.forEach((_, element) => finish(element));
    instances.delete(root);
  };
  instances.set(root, cleanup);
  return cleanup;
}
