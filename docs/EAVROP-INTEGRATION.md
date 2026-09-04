# e-Avrop integration

**Status:** Slice 2 implemented and locally verified 2026-09-04
**Scope:** Read-only import of one concrete e-Avrop procurement into the existing CallOff review flow

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

Never place actual values in this document, `.env.example`, tests, logs, screenshots, prompts, or committed files.

## Supported content

- Portal overview text
- The linked page named `Upphandlingsdokument`
- PDF text extraction
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

Run the complete local verification from the repository root:

```powershell
cd C:\Github\Staffan
pnpm check
```

## Known limitations and next work

- Import currently starts from a URL entered in the operations UI; there is no scheduler or mailbox trigger yet.
- Portal markup and login behavior can change and require adapter maintenance.
- CAPTCHA and two-factor challenges are not bypassed.
- Scanned PDFs require an OCR step before their contents can be extracted.
- Background polling, deduplication across repeated portal discoveries, retries, and an exception queue belong to a later explicitly scoped implementation.
