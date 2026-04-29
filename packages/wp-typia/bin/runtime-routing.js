import { collectPositionalIndexes } from './argv-walker.js';

function normalizeSet(values) {
  return values instanceof Set ? values : new Set(values);
}

function hasBooleanFlagBeforeTerminator(argv, longFlag, shortFlag) {
  for (const arg of argv) {
    if (arg === '--') {
      return false;
    }
    if (arg === longFlag || (shortFlag && arg === shortFlag)) {
      return true;
    }
    if (arg.startsWith(`${longFlag}=`)) {
      const value = arg.slice(longFlag.length + 1).toLowerCase();
      return value !== 'false' && value !== '0' && value !== 'no';
    }
  }

  return false;
}

function hasLongOptionBeforeTerminator(argv, optionName) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      return false;
    }
    if (arg === optionName || arg.startsWith(`${optionName}=`)) {
      return true;
    }
  }

  return false;
}

function isInteractiveTerminal({ stdin, stdout, term }) {
  return Boolean(stdin?.isTTY) && Boolean(stdout?.isTTY) && term !== 'dumb';
}

export function getRuntimeRoutingInvocation(argv, metadata) {
  const positionalIndexes = collectPositionalIndexes(argv, metadata);
  const positionals = positionalIndexes
    .map((index) => argv[index])
    .filter((value) => typeof value === 'string' && value.length > 0);
  const command = positionals[0];
  const reservedCommandSet = normalizeSet(metadata.reservedCommands);
  const isSinglePositionalAlias =
    Boolean(command) &&
    positionals.length === 1 &&
    !reservedCommandSet.has(command);

  return {
    command,
    isSinglePositionalAlias,
    positionals,
  };
}

export function shouldRouteToFullRuntime({
  argv,
  fullRuntimeCommands,
  hasBuiltRuntime,
  hasWorkingBun,
  interactiveRuntimeCommands,
  longValueOptions,
  reservedCommands,
  shortValueOptions,
  stdin = process.stdin,
  stdout = process.stdout,
  term = process.env.TERM,
}) {
  if (!hasWorkingBun || !hasBuiltRuntime) {
    return false;
  }

  const fullRuntimeCommandSet = normalizeSet(fullRuntimeCommands);
  const interactiveRuntimeCommandSet = normalizeSet(interactiveRuntimeCommands);
  const invocation = getRuntimeRoutingInvocation(argv, {
    longValueOptions,
    reservedCommands,
    shortValueOptions,
  });

  if (invocation.command && fullRuntimeCommandSet.has(invocation.command)) {
    return true;
  }

  if (
    !isInteractiveTerminal({
      stdin,
      stdout,
      term,
    })
  ) {
    return false;
  }

  if (
    invocation.command === 'help' ||
    invocation.command === 'version' ||
    hasBooleanFlagBeforeTerminator(argv, '--help', '-h') ||
    hasBooleanFlagBeforeTerminator(argv, '--version', '-v') ||
    hasLongOptionBeforeTerminator(argv, '--format') ||
    hasBooleanFlagBeforeTerminator(argv, '--yes', '-y')
  ) {
    return false;
  }

  if (
    invocation.command &&
    interactiveRuntimeCommandSet.has(invocation.command)
  ) {
    return true;
  }

  return (
    invocation.isSinglePositionalAlias &&
    interactiveRuntimeCommandSet.has('create')
  );
}
