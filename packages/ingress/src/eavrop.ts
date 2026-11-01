import { existsSync } from "node:fs";
import path from "node:path";

import { chromium, type Browser, type BrowserContext, type Frame, type Page } from "playwright";

const LOGIN_URL = "https://www.e-avrop.com/Login.aspx";
export const EAVROP_IMPORT_QUEUE = "eavrop.import";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTACHMENTS = 20;
const DEFAULT_MAX_ATTACHMENT_BYTES = 10_000_000;
const ATTACHMENT_EXTENSIONS = /\.(?:pdf|txt|docx?|xlsx?|zip)(?:$|[?#])/i;

export interface EavropCredentials {
  password: string;
  username: string;
}

export interface EavropAttachment {
  content: Uint8Array;
  fileName: string;
  mediaType: string;
  sourceUrl: string;
}

export interface EavropAttachmentStatus {
  detail: string;
  fileName: string;
  status:
    | "downloaded"
    | "http_error"
    | "request_failed"
    | "empty"
    | "too_large"
    | "blocked_redirect"
    | "limit_exceeded";
}

export interface EavropLogEntry {
  detail: string;
  status: "ok" | "skipped" | "warning";
  step: "navigate" | "login" | "discover" | "extract" | "attachments";
}

export interface EavropDiscoveredCallOff {
  externalRef: string | null;
  sourceUrl: string;
}

export interface EavropDiscoveryResult {
  callOffs: EavropDiscoveredCallOff[];
  log: EavropLogEntry[];
}

export interface EavropFetchResult {
  attachments: EavropAttachment[];
  attachmentStatuses: EavropAttachmentStatus[];
  externalRef: string | null;
  log: EavropLogEntry[];
  pageText: string;
  sourceUrl: string;
}

export interface EavropPortal {
  fetchCallOff(sourceUrl: string): Promise<EavropFetchResult>;
}

export interface EavropPollingPortal extends EavropPortal {
  discoverCallOffs(sourceUrl: string): Promise<EavropDiscoveryResult>;
}

export class EavropAdapterError extends Error {
  constructor(
    message: string,
    readonly step: EavropLogEntry["step"],
    readonly code:
      | "invalid_url"
      | "navigation_failed"
      | "authentication_failed"
      | "interaction_required"
      | "empty_calloff"
      | "discovery_failed",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "EavropAdapterError";
  }
}

export interface EavropPortalAdapterOptions {
  browserExecutablePath?: string;
  headless?: boolean;
  maxAttachmentBytes?: number;
  maxAttachments?: number;
  timeoutMs?: number;
}

export class PlaywrightEavropPortalAdapter implements EavropPortal {
  private readonly timeoutMs: number;
  private readonly maxAttachments: number;
  private readonly maxAttachmentBytes: number;

  constructor(
    private readonly credentials: EavropCredentials,
    private readonly options: EavropPortalAdapterOptions = {},
  ) {
    if (credentials.username.trim() === "" || credentials.password === "") {
      throw new Error("e-Avrop-användarnamn och lösenord måste anges");
    }
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxAttachments = options.maxAttachments ?? DEFAULT_MAX_ATTACHMENTS;
    this.maxAttachmentBytes = options.maxAttachmentBytes ?? DEFAULT_MAX_ATTACHMENT_BYTES;
  }

  async fetchCallOff(sourceUrl: string): Promise<EavropFetchResult> {
    const requestedUrl = validateEavropUrl(sourceUrl);
    const externalRef = deriveEavropExternalRef(requestedUrl);
    const log: EavropLogEntry[] = [];
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch(browserLaunchOptions(this.options));
      const context = await createRestrictedContext(browser);
      const page = await context.newPage();
      page.setDefaultTimeout(this.timeoutMs);
      page.setDefaultNavigationTimeout(this.timeoutMs);

      await navigate(page, requestedUrl);
      log.push({ step: "navigate", status: "ok", detail: "Avropslänken öppnades" });

      if (await loginIsVisible(page)) {
        await loginToEavrop(page, this.credentials, this.timeoutMs);
        log.push({ step: "login", status: "ok", detail: "Inloggningen slutfördes" });
      } else {
        log.push({ step: "login", status: "skipped", detail: "Sidan krävde ingen ny inloggning" });
      }

      await ensureRequestedEavropPage(page, requestedUrl);
      const overviewText = await waitForMeaningfulEavropPageText(page, this.timeoutMs);
      const documentsUrl = await findProcurementDocumentsUrl(page);
      if (documentsUrl !== null) {
        await navigate(page, documentsUrl);
        validateEavropUrl(page.url());
        await assertNoEavropInteractionChallenge(page);
      }
      const documentsText = documentsUrl === null ? "" : await extractEavropPageText(page);
      const pageText = [overviewText, documentsText].filter(Boolean).join("\n\n--- Upphandlingsdokument ---\n\n");
      if (!hasMeaningfulEavropContent(pageText)) {
        throw new EavropAdapterError(
          "e-Avrop-sidan saknar läsbart avropsinnehåll",
          "extract",
          "empty_calloff",
        );
      }
      log.push({
        step: "extract",
        status: "ok",
        detail:
          documentsUrl === null
            ? "Sidans avropstext hämtades"
            : "Avropstexten och sidan med upphandlingsdokument hämtades",
      });

      const { attachments, statuses: attachmentStatuses } = await downloadEavropAttachments(
        page,
        context,
        this.maxAttachments,
        this.maxAttachmentBytes,
        this.timeoutMs,
      );
      const failedAttachmentCount = attachmentStatuses.filter(
        ({ status }) => status !== "downloaded",
      ).length;
      log.push({
        step: "attachments",
        status: failedAttachmentCount > 0 ? "warning" : attachments.length === 0 ? "skipped" : "ok",
        detail:
          failedAttachmentCount > 0
            ? `${attachments.length} bilagor hämtades; ${failedAttachmentCount} kunde inte hämtas fullständigt`
            : attachments.length === 0
            ? "Inga direkt nedladdningsbara bilagor hittades"
            : `${attachments.length} bilagor hämtades`,
      });

      return {
        attachments,
        attachmentStatuses,
        externalRef,
        log,
        pageText,
        sourceUrl: requestedUrl,
      };
    } catch (error) {
      if (error instanceof EavropAdapterError) throw error;
      throw new EavropAdapterError(
        "e-Avrop kunde inte hämtas",
        "navigate",
        "navigation_failed",
        { cause: error },
      );
    } finally {
      await browser?.close();
    }
  }

  async discoverCallOffs(sourceUrl: string): Promise<EavropDiscoveryResult> {
    const requestedUrl = validateEavropUrl(sourceUrl);
    const log: EavropLogEntry[] = [];
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch(browserLaunchOptions(this.options));
      const page = await (await createRestrictedContext(browser)).newPage();
      page.setDefaultTimeout(this.timeoutMs);
      page.setDefaultNavigationTimeout(this.timeoutMs);

      await navigate(page, requestedUrl);
      log.push({ step: "navigate", status: "ok", detail: "Bevakningssidan öppnades" });
      if (await loginIsVisible(page)) {
        await loginToEavrop(page, this.credentials, this.timeoutMs);
        log.push({ step: "login", status: "ok", detail: "Inloggningen slutfördes" });
      } else {
        log.push({ step: "login", status: "skipped", detail: "Sidan krävde ingen ny inloggning" });
      }

      await ensureRequestedEavropPage(page, requestedUrl);
      const links = await page.locator("a[href]").evaluateAll((elements) =>
        elements.map((element) => ({ href: element.getAttribute("href") ?? "" })),
      );
      const callOffs = discoverEavropCallOffLinks(links, page.url());
      log.push({
        step: "discover",
        status: callOffs.length === 0 ? "skipped" : "ok",
        detail:
          callOffs.length === 0
            ? "Inga nya avropslänkar hittades"
            : `${callOffs.length} avropslänkar hittades`,
      });
      return { callOffs, log };
    } catch (error) {
      if (error instanceof EavropAdapterError) throw error;
      throw new EavropAdapterError(
        "e-Avrops bevakningssida kunde inte läsas",
        "discover",
        "discovery_failed",
        { cause: error },
      );
    } finally {
      await browser?.close();
    }
  }
}

export function validateEavropUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    throw new EavropAdapterError("Ange en giltig e-Avrop-länk", "navigate", "invalid_url", {
      cause: error,
    });
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    (hostname !== "e-avrop.com" && !hostname.endsWith(".e-avrop.com")) ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new EavropAdapterError(
      "Länken måste vara en säker adress på e-avrop.com",
      "navigate",
      "invalid_url",
    );
  }
  url.hash = "";
  return url.href;
}

export function deriveEavropExternalRef(value: string): string | null {
  const url = new URL(validateEavropUrl(value));
  for (const [key, candidate] of url.searchParams) {
    if (/^(?:id|noticeid|upphandlingid|procurementid|contractid)$/i.test(key) && candidate.trim() !== "") {
      return candidate.trim().slice(0, 200);
    }
  }
  const segment = url.pathname.split("/").filter(Boolean).at(-1);
  return segment === undefined || /^default\.aspx$/i.test(segment) ? null : segment.slice(0, 200);
}

export function discoverEavropCallOffLinks(
  links: Array<{ href: string }>,
  baseUrl: string,
): EavropDiscoveredCallOff[] {
  const discovered = new Map<string, EavropDiscoveredCallOff>();
  for (const link of links) {
    try {
      const sourceUrl = validateEavropUrl(new URL(link.href, baseUrl).href);
      if (!isEavropCallOffUrl(sourceUrl)) continue;
      discovered.set(sourceUrl, {
        externalRef: deriveEavropExternalRef(sourceUrl),
        sourceUrl,
      });
    } catch {
      // Other hosts, javascript controls and malformed links are not portal discoveries.
    }
  }
  return [...discovered.values()];
}

export function isEavropCallOffUrl(value: string) {
  const url = new URL(validateEavropUrl(value));
  const target = `${url.pathname}?${url.searchParams.toString()}`;
  if (/login\.aspx|attachmentdispatcher|invitationinfo|\/information\//i.test(target)) return false;
  const hasStableReference = [...url.searchParams].some(
    ([key, candidate]) =>
      /^(?:id|noticeid|upphandlingid|procurementid|contractid)$/i.test(key) &&
      candidate.trim() !== "",
  );
  const hasCallOffPath = /\/(?:calloff|notice|tender)\//i.test(url.pathname);
  return /procurement|notice|upphandling|calloff|tender/i.test(target) &&
    (hasStableReference || hasCallOffPath);
}

function browserLaunchOptions(options: EavropPortalAdapterOptions) {
  const executablePath = options.browserExecutablePath ?? installedBrowserPath();
  return {
    headless: options.headless ?? true,
    ...(executablePath === undefined ? {} : { executablePath }),
  };
}

export function findEavropCallOffUrlInEmail(rawEmail: string): string | null {
  const normalized = rawEmail.replace(/=\r?\n/g, "").replaceAll("&amp;", "&");
  const candidates = normalized.match(/https:\/\/[^\s<>"']+/gi) ?? [];
  for (const candidate of candidates) {
    const value = candidate.replace(/[),.;\]]+$/g, "");
    try {
      const url = validateEavropUrl(value);
      if (isEavropCallOffUrl(url)) return url;
    } catch {
      // Tracking links and other external URLs remain inert email data.
    }
  }
  return null;
}

async function createRestrictedContext(browser: Browser) {
  const context = await browser.newContext({
    acceptDownloads: false,
    locale: "sv-SE",
    serviceWorkers: "block",
  });
  await context.route("**/*", async (route) => {
    if (isAllowedEavropRequest(route.request().url())) {
      await route.continue();
    } else {
      await route.abort("blockedbyclient");
    }
  });
  return context;
}

export function isAllowedEavropRequest(value: string) {
  try {
    validateEavropUrl(value);
    return true;
  } catch {
    return false;
  }
}

function installedBrowserPath() {
  if (process.platform !== "win32") return undefined;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

async function navigate(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (error) {
    throw new EavropAdapterError("e-Avrop-länken kunde inte öppnas", "navigate", "navigation_failed", {
      cause: error,
    });
  }
}

async function loginIsVisible(page: Page) {
  return page.locator("#mainContent_ctl00_username").isVisible().catch(() => false);
}

export async function loginToEavrop(
  page: Page,
  credentials: EavropCredentials,
  timeoutMs: number,
) {
  assertEavropCredentialPage(page);
  await page.locator("#mainContent_ctl00_username").fill(credentials.username);
  assertEavropCredentialPage(page);
  await page.locator("#NextButton").click();
  const password = page.locator("#mainContent_ctl00_password");
  await password.waitFor({ state: "visible" });
  assertEavropCredentialPage(page);
  await password.fill(credentials.password);
  assertEavropCredentialPage(page);
  await page.locator("#verify").click();

  await Promise.race([
    page.waitForURL((url) => !isLoginUrl(url.href), { timeout: timeoutMs }),
    page.getByText(/Inloggning misslyckades/i).waitFor({ state: "visible", timeout: timeoutMs }),
    page.getByText(/verifieringskod|tvåfaktor|captcha/i).waitFor({ state: "visible", timeout: timeoutMs }),
  ]).catch(() => undefined);

  const bodyText = await assertNoEavropInteractionChallenge(page);
  assertEavropCredentialPage(page);
  if (isLoginUrl(page.url()) || /Inloggning misslyckades/i.test(bodyText)) {
    throw new EavropAdapterError(
      "Inloggningen till e-Avrop misslyckades",
      "login",
      "authentication_failed",
    );
  }
}

export async function ensureRequestedEavropPage(page: Page, requestedUrl: string) {
  if (normalizeUrl(page.url()) !== requestedUrl && !isLoginUrl(requestedUrl)) {
    await navigate(page, requestedUrl);
  }
  validateEavropUrl(page.url());
  await assertNoEavropInteractionChallenge(page);
}

async function assertNoEavropInteractionChallenge(page: Page) {
  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (/verifieringskod|tvåfaktor|captcha/i.test(bodyText)) {
    throw new EavropAdapterError(
      "e-Avrop kräver manuell verifiering",
      "login",
      "interaction_required",
    );
  }
  return bodyText;
}

function assertEavropCredentialPage(page: Pick<Page, "url">) {
  try {
    validateEavropUrl(page.url());
  } catch (error) {
    throw new EavropAdapterError(
      "Inloggningsuppgifter får endast anges på e-avrop.com",
      "login",
      "invalid_url",
      { cause: error },
    );
  }
}

export async function extractEavropPageText(page: Page) {
  const texts = await Promise.all(
    eavropSurfaces(page).map((surface) =>
      extractSurfaceText(surface).catch(() => ""),
    ),
  );
  return [...new Set(texts.filter(Boolean))].join("\n\n--- Inbäddat e-Avrop-innehåll ---\n\n");
}

async function waitForMeaningfulEavropPageText(page: Page, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let bestText = "";
  do {
    const currentText = await extractEavropPageText(page);
    if (currentText.length > bestText.length) bestText = currentText;
    if (hasMeaningfulEavropContent(currentText)) return currentText;
    await page.waitForTimeout(250);
  } while (Date.now() < deadline);
  return bestText;
}

export function hasMeaningfulEavropContent(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 200) return false;
  const signals = [
    /\b(?:avrop|upphandling|anbud|leverantörspool|dynamiskt inköpssystem)\b/i,
    /\b(?:CPV|referensnummer|diarienummer|kontraktsvärde|sista (?:svars|anbuds)(?:datum|dag))\b/i,
    /\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
    /\b(?:kommun|region|upphandlande (?:myndighet|organisation)|vårdgivare|beställare)\b/i,
  ].filter((pattern) => pattern.test(text)).length;
  return signals >= 2;
}

async function extractSurfaceText(surface: Page | Frame) {
  return surface.evaluate(() => {
    const root = document.querySelector("main") ?? document.querySelector("#mainContent") ?? document.body;
    return ((root as HTMLElement).innerText ?? "")
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  });
}

async function findProcurementDocumentsUrl(page: Page) {
  for (const surface of eavropSurfaces(page)) {
    const links = await surfaceLinks(surface);
    const documentsUrl = resolveEavropDocumentsUrl(links, surface.url());
    if (documentsUrl !== null) return documentsUrl;
  }
  return null;
}

export function resolveEavropDocumentsUrl(
  links: Array<{ href: string; text: string }>,
  baseUrl: string,
): string | null {
  const link = links.find(({ text }) => /^upphandlingsdokument$/i.test(text.trim()));
  if (link === undefined) return null;
  return validateEavropUrl(new URL(link.href, baseUrl).href);
}

export function isEavropAttachmentCandidate(href: string, linkText: string) {
  return ATTACHMENT_EXTENSIONS.test(href) || ATTACHMENT_EXTENSIONS.test(linkText);
}

export async function downloadEavropAttachments(
  page: Page,
  context: BrowserContext,
  maxAttachments: number,
  maxAttachmentBytes: number,
  timeoutMs: number,
) {
  const candidates = new Map<string, string>();
  for (const surface of eavropSurfaces(page)) {
    const links = await surfaceLinks(surface);
    for (const link of links) {
      try {
        const url = new URL(link.href, surface.url());
        validateEavropUrl(url.href);
        if (!isEavropAttachmentCandidate(url.href, link.text)) continue;
        candidates.set(url.href, link.text);
      } catch {
        // Ignore non-URL controls such as ASP.NET postback links.
      }
    }
  }

  const attachments: EavropAttachment[] = [];
  const statuses: EavropAttachmentStatus[] = [];
  const entries = [...candidates];
  for (const [url, linkText] of entries.slice(maxAttachments)) {
    statuses.push({
      detail: `Bilagan hoppades över eftersom gränsen är ${maxAttachments}`,
      fileName: attachmentFileName(undefined, url, linkText),
      status: "limit_exceeded",
    });
  }
  for (const [url, linkText] of entries.slice(0, maxAttachments)) {
    const initialFileName = attachmentFileName(undefined, url, linkText);
    let response;
    try {
      response = await context.request.get(url, { timeout: timeoutMs });
    } catch {
      statuses.push({
        detail: "Bilagan kunde inte hämtas",
        fileName: initialFileName,
        status: "request_failed",
      });
      continue;
    }
    if (!response.ok()) {
      statuses.push({
        detail: `Bilagan svarade med HTTP ${response.status()}`,
        fileName: initialFileName,
        status: "http_error",
      });
      continue;
    }
    try {
      validateEavropUrl(response.url());
    } catch {
      statuses.push({
        detail: "Bilagans omdirigering blockerades eftersom den lämnade e-avrop.com",
        fileName: initialFileName,
        status: "blocked_redirect",
      });
      continue;
    }
    const headers = response.headers();
    const fileName = attachmentFileName(headers["content-disposition"], url, linkText);
    const declaredSize = Number(headers["content-length"]);
    if (Number.isFinite(declaredSize) && declaredSize > maxAttachmentBytes) {
      statuses.push({
        detail: `Bilagan överskred storleksgränsen ${maxAttachmentBytes} byte`,
        fileName,
        status: "too_large",
      });
      continue;
    }
    let body: Buffer;
    try {
      body = await response.body();
    } catch {
      statuses.push({
        detail: "Bilagans innehåll kunde inte läsas",
        fileName,
        status: "request_failed",
      });
      continue;
    }
    if (body.byteLength === 0) {
      statuses.push({ detail: "Bilagan var tom", fileName, status: "empty" });
      continue;
    }
    if (body.byteLength > maxAttachmentBytes) {
      statuses.push({
        detail: `Bilagan överskred storleksgränsen ${maxAttachmentBytes} byte`,
        fileName,
        status: "too_large",
      });
      continue;
    }
    attachments.push({
      content: body,
      fileName,
      mediaType: headers["content-type"]?.split(";", 1)[0] ?? "application/octet-stream",
      sourceUrl: url,
    });
    statuses.push({ detail: "Bilagan hämtades", fileName, status: "downloaded" });
  }
  return { attachments, statuses };
}

function eavropSurfaces(page: Page): Array<Page | Frame> {
  const frames = typeof page.frames === "function" ? page.frames() : [];
  const surfaces: Array<Page | Frame> = frames.length === 0 ? [page] : frames;
  return surfaces.filter((surface) => isAllowedEavropRequest(surface.url()));
}

async function surfaceLinks(surface: Page | Frame) {
  return surface.locator("a[href]").evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.getAttribute("href") ?? "",
      text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
    })),
  );
}

function attachmentFileName(contentDisposition: string | undefined, url: string, linkText: string) {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  const candidate = encoded === undefined ? plain : decodeURIComponent(encoded);
  const urlName = path.basename(new URL(url).pathname);
  const linkName = ATTACHMENT_EXTENSIONS.test(linkText) ? linkText : undefined;
  return sanitizeFileName(candidate ?? linkName ?? urlName) || "bilaga";
}

function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim().slice(0, 255);
}

function isLoginUrl(value: string) {
  try {
    return /\/login\.aspx$/i.test(new URL(value).pathname);
  } catch {
    return value === LOGIN_URL;
  }
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  return url.href;
}
