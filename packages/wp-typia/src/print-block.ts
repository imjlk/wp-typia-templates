import type { PrintLine } from './print-line';

/**
 * Prints a block of text lines using a shared line printer.
 *
 * @param printLine Line printer to use.
 * @param lines Lines to print in order.
 * @returns Nothing.
 */
export function printBlock(printLine: PrintLine, lines: string[]): void {
  for (const line of lines) {
    printLine(line);
  }
}
