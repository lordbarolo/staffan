import { createServer as httpServer } from "node:http";
import { createServer as httpsServer } from "node:https";
import { readFileSync } from "node:fs";

// Network fixture only. Production adapters, database, queue and worker remain unchanged.
const counts = { login: 0, page: 0, attachment: 0 };
httpServer((request, response) => {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(request.url === "/stats" ? counts : { status: "ok" }));
}).listen(4101, "0.0.0.0");

httpsServer({
  cert: readFileSync("/certs/cert.pem"),
  key: readFileSync("/certs/key.pem"),
}, (request, response) => {
  const url = new URL(request.url, "https://mailbox-fixture.e-avrop.com:8443");
  const authenticated = request.headers.cookie?.includes("fixture=authenticated");
  if (url.pathname === "/login.aspx") {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(`<!doctype html><html><body>
      <input id="mainContent_ctl00_username" aria-label="Username">
      <button id="NextButton" onclick="document.getElementById('password-step').hidden=false">Next</button>
      <form id="password-step" hidden method="post" action="/session">
        <input id="mainContent_ctl00_password" name="password" type="password">
        <button id="verify">Login</button>
      </form></body></html>`);
    return;
  }
  if (url.pathname === "/session" && request.method === "POST") {
    counts.login++;
    response.writeHead(303, { "set-cookie": "fixture=authenticated; Path=/; Secure; HttpOnly", location: "/welcome" });
    response.end();
    return;
  }
  if (!authenticated) {
    response.writeHead(302, { location: "/login.aspx" });
    response.end();
    return;
  }
  if (url.pathname === "/calloff/requirements.txt") {
    counts.attachment++;
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("MAILBOX-ATTACHMENT: Legitimerad sjuksköterska. Erfarenhet av hemsjukvård krävs.");
    return;
  }
  if (url.pathname === "/notice.aspx" && url.searchParams.get("id")?.startsWith("MAILBOX-FAIL-")) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end("<html><body>Manuell verifieringskod krävs. <input id='mainContent_ctl00_username'><button id='NextButton'>Next</button><input id='mainContent_ctl00_password'><button id='verify'>Login</button></body></html>");
    return;
  }
  if (url.pathname === "/notice.aspx") {
    counts.page++;
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html><body><main>
      <h1>MAILBOX-ACCEPTANCE: Avrop för Testkommun</h1>
      <p>Referensnummer: ${url.searchParams.get("id")}</p>
      <p>Roll: Sjuksköterska. Plats: Teststad. Period: 2027-06-01 till 2027-06-30.</p>
      <p>Testkommun söker en legitimerad sjuksköterska för hemsjukvård på dagtid.
      Detta är ett syntetiskt avrop för att verifiera mailbox, portalhämtning och manuell review.</p>
      <a href="/calloff/requirements.txt">requirements.txt</a>
      </main></body></html>`);
    return;
  }
  response.end("Welcome");
}).listen(8443, "0.0.0.0");
