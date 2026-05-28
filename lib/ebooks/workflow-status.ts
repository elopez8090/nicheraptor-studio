export const WORKFLOW_STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "drafting", label: "Drafting" },
  { value: "editing", label: "Editing" },
  { value: "completed", label: "Completed" },
] as const;

export type EbookWorkflowStatus = (typeof WORKFLOW_STATUS_OPTIONS)[number]["value"];

export function isEbookWorkflowStatus(value: unknown): value is EbookWorkflowStatus {
  return WORKFLOW_STATUS_OPTIONS.some((o) => o.value === value);
}
