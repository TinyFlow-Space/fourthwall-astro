export const initBrandManufactureSliders = () => {
  const sliders = document.querySelectorAll<HTMLElement>(
    "[data-brand-manufacture-slider]",
  );

  sliders.forEach((slider) => {
    if (slider.dataset.initialized) return;

    const backgrounds = [
      ...slider.querySelectorAll<HTMLElement>("[data-manufacture-background]"),
    ];
    const panels = [
      ...slider.querySelectorAll<HTMLElement>("[data-manufacture-panel]"),
    ];
    const slideKeys = backgrounds
      .map((background) => background.dataset.manufactureBackground)
      .filter((key): key is string => Boolean(key));

    if (!slideKeys.length || panels.length !== slideKeys.length) return;
    slider.dataset.initialized = "true";

    const zIndexSequence = [...slideKeys].sort((first, second) =>
      first.localeCompare(second, undefined, { numeric: true }),
    );
    const autoplayDelay = Number(slider.dataset.autoplayDelay) || 5200;
    const backgroundTransition = "clip-path 1150ms var(--ease-rise-in)";
    const panelTransition = "clip-path 1600ms var(--ease-rise-in) 200ms";
    const transitionDuration = 1800;
    let activeKey: string | undefined;
    let autoplayTimer: number | undefined;
    let transitionCleanupTimer: number | undefined;

    const setSlideStacking = (key: string) => {
      const activeIndex = zIndexSequence.indexOf(key);
      const slideCount = zIndexSequence.length;
      const isFirstInSequence = activeIndex === 0;
      const zIndexes = new Map<string, number>();

      zIndexSequence.forEach((slideKey, index) => {
        const relativePosition =
          (index - activeIndex + slideCount) % slideCount;
        const zIndex =
          relativePosition === 0
            ? slideCount
            : isFirstInSequence
              ? relativePosition
              : slideCount - relativePosition;
        zIndexes.set(slideKey, zIndex);
      });

      backgrounds.forEach((background) => {
        background.style.zIndex = String(
          zIndexes.get(background.dataset.manufactureBackground ?? "") ?? 0,
        );
      });
      panels.forEach((panel) => {
        panel.style.zIndex = String(
          zIndexes.get(panel.dataset.manufacturePanel ?? "") ?? 0,
        );
      });
    };

    const setVisualState = (
      elements: HTMLElement[],
      key: string,
      previousKey: string | undefined,
      immediate: boolean,
      isPanel: boolean,
    ) => {
      elements.forEach((element) => {
        const elementKey = isPanel
          ? element.dataset.manufacturePanel
          : element.dataset.manufactureBackground;
        const isActive = elementKey === key;
        const isPrevious = Boolean(previousKey && elementKey === previousKey);

        element.style.transition =
          immediate || (!isActive && !isPrevious)
            ? "none"
            : isPanel
              ? panelTransition
              : backgroundTransition;

        if (isActive) {
          element.style.clipPath = "inset(0px)";
        } else if (isPrevious && !immediate) {
          element.style.clipPath = "inset(0px)";
        } else {
          element.style.clipPath = "inset(0 100% 0 0)";
        }
      });
    };

    const scheduleAutoplay = (key: string) => {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = window.setTimeout(() => {
        const activeIndex = slideKeys.indexOf(key);
        const nextKey = slideKeys[(activeIndex + 1) % slideKeys.length];
        if (nextKey) activateSlide(nextKey);
      }, autoplayDelay);
    };

    const activateSlide = (key: string, immediate = false) => {
      if (!slideKeys.includes(key)) return;

      const previousKey = activeKey;
      window.clearTimeout(transitionCleanupTimer);
      setSlideStacking(key);
      setVisualState(backgrounds, key, previousKey, immediate, false);
      setVisualState(panels, key, previousKey, immediate, true);

      activeKey = key;
      slider.dataset.currentSlide = key;

      if (previousKey && previousKey !== key && !immediate) {
        transitionCleanupTimer = window.setTimeout(() => {
          if (activeKey !== key) return;

          for (const elements of [backgrounds, panels]) {
            const previous = elements.find(
              (element) =>
                (element.dataset.manufactureBackground ??
                  element.dataset.manufacturePanel) === previousKey,
            );
            if (previous) {
              previous.style.transition = "none";
              previous.style.clipPath = "inset(0 100% 0 0)";
            }
          }
        }, transitionDuration);
      }

      scheduleAutoplay(key);
    };

    const initialKey = slider.dataset.currentSlide ?? slideKeys[0];
    activateSlide(
      slideKeys.includes(initialKey) ? initialKey : slideKeys[0],
      true,
    );
  });
};
