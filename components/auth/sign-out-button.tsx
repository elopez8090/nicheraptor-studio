"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  variant?: "outline" | "ghost" | "default";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function SignOutButton({
  variant = "outline",
  size = "sm",
  className,
}: SignOutButtonProps) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a href="/logout">
        <LogOut aria-hidden />
        Sign out
      </a>
    </Button>
  );
}
