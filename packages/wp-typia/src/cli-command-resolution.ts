import { findFirstPositional } from '../bin/argv-walker.js';
import { COMMAND_ROUTING_METADATA } from './command-option-metadata';

export function resolveEntrypointCliCommand(argv: string[]): string {
  return findFirstPositional(argv, COMMAND_ROUTING_METADATA) ?? 'wp-typia';
}
