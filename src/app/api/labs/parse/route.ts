import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/rbac";
import { UserRole } from "@prisma/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface ParseRequest {
  imageDataUrls: string[];
  patientId: string;
}

const EXTRACTION_PROMPT = `You are a medical lab report parser. Analyze these lab result images and extract ALL biomarkers/test results into structured JSON.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "panel": {
    "collectedAt": "YYYY-MM-DD",
    "reportedAt": "YYYY-MM-DD",
    "specimenId": "string or null",
    "labProvider": "string (e.g. Quest Diagnostics)",
    "fasting": true/false
  },
  "markers": [
    {
      "name": "Test Name",
      "value": 123.4,
      "unit": "mg/dL",
      "referenceMin": 60.0,
      "referenceMax": 100.0,
      "category": "Category Name",
      "status": "normal|low|high|critical"
    }
  ]
}

RULES:
- Extract EVERY test result from ALL pages
- Use these categories: CBC, Metabolic, Diabetes, Thyroid, Hormones, Growth Factors, Lipids, Iron, Inflammation, Vitamins, Prostate, Immunology, Viral, Urinalysis, Other
- For status: compare value against reference range. "low" if below min, "high" if above max, "normal" if in range, "critical" if far outside range
- referenceMin/referenceMax should be numbers or null if not provided
- value must be a number. If the result is text-only (e.g. "Negative", "Non-Reactive"), use 0 as value and put the text in the name
- Include the specimen ID if visible on the report
- Detect if the report indicates fasting
- For Quest Diagnostics reports, the collection date is usually at the top of each page
- Parse ALL pages thoroughly - don't skip any markers`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // AI costs money — use the stricter chat rate limit bucket
    const rate = checkRateLimit(`labs-parse:${session.user.id}`, RATE_LIMITS.chat);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!hasPermission(session.user.role as UserRole, "labs:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: ParseRequest = await request.json();
    const { imageDataUrls, patientId } = body;

    if (!imageDataUrls || !Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
      return NextResponse.json(
        { error: "imageDataUrls array is required" },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    // Verify patient belongs to caller's clinic before burning AI budget
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: session.user.clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (imageDataUrls.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 pages supported" },
        { status: 400 }
      );
    }

    // Send all pages to vision model
    const result = await fal.subscribe("openrouter/router/vision", {
      input: {
        prompt: EXTRACTION_PROMPT,
        image_urls: imageDataUrls,
        model: "google/gemini-2.0-flash-001",
        temperature: 0.1,
        max_tokens: 8192,
      },
    });

    const output = (result.data as Record<string, unknown>)?.output as string;
    if (!output) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    // Parse the JSON from the AI response
    // Try to extract JSON from the response (may have markdown fences)
    let jsonStr = output;
    const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Also try to find raw JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.panel || !parsed.markers || !Array.isArray(parsed.markers)) {
      return NextResponse.json(
        { error: "AI returned invalid structure", raw: output },
        { status: 422 }
      );
    }

    // Clean up markers - ensure numeric values
    const cleanedMarkers = parsed.markers.map((m: Record<string, unknown>) => ({
      name: String(m.name || ""),
      value: Number(m.value) || 0,
      unit: String(m.unit || ""),
      referenceMin: m.referenceMin != null ? Number(m.referenceMin) : null,
      referenceMax: m.referenceMax != null ? Number(m.referenceMax) : null,
      category: String(m.category || "Other"),
      status: ["normal", "low", "high", "critical"].includes(String(m.status))
        ? String(m.status)
        : "normal",
    }));

    return NextResponse.json({
      panel: parsed.panel,
      markers: cleanedMarkers,
    });
  } catch (error) {
    console.error("Lab parse error:", error instanceof Error ? error.message : "Unknown error");

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Failed to parse lab results" },
      { status: 500 }
    );
  }
}
