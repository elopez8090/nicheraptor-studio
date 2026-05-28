export type EbookTemplateChapter = {
  title: string;
  summary: string;
};

export type EbookTemplate = {
  id: string;
  name: string;
  bestUseCase: string;
  defaultTitle: string;
  defaultAudience: string;
  defaultGoal: string;
  chapters: EbookTemplateChapter[];
};

export const EBOOK_TEMPLATES: EbookTemplate[] = [
  {
    id: "how-to-guide",
    name: "How-To Guide",
    bestUseCase:
      "Teaching a single skill or process with clear steps readers can follow immediately.",
    defaultTitle: "How-To Guide",
    defaultAudience: "Readers who want practical, step-by-step instructions",
    defaultGoal:
      "Walk the reader through a complete process from start to finish with actionable steps.",
    chapters: [
      {
        title: "Introduction: What You'll Learn",
        summary:
          "Set expectations, who this guide is for, and the outcome after finishing.",
      },
      {
        title: "What You Need Before You Start",
        summary:
          "Tools, prerequisites, time estimate, and common mistakes to avoid upfront.",
      },
      {
        title: "Step 1 — Get Set Up",
        summary: "First concrete action with checkpoints so readers know they're on track.",
      },
      {
        title: "Step 2 — Core Execution",
        summary: "The main work phase with substeps, tips, and troubleshooting notes.",
      },
      {
        title: "Step 3 — Refine and Verify",
        summary: "Quality checks, adjustments, and how to confirm success.",
      },
      {
        title: "Next Steps and Maintenance",
        summary: "How to keep results, scale up, and where to go for deeper help.",
      },
    ],
  },
  {
    id: "beginners-guide",
    name: "Beginner's Guide",
    bestUseCase:
      "Onboarding newcomers to a topic without assuming prior knowledge.",
    defaultTitle: "Beginner's Guide",
    defaultAudience: "Complete beginners exploring a new topic or hobby",
    defaultGoal:
      "Build foundational understanding and confidence so readers can take their first real actions.",
    chapters: [
      {
        title: "Welcome: Why This Matters",
        summary: "Friendly overview of the topic and what beginners often get wrong.",
      },
      {
        title: "Key Terms and Concepts",
        summary: "Simple definitions and mental models without jargon overload.",
      },
      {
        title: "Your First Simple Win",
        summary: "A low-risk exercise or mini-project to create early momentum.",
      },
      {
        title: "Building Core Skills",
        summary: "Progressive practice areas with examples and encouragement.",
      },
      {
        title: "Common Beginner Mistakes",
        summary: "What to watch for and how to recover when things go sideways.",
      },
      {
        title: "Your Path Forward",
        summary: "Suggested learning order, resources, and habits for continued growth.",
      },
    ],
  },
  {
    id: "checklist-ebook",
    name: "Checklist Ebook",
    bestUseCase:
      "Lead magnets and quick wins where readers tick off tasks in order.",
    defaultTitle: "The Complete Checklist",
    defaultAudience: "Busy readers who want a scannable, actionable checklist",
    defaultGoal:
      "Give readers a printable-style checklist they can complete in one sitting or over a week.",
    chapters: [
      {
        title: "How to Use This Checklist",
        summary: "Instructions for printing, timing, and prioritizing items.",
      },
      {
        title: "Phase 1 — Prepare",
        summary: "Checklist items for gathering inputs, accounts, and baseline setup.",
      },
      {
        title: "Phase 2 — Execute",
        summary: "Core checklist items for doing the main work.",
      },
      {
        title: "Phase 3 — Review",
        summary: "Verification items, quality checks, and sign-off criteria.",
      },
      {
        title: "Phase 4 — Optimize",
        summary: "Optional improvements and repeat-use tips.",
      },
      {
        title: "Bonus Quick-Reference",
        summary: "One-page summary of the highest-impact checklist items.",
      },
    ],
  },
  {
    id: "problem-solution",
    name: "Problem/Solution Ebook",
    bestUseCase:
      "Pain-aware marketing ebooks that name a problem and present your approach as the fix.",
    defaultTitle: "Solve the Problem",
    defaultAudience: "Readers frustrated with a specific recurring problem",
    defaultGoal:
      "Validate the reader's pain, explain root causes, and deliver a credible solution framework.",
    chapters: [
      {
        title: "The Problem You're Facing",
        summary: "Empathetic description of symptoms and why it keeps happening.",
      },
      {
        title: "Why Common Fixes Fail",
        summary: "Debunk quick fixes and set up the need for a better approach.",
      },
      {
        title: "Root Causes Explained",
        summary: "Underlying drivers so readers understand the real levers.",
      },
      {
        title: "The Solution Framework",
        summary: "Your structured approach with principles readers can trust.",
      },
      {
        title: "Implementation Plan",
        summary: "Phased actions, timelines, and what to do first this week.",
      },
      {
        title: "Staying Unstuck",
        summary: "Maintenance habits, warning signs, and when to get extra help.",
      },
    ],
  },
  {
    id: "local-business-lead-magnet",
    name: "Local Business Lead Magnet",
    bestUseCase:
      "Capturing local leads with geographically relevant value (salon, clinic, contractor, etc.).",
    defaultTitle: "Local Business Playbook",
    defaultAudience: "Local customers in your service area",
    defaultGoal:
      "Demonstrate local expertise and motivate readers to book, visit, or request a quote.",
    chapters: [
      {
        title: "Serving Your Community",
        summary: "Local credibility, service area, and what makes your business different.",
      },
      {
        title: "What Locals Should Know First",
        summary: "Region-specific tips, regulations, or seasonal factors that matter.",
      },
      {
        title: "Our Proven Process",
        summary: "How you deliver service from first contact to finished result.",
      },
      {
        title: "Pricing and What to Expect",
        summary: "Transparent ranges, timelines, and how quotes work.",
      },
      {
        title: "Success Stories Near You",
        summary: "Brief case highlights or testimonials framed for local trust.",
      },
      {
        title: "Book Your Next Step",
        summary: "Clear CTA: call, form, offer code, and what happens after they reach out.",
      },
    ],
  },
  {
    id: "authority-expert-guide",
    name: "Authority/Expert Guide",
    bestUseCase:
      "Positioning you as the go-to expert with insights competitors don't share.",
    defaultTitle: "Expert Guide",
    defaultAudience: "Readers evaluating providers or deepening their expertise",
    defaultGoal:
      "Establish authority with frameworks, standards, and expert perspective readers can cite.",
    chapters: [
      {
        title: "The Landscape Today",
        summary: "Industry context, trends, and where most advice falls short.",
      },
      {
        title: "Expert Principles",
        summary: "Non-negotiable standards and beliefs that guide your work.",
      },
      {
        title: "Framework in Practice",
        summary: "Your signature method with examples from real situations.",
      },
      {
        title: "Advanced Strategies",
        summary: "Higher-level tactics for readers ready to go beyond basics.",
      },
      {
        title: "Myths vs. Reality",
        summary: "Correct misconceptions and show depth of experience.",
      },
      {
        title: "Working With an Expert",
        summary: "When DIY ends, how you help, and what engagement looks like.",
      },
    ],
  },
  {
    id: "product-buyers-guide",
    name: "Product Buyer's Guide",
    bestUseCase:
      "Helping buyers compare options and choose the right product with confidence.",
    defaultTitle: "Buyer's Guide",
    defaultAudience: "Shoppers researching a purchase decision",
    defaultGoal:
      "Educate buyers on criteria, tradeoffs, and recommendations without feeling salesy.",
    chapters: [
      {
        title: "Who This Guide Is For",
        summary: "Buyer personas and situations where this purchase matters most.",
      },
      {
        title: "How to Evaluate Options",
        summary: "Features, specs, and criteria that actually affect outcomes.",
      },
      {
        title: "Budget Tiers Explained",
        summary: "Good / better / best framing with honest tradeoffs per tier.",
      },
      {
        title: "Top Picks by Use Case",
        summary: "Recommendations mapped to common scenarios and constraints.",
      },
      {
        title: "Setup and Getting Value Fast",
        summary: "Onboarding tips so buyers succeed right after purchase.",
      },
      {
        title: "FAQ Before You Buy",
        summary: "Objections, warranty, returns, and support questions answered.",
      },
    ],
  },
  {
    id: "niche-report",
    name: "Niche Report",
    bestUseCase:
      "Data-leaning reports, trend roundups, or state-of-the-niche publications.",
    defaultTitle: "Niche Report",
    defaultAudience: "Professionals and enthusiasts who follow industry trends",
    defaultGoal:
      "Deliver timely insights, patterns, and takeaways readers can share or act on.",
    chapters: [
      {
        title: "Executive Summary",
        summary: "Headline findings and why they matter this year.",
      },
      {
        title: "Market Snapshot",
        summary: "Size, segments, and forces shaping the niche right now.",
      },
      {
        title: "Trends to Watch",
        summary: "Emerging patterns with evidence and early adopter examples.",
      },
      {
        title: "Opportunities and Risks",
        summary: "Where money and attention are moving; what to avoid.",
      },
      {
        title: "Case Highlights",
        summary: "Short profiles of players or tactics worth studying.",
      },
      {
        title: "Predictions and Action Items",
        summary: "Forward view plus concrete steps for different reader types.",
      },
    ],
  },
];

export function getEbookTemplate(templateId: string): EbookTemplate | undefined {
  return EBOOK_TEMPLATES.find((t) => t.id === templateId);
}
