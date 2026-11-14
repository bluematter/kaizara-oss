"use client";

import { DEMO_MODE } from "@/lib/demo-mode";
import { FlaskConical } from "lucide-react";

export function DemoModeBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
      <FlaskConical className="h-3.5 w-3.5" />
      Demo Mode
    </div>
  );
}
