import type { EbookWithChapters } from "@/lib/ebooks/chapter-workflow-types";

const MOCK_EBOOK: EbookWithChapters = {
  id: "demo-ebook",
  title: "How to Start a Local Newsletter That Pays",
  audience: "Local business owners and community organizers",
  goal:
    "Help readers launch a profitable local newsletter with a clear content plan, growth tactics, and monetization steps within 30 days.",
  coverStoragePath: null,
  coverImageUrl: null,
  chapters: [
    {
      id: "ch-1",
      number: 1,
      title: "Why Local Newsletters Win in 2026",
      summary:
        "Define the opportunity, compare formats, and pick a niche angle that readers will pay attention to.",
      status: "generated",
      content: null,
    },
    {
      id: "ch-2",
      number: 2,
      title: "Choosing Your Audience and Promise",
      summary:
        "Clarify who you serve, what problem you solve, and the single outcome each issue should deliver.",
      status: "not_generated",
      content: null,
    },
    {
      id: "ch-3",
      number: 3,
      title: "Your First 4-Week Content Calendar",
      summary:
        "Build a repeatable editorial rhythm with themes, sources, and low-effort production workflows.",
      status: "not_generated",
      content: null,
    },
    {
      id: "ch-4",
      number: 4,
      title: "Growth Without Paid Ads",
      summary:
        "Use partnerships, referrals, and offline touchpoints to grow a qualified subscriber list.",
      status: "not_generated",
      content: null,
    },
    {
      id: "ch-5",
      number: 5,
      title: "Monetization Paths That Fit Locals",
      summary:
        "Evaluate sponsorships, memberships, and services—and launch your first revenue offer.",
      status: "not_generated",
      content: null,
    },
  ],
};

export function getMockEbookWithChapters(ebookId: string): EbookWithChapters {
  return {
    ...MOCK_EBOOK,
    id: ebookId,
  };
}
