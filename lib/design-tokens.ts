/**
 * Spacing & layout tokens (Tailwind-aligned). Prefer utility classes in globals.css
 * (type-display, card-interactive, shadow-premium) for visual polish.
 */
export const spacing = {
  pageX: "px-4 sm:px-6 lg:px-8",
  pageY: "py-6 sm:py-8 lg:py-10",
  section: "space-y-6",
  stack: "mt-10",
} as const;

export const radii = {
  card: "rounded-2xl",
  control: "rounded-xl",
  badge: "rounded-full",
} as const;
