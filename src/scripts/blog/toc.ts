const instances = new WeakMap<HTMLElement, () => void>();

/** Initialize an article TOC; return cleanup. */
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
  const disclosure = nav.closest<HTMLElement>("[data-toc-disclosure]");
  const toggle =
    disclosure?.querySelector<HTMLButtonElement>("[data-toc-toggle]");
  const compact = matchMedia("(max-width: 992px)");
  const links = Array.from(
    nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  );
  let expanded = false;
  function updateDisclosure() {
    if (!disclosure || !toggle) return;
    const collapsible = compact.matches && links.length > 4;
    toggle.hidden = !collapsible;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded
      ? "Hide table of contents"
      : "Show table of contents";
    if (collapsible) {
      // Four complete entries, followed by a faded preview of the next entry.
      const preview = links[4];
      const height =
        preview.getBoundingClientRect().top -
        nav.getBoundingClientRect().top +
        parseFloat(getComputedStyle(preview).lineHeight);
      disclosure.style.setProperty("--toc-preview-height", `${height}px`);
      disclosure.dataset.expanded = String(expanded);
    } else delete disclosure.dataset.expanded;
    links.forEach((link, index) => {
      const clipped = collapsible && !expanded && index >= 4;
      link.inert = clipped;
      if (clipped) link.setAttribute("aria-hidden", "true");
      else link.removeAttribute("aria-hidden");
    });
  }
  toggle?.addEventListener(
    "click",
    () => {
      expanded = !expanded;
      updateDisclosure();
      // Keep the control visible if collapsing a long list moves it above the viewport.
      if (!expanded && toggle.getBoundingClientRect().top < 100) {
        toggle.scrollIntoView({ block: "center", behavior: "instant" });
      }
    },
    { signal },
  );
  compact.addEventListener("change", updateDisclosure, { signal });
  const disclosureResize = new ResizeObserver(updateDisclosure);
  disclosureResize.observe(nav);
  updateDisclosure();

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
    // Measure headings only when the observer fires.
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
    // Unlock if scrollend never fires.
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
    // Track header crossings in either scroll direction.
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
        // Ignore scrollend from a scroll that started before this navigation.
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

  // Keep the incoming hash until navigation finishes.
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
    disclosureResize.disconnect();
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    instances.delete(nav);
  };
  instances.set(nav, cleanup);
  return cleanup;
}
