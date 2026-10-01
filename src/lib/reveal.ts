let observer: IntersectionObserver | undefined;
const pendingItems = new Set<HTMLElement>();

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

        const item = entry.target as HTMLElement;
        item.classList.add("in");
        pendingItems.delete(item);
        observer?.unobserve(item);
      });

      if (pendingItems.size === 0) {
        observer?.disconnect();
        observer = undefined;
      }
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" },
  );

  items.forEach((item) => {
    pendingItems.add(item);
    observer?.observe(item);
  });
}
