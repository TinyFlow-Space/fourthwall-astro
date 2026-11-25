import { at, insert, remove, setIfMissing } from "@sanity/mutate";
import { getDocuments, mountDocumentsBridge } from "./documents";
// Inlined and injected on init, so public pages never ship these styles.
import css from "./canvas.css?inline";

/**
 * Canvas tools for the Presentation preview, driven by the data-fw-* markers
 * from src/lib/canvas.ts:
 *
 * - hover an item → a drag grip and "+" buttons before/after it;
 * - drag the grip into any slot that accepts the item (same list, another
 *   section, into a card/grid/slider…), with a drop line showing the spot;
 * - "+" inserts a new item at that exact position (a menu appears when the
 *   slot accepts several block types); empty slots get their own "+".
 *
 * Writes go through Presentation's document store (see ./documents.ts).
 */

interface Item {
  el: HTMLElement;
  path: string;
  parent: string;
  type: string;
  key: string;
  doc: string;
}
interface Drop {
  slot: HTMLElement;
  ref: Item | null;
  position: "before" | "after";
  line: { x: number; y: number; w: number; h: number };
}

const ITEM = "[data-fw-item]";
const SLOT = "[data-fw-slot]";

// ---------- reading the markers ----------

const lastKey = (path: string) => [...path.matchAll(/\[_key=="([^"]+)"\]/g)].at(-1)?.[1] ?? "";
const readItem = (el: HTMLElement): Item => ({
  el,
  path: el.dataset.fwItem!,
  parent: el.dataset.fwParent!,
  type: el.dataset.fwType!,
  key: lastKey(el.dataset.fwItem!),
  doc: el.dataset.fwDoc!,
});
const accepts = (slot: HTMLElement, type: string) =>
  (slot.dataset.fwAccepts ?? "").split(" ").includes(type);
const visible = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
};

/** Items directly in a slot's array, in DOM order (first copy of duplicates). */
function itemsOf(slot: HTMLElement): Item[] {
  const path = slot.dataset.fwSlot;
  const seen = new Set<string>();
  return [...slot.querySelectorAll<HTMLElement>(ITEM)]
    .filter((el) => el.dataset.fwParent === path && visible(el))
    .map(readItem)
    .filter((item) => !seen.has(item.path) && seen.add(item.path));
}

/** The array path an element sits in, walking up through slots. */
function slotsAt(x: number, y: number): HTMLElement[] {
  const hit = document.elementsFromPoint(x, y).find((el) => !layer.contains(el));
  const slots: HTMLElement[] = [];
  for (let el = hit?.closest<HTMLElement>(SLOT); el; el = el.parentElement?.closest<HTMLElement>(SLOT) ?? null)
    slots.push(el);
  return slots;
}

// ---------- patches ----------

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => (b % 36).toString(36)).join("");
}
/**
 * Deep clone with fresh `_key`s, so copies never collide with originals.
 * Objects inside arrays always get a key (Sanity requires one per item).
 */
function reKey<T>(value: T): T {
  if (Array.isArray(value))
    return value.map((entry) => {
      const copy = reKey(entry);
      return copy && typeof copy === "object" && !Array.isArray(copy)
        ? { ...copy, _key: randomKey() }
        : copy;
    }) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, k === "_key" ? randomKey() : reKey(v)]),
    ) as T;
  return value;
}
/** Resolve `a[_key=="x"].b` in a document snapshot. */
function resolve(root: unknown, path: string): unknown {
  let node: unknown = root;
  for (const [, field, key] of path.matchAll(/([A-Za-z0-9_]+)|\[_key=="([^"]+)"\]/g)) {
    if (field) node = (node as Record<string, unknown> | undefined)?.[field];
    else node = Array.isArray(node) ? node.find((item) => item?._key === key) : undefined;
    if (node === undefined) return undefined;
  }
  return node;
}

type PatchList = ReturnType<typeof at>[];
async function patch(docId: string, build: (snapshot: unknown) => PatchList) {
  try {
    const documents = await getDocuments();
    await documents.getDocument(docId).patch(async ({ getSnapshot }) => build(await getSnapshot()));
  } catch (error) {
    console.error("[canvas]", error);
    toast("Couldn't save that change — reload the preview and try again.");
  }
}

function insertOps(slotPath: string, value: unknown, ref: Item | null, position: "before" | "after"): PatchList {
  return ref
    ? [at(slotPath, insert(value, position, { _key: ref.key }))]
    : [at(slotPath, setIfMissing([])), at(slotPath, insert(value, "after", -1))];
}

function moveItem(item: Item, drop: Drop) {
  const slotPath = drop.slot.dataset.fwSlot!;
  if (drop.ref?.key === item.key) return;
  // Dropping right next to itself in the same list changes nothing.
  if (slotPath === item.parent && drop.ref) {
    const list = itemsOf(drop.slot);
    const from = list.findIndex((i) => i.key === item.key);
    const to = list.findIndex((i) => i.key === drop.ref!.key) + (drop.position === "after" ? 1 : 0);
    if (to === from || to === from + 1) return;
  }
  void patch(item.doc, (snapshot) => {
    const value = resolve(snapshot, item.path);
    if (!value) return [];
    return [at(item.parent, remove({ _key: item.key })), ...insertOps(slotPath, value, drop.ref, drop.position)];
  });
}

// ---------- new blocks ----------

const TITLES: Record<string, string> = {
  section: "Section",
  eyebrow: "Eyebrow",
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  buttonGroup: "Button Group",
  imageBlock: "Image",
  loopingVideo: "Looping Video",
  card: "Card",
  grid: "Grid",
  slider: "Slider",
  groupButton: "Button",
  homeHero: "Hero",
  homeFeaturedProducts: "Featured Products",
  homeTrustedBrands: "Trusted Brands",
  homeBrandShowcase: "Brand Showcase",
  homeProductDesign: "Product Design",
  homeOperations: "Operations",
  homeTestimonials: "Testimonials",
  homeProducts: "Products",
  homeCreators: "Creators",
  homeMadeWith: "Made With Fourthwall",
  homeFaq: "FAQ",
};
const text = (value: string) => [
  { _type: "block", _key: randomKey(), style: "normal", markDefs: [], children: [{ _type: "span", _key: randomKey(), text: value, marks: [] }] },
];
const heading = (value = "New heading", size = "xl") => ({ _type: "heading", text: text(value), level: "h2", size, weight: "regular", color: "default", align: "auto" });
const paragraph = () => ({ _type: "paragraph", text: text("Write a sentence or two here."), size: "md", color: "muted", align: "auto", maxWidth: 60 });
const groupButton = () => ({ _type: "groupButton", label: "Button", href: "#", newTab: false, style: "primary", size: "md" });
const card = () => ({ _type: "card", variant: "surface", padding: 28, gap: 12, radius: 14, content: [heading("Card title", "md"), paragraph()] });
const DEFAULTS: Record<string, () => Record<string, unknown>> = {
  section: () => ({ _type: "section", name: "Section", theme: "light", paddingTop: 96, paddingBottom: 96, gap: 16, maxWidth: 1240, contentAlign: "start", content: [heading(), paragraph()] }),
  eyebrow: () => ({ _type: "eyebrow", text: "Eyebrow", size: "sm", color: "muted", align: "auto" }),
  heading: () => heading(),
  paragraph,
  button: () => ({ ...groupButton(), _type: "button", align: "auto" }),
  buttonGroup: () => ({ _type: "buttonGroup", buttons: [groupButton()], direction: "row", align: "auto", wrap: true, gap: 12 }),
  imageBlock: () => ({ _type: "imageBlock", aspectRatio: "16/9", objectFit: "cover", radius: 12 }),
  loopingVideo: () => ({ _type: "loopingVideo", aspectRatio: "16/9", objectFit: "cover", autoplay: true, radius: 12 }),
  card,
  grid: () => ({ _type: "grid", columns: { mobile: 1, tablet: 2, desktop: 3 }, columnGap: 24, rowGap: 24, alignItems: "stretch", items: [card(), card(), card()] }),
  slider: () => ({ _type: "slider", slidesPerView: { mobile: 1, tablet: 2, desktop: 3 }, gap: 24, loop: true, showArrows: true, showDots: true, slides: [card(), card(), card()] }),
  groupButton,
};
const builtIn = (type: string) => type.startsWith("home");

/** Types the "+" can add to a slot (list items copy their neighbour instead). */
function insertableTypes(slot: HTMLElement): string[] {
  const types = (slot.dataset.fwAccepts ?? "").split(" ").filter(Boolean);
  if (types.some((t) => t.startsWith("cmsItem:"))) return types;
  // Every section type is offered, like the Studio's "Add item" menu; built-in
  // sections already on the page are moved instead of duplicated (see openMenu).
  return types.filter((type) => builtIn(type) || type in DEFAULTS);
}

function addItem(slot: HTMLElement, type: string, ref: Item | null, position: "before" | "after", template?: Item) {
  const slotPath = slot.dataset.fwSlot!;
  void patch(slot.dataset.fwDoc!, (snapshot) => {
    let value: Record<string, unknown> | undefined;
    if (type.startsWith("cmsItem:")) {
      // Homepage list items: start from a copy of the neighbouring item.
      const source = template && resolve(snapshot, template.path);
      if (!source) return [];
      value = reKey(source as Record<string, unknown>);
    } else value = builtIn(type) ? { _type: type, hidden: false } : reKey(DEFAULTS[type]());
    return insertOps(slotPath, { ...value, _key: randomKey() }, ref, position);
  });
}

// ---------- UI layer ----------

const layer = document.createElement("div");
layer.className = "fw-canvas";
const grip = button("fw-canvas-grip", "⠿", "Drag to move");
const before = button("fw-canvas-plus", "+", "Add before");
const after = button("fw-canvas-plus", "+", "Add after");
const empty = button("fw-canvas-empty", "+ Add", "Add an item");
const menu = document.createElement("div");
menu.className = "fw-canvas-menu";
const line = document.createElement("div");
line.className = "fw-canvas-line";
const ghost = document.createElement("div");
ghost.className = "fw-canvas-ghost";
const message = document.createElement("div");
message.className = "fw-canvas-toast";
message.setAttribute("role", "status");
const style = document.createElement("style");
style.textContent = css;
layer.append(style, grip, before, after, empty, line, ghost, menu, message);

function button(className: string, label: string, title: string) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = className;
  el.textContent = label;
  el.title = title;
  el.setAttribute("aria-label", title);
  return el;
}
const show = (el: HTMLElement, x: number, y: number) => {
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  el.hidden = false;
};
const hideAll = () => [grip, before, after, empty, line, ghost].forEach((el) => (el.hidden = true));
let toastTimer: ReturnType<typeof setTimeout>;
function toast(text: string) {
  message.textContent = text;
  message.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (message.hidden = true), 4000);
}

/** Whether the siblings of an item run left-to-right (rows, tracks, grids). */
function horizontal(item: Item): boolean {
  const slot = item.el.parentElement?.closest<HTMLElement>(`[data-fw-slot="${CSS.escape(item.parent)}"]`);
  const list = slot ? itemsOf(slot) : [];
  const index = list.findIndex((i) => i.key === item.key);
  const neighbour = list[index + 1] ?? list[index - 1];
  if (!neighbour) return false;
  const a = item.el.getBoundingClientRect();
  const b = neighbour.el.getBoundingClientRect();
  return Math.abs(a.top - b.top) < Math.min(a.height, b.height) / 2;
}

// Hover state: the item (or empty slot) the controls belong to.
let hovered: Item | null = null;
let hoveredEmpty: HTMLElement | null = null;
let menuOpen = false;

function place() {
  hideAll();
  if (dragging) return;
  if (hovered && document.contains(hovered.el)) {
    const r = hovered.el.getBoundingClientRect();
    const row = horizontal(hovered);
    show(grip, Math.min(r.right, innerWidth) - 34, Math.max(r.top, 0) + 6);
    const slot = hovered.el.parentElement?.closest<HTMLElement>(`[data-fw-slot="${CSS.escape(hovered.parent)}"]`);
    if (slot && insertableTypes(slot).length) {
      if (row) {
        show(before, r.left - 13, r.top + r.height / 2 - 13);
        show(after, r.right - 13, r.top + r.height / 2 - 13);
      } else {
        show(before, r.left + r.width / 2 - 13, r.top - 13);
        show(after, r.left + r.width / 2 - 13, r.bottom - 13);
      }
    }
  }
  if (hoveredEmpty && document.contains(hoveredEmpty) && insertableTypes(hoveredEmpty).length) {
    const r = hoveredEmpty.getBoundingClientRect();
    show(empty, r.left + r.width / 2 - 40, r.top + r.height / 2 - 16);
  }
}

function onPointerMove(event: PointerEvent) {
  if (dragging || menuOpen) return;
  const target = event.target as Element | null;
  if (!target || layer.contains(target)) return; // keep controls while using them
  const el = target.closest<HTMLElement>(ITEM);
  const slot = target.closest<HTMLElement>(SLOT);
  // The innermost empty slot gets "+ Add"; when it sits inside the hovered item
  // (an empty section) it takes over, when it *is* the item (an empty card)
  // both the item controls and "+ Add" show.
  hoveredEmpty = slot && (!el || el.contains(slot)) && !itemsOf(slot).length ? slot : null;
  hovered = el && !(hoveredEmpty && hoveredEmpty !== el) ? readItem(el) : null;
  place();
}

// ---------- "+" and the type menu ----------

function openMenu(slot: HTMLElement, ref: Item | null, position: "before" | "after", anchor: HTMLElement) {
  const types = insertableTypes(slot);
  if (!types.length) return;
  // Single choice (or a homepage list): insert straight away.
  if (types.length === 1) {
    addItem(slot, types[0], ref, position, ref ?? undefined);
    return;
  }
  // Built-in sections share one set of content and appear once per page, so
  // picking one that is already on the page moves it to this spot.
  const onPage = new Map(itemsOf(slot).filter((item) => builtIn(item.type)).map((item) => [item.type, item]));
  menu.replaceChildren(
    ...types.map((type) => {
      const title = TITLES[type] ?? type;
      const existing = onPage.get(type);
      const option = button("fw-canvas-option", title, existing ? `Move ${title} here` : `Add ${title}`);
      if (existing) {
        const hint = document.createElement("small");
        hint.textContent = existing.key === ref?.key ? "On page · here" : "On page · move here";
        option.append(hint);
        option.disabled = existing.key === ref?.key;
      }
      option.addEventListener("click", () => {
        closeMenu();
        if (existing) moveItem(existing, { slot, ref, position, line: { x: 0, y: 0, w: 0, h: 0 } });
        else addItem(slot, type, ref, position);
      });
      return option;
    }),
  );
  const r = anchor.getBoundingClientRect();
  menu.hidden = false;
  menuOpen = true;
  const left = Math.min(r.left, innerWidth - menu.offsetWidth - 8);
  const top = r.bottom + menu.offsetHeight + 8 > innerHeight ? r.top - menu.offsetHeight - 6 : r.bottom + 6;
  menu.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
  (menu.firstElementChild as HTMLElement | null)?.focus();
}
function closeMenu() {
  menu.hidden = true;
  menuOpen = false;
}
function plus(position: "before" | "after", anchor: HTMLElement) {
  if (!hovered) return;
  const slot = hovered.el.parentElement?.closest<HTMLElement>(`[data-fw-slot="${CSS.escape(hovered.parent)}"]`);
  if (slot) openMenu(slot, hovered, position, anchor);
}
before.addEventListener("click", () => plus("before", before));
after.addEventListener("click", () => plus("after", after));
empty.addEventListener("click", () => hoveredEmpty && openMenu(hoveredEmpty, null, "after", empty));

// ---------- dragging ----------

let dragging: Item | null = null;
let currentDrop: Drop | null = null;

function findDrop(x: number, y: number, item: Item): Drop | null {
  const slot = slotsAt(x, y).find(
    (s) => s.dataset.fwDoc === item.doc && accepts(s, item.type) && !item.el.contains(s),
  );
  if (!slot) return null;
  const list = itemsOf(slot).filter((i) => i.key !== item.key && !item.el.contains(i.el));
  if (!list.length) {
    const r = slot.getBoundingClientRect();
    return { slot, ref: null, position: "after", line: { x: r.left + 8, y: r.top + r.height / 2, w: r.width - 16, h: 3 } };
  }
  // Nearest sibling decides the side; rows compare x, columns compare y.
  let best = list[0];
  let bestDistance = Infinity;
  for (const candidate of list) {
    const r = candidate.el.getBoundingClientRect();
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) [best, bestDistance] = [candidate, distance];
  }
  const r = best.el.getBoundingClientRect();
  const row = horizontal(best);
  const first = row ? x < r.left + r.width / 2 : y < r.top + r.height / 2;
  return {
    slot,
    ref: best,
    position: first ? "before" : "after",
    line: row
      ? { x: (first ? r.left : r.right) - 1, y: r.top, w: 3, h: r.height }
      : { x: r.left, y: (first ? r.top : r.bottom) - 1, w: r.width, h: 3 },
  };
}

grip.addEventListener("pointerdown", (event) => {
  if (!hovered || event.button !== 0) return;
  event.preventDefault();
  grip.setPointerCapture(event.pointerId);
  dragging = hovered;
  dragging.el.classList.add("fw-canvas-dragging");
  document.documentElement.classList.add("fw-canvas-busy");
  ghost.textContent = `⠿ ${TITLES[dragging.type] ?? (dragging.type.startsWith("cmsItem") ? "Item" : dragging.type)}`;
  hideAll();
});
grip.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  show(ghost, event.clientX + 12, event.clientY + 12);
  // Scroll while dragging near the viewport edges.
  if (event.clientY < 60) scrollBy(0, -18);
  else if (event.clientY > innerHeight - 60) scrollBy(0, 18);
  currentDrop = findDrop(event.clientX, event.clientY, dragging);
  if (currentDrop) {
    const { x, y, w, h } = currentDrop.line;
    line.style.width = `${w}px`;
    line.style.height = `${h}px`;
    show(line, x, y);
  } else line.hidden = true;
});
function endDrag(commit: boolean) {
  if (!dragging) return;
  const item = dragging;
  const drop = currentDrop;
  dragging.el.classList.remove("fw-canvas-dragging");
  document.documentElement.classList.remove("fw-canvas-busy");
  dragging = null;
  currentDrop = null;
  hideAll();
  if (commit && drop) moveItem(item, drop);
  else if (commit) toast("That item can't go there.");
}
grip.addEventListener("pointerup", () => endDrag(true));
grip.addEventListener("pointercancel", () => endDrag(false));

// ---------- lifecycle ----------

export function initCanvas() {
  mountDocumentsBridge();
  document.documentElement.dataset.fwEditing = "";
  closeMenu();
  hideAll();
  message.hidden = true;
  document.body.append(layer);
  let frame = 0;
  const follow = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(place);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    closeMenu();
    endDrag(false);
  };
  const onDown = (event: PointerEvent) => {
    if (menuOpen && !menu.contains(event.target as Node)) closeMenu();
  };
  addEventListener("pointermove", onPointerMove, { passive: true });
  addEventListener("pointerdown", onDown, true);
  addEventListener("scroll", follow, { passive: true, capture: true });
  addEventListener("resize", follow);
  addEventListener("keydown", onKey);
  return () => {
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("pointerdown", onDown, true);
    removeEventListener("scroll", follow, true);
    removeEventListener("resize", follow);
    removeEventListener("keydown", onKey);
    layer.remove();
    delete document.documentElement.dataset.fwEditing;
  };
}
