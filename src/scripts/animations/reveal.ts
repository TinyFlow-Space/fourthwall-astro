let observer: IntersectionObserver | undefined;

export function initReveal() {
  const items = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("in"));
    return;
  }

  observer ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // if (!entry.isIntersecting || entry.intersectionRatio <= 0) return;

        const item = entry.target as HTMLElement;
        observer?.unobserve(item);
        item.classList.add("in");
      });
    },
    { threshold: 0 },
  );

  items.forEach((item) => {
    observer?.observe(item);
  });
}
