import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 4100);

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) reject(new Error("request too large"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { status: "ok", gateway: "deterministic-test" });
    return;
  }

  if (request.method !== "POST" || request.url !== "/extract") {
    sendJson(response, 404, { error: "not found" });
    return;
  }

  try {
    const body = await readJson(request);
    const artifactId = body?.source?.artifactId;
    sendJson(response, 200, {
      output: {
        externalRef: null,
        sourceSystem: "docker-test",
        careProvider: null,
        organizationNumber: null,
        administration: null,
        unit: null,
        requester: null,
        role: null,
        specialty: null,
        competenceRequirements: [],
        location: null,
        periodStart: null,
        periodEnd: null,
        scope: null,
        schedule: null,
        onCall: null,
        introduction: null,
        mandatoryRequirements: [],
        preferences: [],
        criteria: [],
        priorities: [],
        commercialTerms: null,
        submissionDeadline: null,
        otherTerms: [],
        confidence: 0.5,
        fieldConfidence: {},
        fieldProvenance: artifactId === undefined ? {} : { source: [{ artifactId, excerpt: "docker test", locator: null }] },
      },
    });
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : "invalid request" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Deterministic test gateway listening on ${port}`);
});
