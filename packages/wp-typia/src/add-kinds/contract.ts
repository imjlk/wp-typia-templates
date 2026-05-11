import { readOptionalStrictStringFlag } from '../cli-string-flags';
import {
  createNamedExecutionPlan,
  defineAddKindRegistryEntry,
  NAME_TYPE_VISIBLE_FIELDS,
  requireAddKindName,
  type AddContractResult,
} from '../add-kind-registry-shared';

const CONTRACT_MISSING_NAME_MESSAGE =
  '`wp-typia add contract` requires <name>. Usage: wp-typia add contract <name> [--type <ExportedTypeName>].';

export const contractAddKindEntry =
  defineAddKindRegistryEntry<AddContractResult>({
    completion: {
      nextSteps: (values) => [
        `Edit ${values.typesFile} when the standalone wire shape changes.`,
        'Run `wp-typia sync-rest` or `wp-typia sync` to refresh the generated schema artifact.',
      ],
      summaryLines: (values, projectDir) => [
        `Contract: ${values.contractSlug}`,
        `Source type: ${values.sourceTypeName}`,
        `Schema: ${values.schemaFile}`,
        `Project directory: ${projectDir}`,
      ],
      title: 'Added standalone contract',
    },
    description: 'Add a standalone TypeScript schema contract',
    nameLabel: 'Contract name',
    async prepareExecution(context) {
      const name = requireAddKindName(context, CONTRACT_MISSING_NAME_MESSAGE);
      const typeName = readOptionalStrictStringFlag(context.flags, 'type');

      return createNamedExecutionPlan(context, {
        execute: ({ cwd, name }) =>
          context.addRuntime.runAddContractCommand({
            contractName: name,
            cwd,
            typeName,
          }),
        getValues: (result) => ({
          contractSlug: result.contractSlug,
          schemaFile: result.schemaFile,
          sourceTypeName: result.sourceTypeName,
          typesFile: result.typesFile,
        }),
        missingNameMessage: CONTRACT_MISSING_NAME_MESSAGE,
        name,
        warnLine: context.warnLine,
      });
    },
    sortOrder: 75,
    supportsDryRun: true,
    usage: 'wp-typia add contract <name> [--type <ExportedTypeName>] [--dry-run]',
    visibleFieldNames: () => NAME_TYPE_VISIBLE_FIELDS,
  });
