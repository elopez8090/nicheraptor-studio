"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ToolPanelCategory =
  | "Writing"
  | "AI"
  | "Research"
  | "Export"
  | "Project"
  | "SEO";

export type TabbedPanelItem = {
  id: string;
  label: string;
  category?: ToolPanelCategory;
  content: ReactNode | (() => ReactNode);
  disabled?: boolean;
};

type TabbedPanelProps = {
  items: TabbedPanelItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  orientation?: "horizontal" | "vertical";
};

function resolveContent(content: TabbedPanelItem["content"]): ReactNode {
  return typeof content === "function" ? content() : content;
}

export function TabbedPanel({
  items,
  defaultTab,
  activeTab,
  onTabChange,
  className,
  listClassName,
  contentClassName,
  orientation = "horizontal",
}: TabbedPanelProps) {
  const initial = defaultTab ?? items[0]?.id;
  const [internalTab, setInternalTab] = useState(initial);
  const currentTab = activeTab ?? internalTab;

  useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  if (!items.length) {
    return null;
  }

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => {
        setInternalTab(value);
        onTabChange?.(value);
      }}
      orientation={orientation}
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
    >
      <TabsList
        variant="line"
        className={cn(
          "h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border/60 bg-transparent p-0 pb-0",
          listClassName,
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.id}
            value={item.id}
            disabled={item.disabled}
            className="rounded-none px-2.5 py-2.5 text-xs data-[state=active]:font-semibold sm:text-sm"
          >
            <span className="flex flex-col items-start gap-0.5 leading-none">
              {item.category ? (
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </span>
              ) : null}
              <span>{item.label}</span>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent
          key={item.id}
          value={item.id}
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto pr-1 data-[state=inactive]:hidden",
            contentClassName,
          )}
        >
          {item.id === currentTab ? (
            <div className="panel-transition flex flex-col gap-5 pb-6 animate-in fade-in duration-200 motion-reduce:animate-none">
              {resolveContent(item.content)}
            </div>
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
