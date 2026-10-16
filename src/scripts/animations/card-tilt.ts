interface CardTiltOptions {
  targetSelector?: string;
  parentSelector?: string;
  maxTilt?: number;
}

const defaultTargetSelector = '[style*="--tilt-x"]';
const activeInstances = new WeakMap<HTMLElement, () => void>();

export function initCardTilt(
  root: ParentNode = document,
  {
    targetSelector = defaultTargetSelector,
    parentSelector = ".group",
    maxTilt = 6,
  }: CardTiltOptions = {},
) {
  const targets = [
    ...(root instanceof HTMLElement && root.matches(targetSelector)
      ? [root]
      : []),
    ...root.querySelectorAll<HTMLElement>(targetSelector),
  ];
  const cleanups: Array<() => void> = [];

  targets.forEach((target) => {
    if (activeInstances.has(target)) return;

    const parent = target.closest<HTMLElement>(parentSelector);
    if (!parent) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const reset = () => {
      target.style.setProperty("--tilt-x", "0deg");
      target.style.setProperty("--tilt-y", "0deg");
    };

    const updateTilt = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const normalizedX = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
      );
      const normalizedY = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2),
      );

      target.style.setProperty(
        "--tilt-x",
        `${(-normalizedY * maxTilt).toFixed(2)}deg`,
      );
      target.style.setProperty(
        "--tilt-y",
        `${(normalizedX * maxTilt).toFixed(2)}deg`,
      );
    };

    let enabled = false;
    const syncMotionSupport = () => {
      const shouldEnable = finePointer.matches && !reducedMotion.matches;
      if (shouldEnable === enabled) return;

      enabled = shouldEnable;
      if (enabled) {
        parent.addEventListener("mouseover", updateTilt);
        parent.addEventListener("mousemove", updateTilt, { passive: true });
        parent.addEventListener("mouseleave", reset);
      } else {
        parent.removeEventListener("mouseover", updateTilt);
        parent.removeEventListener("mousemove", updateTilt);
        parent.removeEventListener("mouseleave", reset);
        reset();
      }
    };

    finePointer.addEventListener("change", syncMotionSupport);
    reducedMotion.addEventListener("change", syncMotionSupport);
    syncMotionSupport();

    const cleanup = () => {
      finePointer.removeEventListener("change", syncMotionSupport);
      reducedMotion.removeEventListener("change", syncMotionSupport);
      parent.removeEventListener("mouseover", updateTilt);
      parent.removeEventListener("mousemove", updateTilt);
      parent.removeEventListener("mouseleave", reset);
      reset();
      activeInstances.delete(target);
    };

    activeInstances.set(target, cleanup);
    cleanups.push(cleanup);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}
