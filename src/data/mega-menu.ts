const site = "https://fourthwall.com";
const asset = `${site}/webflow-cdn/63ff7c6ecc83f97ec5fe9155/`;
export const FEATURE_GROUPS = [
  {
    title: "Create products",
    links: [
      { label: "Product catalog", href: "https://products.fourthwall.com" },
      { label: "Product designer", href: `${site}/design-and-sell` },
      { label: "Source custom products", href: `${site}/bespoke` },
      { label: "Digital products", href: `${site}/features/digital-products` },
      { label: "Curated artists", href: `${site}/designers` },
    ],
  },
  {
    title: "Launch a shop",
    links: [
      { label: "Shop builder", href: `${site}/shops` },
      { label: "Themes", href: `${site}/features/custom-themes` },
      { label: "Fulfillment & shipping", href: `${site}/print-on-demand` },
      { label: "Sales channels", href: `${site}/features` },
      { label: "Discounts", href: `${site}/features/promo-codes` },
    ],
  },
  {
    title: "Build your brand",
    links: [
      { label: "Homepages", href: `${site}/websites` },
      { label: "Memberships", href: `${site}/memberships` },
      { label: "Apps & integrations", href: `${site}/features` },
      {
        label: "Launch your mobile app",
        href: `${site}/features/custom-mobile-apps`,
      },
    ],
  },
];
export const EXPAND_LINKS = [
  { label: "Build your own app", href: "https://docs.fourthwall.com/" },
  { label: "Fourthwall MCP", href: "https://docs.fourthwall.com/ai/mcp" },
];
export const ELI_CARD = {
  href: `${site}/ai-assistant-eli`,
  image: `${asset}6a90730dec75f2fe3ac0359d_nav-ask-eli.webp`,
  description: "Introducing Eli, your personal 24/7 e-commerce assistant",
};
export const LEARN_CARDS = [
  {
    label: "Get inspired",
    href: `${site}/get-inspired`,
    image: `${asset}6a90730d7ae69840e3d7157c_nav-learn-getinspired.webp`,
    description:
      "See how creators and companies use Fourthwall to run their shops",
  },
  {
    label: "Designers",
    href: `${site}/designers`,
    image: `${asset}6a90730d36d8b0bfe90efb06_nav-learn-designers.webp`,
    description: "Browse our network of talented designers ready to help you",
  },
  {
    label: "Help center",
    href: "https://help.fourthwall.com/",
    image: `${asset}6a90730cbdfc5afc225a3c03_nav-learn-helpcenter.webp`,
    description: "Find answers to questions for every step of your journey",
  },
  {
    label: "Blog",
    href: `${site}/blog`,
    image: `${asset}6a90730c73dc4088c848ce1b_nav-learn-blog.webp`,
    description: "Read news, explore creator stories, and learn helpful tips",
  },
];
export const APP_LINKS = [
  {
    label: "Download on the App Store",
    href: "https://apps.apple.com/us/app/fourthwall-for-creators/id1479668990",
    image: `${asset}6a90730d84dd5e7e02ae04cb_badge-app-store.svg`,
  },
  {
    label: "Get it on Google Play",
    href: "https://play.google.com/store/apps/details?id=com.fourthwall.android",
    image: `${asset}6a90730d9cab5f62a7a481ef_badge-google-play.svg`,
  },
];
