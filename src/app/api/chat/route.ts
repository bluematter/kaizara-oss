import { fal } from "@fal-ai/client";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getPortalSession } from "@/lib/patient-auth-server";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface LabMarkerContext {
  name: string;
  value: number;
  unit: string;
  score: number;
  label: string;
  interpretation?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  patientContext?: {
    name: string;
    age: number;
    sex: string;
  };
  labMarkers?: LabMarkerContext[];
  imageUrls?: string[]; // Optional image attachments
}

// Basic input sanitization
function sanitizeString(str: string, maxLength: number = 10000): string {
  if (typeof str !== "string") return "";
  return str.slice(0, maxLength).trim();
}

export async function POST(request: NextRequest) {
  try {
    // Require a staff session or a patient portal session
    const staff = await auth();
    const portal = staff?.user?.clinicId ? null : await getPortalSession();
    if (!staff?.user?.clinicId && !portal) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const callerKey = staff?.user?.clinicId ? `staff:${staff.user.id}` : `portal:${portal!.patientId}`;
    const rateLimitResult = checkRateLimit(`chat:${callerKey}`, RATE_LIMITS.chat);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    const body: ChatRequest = await request.json();
    const { messages, patientContext, labMarkers, imageUrls } = body;

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Limit message count to prevent abuse
    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sanitize message content
    const sanitizedMessages = messages.map((m) => ({
      ...m,
      content: sanitizeString(m.content, 5000),
    }));

    // Determine which endpoint to use based on whether images are attached
    const hasImages = imageUrls && imageUrls.length > 0;
    const endpoint = hasImages ? "openrouter/router/vision" : "openrouter/router";

    // Build system prompt with patient context and lab data
    let systemPrompt = `You are a friendly, knowledgeable health assistant for Kaizara, a longevity and peptide clinic platform.
You help patients understand their lab results and health data in plain, accessible language.

IMPORTANT GUIDELINES:
- Be warm, supportive, and encouraging
- Explain medical terms in simple language
- Always recommend consulting with their provider for treatment decisions
- Never diagnose conditions or prescribe treatments
- Focus on education and empowerment
- If asked about something outside your knowledge, be honest about limitations
- Keep responses concise but thorough
`;

    if (patientContext) {
      systemPrompt += `\n\nPATIENT CONTEXT:
- Name: ${patientContext.name}
- Age: ${patientContext.age} years old
- Sex: ${patientContext.sex}
`;
    }

    if (labMarkers && labMarkers.length > 0) {
      systemPrompt += `\n\nLAB RESULTS (with age-adjusted scoring 0-100, 100=optimal):
`;
      // Group by score for context
      const critical = labMarkers.filter((m) => m.score < 25);
      const concerning = labMarkers.filter((m) => m.score >= 25 && m.score < 50);
      const suboptimal = labMarkers.filter((m) => m.score >= 50 && m.score < 75);
      const good = labMarkers.filter((m) => m.score >= 75 && m.score < 90);
      const optimal = labMarkers.filter((m) => m.score >= 90);

      if (critical.length > 0) {
        systemPrompt += `\nCRITICAL (needs attention):\n`;
        critical.forEach((m) => {
          systemPrompt += `- ${m.name}: ${m.value} ${m.unit} (score: ${m.score})${m.interpretation ? ` - ${m.interpretation}` : ""}\n`;
        });
      }

      if (concerning.length > 0) {
        systemPrompt += `\nCONCERNING:\n`;
        concerning.forEach((m) => {
          systemPrompt += `- ${m.name}: ${m.value} ${m.unit} (score: ${m.score})${m.interpretation ? ` - ${m.interpretation}` : ""}\n`;
        });
      }

      if (suboptimal.length > 0) {
        systemPrompt += `\nSUBOPTIMAL:\n`;
        suboptimal.forEach((m) => {
          systemPrompt += `- ${m.name}: ${m.value} ${m.unit} (score: ${m.score})${m.interpretation ? ` - ${m.interpretation}` : ""}\n`;
        });
      }

      if (good.length > 0) {
        systemPrompt += `\nGOOD:\n`;
        good.forEach((m) => {
          systemPrompt += `- ${m.name}: ${m.value} ${m.unit} (score: ${m.score})\n`;
        });
      }

      if (optimal.length > 0) {
        systemPrompt += `\nOPTIMAL:\n`;
        optimal.forEach((m) => {
          systemPrompt += `- ${m.name}: ${m.value} ${m.unit} (score: ${m.score})\n`;
        });
      }
    }

    // Build conversation history as a single prompt
    const userMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || "";

    // Build context from previous messages
    let conversationContext = "";
    if (sanitizedMessages.length > 1) {
      conversationContext = "\n\nPREVIOUS CONVERSATION:\n";
      sanitizedMessages.slice(0, -1).forEach((msg) => {
        conversationContext += `${msg.role === "user" ? "Patient" : "Assistant"}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}${conversationContext}\n\nPatient's question: ${userMessage}\n\nProvide a helpful, empathetic response:`;

    // Use fal.ai streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build input based on whether we have images
          const input: Record<string, unknown> = {
            prompt: fullPrompt,
            model: "google/gemini-2.0-flash-001",
            temperature: 0.7,
            max_tokens: 1024,
          };

          // Add image_urls only for vision endpoint
          if (hasImages) {
            input.image_urls = imageUrls;
          }

          // Use the appropriate endpoint based on whether images are attached
          const result = await fal.subscribe(endpoint, { input });

          // Send the complete response as a single chunk
          // (fal.ai endpoint doesn't support true streaming, so we chunk it)
          const output = result.data?.output || "I apologize, but I couldn't generate a response. Please try again.";

          // Simulate streaming by sending word by word
          const words = output.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            // Small delay to simulate streaming
            await new Promise((resolve) => setTimeout(resolve, 20));
          }

          controller.close();
        } catch (error) {
          // Log error type only - no PHI
          console.error("AI service error:", error instanceof Error ? error.name : "Unknown error");
          controller.enqueue(
            encoder.encode("I apologize, but I encountered an error. Please try again later.")
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    // Log error type only - no request body which may contain PHI
    console.error("Chat API error:", error instanceof Error ? error.name : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
