export const LANDING_PAGE_TYPE_OPTIONS = [
  { value: "lead_magnet_page", label: "Lead Magnet Page" },
  { value: "ebook_sales_page", label: "Ebook Sales Page" },
  { value: "webinar_registration", label: "Webinar Registration" },
  { value: "service_business_landing_page", label: "Service Business Landing Page" },
  { value: "saas_landing_page", label: "SaaS Landing Page" },
  { value: "product_launch_page", label: "Product Launch Page" },
  { value: "newsletter_opt_in", label: "Newsletter Opt-in" },
  { value: "local_seo_service_page", label: "Local SEO Service Page" },
  { value: "affiliate_review_page", label: "Affiliate Review Page" },
  { value: "simple_funnel_page", label: "Simple Funnel Page" },
] as const;

export type LandingPageTypeValue = (typeof LANDING_PAGE_TYPE_OPTIONS)[number]["value"];

export const LANDING_PAGE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "generated", label: "Generated" },
  { value: "ready", label: "Ready" },
  { value: "published", label: "Published" },
] as const;

export function landingPageTypeLabel(value: string): string {
  return LANDING_PAGE_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
}
