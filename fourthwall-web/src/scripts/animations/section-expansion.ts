import { ScrollTrigger } from "gsap/ScrollTrigger";

let refreshFrame = 0;
function scheduleRefresh() {
  if (refreshFrame) return;
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    // Refresh viewport measurements before section bounds.
    ScrollTrigger.refresh();
  });
}

/** Scroll distance for expanding sections. */
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
  // Watch parent width to avoid a resize loop during animation.
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
  // ScrollTrigger handles viewport resizing.
  return () => {
    disposed = true;
    observer.disconnect();
    section.removeEventListener("load", refresh, true);
    animation.kill();
  };
}
