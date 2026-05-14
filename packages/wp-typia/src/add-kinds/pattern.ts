import {
  defineAddKindRegistryEntry,
  NAME_ONLY_VISIBLE_FIELDS,
  requireAddKindName,
  type AddPatternResult,
} from '../add-kind-registry-shared';

const PATTERN_MISSING_NAME_MESSAGE =
  '`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.';

export const patternAddKindEntry =
  defineAddKindRegistryEntry<AddPatternResult>({
    completion: {
      nextSteps: (values) => [
        `Review ${values.contentFile}.`,
        'Run your workspace build or dev command to verify the new pattern registration.',
      ],
      summaryLines: (values, projectDir) => [
        `Pattern: ${values.patternSlug}`,
        `Content file: ${values.contentFile}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added workspace pattern',
    },
    description: 'Add a PHP block pattern shell',
    hiddenStringSubmitFields: [
      'scope',
      'section-role',
      'tags',
      'thumbnail-url',
    ],
    nameLabel: 'Pattern name',
    async prepareExecution(context) {
      const name = requireAddKindName(context, PATTERN_MISSING_NAME_MESSAGE);
      const scope =
        typeof context.flags.scope === 'string'
          ? context.flags.scope
          : undefined;
      const sectionRole =
        typeof context.flags['section-role'] === 'string'
          ? context.flags['section-role']
          : undefined;
      const tags =
        typeof context.flags.tags === 'string' ? context.flags.tags : undefined;
      const thumbnailUrl =
        typeof context.flags['thumbnail-url'] === 'string'
          ? context.flags['thumbnail-url']
          : undefined;

      return {
        execute: (cwd) =>
          context.addRuntime.runAddPatternCommand({
            cwd,
            patternScope: scope,
            patternName: name,
            sectionRole,
            tags,
            thumbnailUrl,
          }),
        getValues: (result: AddPatternResult) => ({
          contentFile: result.contentFile,
          patternSlug: result.patternSlug,
          patternScope: result.patternScope,
          ...(result.sectionRole ? { sectionRole: result.sectionRole } : {}),
        }),
        warnLine: context.warnLine,
      };
    },
    sortOrder: 60,
    supportsDryRun: true,
    usage:
      'wp-typia add pattern <name> [--scope <full|section>] [--section-role <role>] [--tags <tag,...>] [--thumbnail-url <url>] [--dry-run]',
    visibleFieldNames: () => NAME_ONLY_VISIBLE_FIELDS,
  });
