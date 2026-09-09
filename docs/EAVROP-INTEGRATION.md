# e-Avrop integration

**Status:** Slice 2 import verified; OCR and continuous polling implemented locally 2026-09-05
**Scope:** Read-only direct and scheduled import of e-Avrop procurements into the existing CallOff review flow

## Purpose and boundaries

The e-Avrop implementation is an ingress adapter. It authenticates to the portal, reads a procurement page and its procurement-document page, downloads eligible attachments, and hands the combined material to the existing quarantine and extraction pipeline.

It does not submit tenders, modify portal data, match consultants, send outreach, or perform any other external action. Human review and explicit approval remain required before the extracted CallOff changes status.

## End-to-end flow

```text
e-Avrop URL
  -> POST /call-offs/import-eavrop
  -> PlaywrightEavropPortalAdapter
  -> page text + procurement-document page + attachments
  -> one quarantined RawArtifact with sourceSystem=e-avrop
  -> configured ModelGateway
  -> strict CallOffExtraction validation
  -> review screen
  -> human correction and approval
```

The optional continuous path reuses the same pipeline:

```text
pg-boss schedule
  -> read configured e-Avrop list page
  -> discover and persist stable source keys
  -> enqueue each pending source once
  -> fetch page and attachments
  -> OCR image-only PDF pages when needed
  -> same CallOff extraction
  -> ready_for_review or visible exception state
```

Polling never approves a CallOff. A human must still review and submit the approval form.

Trusted source metadata such as `sourceSystem` and a reference derived from the portal URL overrides conflicting model output. Portal content remains untrusted source data.

## Configuration

Copy names and placeholder structure from `.env.example`. Put real values only in the local `.env` file or the deployment platform's secret store.

Required for e-Avrop:

- `EAVROP_USERNAME`
- `EAVROP_PASSWORD`

Required for the normal local OpenAI provider:

- `MODEL_PROVIDER=openai`
- `OPENAI_API_KEY`
- `MODEL_NAME`
- `MODEL_VERSION`

Optional:

- `EAVROP_BROWSER_EXECUTABLE_PATH` when Chrome, Edge, or Chromium cannot be discovered automatically
- `OCR_TESSERACT_PATH` when the `tesseract` executable cannot be discovered automatically

Required for the separate background worker:

- `EAVROP_POLL_URL`, the authenticated e-Avrop list page to observe

Optional worker controls:

- `EAVROP_POLL_CRON` (default every five minutes)
- `EAVROP_POLL_TIME_ZONE` (default `Europe/Stockholm`)
- `WORKER_IMPORT_MAX_ATTEMPTS` (default 5)

Never place actual values in this document, `.env.example`, tests, logs, screenshots, prompts, or committed files.

## Supported content

- Portal overview text
- The linked page named `Upphandlingsdokument`
- PDF text extraction
- OCR of PDF pages that contain too little embedded text
- DOCX text extraction
- XLSX worksheet and cell extraction
- Plain text, JSON, and XML text extraction

The adapter may download legacy DOC/XLS or ZIP links, but those formats are not text-decoded by the current pipeline. Unsupported formats remain visible as attachment placeholders instead of being silently treated as parsed text.

Default safety limits are 20 attachments, 10 MB per attachment, and 200,000 extracted characters per attachment. Only HTTPS URLs on `e-avrop.com` and its subdomains are accepted.

## Failure behavior

- Missing credential pair fails configuration explicitly.
- Invalid or non-e-Avrop URLs return a validation error.
- Failed authentication and portal navigation report the failed adapter step.
- CAPTCHA or two-factor challenges report that manual interaction is required.
- Unreadable attachments remain visible in the source material with a parsing marker.
- Database or persistence failures return an explicit service error.
- Repeated background-import failures stop in a visible `failed` state after the configured attempt limit.

## Verification evidence

The integration has been exercised locally against a real e-Avrop procurement with authenticated access. The verified flow followed the procurement-document page, downloaded seven attachments, extracted content from PDF, DOCX, and XLSX material, produced a model-backed CallOff review, persisted it to PostgreSQL, and completed manual approval in the operations UI.

No credentials or downloaded source documents are part of the repository. This is local functional evidence only; it is not a claim that the current commit has passed post-push GitHub Actions or a production deployment.

Automated coverage includes:

- e-Avrop URL and credential boundaries
- procurement-document link resolution and attachment filtering
- spreadsheet extraction with unknown media type
- API import through the existing review pipeline
- explicit disabled-adapter behavior
- trusted portal metadata overriding conflicting model output
- direct OpenAI execution behind the existing `ModelGateway`
- mixed text/OCR page handling and explicit missing-OCR behavior
- multiple period segments and calendar weeks, including unknown week years
- structured classification of explicit shall and should requirements
- scheduled discovery, queueing, idempotent source keys, retries, and exception state

Run the complete local verification from the repository root:

```powershell
cd C:\Github\Staffan
pnpm check
```

## Known limitations and next work

- Background polling requires an explicit list-page URL; mailbox-triggered discovery is not included.
- Portal markup and login behavior can change and require adapter maintenance.
- CAPTCHA and two-factor challenges are not bypassed.
- OCR quality depends on scan resolution and still requires human comparison with the rendered source.
- Local Windows OCR requires Tesseract on `PATH` or `OCR_TESSERACT_PATH`; the Docker runtime includes Swedish and English language data.
- Automatic extraction approval remains parked until measured quality justifies Slice 6.
