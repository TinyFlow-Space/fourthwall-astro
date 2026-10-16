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
          {
            text: "See full pricing details",
            href: "https://fourthwall.com/pricing",
          },
          ".",
        ],
      },
    ],
  },
  {
    id: "taxes",
    question: "Does Fourthwall handle taxes?",
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
          {
            text: "See full pricing details",
            href: "https://fourthwall.com/pricing",
          },
          ".",
        ],
      },
    ],
  },
];

const ADDITIONAL_FAQS = [
  [
    "payments",
    "Does Fourthwall handle payment processing?",
    "Fourthwall handles checkout and payment processing for your shop. Your supporters can use the payment methods available at checkout.",
  ],
  [
    "design",
    "Does Fourthwall offer design support?",
    "You can use your own artwork or find an independent designer through Fourthwall’s designer directory.",
  ],
  [
    "profit",
    "How much money do I make on sales from the Fourthwall product catalog?",
    "You set the retail price. Your earnings depend on that price, the listed product cost, and applicable processing fees. See the pricing page for details.",
  ],
  [
    "shipping",
    "Do you ship worldwide?",
    "Products can ship to many countries. Availability, delivery estimates, and shipping costs depend on the product and destination and are shown at checkout.",
  ],
  [
    "ai",
    "Does Fourthwall use AI?",
    "Fourthwall includes optional AI tools for product ideas, shop customization, and help with running your business.",
  ],
  [
    "support",
    "Does Fourthwall provide customer support for my orders?",
    "Fourthwall provides customer support for orders fulfilled through its product catalog. Visit the help center for support with an order.",
  ],
  [
    "domain",
    "Can I move my domain to a Fourthwall website?",
    "You can connect your own domain to your Fourthwall shop. The help center explains how to update your domain settings.",
  ],
];
for (const [id, question, answer] of ADDITIONAL_FAQS) {
  const entry = {
    id,
    question,
    answer: [{ type: "paragraph" as const, content: [answer] }],
  };
  if (id === "payments") FAQS.splice(1, 0, entry);
  else FAQS.push(entry);
}
