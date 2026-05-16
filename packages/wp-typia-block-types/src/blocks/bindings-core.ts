import type { BlockAttributes } from "./registration.js";
import {
  DEFAULT_WORDPRESS_COMPATIBILITY_MIN_VERSION,
  evaluateWordPressBlockApiCompatibility,
  type WordPressBlockApiCompatibilityDiagnostic,
  type WordPressBlockApiCompatibilityFeature,
  type WordPressBlockApiCompatibilityManifest,
  type WordPressCompatibilitySettings,
  type WordPressVersion,
} from "./compatibility.js";
import {
  getDiagnosticSeverity,
  handleDiagnostics,
  type DiagnosticLogger,
} from "./shared/diagnostics.js";
import { isObjectRecord } from "./shared/object-utils.js";

export type BindingSourceName = `${string}/${string}`;

export type BindingSourceArgs = Readonly<Record<string, unknown>>;

export type BindingFieldType =
  | "array"
  | "boolean"
  | "integer"
  | "number"
  | "object"
  | "string";

export interface BindingSourceField<
  TArgs extends BindingSourceArgs = BindingSourceArgs,
> {
  readonly args?: TArgs;
  readonly label: string;
  readonly name: string;
  readonly type?: BindingFieldType;
}

export type BlockBindingAttributeName<
  TAttributes extends BlockAttributes = BlockAttributes,
> = Extract<Exclude<keyof TAttributes, "metadata">, string>;

export interface BindingSourceBindableAttributes<
  TAttributes extends BlockAttributes = BlockAttributes,
  TBlockName extends string = string,
  TAttributesList extends readonly BlockBindingAttributeName<TAttributes>[] = readonly BlockBindingAttributeName<TAttributes>[],
> {
  readonly attributes: TAttributesList;
  readonly blockName: TBlockName;
}

export interface BindingSourceDefinition<
  TName extends string = string,
  TArgs extends BindingSourceArgs = BindingSourceArgs,
  TFields extends readonly BindingSourceField[] = readonly BindingSourceField[],
> {
  readonly args?: TArgs;
  readonly bindableAttributes?: readonly BindingSourceBindableAttributes[];
  readonly fields?: TFields;
  readonly getValueCallback?: string;
  readonly label?: string;
  readonly name: TName;
  readonly usesContext?: readonly string[];
}

export interface BindingSourceVersionGates {
  readonly editor?: WordPressVersion;
  readonly fieldsList?: WordPressVersion;
  readonly server?: WordPressVersion;
  readonly supportedAttributesFilter?: WordPressVersion;
}

export interface DefineBindingSourceInlineOptions {
  readonly allowUnknownFutureKeys?: boolean;
  readonly editor?: boolean;
  readonly fieldsList?: boolean;
  readonly logger?: DiagnosticLogger<BindingSourceDiagnostic>;
  readonly minVersion?: WordPressVersion;
  readonly minWordPress?: WordPressVersion | BindingSourceVersionGates;
  readonly minWordPressEditor?: WordPressVersion;
  readonly minWordPressFieldsList?: WordPressVersion;
  readonly minWordPressServer?: WordPressVersion;
  readonly minWordPressSupportedAttributesFilter?: WordPressVersion;
  readonly onDiagnostic?: (diagnostic: BindingSourceDiagnostic) => void;
  readonly server?: boolean;
  readonly strict?: boolean;
  readonly supportedAttributesFilter?: boolean;
}

export interface DefineBindingSourceOptions extends WordPressCompatibilitySettings {
  readonly editor?: boolean;
  readonly fieldsList?: boolean;
  readonly logger?: DiagnosticLogger<BindingSourceDiagnostic>;
  readonly minWordPress?: WordPressVersion | BindingSourceVersionGates;
  readonly minWordPressEditor?: WordPressVersion;
  readonly minWordPressFieldsList?: WordPressVersion;
  readonly minWordPressServer?: WordPressVersion;
  readonly minWordPressSupportedAttributesFilter?: WordPressVersion;
  readonly onDiagnostic?: (diagnostic: BindingSourceDiagnostic) => void;
  readonly server?: boolean;
  readonly supportedAttributesFilter?: boolean;
}

export type StripDefineBindingSourceOptions<TSource> = Omit<
  TSource,
  keyof DefineBindingSourceInlineOptions
>;

export const DEFINED_BLOCK_BINDING_SOURCE_METADATA: unique symbol = Symbol.for(
  "@wp-typia/block-types/defined-binding-source",
) as never;

export type DefinedBlockBindingSourceMetadataKey =
  typeof DEFINED_BLOCK_BINDING_SOURCE_METADATA;

export interface DefinedBlockBindingSourceMetadata {
  readonly diagnostics: readonly BindingSourceDiagnostic[];
  readonly features: readonly WordPressBlockApiCompatibilityFeature[];
  readonly manifest: WordPressBlockApiCompatibilityManifest;
}

export type DefinedBindingSource<
  TName extends string = string,
  TArgs extends BindingSourceArgs = BindingSourceArgs,
  TFields extends readonly BindingSourceField[] = readonly BindingSourceField[],
  TSource extends BindingSourceDefinition = BindingSourceDefinition,
> = Readonly<StripDefineBindingSourceOptions<TSource>> & {
  readonly [DEFINED_BLOCK_BINDING_SOURCE_METADATA]?:
    | DefinedBlockBindingSourceMetadata
    | undefined;
  readonly __wpTypiaBindingSourceArgs?: TArgs;
  readonly __wpTypiaBindingSourceFields?: TFields;
  readonly name: TName;
};

export interface BlockBinding<
  TSourceName extends string = string,
  TArgs extends BindingSourceArgs = BindingSourceArgs,
> {
  readonly args?: TArgs;
  readonly source: TSourceName;
}

type BindingSourceInferredArgs<TSource> = TSource extends {
  readonly __wpTypiaBindingSourceArgs?: infer TArgs extends BindingSourceArgs;
}
  ? TArgs
  : BindingSourceArgs;

export type Binding<
  TSource extends DefinedBindingSource | string,
  TArgs extends BindingSourceArgs = BindingSourceInferredArgs<TSource>,
> = TSource extends DefinedBindingSource<infer TName, infer TSourceArgs>
  ? TArgs extends TSourceArgs
    ? BlockBinding<TName, TArgs>
    : never
  : TSource extends string
    ? BlockBinding<TSource, TArgs>
    : never;

export type BlockBindingMap<
  TAttributes extends BlockAttributes = BlockAttributes,
> = Readonly<
  Partial<Record<BlockBindingAttributeName<TAttributes>, BlockBinding>>
>;

export interface BlockMetadataBindings<
  TBindings extends Readonly<
    Record<string, BlockBinding | undefined>
  > = Readonly<Record<string, BlockBinding>>,
> {
  readonly bindings?: TBindings;
}

export type TypedBlockMetadataBindings<
  TAttributes extends BlockAttributes,
  TBindings extends BlockBindingMap<TAttributes> = BlockBindingMap<TAttributes>,
> = BlockMetadataBindings<TBindings>;

export type BindingSourceDiagnosticCode =
  | "duplicate-bindable-attribute"
  | "duplicate-field-name"
  | "fields-list-requires-editor"
  | "invalid-bindable-attribute"
  | "invalid-block-name"
  | "invalid-field-name"
  | "invalid-source-name"
  | "missing-php-callback";

export interface BindingSourceAuthoringDiagnostic {
  readonly attribute?: string | undefined;
  readonly blockName?: string | undefined;
  readonly code: BindingSourceDiagnosticCode;
  readonly fieldName?: string | undefined;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly sourceName: string;
}

export type BindingSourceDiagnostic =
  | BindingSourceAuthoringDiagnostic
  | WordPressBlockApiCompatibilityDiagnostic;

export interface BindingSourceRegistrationEntry {
  readonly metadata: DefinedBlockBindingSourceMetadata;
  readonly source: DefinedBindingSource;
}

const DEFINE_BINDING_SOURCE_INLINE_OPTION_KEYS = new Set<string>([
  "allowUnknownFutureKeys",
  "editor",
  "fieldsList",
  "logger",
  "minVersion",
  "minWordPress",
  "minWordPressEditor",
  "minWordPressFieldsList",
  "minWordPressServer",
  "minWordPressSupportedAttributesFilter",
  "onDiagnostic",
  "server",
  "strict",
  "supportedAttributesFilter",
]);

const SOURCE_NAME_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u;
const FIELD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/u;

function isBindingSourceVersionGates(
  value: WordPressVersion | BindingSourceVersionGates | undefined,
): value is BindingSourceVersionGates {
  return isObjectRecord(value);
}

function splitDefineBindingSourceInput<
  TSource extends BindingSourceDefinition & DefineBindingSourceInlineOptions,
>(source: TSource): {
  inlineOptions: DefineBindingSourceInlineOptions;
  source: StripDefineBindingSourceOptions<TSource> & BindingSourceDefinition;
} {
  const inlineOptions: DefineBindingSourceInlineOptions = {};
  const normalizedSource: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (DEFINE_BINDING_SOURCE_INLINE_OPTION_KEYS.has(key)) {
      Object.assign(inlineOptions, { [key]: value });
      continue;
    }

    normalizedSource[key] = value;
  }

  return {
    inlineOptions,
    source: normalizedSource as StripDefineBindingSourceOptions<TSource> &
      BindingSourceDefinition,
  };
}

function resolveMinWordPress(
  inlineOptions: DefineBindingSourceInlineOptions,
  options: DefineBindingSourceOptions,
): {
  compatibility: WordPressCompatibilitySettings;
  gates: BindingSourceVersionGates;
} {
  const optionMinWordPress = options.minWordPress;
  const inlineMinWordPress = inlineOptions.minWordPress;
  const optionGates = isBindingSourceVersionGates(optionMinWordPress)
    ? optionMinWordPress
    : {};
  const inlineGates = isBindingSourceVersionGates(inlineMinWordPress)
    ? inlineMinWordPress
    : {};
  const minVersion =
    options.minVersion ??
    (typeof optionMinWordPress === "string" ? optionMinWordPress : undefined) ??
    inlineOptions.minVersion ??
    (typeof inlineMinWordPress === "string" ? inlineMinWordPress : undefined);
  const compatibility: WordPressCompatibilitySettings = {
    strict: options.strict ?? inlineOptions.strict ?? true,
  };

  if (options.allowUnknownFutureKeys ?? inlineOptions.allowUnknownFutureKeys) {
    Object.assign(compatibility, {
      allowUnknownFutureKeys:
        options.allowUnknownFutureKeys ?? inlineOptions.allowUnknownFutureKeys,
    });
  }
  if (minVersion !== undefined) {
    Object.assign(compatibility, { minVersion });
  }

  const gates: BindingSourceVersionGates = {};
  const editor =
    options.minWordPressEditor ??
    optionGates.editor ??
    inlineOptions.minWordPressEditor ??
    inlineGates.editor;
  const fieldsList =
    options.minWordPressFieldsList ??
    optionGates.fieldsList ??
    inlineOptions.minWordPressFieldsList ??
    inlineGates.fieldsList;
  const server =
    options.minWordPressServer ??
    optionGates.server ??
    inlineOptions.minWordPressServer ??
    inlineGates.server;
  const supportedAttributesFilter =
    options.minWordPressSupportedAttributesFilter ??
    optionGates.supportedAttributesFilter ??
    inlineOptions.minWordPressSupportedAttributesFilter ??
    inlineGates.supportedAttributesFilter;

  if (editor !== undefined) {
    Object.assign(gates, { editor });
  }
  if (fieldsList !== undefined) {
    Object.assign(gates, { fieldsList });
  }
  if (server !== undefined) {
    Object.assign(gates, { server });
  }
  if (supportedAttributesFilter !== undefined) {
    Object.assign(gates, { supportedAttributesFilter });
  }

  return {
    compatibility,
    gates,
  };
}

function resolveDefineBindingSourceSettings(
  inlineOptions: DefineBindingSourceInlineOptions,
  options: DefineBindingSourceOptions,
  source: BindingSourceDefinition,
): {
  compatibility: WordPressCompatibilitySettings;
  features: {
    editor: boolean;
    fieldsList: boolean;
    metadata: boolean;
    server: boolean;
    supportedAttributesFilter: boolean;
  };
  gates: BindingSourceVersionGates;
  logger: DefineBindingSourceOptions["logger"];
  onDiagnostic: DefineBindingSourceOptions["onDiagnostic"];
  strict: boolean;
} {
  const { compatibility, gates } = resolveMinWordPress(inlineOptions, options);
  const strict = compatibility.strict ?? true;
  const hasFields = (source.fields?.length ?? 0) > 0;
  const hasBindableAttributes = (source.bindableAttributes?.length ?? 0) > 0;

  return {
    compatibility,
    features: {
      editor: options.editor ?? inlineOptions.editor ?? true,
      fieldsList: options.fieldsList ?? inlineOptions.fieldsList ?? hasFields,
      metadata: true,
      server: options.server ?? inlineOptions.server ?? true,
      supportedAttributesFilter:
        options.supportedAttributesFilter ??
        inlineOptions.supportedAttributesFilter ??
        hasBindableAttributes,
    },
    gates,
    logger: options.logger ?? inlineOptions.logger,
    onDiagnostic: options.onDiagnostic ?? inlineOptions.onDiagnostic,
    strict,
  };
}

function getFeatureMinVersion(
  feature: WordPressBlockApiCompatibilityFeature,
  fallback: WordPressVersion,
  gates: BindingSourceVersionGates,
): WordPressVersion {
  if (feature.area !== "blockBindings") {
    return fallback;
  }

  switch (feature.feature) {
    case "metadata.bindings":
    case "serverRegistration":
      return gates.server ?? fallback;
    case "editorFieldsList":
      return gates.fieldsList ?? fallback;
    case "editorRegistration":
    case "editorSourceLookup":
      return gates.editor ?? fallback;
    case "supportedAttributesFilter":
      return gates.supportedAttributesFilter ?? gates.fieldsList ?? fallback;
    default:
      return fallback;
  }
}

function createBindingCompatibilityManifest(
  features: readonly WordPressBlockApiCompatibilityFeature[],
  settings: WordPressCompatibilitySettings,
  gates: BindingSourceVersionGates,
): WordPressBlockApiCompatibilityManifest {
  const fallback =
    settings.minVersion ?? DEFAULT_WORDPRESS_COMPATIBILITY_MIN_VERSION;
  const strict = settings.strict ?? true;
  const allowUnknownFutureKeys = settings.allowUnknownFutureKeys ?? false;
  const evaluations = features.map((feature) =>
    evaluateWordPressBlockApiCompatibility(feature, {
      allowUnknownFutureKeys,
      minVersion: getFeatureMinVersion(feature, fallback, gates),
      strict,
    }),
  );
  const diagnostics = evaluations.flatMap((evaluation) =>
    evaluation.diagnostic ? [evaluation.diagnostic] : [],
  );

  return {
    allowUnknownFutureKeys,
    diagnostics,
    evaluations,
    minVersion: fallback,
    strict,
    supported: evaluations.filter(
      (evaluation) => evaluation.status === "supported",
    ),
    unknown: evaluations.filter((evaluation) => evaluation.status === "unknown"),
    unsupported: evaluations.filter(
      (evaluation) => evaluation.status === "unsupported",
    ),
  };
}

export function collectBindingSourceCompatibilityFeatures(
  settings: {
    readonly editor?: boolean;
    readonly fieldsList?: boolean;
    readonly metadata?: boolean;
    readonly server?: boolean;
    readonly supportedAttributesFilter?: boolean;
  } = {},
): readonly WordPressBlockApiCompatibilityFeature[] {
  const features: WordPressBlockApiCompatibilityFeature[] = [];

  if (settings.metadata ?? true) {
    features.push({
      area: "blockBindings",
      feature: "metadata.bindings",
    });
  }
  if (settings.server ?? true) {
    features.push({
      area: "blockBindings",
      feature: "serverRegistration",
    });
  }
  if (settings.editor ?? true) {
    features.push({
      area: "blockBindings",
      feature: "editorRegistration",
    });
  }
  if (settings.fieldsList ?? false) {
    features.push({
      area: "blockBindings",
      feature: "editorFieldsList",
    });
  }
  if (settings.supportedAttributesFilter ?? false) {
    features.push({
      area: "blockBindings",
      feature: "supportedAttributesFilter",
    });
  }

  return features;
}

export function createBindingSourceCompatibilityManifest(
  settings: DefineBindingSourceOptions = {},
): WordPressBlockApiCompatibilityManifest {
  const resolved = resolveDefineBindingSourceSettings({}, settings, {
    name: "wp-typia/binding-source",
  });

  return createBindingCompatibilityManifest(
    collectBindingSourceCompatibilityFeatures(resolved.features),
    resolved.compatibility,
    resolved.gates,
  );
}

function createBindingSourceDiagnostics(
  source: BindingSourceDefinition,
  options: {
    readonly editor: boolean;
    readonly fieldsList: boolean;
    readonly server: boolean;
    readonly strict: boolean;
  },
): readonly BindingSourceAuthoringDiagnostic[] {
  const diagnostics: BindingSourceAuthoringDiagnostic[] = [];
  const severity = getDiagnosticSeverity(options.strict);

  if (!SOURCE_NAME_PATTERN.test(source.name)) {
    diagnostics.push({
      code: "invalid-source-name",
      message: `Block binding source "${source.name}" must be lowercase and namespaced, such as "acme/profile-data".`,
      severity,
      sourceName: source.name,
    });
  }

  if (options.server && !source.getValueCallback) {
    diagnostics.push({
      code: "missing-php-callback",
      message: `Block binding source "${source.name}" needs getValueCallback when server registration is enabled.`,
      severity,
      sourceName: source.name,
    });
  }

  if (options.fieldsList && !options.editor) {
    diagnostics.push({
      code: "fields-list-requires-editor",
      message: `Block binding source "${source.name}" enables getFieldsList() without editor registration.`,
      severity,
      sourceName: source.name,
    });
  }

  const seenFields = new Set<string>();
  for (const field of source.fields ?? []) {
    if (!FIELD_NAME_PATTERN.test(field.name)) {
      diagnostics.push({
        code: "invalid-field-name",
        fieldName: field.name,
        message: `Block binding source "${source.name}" field "${field.name}" must be a stable identifier.`,
        severity,
        sourceName: source.name,
      });
    }
    if (seenFields.has(field.name)) {
      diagnostics.push({
        code: "duplicate-field-name",
        fieldName: field.name,
        message: `Block binding source "${source.name}" declares duplicate field "${field.name}".`,
        severity,
        sourceName: source.name,
      });
    }
    seenFields.add(field.name);
  }

  for (const target of source.bindableAttributes ?? []) {
    if (!SOURCE_NAME_PATTERN.test(target.blockName)) {
      diagnostics.push({
        blockName: target.blockName,
        code: "invalid-block-name",
        message: `Bindable attributes target "${target.blockName}" must be a lowercase namespaced block name.`,
        severity,
        sourceName: source.name,
      });
    }

    const seenAttributes = new Set<string>();
    for (const attribute of target.attributes) {
      if (!FIELD_NAME_PATTERN.test(attribute)) {
        diagnostics.push({
          attribute,
          blockName: target.blockName,
          code: "invalid-bindable-attribute",
          message: `Bindable attribute "${attribute}" for "${target.blockName}" must be a stable identifier.`,
          severity,
          sourceName: source.name,
        });
      }
      if (seenAttributes.has(attribute)) {
        diagnostics.push({
          attribute,
          blockName: target.blockName,
          code: "duplicate-bindable-attribute",
          message: `Bindable attribute "${attribute}" for "${target.blockName}" is declared more than once.`,
          severity,
          sourceName: source.name,
        });
      }
      seenAttributes.add(attribute);
    }
  }

  return diagnostics;
}

function handleBindingSourceDiagnostics(
  diagnostics: readonly BindingSourceDiagnostic[],
  onDiagnostic: DefineBindingSourceOptions["onDiagnostic"],
  logger: DefineBindingSourceOptions["logger"],
): void {
  handleDiagnostics(diagnostics, onDiagnostic, {
    failureHeading: "WordPress block binding source check failed:",
    logger,
  });
}

export function getDefinedBindingSourceMetadata(
  source: unknown,
): DefinedBlockBindingSourceMetadata | undefined {
  return isObjectRecord(source)
    ? (
        source as {
          readonly [DEFINED_BLOCK_BINDING_SOURCE_METADATA]?:
            | DefinedBlockBindingSourceMetadata
            | undefined;
        }
      )[DEFINED_BLOCK_BINDING_SOURCE_METADATA]
    : undefined;
}

export function getDefinedBindingSourceCompatibilityManifest(
  source: unknown,
): WordPressBlockApiCompatibilityManifest | undefined {
  return getDefinedBindingSourceMetadata(source)?.manifest;
}

export function defineBindingSource<
  const TSource extends BindingSourceDefinition &
    DefineBindingSourceInlineOptions,
>(
  source: TSource,
  options: DefineBindingSourceOptions = {},
): DefinedBindingSource<
  Extract<TSource["name"], string>,
  TSource extends { readonly args: infer TArgs extends BindingSourceArgs }
    ? TArgs
    : BindingSourceArgs,
  TSource extends { readonly fields: infer TFields extends readonly BindingSourceField[] }
    ? TFields
    : readonly BindingSourceField[],
  TSource
> {
  const { inlineOptions, source: normalizedSource } =
    splitDefineBindingSourceInput(source);
  const resolved = resolveDefineBindingSourceSettings(
    inlineOptions,
    options,
    normalizedSource,
  );
  const features = collectBindingSourceCompatibilityFeatures(resolved.features);
  const manifest = createBindingCompatibilityManifest(
    features,
    resolved.compatibility,
    resolved.gates,
  );
  const diagnostics = [
    ...manifest.diagnostics,
    ...createBindingSourceDiagnostics(normalizedSource, {
      editor: resolved.features.editor,
      fieldsList: resolved.features.fieldsList,
      server: resolved.features.server,
      strict: resolved.strict,
    }),
  ];

  handleBindingSourceDiagnostics(
    diagnostics,
    resolved.onDiagnostic,
    resolved.logger,
  );

  Object.defineProperty(
    normalizedSource,
    DEFINED_BLOCK_BINDING_SOURCE_METADATA,
    {
      configurable: false,
      enumerable: false,
      value: {
        diagnostics,
        features,
        manifest,
      } satisfies DefinedBlockBindingSourceMetadata,
      writable: false,
    },
  );

  return normalizedSource as DefinedBindingSource<
    Extract<TSource["name"], string>,
    TSource extends { readonly args: infer TArgs extends BindingSourceArgs }
      ? TArgs
      : BindingSourceArgs,
    TSource extends { readonly fields: infer TFields extends readonly BindingSourceField[] }
      ? TFields
      : readonly BindingSourceField[],
    TSource
  >;
}

export function defineBindableAttributes<
  TAttributes extends BlockAttributes = BlockAttributes,
  const TBlockName extends string = string,
  const TAttributesList extends readonly BlockBindingAttributeName<TAttributes>[] = readonly BlockBindingAttributeName<TAttributes>[],
>(
  blockName: TBlockName,
  attributes: TAttributesList,
): BindingSourceBindableAttributes<TAttributes, TBlockName, TAttributesList> {
  return {
    attributes,
    blockName,
  };
}

export function defineBlockMetadataBindings<
  const TBindings extends Readonly<Record<string, BlockBinding | undefined>>,
>(bindings: TBindings): BlockMetadataBindings<TBindings> {
  return { bindings };
}

export function defineTypedBlockMetadataBindings<
  TAttributes extends BlockAttributes,
  const TBindings extends BlockBindingMap<TAttributes> = BlockBindingMap<TAttributes>,
>(bindings: TBindings): TypedBlockMetadataBindings<TAttributes, TBindings> {
  return { bindings };
}

export function createBindingSourceRegistrationPlan(
  sources: readonly DefinedBindingSource[],
): readonly BindingSourceRegistrationEntry[] {
  return sources.map((source) => {
    const metadata = getDefinedBindingSourceMetadata(source);

    if (!metadata) {
      throw new Error(
        `Block binding source "${source.name}" was not created by defineBindingSource().`,
      );
    }

    return {
      metadata,
      source,
    };
  });
}
