export function httpsUrl(value?: string): string | undefined {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function videoUrl(value?: string): string | undefined {
  const safe = httpsUrl(value);
  if (!safe) return;
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./, "");
  if (["youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v") ||
          url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id))
      return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (["vimeo.com", "player.vimeo.com"].includes(host)) {
    const id = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/|$)/)?.[1];
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
}
export function socialUrl(value?: string): string | undefined {
  const safe = httpsUrl(value);
  if (!safe) return;
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./, "");
  if (host === "instagram.com") {
    const path = url.pathname.match(/^\/(p|reel|tv)\/([\w-]+)\/?$/);
    if (path) return `https://www.instagram.com/${path[1]}/${path[2]}/embed/`;
  }
  if (host === "open.spotify.com") {
    const path = url.pathname.match(
      /^\/(?:embed\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)$/,
    );
    if (path) return `https://open.spotify.com/embed/${path[1]}/${path[2]}`;
  }
}
// Promote only a standalone, recognized video iframe. Never render editor HTML
// directly in the page or relax the sandbox for arbitrary HTML/script embeds.
export function htmlVideoUrl(html?: string): string | undefined {
  const iframe = html?.match(
    /^\s*<iframe\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>\s*<\/iframe>\s*$/i,
  );
  if (!iframe) return;
  const attributes = iframe[1].matchAll(
    /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g,
  );
  for (const attribute of attributes) {
    if (attribute[1].toLowerCase() === "src") {
      return videoUrl(attribute[2] ?? attribute[3] ?? attribute[4]);
    }
  }
}
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
// An opaque-origin sandbox isolates editor HTML and scripts from the parent DOM,
// cookies, storage, navigation and forms. CSP also prevents inline event handlers.
export function embedDocument(html: string, scriptUrl?: string): string {
  const script = httpsUrl(scriptUrl);
  const policy = `default-src 'none'; img-src https: data:; media-src https:; frame-src https:; style-src 'unsafe-inline' https:; font-src https: data:; connect-src https:; script-src ${script ? new URL(script).origin : "'none'"}; base-uri 'none'; form-action 'none'`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy)}"><style>body{margin:0;font:16px/1.5 system-ui;overflow-wrap:anywhere}img,video,iframe{max-width:100%}*{box-sizing:border-box}</style></head><body>${html}${script ? `<script async src="${escapeHtml(script)}"></script>` : ""}</body></html>`;
}
