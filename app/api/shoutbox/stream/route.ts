import { getShoutboxLiveService } from "@/lib/shoutbox-live";
import { isShoutboxConfigured } from "@/lib/shoutbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isShoutboxConfigured()) {
    return new Response("Shoutbox is not configured", { status: 503 });
  }

  const live = getShoutboxLiveService();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      send({ messages: live.getMessages(), live: true });

      const unsubscribe = live.subscribe((messages) => {
        send({ messages, live: true });
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
