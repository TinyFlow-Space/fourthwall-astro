import { ScrollTrigger } from "gsap/ScrollTrigger";

let refreshFrame = 0;
function scheduleRefresh() {
  if (refreshFrame) return;
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    // Refresh shared viewport measurements before refreshing individual bounds.
    ScrollTrigger.refresh();
  });
}

/** The existing scroll-distance calculation, shared by both expanding sections. */
export function initSectionExpansion(
  section: HTMLElement,
  trigger: HTMLElement,
  factor: number,
) {
  const update = (self: ScrollTrigger) => {
    const progress = Math.min(1, Math.max(0, self.progress)).toFixed(4);
    if (section.style.getPropertyValue("--expand-progress") !== progress)
      section.style.setProperty("--expand-progress", progress);
  };
  const animation = ScrollTrigger.create({
    trigger,
    start: "top bottom",
    end: () =>
      `+=${Math.min(trigger.clientHeight * factor, document.documentElement.clientHeight)}`,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: update,
    onRefresh: update,
  });
  let disposed = false;
  const refresh = () => {
    if (!disposed) scheduleRefresh();
  };
  // Observe available width, not the animated section's dimensions. Observing
  // its changing height would feed each animation frame back into its bounds.
  let availableWidth = section.parentElement!.clientWidth;
  const observer = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - availableWidth) < 1) return;
    availableWidth = width;
    refresh();
  });
  observer.observe(section.parentElement!);
  section.addEventListener("load", refresh, true);
  document.fonts.ready.then(refresh);
  // ScrollTrigger already refreshes all instances together on viewport resize.
  return () => {
    disposed = true;
    observer.disconnect();
    section.removeEventListener("load", refresh, true);
    animation.kill();
  };
}
