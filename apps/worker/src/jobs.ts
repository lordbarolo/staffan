import type {
  IngressDiscoveryRecord,
  IngressDiscoveryRepository,
} from "@staffan/db";
import {
  EavropAdapterError,
  PdfTextExtractionError,
  eavropContent,
  processCallOff,
  type CallOffReviewRepository,
  type EavropPollingPortal,
  type ModelGateway,
  type OcrEngine,
} from "@staffan/ingress";

export interface ImportQueue {
  enqueue(discovery: IngressDiscoveryRecord): Promise<string | null>;
}

export async function pollEavrop(input: {
  discoveryRepository: IngressDiscoveryRepository;
  pollUrl: string;
  portal: EavropPollingPortal;
  queue: ImportQueue;
}) {
  const result = await input.portal.discoverCallOffs(input.pollUrl);
  for (const discovery of result.callOffs) {
    await input.discoveryRepository.register(discovery);
  }

  const pending = await input.discoveryRepository.listPending();
  let queued = 0;
  for (const discovery of pending) {
    const jobId = await input.queue.enqueue(discovery);
    await input.discoveryRepository.markQueued(discovery.id);
    if (jobId !== null) queued += 1;
  }
  return { discovered: result.callOffs.length, queued };
}

export async function importEavropDiscovery(input: {
  callOffRepository: CallOffReviewRepository;
  discoveryId: string;
  discoveryRepository: IngressDiscoveryRepository;
  gateway: ModelGateway;
  maxAttempts: number;
  ocr?: OcrEngine;
  portal: EavropPollingPortal;
}) {
  const discovery = await input.discoveryRepository.claim(input.discoveryId);
  if (discovery === null) return { status: "skipped" as const };

  try {
    const portalResult = await input.portal.fetchCallOff(discovery.sourceUrl);
    const content = await eavropContent(portalResult, {
      ...(input.ocr === undefined ? {} : { ocr: input.ocr }),
    });
    const result = await processCallOff(
      {
        content,
        externalRef: portalResult.externalRef ?? discovery.externalRef,
        fileName: "e-avrop-background.txt",
        mediaType: "text/plain",
        sourceSystem: "e-avrop",
        sourceType: "raw_text",
      },
      { gateway: input.gateway, repository: input.callOffRepository },
    );
    await input.discoveryRepository.markInReview(discovery.id, result.extraction.id);
    return { extractionId: result.extraction.id, status: "in_review" as const };
  } catch (error) {
    const message = operationalError(error);
    if (discovery.attemptCount >= input.maxAttempts) {
      await input.discoveryRepository.markFailed(discovery.id, message);
      return { status: "failed" as const };
    }
    await input.discoveryRepository.markRetry(discovery.id, message);
    throw error;
  }
}

function operationalError(error: unknown) {
  if (error instanceof EavropAdapterError) return error.message;
  if (error instanceof PdfTextExtractionError) return error.message;
  return "Avropet kunde inte importeras";
}
