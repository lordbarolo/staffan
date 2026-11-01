import { chromium } from "playwright";

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const username = process.env.OPERATOR_USERNAME;
const password = process.env.OPERATOR_PASSWORD;
if (!username || !password) throw new Error("OPERATOR_USERNAME och OPERATOR_PASSWORD krävs");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Användarnamn").fill(username);
  await page.getByLabel("Lösenord").fill(password);
  await page.getByRole("button", { name: "Logga in" }).click();
  await page.getByRole("heading", { name: "Avropsintag" }).waitFor();

  await page.getByLabel("Inklistrad avropstext").fill([
    "Syntetiskt browser-E2E-avrop",
    "Vårdgivare: Testkommun",
    "Roll: Sjuksköterska",
    "Plats: Teststad",
    "Period: 2027-06-01 till 2027-06-30",
    "Schema: Dagtid",
    "Omfattning: Heltid",
    "Sista svarsdatum: 2027-05-01",
  ].join("\n"));
  await page.getByRole("button", { name: "Extrahera text" }).click();
  try {
    await page.getByRole("heading", { name: "Källa och extraktion" }).waitFor();
  } catch (error) {
    const notices = await page.locator(".notice").allTextContents();
    console.error(JSON.stringify({ url: page.url(), notices }));
    throw error;
  }

  await page.getByLabel("Vårdgivare").fill("Testkommun");
  await page.getByLabel("Roll").fill("Sjuksköterska");
  await page.getByLabel("Plats").fill("Teststad");
  await page.getByLabel("Startdatum", { exact: true }).fill("2027-06-01");
  await page.getByLabel("Slutdatum", { exact: true }).fill("2027-06-30");
  await page.getByLabel("Omfattning").fill("Heltid");
  await page.getByLabel("Övergripande schema").fill("Dagtid");
  await page.getByLabel("Sista svarsdatum").fill("2027-05-01");
  await page.getByRole("button", { name: "Godkänn CallOff" }).click();
  await page.getByText("CallOff godkänd och sparad").waitFor();
  console.log("Browser-E2E import, correction and approval passed.");
} finally {
  await browser.close();
}
