import { existsSync } from "node:fs";
import path from "node:path";

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const LOGIN_URL = "https://www.e-avrop.com/Login.aspx";
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

export interface EavropLogEntry {
  detail: string;
  status: "ok" | "skipped";
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
      const context = await browser.newContext({ acceptDownloads: false, locale: "sv-SE" });
      const page = await context.newPage();
      page.setDefaultTimeout(this.timeoutMs);
      page.setDefaultNavigationTimeout(this.timeoutMs);

      await navigate(page, requestedUrl);
      log.push({ step: "navigate", status: "ok", detail: "Avropslänken öppnades" });

      if (await loginIsVisible(page)) {
        await login(page, this.credentials, this.timeoutMs);
        log.push({ step: "login", status: "ok", detail: "Inloggningen slutfördes" });

        if (normalizeUrl(page.url()) !== requestedUrl && !isLoginUrl(requestedUrl)) {
          await navigate(page, requestedUrl);
        }
      } else {
        log.push({ step: "login", status: "skipped", detail: "Sidan krävde ingen ny inloggning" });
      }

      validateEavropUrl(page.url());
      const overviewText = await extractPageText(page);
      const documentsUrl = await findProcurementDocumentsUrl(page);
      if (documentsUrl !== null) {
        await navigate(page, documentsUrl);
        validateEavropUrl(page.url());
      }
      const documentsText = documentsUrl === null ? "" : await extractPageText(page);
      const pageText = [overviewText, documentsText].filter(Boolean).join("\n\n--- Upphandlingsdokument ---\n\n");
      if (pageText.length < 20) {
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

      const attachments = await downloadAttachments(
        page,
        context,
        this.maxAttachments,
        this.maxAttachmentBytes,
      );
      log.push({
        step: "attachments",
        status: attachments.length === 0 ? "skipped" : "ok",
        detail:
          attachments.length === 0
            ? "Inga direkt nedladdningsbara bilagor hittades"
            : `${attachments.length} bilagor hämtades`,
      });

      return {
        attachments,
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
      const page = await (await browser.newContext({ acceptDownloads: false, locale: "sv-SE" })).newPage();
      page.setDefaultTimeout(this.timeoutMs);
      page.setDefaultNavigationTimeout(this.timeoutMs);

      await navigate(page, requestedUrl);
      log.push({ step: "navigate", status: "ok", detail: "Bevakningssidan öppnades" });
      if (await loginIsVisible(page)) {
        await login(page, this.credentials, this.timeoutMs);
        log.push({ step: "login", status: "ok", detail: "Inloggningen slutfördes" });
        if (normalizeUrl(page.url()) !== requestedUrl && !isLoginUrl(requestedUrl)) {
          await navigate(page, requestedUrl);
        }
      } else {
        log.push({ step: "login", status: "skipped", detail: "Sidan krävde ingen ny inloggning" });
      }

      validateEavropUrl(page.url());
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

async function login(page: Page, credentials: EavropCredentials, timeoutMs: number) {
  await page.locator("#mainContent_ctl00_username").fill(credentials.username);
  await page.locator("#NextButton").click();
  const password = page.locator("#mainContent_ctl00_password");
  await password.waitFor({ state: "visible" });
  await password.fill(credentials.password);
  await page.locator("#verify").click();

  await Promise.race([
    page.waitForURL((url) => !isLoginUrl(url.href), { timeout: timeoutMs }),
    page.getByText(/Inloggning misslyckades/i).waitFor({ state: "visible", timeout: timeoutMs }),
    page.getByText(/verifieringskod|tvåfaktor|captcha/i).waitFor({ state: "visible", timeout: timeoutMs }),
  ]).catch(() => undefined);

  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (/verifieringskod|tvåfaktor|captcha/i.test(bodyText)) {
    throw new EavropAdapterError(
      "e-Avrop kräver manuell verifiering",
      "login",
      "interaction_required",
    );
  }
  if (isLoginUrl(page.url()) || /Inloggning misslyckades/i.test(bodyText)) {
    throw new EavropAdapterError(
      "Inloggningen till e-Avrop misslyckades",
      "login",
      "authentication_failed",
    );
  }
}

async function extractPageText(page: Page) {
  return page.evaluate(() => {
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
  const links = await page.locator("a[href]").evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.getAttribute("href") ?? "",
      text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
    })),
  );
  return resolveEavropDocumentsUrl(links, page.url());
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

async function downloadAttachments(
  page: Page,
  context: BrowserContext,
  maxAttachments: number,
  maxAttachmentBytes: number,
) {
  const links = await page.locator("a[href]").evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.getAttribute("href") ?? "",
      text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
    })),
  );
  const candidates = new Map<string, string>();
  for (const link of links) {
    try {
      const url = new URL(link.href, page.url());
      validateEavropUrl(url.href);
      if (!isEavropAttachmentCandidate(url.href, link.text)) continue;
      candidates.set(url.href, link.text);
    } catch {
      // Ignore non-URL controls such as ASP.NET postback links.
    }
  }

  const attachments: EavropAttachment[] = [];
  for (const [url, linkText] of [...candidates].slice(0, maxAttachments)) {
    const response = await context.request.get(url, { timeout: DEFAULT_TIMEOUT_MS });
    if (!response.ok()) continue;
    try {
      validateEavropUrl(response.url());
    } catch {
      continue;
    }
    const body = await response.body();
    if (body.byteLength === 0 || body.byteLength > maxAttachmentBytes) continue;
    const headers = response.headers();
    attachments.push({
      content: body,
      fileName: attachmentFileName(headers["content-disposition"], url, linkText),
      mediaType: headers["content-type"]?.split(";", 1)[0] ?? "application/octet-stream",
      sourceUrl: url,
    });
  }
  return attachments;
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
