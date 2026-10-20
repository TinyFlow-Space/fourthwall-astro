const instances = new WeakMap<HTMLElement, () => void>();

/** Connect one TOC to headings in its own article. */
export function initToc(nav: HTMLElement) {
  const existing = instances.get(nav);
  if (existing) return existing;
  const article = nav.closest("article");
  const items = Array.from(
    nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  ).flatMap((link) => {
    let id: string;
    try {
      id = decodeURIComponent(link.hash.slice(1));
    } catch {
      return [];
    }
    const heading = document.getElementById(id);
    return heading && article?.contains(heading) ? [{ link, heading }] : [];
  });
  if (!items.length) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  const header = document.querySelector<HTMLElement>(".site-header");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let observer: IntersectionObserver;
  let pending: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout>;
  let frame = 0;
  let offset = 100;

  function activate(heading: HTMLElement | null, updateUrl = true) {
    for (const item of items) {
      if (item.heading === heading)
        item.link.setAttribute("aria-current", "location");
      else item.link.removeAttribute("aria-current");
    }
    if (heading && updateUrl) {
      const url = new URL(location.href);
      url.hash = heading.id;
      if (url.href !== location.href)
        history.replaceState(history.state, "", url);
    }
  }

  function update() {
    if (pending) return;
    // Read positions only at observer boundaries, never on every scroll event.
    let active: HTMLElement | null = null;
    for (const { heading } of items) {
      if (heading.getBoundingClientRect().top <= offset + 1) active = heading;
      else break;
    }
    activate(active);
  }

  function release() {
    clearTimeout(timer);
    pending = null;
    update();
  }

  function navigate(heading: HTMLElement, smooth: boolean) {
    clearTimeout(timer);
    pending = heading;
    activate(heading);
    window.scrollTo({
      top: Math.max(
        0,
        heading.getBoundingClientRect().top + window.scrollY - offset,
      ),
      behavior: smooth && !reducedMotion.matches ? "smooth" : "instant",
    });
    // Fallback for browsers without scrollend and navigation to the same position.
    timer = setTimeout(release, smooth && !reducedMotion.matches ? 1800 : 100);
  }

  function restoreHash() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const item = items.find(({ link }) => link.hash === location.hash);
      if (item) navigate(item.heading, false);
      else {
        pending = null;
        update();
      }
    });
  }

  function observe() {
    offset = Math.max(100, (header?.getBoundingClientRect().height ?? 0) + 24);
    observer?.disconnect();
    // Extend below the document: headings remain intersecting until they cross
    // the header boundary, including large jumps and upward scrolling.
    observer = new IntersectionObserver(update, {
      rootMargin: `-${offset}px 0px ${document.documentElement.scrollHeight}px 0px`,
      threshold: [0, 1],
    });
    items.forEach(({ heading }) => observer.observe(heading));
    update();
  }

  nav.addEventListener(
    "click",
    (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest("a");
      const item = items.find((item) => item.link === link);
      if (!item) return;
      event.preventDefault();
      navigate(item.heading, true);
    },
    { signal },
  );
  window.addEventListener(
    "scrollend",
    () => {
      if (pending) {
        const target = Math.min(
          Math.max(
            0,
            pending.getBoundingClientRect().top + window.scrollY - offset,
          ),
          document.documentElement.scrollHeight - window.innerHeight,
        );
        // A previous scroll (e.g. bringing a mobile TOC link into view) may
        // finish just as navigation starts. Do not unlock that new navigation.
        if (Math.abs(window.scrollY - target) > 2) return;
      }
      release();
    },
    { signal },
  );
  window.addEventListener("wheel", release, { passive: true, signal });
  window.addEventListener("touchstart", release, { passive: true, signal });
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        release();
    },
    { signal },
  );
  window.addEventListener("popstate", restoreHash, { signal });
  window.addEventListener("hashchange", restoreHash, { signal });
  window.addEventListener("pageshow", restoreHash, { signal });

  // Preserve an incoming hash before the first observer callback can update it.
  pending =
    items.find(({ link }) => link.hash === location.hash)?.heading ?? null;
  observe();
  restoreHash();
  const resize = new ResizeObserver(observe);
  if (header) resize.observe(header);
  if (article) resize.observe(article);

  const cleanup = () => {
    controller.abort();
    observer.disconnect();
    resize.disconnect();
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    instances.delete(nav);
  };
  instances.set(nav, cleanup);
  return cleanup;
}
