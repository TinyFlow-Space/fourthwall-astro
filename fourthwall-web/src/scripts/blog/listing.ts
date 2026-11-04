function initializeListing(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form")!;
  const status = root.querySelector<HTMLElement>("[data-loading-status]")!;
  const skeleton = root.querySelector<HTMLElement>("[data-skeleton]")!;
  const shell = root.querySelector<HTMLElement>("[data-results-shell]")!;
  const filters = root.querySelector<HTMLElement>("[data-filter-buttons]");
  let results = root.querySelector<HTMLElement>("[data-blog-results]")!;
  const events = new AbortController();
  const cache = new Map<string, { html: string; time: number }>();
  let controller: AbortController | undefined;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout>;
  const field = (name: string) =>
    form.elements.namedItem(name) as HTMLInputElement;
  const keyOf = (url: URL) => {
    const copy = new URL(url);
    copy.searchParams.delete("fragment");
    if (copy.searchParams.get("page") === "1") copy.searchParams.delete("page");
    for (const name of ["q", "category", "tag"])
      if (!copy.searchParams.get(name)) copy.searchParams.delete(name);
    copy.searchParams.sort();
    return copy.pathname + copy.search;
  };
  const responseUrl = (element: HTMLElement, fallback: URL) => {
    const url = new URL(fallback);
    for (const name of ["q", "category", "tag", "page"]) {
      const value = element.dataset[name];
      if (value === undefined) continue;
      if (value && !(name === "page" && value === "1"))
        url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    url.searchParams.delete("fragment");
    return url;
  };
  let committed = responseUrl(results, new URL(location.href));
  history.replaceState(history.state, "", committed);
  if (!results.dataset.error)
    cache.set(keyOf(committed), { html: results.outerHTML, time: Date.now() });

  const setBusy = (busy: boolean) => {
    results.setAttribute("aria-busy", String(busy));
    results.inert = busy;
    skeleton.hidden = !busy;
    if (busy) shell.style.minHeight = `${shell.offsetHeight}px`;
    else shell.style.minHeight = "";
  };
  function syncForm(url: URL) {
    for (const name of ["q", "category", "tag"])
      field(name).value = url.searchParams.get(name) ?? "";
    const category = field("category").value;
    // Update semantic state immediately even if the shared animation script loads later.
    filters?.querySelectorAll<HTMLElement>("[data-value]").forEach((button) => {
      const selected = button.dataset.value === category;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("text-foreground!", selected);
      if (button instanceof HTMLAnchorElement) {
        const href = new URL(url);
        href.searchParams.delete("page");
        if (button.dataset.value)
          href.searchParams.set("category", button.dataset.value);
        else href.searchParams.delete("category");
        button.href = href.href;
      }
    });
    filters?.dispatchEvent(
      new CustomEvent("selection-set", { detail: { value: category } }),
    );
  }
  syncForm(committed);
  async function load(
    url: URL,
    historyMode: "push" | "none" = "push",
    retry = false,
  ) {
    clearTimeout(timer);
    controller?.abort();
    controller = new AbortController();
    const current = ++generation;
    const restoreFocus = results.contains(document.activeElement);
    setBusy(true);
    status.classList.add("sr-only");
    status.textContent = "Loading posts…";
    const key = keyOf(url);
    try {
      const cached = cache.get(key);
      let html: string;
      if (!retry && cached && Date.now() - cached.time < 60000)
        html = cached.html;
      else {
        const request = new URL(url);
        request.searchParams.set("fragment", "1");
        const response = await fetch(request, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
          headers: { Accept: "text/html" },
        });
        if (!response.ok) throw new Error("Request failed");
        const doc = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
        const fragment = doc.querySelector<HTMLElement>("[data-blog-results]");
        if (!fragment || fragment.dataset.error)
          throw new Error("Invalid response");
        html = fragment.outerHTML;
        if (current !== generation) return;
        if (cache.size >= 20) cache.delete(cache.keys().next().value!);
        cache.set(key, { html, time: Date.now() });
      }
      if (current !== generation) return;
      const replacement = new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector<HTMLElement>("[data-blog-results]")!;
      results.replaceWith(replacement);
      results = replacement;
      url = responseUrl(results, url);
      if (
        historyMode === "push" &&
        keyOf(new URL(location.href)) !== keyOf(url)
      )
        history.pushState({}, "", url);
      else history.replaceState(history.state, "", url);
      committed = url;
      syncForm(url);
      if (restoreFocus) {
        results.tabIndex = -1;
        results.focus({ preventScroll: true });
      }
      status.textContent =
        results.querySelector("[data-result-count]")?.textContent ??
        "Posts updated.";
    } catch (error) {
      if (
        current !== generation ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
      // Keep URL, tab and visible results consistent when an update fails.
      syncForm(committed);
      history.replaceState(history.state, "", committed);
      status.classList.remove("sr-only");
      status.textContent =
        "Couldn’t update posts. Your previous results are still shown. ";
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.textContent = "Try again";
      retryButton.className = "underline";
      retryButton.onclick = () => void load(url, historyMode, true);
      status.append(retryButton);
    } finally {
      if (current === generation) setBusy(false);
    }
  }
  function formUrl() {
    const url = new URL("/blog", location.origin);
    new FormData(form).forEach((value, key) => {
      const text = String(value).trim();
      if (text)
        url.searchParams.set(key, key === "q" ? text.slice(0, 120) : text);
    });
    return url;
  }
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      void load(formUrl());
    },
    { signal: events.signal },
  );
  form.addEventListener(
    "input",
    (event) => {
      if (
        !(event.target instanceof HTMLInputElement) ||
        event.target.name !== "q"
      )
        return;
      clearTimeout(timer);
      controller?.abort();
      ++generation;
      setBusy(true);
      status.classList.add("sr-only");
      status.textContent = "Waiting for search…";
      if (!event.isComposing)
        timer = setTimeout(() => void load(formUrl()), 300);
    },
    { signal: events.signal },
  );
  form.addEventListener(
    "compositionend",
    () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(formUrl()), 300);
    },
    { signal: events.signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const tab = (event.target as Element).closest<HTMLAnchorElement>(
        "[data-filter-buttons] a[data-value]",
      );
      if (tab) {
        event.preventDefault();
        field("category").value = tab.dataset.value ?? "";
        void load(formUrl());
        return;
      }
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[data-page-link], a[data-reset], a[data-retry]",
      );
      if (!link) return;
      event.preventDefault();
      void load(new URL(link.href), "push", link.hasAttribute("data-retry"));
    },
    { signal: events.signal },
  );
  window.addEventListener(
    "popstate",
    () => {
      const url = new URL(location.href);
      syncForm(url);
      void load(url, "none");
    },
    { signal: events.signal },
  );
  const cancel = () => {
    clearTimeout(timer);
    controller?.abort();
    ++generation;
    setBusy(false);
  };
  window.addEventListener("pagehide", cancel, { signal: events.signal });
  window.addEventListener("pageshow", () => syncForm(committed), {
    signal: events.signal,
  });
  return () => {
    cancel();
    events.abort();
  };
}
let cleanup: (() => void) | undefined;
function initialize() {
  cleanup?.();
  const root = document.querySelector<HTMLElement>("[data-blog-listing]");
  cleanup = root ? initializeListing(root) : undefined;
}
initialize();
document.addEventListener("astro:page-load", initialize);
document.addEventListener("astro:before-swap", () => {
  cleanup?.();
  cleanup = undefined;
});
