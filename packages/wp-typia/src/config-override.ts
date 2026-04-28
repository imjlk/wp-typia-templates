import {
  buildCommandOptionParser,
  extractKnownOptionValuesFromArgv,
  GLOBAL_OPTION_METADATA,
} from './command-option-metadata';

const GLOBAL_OPTION_PARSER = buildCommandOptionParser(GLOBAL_OPTION_METADATA);

export function extractWpTypiaConfigOverride(argv: string[]): {
  argv: string[];
  configOverridePath?: string;
} {
  const { argv: nextArgv, flags } = extractKnownOptionValuesFromArgv(argv, {
    optionNames: ['config'],
    parser: GLOBAL_OPTION_PARSER,
  });

  return {
    argv: nextArgv,
    configOverridePath:
      typeof flags.config === 'string' ? flags.config : undefined,
  };
}
