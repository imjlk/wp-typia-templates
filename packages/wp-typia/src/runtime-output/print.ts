import type { AlternateBufferCompletionPayload } from '../ui/alternate-buffer-lifecycle';
import {
  formatOutputMarker,
  type OutputMarkerOptions,
} from '../output-markers';
import type { PrintLine } from '../print-line';

/**
 * Prints a formatted alternate-buffer completion payload to the provided writers.
 *
 * @param payload Structured completion payload to render.
 * @param options Optional line printers for normal output and warnings.
 * @returns Nothing.
 */
export function printCompletionPayload(
  payload: AlternateBufferCompletionPayload,
  options: {
    markerOptions?: OutputMarkerOptions;
    printLine?: PrintLine;
    warnLine?: PrintLine;
  } = {},
): void {
  const printLine = options.printLine ?? (console.log as PrintLine);
  const warnLine = options.warnLine ?? printLine;

  for (const line of payload.preambleLines ?? []) {
    printLine(line);
  }
  for (const warning of payload.warningLines ?? []) {
    warnLine(formatOutputMarker('warning', warning, options.markerOptions));
  }

  const hasDetails =
    (payload.summaryLines?.length ?? 0) > 0 ||
    (payload.nextSteps?.length ?? 0) > 0 ||
    (payload.optionalLines?.length ?? 0) > 0 ||
    Boolean(payload.optionalNote);
  const hasLeadingContext =
    (payload.preambleLines?.length ?? 0) > 0 ||
    (payload.warningLines?.length ?? 0) > 0;

  printLine(
    hasLeadingContext && hasDetails ? `\n${payload.title}` : payload.title,
  );
  for (const line of payload.summaryLines ?? []) {
    printLine(line);
  }
  if ((payload.nextSteps?.length ?? 0) > 0) {
    printLine('Next steps:');
    for (const step of payload.nextSteps ?? []) {
      printLine(`  ${step}`);
    }
  }
  if ((payload.optionalLines?.length ?? 0) > 0) {
    printLine(`\n${payload.optionalTitle ?? 'Optional:'}`);
    for (const step of payload.optionalLines ?? []) {
      printLine(`  ${step}`);
    }
  }
  if (payload.optionalNote) {
    printLine(`Note: ${payload.optionalNote}`);
  }
}

export { printBlock } from '../print-block';
