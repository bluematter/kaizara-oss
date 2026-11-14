"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Sparkles,
  Check,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
} from "lucide-react";

interface ParsedMarker {
  name: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  category: string;
  status: string;
}

interface ParsedPanel {
  collectedAt: string;
  reportedAt?: string;
  specimenId?: string;
  labProvider?: string;
  fasting?: boolean;
}

type Step = "upload" | "parsing" | "review" | "saving" | "success" | "error";

interface LabUploadDialogProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LabUploadDialog({
  patientId,
  patientName,
  open,
  onOpenChange,
  onSuccess,
}: LabUploadDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [panel, setPanel] = useState<ParsedPanel | null>(null);
  const [markers, setMarkers] = useState<ParsedMarker[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPageImages([]);
    setPanel(null);
    setMarkers([]);
    setEditingIdx(null);
    setError("");
    setProgress(0);
  }, []);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        reset();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, reset]
  );

  // Convert PDF pages to images using pdf.js
  const convertPdfToImages = useCallback(async (pdfFile: File): Promise<string[]> => {
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(Math.round((i / pdf.numPages) * 50));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // High res for OCR
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
      images.push(canvas.toDataURL("image/png"));
    }

    return images;
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setStep("parsing");
      setProgress(0);
      setError("");

      try {
        let images: string[];

        if (selectedFile.type === "application/pdf") {
          // Convert PDF to images
          images = await convertPdfToImages(selectedFile);
        } else {
          // Already an image
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(selectedFile);
          });
          images = [dataUrl];
          setProgress(50);
        }

        setPageImages(images);

        // Send to AI for parsing
        setProgress(60);
        const response = await fetch("/api/labs/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrls: images,
            patientId,
          }),
        });

        setProgress(90);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to parse lab results");
        }

        const data = await response.json();
        setPanel(data.panel);
        setMarkers(data.markers);
        setProgress(100);
        setStep("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
        setStep("error");
      }
    },
    [convertPdfToImages, patientId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const removeMarker = useCallback((idx: number) => {
    setMarkers((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateMarkerValue = useCallback((idx: number, value: number) => {
    setMarkers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, value } : m))
    );
    setEditingIdx(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!panel || markers.length === 0) return;
    setStep("saving");

    try {
      const response = await fetch("/api/labs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, panel, markers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setStep("success");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStep("error");
    }
  }, [panel, markers, patientId, onSuccess]);

  // Group markers by category for display
  const groupedMarkers = markers.reduce<Record<string, ParsedMarker[]>>(
    (acc, marker) => {
      const cat = marker.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(marker);
      return acc;
    },
    {}
  );

  const statusCounts = {
    normal: markers.filter((m) => m.status === "normal").length,
    high: markers.filter((m) => m.status === "high").length,
    low: markers.filter((m) => m.status === "low").length,
    critical: markers.filter((m) => m.status === "critical").length,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Upload Lab Results"}
            {step === "parsing" && "Parsing Lab Results"}
            {step === "review" && "Review Parsed Results"}
            {step === "saving" && "Saving Results"}
            {step === "success" && "Upload Complete"}
            {step === "error" && "Upload Error"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              `Upload a PDF or image of lab results for ${patientName}`}
            {step === "parsing" && "AI is extracting biomarkers from your lab report..."}
            {step === "review" &&
              `${markers.length} markers found. Review and confirm before saving.`}
            {step === "saving" && "Saving to patient record..."}
            {step === "success" && "Lab results saved successfully!"}
            {step === "error" && "Something went wrong"}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === "upload" && (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">
              Drag and drop your lab PDF here
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, PNG, JPG (Quest Diagnostics, LabCorp, etc.)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {/* Parsing Step */}
        {step === "parsing" && (
          <div className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-lg font-medium">AI Processing</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {progress < 50 && "Converting PDF pages to images..."}
              {progress >= 50 && progress < 90 && "Extracting biomarkers with AI vision..."}
              {progress >= 90 && "Finalizing results..."}
            </div>
            {file && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="flex-1 flex flex-col min-h-0 gap-4">
            {/* Panel Info */}
            {panel && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-muted-foreground">Collected: </span>
                  <span className="font-medium">{panel.collectedAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lab: </span>
                  <span className="font-medium">
                    {panel.labProvider || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Specimen: </span>
                  <span className="font-medium">
                    {panel.specimenId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fasting: </span>
                  <span className="font-medium">
                    {panel.fasting ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            )}

            {/* Status Summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {markers.length} markers
              </Badge>
              {statusCounts.normal > 0 && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {statusCounts.normal} normal
                </Badge>
              )}
              {statusCounts.high > 0 && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  {statusCounts.high} high
                </Badge>
              )}
              {statusCounts.low > 0 && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {statusCounts.low} low
                </Badge>
              )}
              {statusCounts.critical > 0 && (
                <Badge variant="destructive">
                  {statusCounts.critical} critical
                </Badge>
              )}
            </div>

            {/* Markers Table */}
            <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
              <div className="space-y-4">
                {Object.entries(groupedMarkers).map(
                  ([category, categoryMarkers]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-primary mb-2 sticky top-0 bg-background py-1">
                        {category} ({categoryMarkers.length})
                      </h4>
                      <div className="space-y-1">
                        {categoryMarkers.map((marker) => {
                          const globalIdx = markers.indexOf(marker);
                          const isEditing = editingIdx === globalIdx;
                          return (
                            <div
                              key={`${marker.name}-${globalIdx}`}
                              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 text-sm group"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate">
                                  {marker.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    step="any"
                                    defaultValue={marker.value}
                                    className="w-20 h-7 text-sm"
                                    autoFocus
                                    onBlur={(e) =>
                                      updateMarkerValue(
                                        globalIdx,
                                        parseFloat(e.target.value)
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        updateMarkerValue(
                                          globalIdx,
                                          parseFloat(
                                            (e.target as HTMLInputElement).value
                                          )
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <span
                                    className={`font-mono cursor-pointer hover:underline ${
                                      marker.status === "high" || marker.status === "critical"
                                        ? "text-amber-600 dark:text-amber-400"
                                        : marker.status === "low"
                                        ? "text-blue-600 dark:text-blue-400"
                                        : ""
                                    }`}
                                    onClick={() => setEditingIdx(globalIdx)}
                                  >
                                    {marker.value}
                                  </span>
                                )}
                                <span className="text-muted-foreground text-xs w-16 truncate">
                                  {marker.unit}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs w-16 justify-center ${
                                    marker.status === "high" || marker.status === "critical"
                                      ? "border-amber-500 text-amber-600"
                                      : marker.status === "low"
                                      ? "border-blue-500 text-blue-600"
                                      : "border-emerald-500 text-emerald-600"
                                  }`}
                                >
                                  {marker.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => setEditingIdx(globalIdx)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                  onClick={() => removeMarker(globalIdx)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="outline" onClick={reset}>
                Start Over
              </Button>
              <Button onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" />
                Save {markers.length} Markers
              </Button>
            </div>
          </div>
        )}

        {/* Saving Step */}
        {step === "saving" && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">
              Saving {markers.length} markers to patient record...
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
            <div>
              <p className="font-medium text-lg">Lab results saved!</p>
              <p className="text-sm text-muted-foreground">
                {markers.length} biomarkers added to {patientName}&apos;s record
              </p>
            </div>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="py-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium text-lg">Something went wrong</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={reset}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
