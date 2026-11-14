"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  GripVertical,
  Type,
  StickyNote,
  ListChecks,
  ToggleLeft,
  CircleDot,
  CheckSquare,
  Star,
  MessageSquare,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Pencil,
  Copy,
  X,
  CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
export interface TemplateSection {
  id: string;
  label: string;
  type: "heading" | "notes" | "checklist" | "yesno" | "radio" | "checkbox" | "rating" | "short_answer";
  defaultContent?: string;
}

export interface SOAPTemplate {
  id: string;
  name: string;
  description: string | null;
  encounterType: string | null;
  chartType: string;
  subjective: { sections?: TemplateSection[]; freeform?: string } | null;
  objective: Record<string, unknown> | null;
  assessment: Record<string, unknown> | null;
  plan: Record<string, unknown> | null;
  macros: Record<string, string> | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

// ─── Presets ─────────────────────────────────────────────────
const SECTION_PRESETS = [
  "Chief Complaint",
  "Symptoms",
  "History of Present Illness",
  "Past Medical History",
  "Family History",
  "Social History",
  "Review of Systems",
  "Physical Examination",
  "Vitals",
  "Assessment Notes",
  "Diagnosis",
  "Treatment Notes",
  "Prescription",
  "Supplement",
  "Injection",
  "Diet Recommendation",
  "Lifestyle Recommendation",
  "Lab Record",
  "Follow Up",
  "Instructions",
  "Self Notes",
] as const;

const COMPONENT_TYPES: { type: TemplateSection["type"]; label: string; icon: typeof Type; color: string }[] = [
  { type: "heading", label: "Heading", icon: Type, color: "text-blue-500" },
  { type: "notes", label: "Notes / Textarea", icon: StickyNote, color: "text-amber-500" },
  { type: "short_answer", label: "Short Answer", icon: MessageSquare, color: "text-cyan-500" },
  { type: "checklist", label: "Checklist", icon: ListChecks, color: "text-emerald-500" },
  { type: "radio", label: "Single Choice", icon: CircleDot, color: "text-orange-500" },
  { type: "checkbox", label: "Multi Choice", icon: CheckSquare, color: "text-indigo-500" },
  { type: "rating", label: "Rating Scale", icon: Star, color: "text-yellow-500" },
  { type: "yesno", label: "Yes / No", icon: ToggleLeft, color: "text-purple-500" },
];

// ─── Sortable Section Item ───────────────────────────────────
function SortableSectionItem({
  section,
  onUpdate,
  onRemove,
}: {
  section: TemplateSection;
  onUpdate: (field: keyof TemplateSection, value: string) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = COMPONENT_TYPES.find((c) => c.type === section.type);

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Input
          value={section.label}
          onChange={(e) => onUpdate("label", e.target.value)}
          className="font-medium h-8 text-sm flex-1"
          placeholder="Section name"
        />
        <Badge variant="outline" className="text-xs shrink-0 gap-1">
          {typeInfo && <typeInfo.icon className={`h-3 w-3 ${typeInfo.color}`} />}
          {typeInfo?.label || section.type}
        </Badge>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {section.type === "notes" && (
        <Textarea
          placeholder="Default content (pre-filled when using this template)..."
          value={section.defaultContent || ""}
          onChange={(e) => onUpdate("defaultContent", e.target.value)}
          rows={2}
          className="text-sm"
        />
      )}

      {section.type === "short_answer" && (
        <Input
          placeholder="Placeholder text..."
          value={section.defaultContent || ""}
          onChange={(e) => onUpdate("defaultContent", e.target.value)}
          className="text-sm"
        />
      )}

      {section.type === "checklist" && (
        <Textarea
          placeholder={"One item per line:\nDenies fever\nDenies weight loss\nDenies fatigue"}
          value={section.defaultContent || ""}
          onChange={(e) => onUpdate("defaultContent", e.target.value)}
          rows={3}
          className="text-sm font-mono"
        />
      )}

      {(section.type === "radio" || section.type === "checkbox") && (
        <Textarea
          placeholder={"One option per line:\nOption A\nOption B\nOption C"}
          value={section.defaultContent || ""}
          onChange={(e) => onUpdate("defaultContent", e.target.value)}
          rows={3}
          className="text-sm font-mono"
        />
      )}

      {section.type === "rating" && (
        <Input
          placeholder="Scale, e.g., 1-10 or 0-5"
          value={section.defaultContent || "1-10"}
          onChange={(e) => onUpdate("defaultContent", e.target.value)}
          className="text-sm"
        />
      )}

      {section.type === "yesno" && (
        <Input
          placeholder="Question, e.g., Any adverse reactions?"
          value={section.defaultContent || ""}
          onChange={(e) => onUpdate("defaultContent", e.target.value)}
          className="text-sm"
        />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function TemplateBuilder({
  templates,
  templatesLoading,
  onRefresh,
}: {
  templates: SOAPTemplate[];
  templatesLoading: boolean;
  onRefresh: () => void;
}) {
  const [mode, setMode] = useState<"list" | "pick" | "build">("list");
  const [editingTemplate, setEditingTemplate] = useState<SOAPTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Builder state
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateMode, setTemplateMode] = useState<"structured" | "freeform">("structured");
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [freeformContent, setFreeformContent] = useState("");
  const [customName, setCustomName] = useState("");

  const genId = () => Math.random().toString(36).slice(2, 9);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reset = () => {
    setMode("list");
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateDesc("");
    setTemplateMode("structured");
    setSections([]);
    setFreeformContent("");
    setError("");
    setCustomName("");
  };

  const openEdit = (t: SOAPTemplate) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateDesc(t.description || "");
    const data = t.subjective as { sections?: TemplateSection[]; freeform?: string } | null;
    if (data?.freeform) {
      setTemplateMode("freeform");
      setFreeformContent(data.freeform);
      setSections([]);
    } else {
      setTemplateMode("structured");
      setSections(data?.sections || []);
      setFreeformContent("");
    }
    setMode("build");
  };

  const openDuplicate = (t: SOAPTemplate) => {
    setEditingTemplate(null);
    setTemplateName(`${t.name} (Copy)`);
    setTemplateDesc(t.description || "");
    const data = t.subjective as { sections?: TemplateSection[]; freeform?: string } | null;
    if (data?.freeform) {
      setTemplateMode("freeform");
      setFreeformContent(data.freeform);
      setSections([]);
    } else {
      setTemplateMode("structured");
      setSections((data?.sections || []).map((s) => ({ ...s, id: genId() })));
      setFreeformContent("");
    }
    setMode("build");
  };

  const addSection = (label: string, type: TemplateSection["type"] = "notes") => {
    setSections((prev) => [...prev, { id: genId(), label, type, defaultContent: "" }]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === active.id);
        const newIdx = prev.findIndex((s) => s.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const handleSave = async () => {
    setError("");
    if (!templateName.trim()) { setError("Template name is required"); return; }
    if (templateMode === "structured" && sections.length === 0) { setError("Add at least one section"); return; }
    if (templateMode === "freeform" && !freeformContent.trim()) { setError("Enter your template content"); return; }

    setSaving(true);
    const payload = {
      name: templateName.trim(),
      description: templateDesc.trim() || null,
      subjective: templateMode === "freeform"
        ? { freeform: freeformContent }
        : { sections },
    };

    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates";
      const method = editingTemplate ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { reset(); onRefresh(); }
      else { const d = await res.json(); setError(d.error || "Failed to save"); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    onRefresh();
  };

  // ─── List View ─────────────────────────────────
  if (mode === "list") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Chart Note Templates</CardTitle>
                <CardDescription>Build custom templates with the sections you need.</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => { reset(); setMode("pick"); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No templates yet</p>
              <p className="text-xs mt-1">Create a template to standardize your encounter notes</p>
              <Button size="sm" className="mt-4" onClick={() => { reset(); setMode("pick"); }}>
                <Plus className="mr-2 h-4 w-4" />Create First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => {
                const data = t.subjective as { sections?: TemplateSection[]; freeform?: string } | null;
                const sectionCount = data?.sections?.length || 0;
                const isFreeform = !!data?.freeform;
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{t.name}</p>
                        {t.isDefault && <Badge variant="outline" className="text-xs">System</Badge>}
                        <Badge variant="secondary" className="text-xs">
                          {isFreeform ? "Freeform" : `${sectionCount} section${sectionCount !== 1 ? "s" : ""}`}
                        </Badge>
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground mt-1 truncate">{t.description}</p>}
                      {!isFreeform && data?.sections && data.sections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {data.sections.slice(0, 8).map((s) => (
                            <Badge key={s.id} variant="outline" className="text-xs font-normal">{s.label}</Badge>
                          ))}
                          {data.sections.length > 8 && (
                            <Badge variant="outline" className="text-xs font-normal">+{data.sections.length - 8} more</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => openDuplicate(t)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
                      {!t.isDefault && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Pick View ─────────────────────────────────
  if (mode === "pick") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={reset}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h3 className="text-lg font-semibold">New Template</h3>
            <p className="text-sm text-muted-foreground">Choose a template style</p>
          </div>
        </div>

        {/* Mode selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setTemplateMode("structured")}
            className={`rounded-xl border-2 p-6 text-left transition-colors ${templateMode === "structured" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
          >
            <ListChecks className="h-8 w-8 text-primary mb-3" />
            <p className="font-semibold">Structured Blocks</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add individual sections like Charm — headings, text fields, checklists, radio buttons. Each section is its own block.
            </p>
          </button>
          <button
            onClick={() => setTemplateMode("freeform")}
            className={`rounded-xl border-2 p-6 text-left transition-colors ${templateMode === "freeform" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
          >
            <StickyNote className="h-8 w-8 text-primary mb-3" />
            <p className="font-semibold">Freeform Note</p>
            <p className="text-sm text-muted-foreground mt-1">
              One big textarea with your own headers. Write CC:, S:, O:, A:, P: or whatever you want. Headers persist, you fill in below each one.
            </p>
          </button>
        </div>

        {/* If structured, show section picker */}
        {templateMode === "structured" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Sections</CardTitle>
              <CardDescription>Click to add. You can also add custom sections below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTION_PRESETS.map((preset) => {
                  const isAdded = sections.some((s) => s.label === preset);
                  return (
                    <button
                      key={preset}
                      onClick={() => {
                        if (isAdded) setSections((p) => p.filter((s) => s.label !== preset));
                        else addSection(preset);
                      }}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${isAdded ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50"}`}
                    >
                      {isAdded ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {preset}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t">
                <Label className="text-sm font-medium">Add Custom Section</Label>
                <p className="text-xs text-muted-foreground mb-2">e.g., Sleep, Stress, CC1, Energy Level</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Section name..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && customName.trim()) { addSection(customName.trim()); setCustomName(""); } }}
                  />
                  <Button variant="outline" onClick={() => { if (customName.trim()) { addSection(customName.trim()); setCustomName(""); } }} disabled={!customName.trim()}>
                    <Plus className="mr-2 h-4 w-4" />Add
                  </Button>
                </div>
              </div>

              {sections.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Label className="text-sm font-medium">Selected ({sections.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sections.map((s) => (
                      <Badge key={s.id} variant="secondary" className="gap-1">
                        {s.label}
                        <button onClick={() => setSections((p) => p.filter((x) => x.id !== s.id))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* If freeform, show the textarea */}
        {templateMode === "freeform" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Freeform Template</CardTitle>
              <CardDescription>
                Write your headers and layout. These persist for each encounter — you fill in below each header.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Start typing your template headers and layout..."
                value={freeformContent}
                onChange={(e) => setFreeformContent(e.target.value)}
                rows={30}
                className="font-mono text-sm min-h-[500px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your layout saves as a reusable template. Each new encounter pre-fills with this structure.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => setMode("build")}
            disabled={templateMode === "structured" ? sections.length === 0 : !freeformContent.trim()}
          >
            {templateMode === "freeform" ? "Continue" : "Proceed to Builder"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Build View ────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => editingTemplate ? reset() : setMode("pick")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{editingTemplate ? "Edit Template" : "Build Template"}</h3>
            <p className="text-sm text-muted-foreground">
              {templateMode === "freeform" ? "Name your template and save" : "Customize sections, set defaults, drag to reorder"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{editingTemplate ? "Update" : "Save"} Template</>}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Name & description */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="e.g., Peptide Follow-Up, Fat Burner Injection" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input placeholder="When to use this template..." value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freeform editor */}
      {templateMode === "freeform" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template Content</CardTitle>
            <CardDescription>Your headers and layout. Each encounter pre-fills with this structure.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Start typing your template headers and layout..."
              value={freeformContent}
              onChange={(e) => setFreeformContent(e.target.value)}
              rows={30}
              className="font-mono text-sm min-h-[500px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Structured builder */}
      {templateMode === "structured" && (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Component palette */}
          <Card className="h-fit sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {COMPONENT_TYPES.map((comp) => (
                <button
                  key={comp.type}
                  onClick={() => addSection(comp.type === "heading" ? "Section Title" : "", comp.type)}
                  className="flex items-center gap-2 w-full rounded-md p-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <comp.icon className={`h-4 w-4 ${comp.color}`} />
                  {comp.label}
                </button>
              ))}

              <div className="pt-3 mt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Quick Add</p>
                <Input
                  placeholder="Custom section..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && customName.trim()) { addSection(customName.trim(), "notes"); setCustomName(""); } }}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Template Layout</CardTitle>
              <CardDescription>{sections.length} section{sections.length !== 1 ? "s" : ""} — drag to reorder</CardDescription>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                  <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Click components on the left to add sections</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          onUpdate={(field, value) =>
                            setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, [field]: value } : s)))
                          }
                          onRemove={() => setSections((prev) => prev.filter((s) => s.id !== section.id))}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
