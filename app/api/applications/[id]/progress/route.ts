/**
 * GET /api/applications/[id]/progress — Server-Sent Events for Live Scoring Progress
 * 
 * Streams real-time scoring pipeline progress to the frontend.
 * The client connects via EventSource and receives updates like:
 *   - { step: "Fetching weather...", progress: 10 }
 *   - { step: "NDVI analysis complete", progress: 55 }
 *   - { step: "Scoring pipeline complete", progress: 100 }
 */

// Access the shared progress store from the queue processor
declare global {
  // eslint-disable-next-line no-var
  var __scoringProgress: Map<string, { step: string; progress: number; data?: any; completedAt?: string }> | undefined;
}

import { requireApiRole } from "../../../../lib/dal";
import { canViewApplicant } from "../../../../lib/access";
import { tvsDb } from "../../../../lib/db";

const progressStore = globalThis.__scoringProgress || (globalThis.__scoringProgress = new Map());

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole();
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!/^APP-[A-Z0-9-]{1,20}$/i.test(id)) {
    return Response.json({ error: "Invalid application id" }, { status: 400 });
  }
  // Applications still in the queue may not be persisted yet; once they are, enforce row access.
  const applicant = await tvsDb.getApplicantById(id);
  if (applicant && !canViewApplicant(auth.user, applicant)) {
    return Response.json({ error: "Applicant not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ step: "Connected to scoring pipeline", progress: 0, applicationId: id })}\n\n`)
      );

      // Poll the progress store every 500ms
      const interval = setInterval(() => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        const progress = progressStore.get(id);

        if (progress) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ ...progress, applicationId: id })}\n\n`)
          );

          // If completed, send final event and close
          if (progress.progress >= 100) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ step: "DONE", progress: 100, applicationId: id })}\n\n`)
            );
            clearInterval(interval);
            closed = true;
            try { controller.close(); } catch {}
            // Clean up after 60 seconds
            setTimeout(() => progressStore.delete(id), 60000);
          }
        }
      }, 500);

      // Auto-close after 120 seconds to prevent hanging connections
      setTimeout(() => {
        if (!closed) {
          clearInterval(interval);
          closed = true;
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ step: "TIMEOUT", progress: -1, applicationId: id })}\n\n`)
            );
            controller.close();
          } catch {}
        }
      }, 120000);
    },

    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
