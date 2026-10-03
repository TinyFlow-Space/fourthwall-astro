const SECTION_SELECTOR = "[data-scatter-reveal-section]";
const ITEM_SELECTOR = ".scatter-reveal:not(.scatter-reveal-in)";

export function initScatterReveal(root: ParentNode = document) {
  const sections = root.querySelectorAll<HTMLElement>(SECTION_SELECTOR);

  sections.forEach((section) => {
    if (section.dataset.scatterRevealInitialized) return;

    const items = section.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
    if (!items.length) return;
    section.dataset.scatterRevealInitialized = "true";

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("scatter-reveal-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const item = entry.target as HTMLElement;
          observer.unobserve(item);
          requestAnimationFrame(() => {
            item.classList.add("scatter-reveal-in");
          });
        });
      },
      { threshold: 0 },
    );

    items.forEach((item) => observer.observe(item));
  });
}
