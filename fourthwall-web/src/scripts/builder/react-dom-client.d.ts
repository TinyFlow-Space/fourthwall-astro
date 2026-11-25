// Minimal types for the one react-dom API the canvas bridge uses.
declare module "react-dom/client" {
  export function createRoot(container: Element): { render(node: unknown): void; unmount(): void };
}
