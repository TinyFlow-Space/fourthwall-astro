import gsap from "gsap";

export function initCursorTracking(
  root: HTMLElement,
  itemSelector: string,
  cursor: HTMLElement,
  labelAttribute: string,
) {
  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  const items = Array.from(root.querySelectorAll<HTMLElement>(itemSelector));

  if (!canHover || !items.length) {
    return () => {};
  }

  document.body.appendChild(cursor);
  gsap.set(cursor, { xPercent: -50, yPercent: -50, autoAlpha: 0 });

  const setX = gsap.quickTo(cursor, "x", { duration: 0.4, ease: "power3" });
  const setY = gsap.quickTo(cursor, "y", { duration: 0.4, ease: "power3" });

  let isActive = false;

  const follow = (event: MouseEvent) => {
    setX(event.clientX);
    setY(event.clientY);
  };

  const show = (event: MouseEvent, label: string) => {
    cursor.textContent = label;

    if (!isActive) {
      isActive = true;
      setX(event.clientX, event.clientX);
      setY(event.clientY, event.clientY);
      document.addEventListener("mousemove", follow);
    } else {
      follow(event);
    }

    gsap.to(cursor, {
      autoAlpha: 1,
      duration: 0.15,
      ease: "none",
      overwrite: "auto",
    });
  };

  const hide = () => {
    isActive = false;
    document.removeEventListener("mousemove", follow);
    gsap.to(cursor, {
      autoAlpha: 0,
      duration: 0.15,
      ease: "none",
      overwrite: "auto",
    });
  };

  const listeners = items.map((item) => {
    const handleEnter = (event: MouseEvent) =>
      show(event, item.getAttribute(labelAttribute) ?? "");

    item.addEventListener("mouseenter", handleEnter);
    item.addEventListener("mouseleave", hide);

    return { item, handleEnter };
  });

  return () => {
    isActive = false;
    document.removeEventListener("mousemove", follow);
    listeners.forEach(({ item, handleEnter }) => {
      item.removeEventListener("mouseenter", handleEnter);
      item.removeEventListener("mouseleave", hide);
    });
    gsap.killTweensOf(cursor);
    cursor.remove();
  };
}
