function normalizeOptionSet(values) {
  return values instanceof Set ? values : new Set(values);
}

export function collectPositionalIndexes(argv, metadata) {
  const longValueOptionSet = normalizeOptionSet(metadata.longValueOptions);
  const shortValueOptionSet = normalizeOptionSet(metadata.shortValueOptions);
  const positionalIndexes = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      for (let restIndex = index + 1; restIndex < argv.length; restIndex += 1) {
        positionalIndexes.push(restIndex);
      }
      break;
    }
    if (!arg.startsWith('-') || arg === '-') {
      positionalIndexes.push(index);
      continue;
    }
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        continue;
      }
      const next = argv[index + 1];
      if (longValueOptionSet.has(arg) && next && !next.startsWith('-')) {
        index += 1;
      }
      continue;
    }
    if (
      arg.length === 2 &&
      shortValueOptionSet.has(arg) &&
      argv[index + 1] &&
      !argv[index + 1].startsWith('-')
    ) {
      index += 1;
    }
  }

  return positionalIndexes;
}

export function findFirstPositionalIndex(argv, metadata) {
  const positionalIndexes = collectPositionalIndexes(argv, metadata);
  return positionalIndexes[0] ?? -1;
}

export function findFirstPositional(argv, metadata) {
  const firstPositionalIndex = findFirstPositionalIndex(argv, metadata);
  return firstPositionalIndex === -1 ? undefined : argv[firstPositionalIndex];
}
