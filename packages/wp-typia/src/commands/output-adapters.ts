import type { PrintLine } from '../print-line';

type CommandOutputAdapterArgs = {
  printLine?: PrintLine;
  warnLine?: PrintLine;
};

const defaultPrintLine: PrintLine = (line) => {
  process.stdout.write(`${line}\n`);
};

const defaultWarnLine: PrintLine = (line) => {
  process.stderr.write(`${line}\n`);
};

export function resolveCommandPrintLine(args: object): PrintLine {
  return (args as CommandOutputAdapterArgs).printLine ?? defaultPrintLine;
}

export function resolveCommandOutputAdapters(args: object): {
  printLine: PrintLine;
  warnLine: PrintLine;
} {
  const adapters = args as CommandOutputAdapterArgs;

  return {
    printLine: adapters.printLine ?? defaultPrintLine,
    warnLine: adapters.warnLine ?? defaultWarnLine,
  };
}
