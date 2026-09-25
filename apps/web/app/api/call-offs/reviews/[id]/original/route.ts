import { z } from "zod";

import { authenticatedApiFetch, AuthenticationRequiredError } from "../../../../../auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = z.object({ id: z.uuid() }).parse(await context.params);
    const response = await authenticatedApiFetch(`/call-offs/reviews/${id}/original`, {
      cache: "no-store",
    });
    if (!response.ok || response.body === null) {
      return Response.json({ error: "Originalfilen kunde inte hämtas" }, { status: response.status });
    }
    return new Response(response.body, {
      headers: {
        "cache-control": "no-store",
        "content-disposition": response.headers.get("content-disposition") ?? "inline",
        "content-type": response.headers.get("content-type") ?? "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return Response.json({ error: "Inloggning krävs" }, { status: 401 });
    }
    return Response.json({ error: "Ogiltig originalbegäran" }, { status: 400 });
  }
}
