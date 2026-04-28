export type ArgvWalkerMetadata = {
  longValueOptions: Iterable<string>;
  shortValueOptions: Iterable<string>;
};

export declare function collectPositionalIndexes(
  argv: string[],
  metadata: ArgvWalkerMetadata,
): number[];

export declare function findFirstPositionalIndex(
  argv: string[],
  metadata: ArgvWalkerMetadata,
): number;

export declare function findFirstPositional(
  argv: string[],
  metadata: ArgvWalkerMetadata,
): string | undefined;
