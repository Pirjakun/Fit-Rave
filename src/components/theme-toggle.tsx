"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
  { value: "system", label: "Sistem" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map(({ value, label }) => {
        const active = mounted && theme === value;
        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="xs"
            disabled={!mounted}
            aria-pressed={active}
            className={cn(
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
            onClick={() => setTheme(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
