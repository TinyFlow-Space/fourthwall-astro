import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { useDocuments } from "@sanity/visual-editing/react";

/**
 * Exposes Presentation's optimistic document store (`useDocuments`) to plain
 * TypeScript. Patches made through it are applied by the Studio as the
 * logged-in editor, land in the draft, and show up in Studio undo/history.
 */
type Documents = ReturnType<typeof useDocuments>;

let current: Documents | undefined;
const waiting: ((documents: Documents) => void)[] = [];

function Bridge() {
  current = useDocuments();
  waiting.splice(0).forEach((resolve) => resolve(current!));
  return null;
}

let mounted = false;
export function mountDocumentsBridge() {
  if (mounted) return;
  mounted = true;
  const host = document.createElement("div");
  host.hidden = true;
  document.body.append(host);
  createRoot(host).render(createElement(Bridge));
}

export const getDocuments = (): Promise<Documents> => {
  // Test seam: automated tests supply a stand-in store.
  const stub = (globalThis as { __fwCanvasDocuments?: Documents }).__fwCanvasDocuments;
  if (stub) return Promise.resolve(stub);
  return current ? Promise.resolve(current) : new Promise((resolve) => waiting.push(resolve));
};
