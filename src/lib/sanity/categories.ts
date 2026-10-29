import type { Taxonomy } from "./types";

// Keep the existing tab labels/order; use actual CMS slugs when available.
const tabs = [
  { label: "Latest", value: "" },
  { label: "Featured", value: "featured" },
  { label: "Case Studies", value: "case-studies" },
  { label: "Announcements", value: "announcements" },
  { label: "Best Practices", value: "best-practices" },
  { label: "Trends & Insights", value: "trends-insights" },
];
export function categoryOptions(categories: Taxonomy[]) {
  const options = tabs.map((tab) => {
    if (!tab.value || tab.value === "featured") return tab;
    const category = categories.find(
      (c) => c.title.toLowerCase() === tab.label.toLowerCase(),
    );
    return { ...tab, value: category?.slug ?? tab.value };
  });
  for (const category of categories) {
    if (!options.some((option) => option.value === category.slug)) {
      options.push({ label: category.title, value: category.slug });
    }
  }
  return options;
}
export function normalizeCategory(value: string, categories: Taxonomy[]) {
  return categoryOptions(categories).some((option) => option.value === value)
    ? value
    : "";
}
