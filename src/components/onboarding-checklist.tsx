"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Circle,
  Building2,
  Users,
  UserPlus,
  FileText,
  Package,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface OnboardingChecklistProps {
  clinicName?: string;
  // Future: These would come from the database
  hasClinicSetup?: boolean;
  hasProvider?: boolean;
  hasPatient?: boolean;
  hasEncounter?: boolean;
  hasInventory?: boolean;
  onDismiss?: () => void;
}

export function OnboardingChecklist({
  clinicName = "Your Clinic",
  hasClinicSetup = false,
  hasProvider = false,
  hasPatient = false,
  hasEncounter = false,
  hasInventory = false,
  onDismiss,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const items: ChecklistItem[] = [
    {
      id: "clinic",
      title: "Set up your clinic",
      description: "Add clinic name, address, and branding",
      href: "/settings",
      completed: hasClinicSetup,
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      id: "provider",
      title: "Add providers",
      description: "Add doctors and staff to your team",
      href: "/settings",
      completed: hasProvider,
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "patient",
      title: "Add your first patient",
      description: "Create a patient record to get started",
      href: "/patients",
      completed: hasPatient,
      icon: <UserPlus className="h-4 w-4" />,
    },
    {
      id: "encounter",
      title: "Create an encounter",
      description: "Document your first patient visit",
      href: "/encounters",
      completed: hasEncounter,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "inventory",
      title: "Add inventory items",
      description: "Track peptides and supplements",
      href: "/inventory",
      completed: hasInventory,
      icon: <Package className="h-4 w-4" />,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  // Don't show if all complete
  if (completedCount === items.length) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Welcome to Kaizara</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete these steps to set up {clinicName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-1"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completedCount}/{items.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                item.completed
                  ? "text-muted-foreground"
                  : "hover:bg-muted/50"
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                  item.completed
                    ? "bg-primary text-primary-foreground"
                    : "border border-border"
                }`}
              >
                {item.completed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {items.indexOf(item) + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed ? "line-through" : ""
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
