import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export async function POST({ request }: { request: Request }) {
  try {
    const { eventId, entryCode } = await request.json();

    if (!eventId || !entryCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing eventId or entryCode",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const convexUrl = import.meta.env.PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const client = new ConvexHttpClient(convexUrl);

    // Call the Convex query to verify the entry code
    const result = await client.query(api.registrations.verifyEntryCode, {
      eventId,
      entryCode,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error verifying entry code:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to verify entry code",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
