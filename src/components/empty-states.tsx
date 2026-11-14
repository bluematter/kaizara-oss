"use client";

import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Package,
  TestTube,
  Calendar,
  Plus,
  ArrowRight,
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-built empty states for common pages
export function EmptyPatients({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="No patients yet"
      description="Add your first patient to get started with consultations and charting."
      action={onAdd ? { label: "Add Patient", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyEncounters({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
      title="No encounters yet"
      description="Create your first encounter to start documenting patient visits."
      action={onAdd ? { label: "New Encounter", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyInventory({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Package className="h-8 w-8 text-muted-foreground" />}
      title="No inventory items"
      description="Add peptides, supplements, and other items to track your clinic inventory."
      action={onAdd ? { label: "Add Item", onClick: onAdd } : undefined}
    />
  );
}

export function EmptyLabs({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<TestTube className="h-8 w-8 text-muted-foreground" />}
      title="No lab results"
      description="Upload or import lab results to track patient biomarkers over time."
      action={onAdd ? { label: "Upload Labs", onClick: onAdd } : undefined}
    />
  );
}

export function EmptySchedule({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
      title="No appointments"
      description="Schedule your first appointment to start managing your clinic calendar."
      action={onAdd ? { label: "Schedule Appointment", onClick: onAdd } : undefined}
    />
  );
}
