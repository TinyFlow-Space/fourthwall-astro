type FaqInlineContent =
  string | { text: string; href: string } | { text: string; strong: true };

type FaqAnswerBlock =
  | { type: "paragraph"; content: FaqInlineContent[] }
  | { type: "list"; items: FaqInlineContent[][] };

export const FAQS: {
  id: string;
  question: string;
  answer: FaqAnswerBlock[];
}[] = [
  {
    id: "pricing",
    question: "How much does it cost to use Fourthwall?",
    answer: [
      {
        type: "paragraph",
        content: [
          "There are no monthly fees, no upfront costs, and no contracts to use Fourthwall. You set your prices and choose your own margins. Here is how our pricing and splits work when you sell:",
        ],
      },
      {
        type: "list",
        items: [
          [
            { text: "Products from our product catalog.", strong: true },
            " All products in our ",
            {
              text: "product catalog",
              href: "https://products.fourthwall.com/all",
            },
            " have a publicly listed flat fee, which gets deducted from the selling price you set. There are no extra percentages/margins. You keep 100% of profits.",
          ],
          [
            { text: "Products you self-source.", strong: true },
            " No fee (0% fee)",
          ],
          [{ text: "Digital products.", strong: true }, " 5% flat fee"],
          [{ text: "Memberships.", strong: true }, " 5% flat fee"],
        ],
      },
      {
        type: "paragraph",
        content: [
          "Additionally, all US-based credit card transactions have an added 2.9% + $0.30 payment processing fee (same as Shopify). Fees vary for PayPal and other providers. ",
          { text: "Learn more", href: "https://fourthwall.com/pricing" },
          ".",
        ],
      },
    ],
  },
  {
    id: "taxes",
    question: "How does Fourthwall handle taxes?",
    answer: [
      {
        type: "paragraph",
        content: [
          "There are no monthly fees, no upfront costs, and no contracts to use Fourthwall. You set your prices and choose your own margins. Here is how our pricing and splits work when you sell:",
        ],
      },
      {
        type: "list",
        items: [
          [
            { text: "Products from our product catalog.", strong: true },
            " All products in our ",
            {
              text: "product catalog",
              href: "https://products.fourthwall.com/all",
            },
            " have a publicly listed flat fee, which gets deducted from the selling price you set. There are no extra percentages/margins. You keep 100% of profits.",
          ],
          [
            { text: "Products you self-source.", strong: true },
            " No fee (0% fee)",
          ],
          [{ text: "Digital products.", strong: true }, " 5% flat fee"],
          [{ text: "Memberships.", strong: true }, " 5% flat fee"],
        ],
      },
      {
        type: "paragraph",
        content: [
          "Additionally, all US-based credit card transactions have an added 2.9% + $0.30 payment processing fee (same as Shopify). Fees vary for PayPal and other providers. ",
          { text: "Learn more", href: "https://fourthwall.com/pricing" },
          ".",
        ],
      },
    ],
  },
];
