import type { BlockAttributes } from "./registration.js";
import {
  DEFAULT_WORDPRESS_COMPATIBILITY_MIN_VERSION,
  evaluateWordPressBlockApiCompatibility,
  type WordPressBlockApiCompatibilityDiagnostic,
  type WordPressBlockApiCompatibilityEvaluation,
  type WordPressBlockApiCompatibilityFeature,
  type WordPressBlockApiCompatibilityManifest,
  type WordPressCompatibilitySettings,
  type WordPressVersion,
} from "./compatibility.js";

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

export interface CreatePhpBindingSourceRegistrationSourceOptions {
  readonly functionName?: string;
  readonly hook?: string;
  readonly includeOpeningTag?: boolean;
  readonly textDomain?: string;
}

export interface CreateEditorBindingSourceRegistrationSourceOptions {
  readonly functionName?: string;
  readonly importSource?: string;
}

const DEFINE_BINDING_SOURCE_INLINE_OPTION_KEYS = new Set<string>([
  "allowUnknownFutureKeys",
  "editor",
  "fieldsList",
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

const SOURCE_NAME_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/u;
const FIELD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/u;

function isObjectRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
    onDiagnostic: options.onDiagnostic ?? inlineOptions.onDiagnostic,
    strict,
  };
}

function getDiagnosticSeverity(strict: boolean): "error" | "warning" {
  return strict ? "error" : "warning";
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
): void {
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(
      [
        "WordPress block binding source check failed:",
        ...errors.map((diagnostic) => `- ${diagnostic.message}`),
      ].join("\n"),
    );
  }

  for (const diagnostic of diagnostics) {
    if (onDiagnostic) {
      onDiagnostic(diagnostic);
      continue;
    }

    console.warn(`[wp-typia] ${diagnostic.message}`);
  }
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

  handleBindingSourceDiagnostics(diagnostics, resolved.onDiagnostic);

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

function normalizeStaticRegistrationValue(value: unknown, path: string): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }
  if (typeof value === "function") {
    throw new Error(
      `Cannot generate static binding source registration code for function value at ${path}.`,
    );
  }
  if (typeof value === "bigint" || typeof value === "symbol") {
    throw new Error(
      `Cannot generate static binding source registration code for ${typeof value} value at ${path}.`,
    );
  }
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      normalizeStaticRegistrationValue(entry, `${path}[${index}]`),
    );
  }
  if (isObjectRecord(value)) {
    const normalized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const nextValue = normalizeStaticRegistrationValue(
        nestedValue,
        `${path}.${key}`,
      );

      if (nextValue !== undefined) {
        normalized[key] = nextValue;
      }
    }

    return normalized;
  }

  throw new Error(
    `Cannot generate static binding source registration code for unsupported value at ${path}.`,
  );
}

function getBindingEvaluation(
  metadata: DefinedBlockBindingSourceMetadata,
  feature: string,
): WordPressBlockApiCompatibilityEvaluation | undefined {
  return metadata.manifest.evaluations.find(
    (evaluation) =>
      evaluation.area === "blockBindings" && evaluation.feature === feature,
  );
}

function shouldGenerateFeature(
  metadata: DefinedBlockBindingSourceMetadata,
  feature: string,
): boolean {
  const evaluation = getBindingEvaluation(metadata, feature);

  return evaluation?.action === "generate";
}

function asSourceList(
  sources: DefinedBindingSource | readonly DefinedBindingSource[],
): readonly DefinedBindingSource[] {
  if (Array.isArray(sources)) {
    return sources;
  }

  return [sources as DefinedBindingSource];
}

function escapePhpSingleQuotedString(value: string): string {
  return value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'");
}

function phpString(value: string): string {
  return `'${escapePhpSingleQuotedString(value)}'`;
}

function phpStringArray(values: readonly string[]): string {
  return values.length === 0
    ? "array()"
    : `array( ${values.map((value) => phpString(value)).join(", ")} )`;
}

function sanitizePhpIdentifier(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9_]/gu, "_").replace(/_+/gu, "_");

  return /^[A-Za-z_]/u.test(sanitized) ? sanitized : `wp_typia_${sanitized}`;
}

function createPhpSourceProperties(
  source: DefinedBindingSource,
  options: CreatePhpBindingSourceRegistrationSourceOptions,
): string[] {
  const properties: string[] = [];

  if (source.label) {
    const label = options.textDomain
      ? `__( ${phpString(source.label)}, ${phpString(options.textDomain)} )`
      : phpString(source.label);
    properties.push(`'label' => ${label}`);
  }
  if (source.usesContext && source.usesContext.length > 0) {
    properties.push(`'uses_context' => ${phpStringArray(source.usesContext)}`);
  }
  if (source.getValueCallback) {
    properties.push(
      `'get_value_callback' => ${phpString(source.getValueCallback)}`,
    );
  }

  return properties;
}

function createPhpBindableAttributeFilterSource(
  entries: readonly BindingSourceRegistrationEntry[],
  functionName: string,
): string[] {
  const lines: string[] = [];
  const targets = entries.flatMap((entry) =>
    (entry.source.bindableAttributes ?? []).map((target, index) => ({
      index,
      metadata: entry.metadata,
      sourceName: entry.source.name,
      target,
    })),
  );

  if (targets.length === 0) {
    return lines;
  }

  lines.push("");
  lines.push("if ( function_exists( 'get_block_bindings_supported_attributes' ) ) {");
  for (const target of targets) {
    if (!shouldGenerateFeature(target.metadata, "supportedAttributesFilter")) {
      lines.push(
        `\t// block_bindings_supported_attributes requires WordPress 6.9+ for ${target.target.blockName}.`,
      );
      continue;
    }

    const callbackName = sanitizePhpIdentifier(
      `${functionName}_${target.sourceName}_${target.target.blockName}_${target.index}_supported_attributes`,
    );
    lines.push(
      `\tadd_filter( ${phpString(
        `block_bindings_supported_attributes_${target.target.blockName}`,
      )}, ${phpString(callbackName)} );`,
    );
    lines.push(`\tfunction ${callbackName}( $supported_attributes ) {`);
    lines.push(
      `\t\treturn array_values( array_unique( array_merge( $supported_attributes, ${phpStringArray(
        target.target.attributes,
      )} ) ) );`,
    );
    lines.push("\t}");
  }
  lines.push("}");

  return lines;
}

export function createPhpBindingSourceRegistrationSource(
  sources: DefinedBindingSource | readonly DefinedBindingSource[],
  options: CreatePhpBindingSourceRegistrationSourceOptions = {},
): string {
  const functionName =
    options.functionName ?? "wp_typia_register_block_binding_sources";
  const hook = options.hook ?? "init";
  const entries = createBindingSourceRegistrationPlan(asSourceList(sources));
  const lines: string[] = [];

  if (options.includeOpeningTag ?? false) {
    lines.push("<?php");
    lines.push("");
  }

  lines.push(`function ${functionName}() {`);
  lines.push("\tif ( ! function_exists( 'register_block_bindings_source' ) ) {");
  lines.push("\t\treturn;");
  lines.push("\t}");
  lines.push("");

  for (const entry of entries) {
    if (!shouldGenerateFeature(entry.metadata, "serverRegistration")) {
      lines.push(
        `\t// register_block_bindings_source() requires WordPress 6.5+ for ${entry.source.name}.`,
      );
      continue;
    }

    const properties = createPhpSourceProperties(entry.source, options);
    lines.push(`\tregister_block_bindings_source( ${phpString(entry.source.name)}, array(`);
    for (const property of properties) {
      lines.push(`\t\t${property},`);
    }
    lines.push("\t) );");
  }

  lines.push("}");
  lines.push(`add_action( ${phpString(hook)}, ${phpString(functionName)} );`);
  lines.push(
    ...createPhpBindableAttributeFilterSource(entries, functionName),
  );
  lines.push("");

  return lines.join("\n");
}

function createEditorRegistrationEntries(
  entries: readonly BindingSourceRegistrationEntry[],
): {
  readonly fields: Readonly<Record<string, readonly BindingSourceField[]>>;
  readonly sources: readonly unknown[];
  readonly skipped: readonly string[];
  readonly skippedFields: readonly string[];
} {
  const fields: Record<string, readonly BindingSourceField[]> = {};
  const skipped: string[] = [];
  const skippedFields: string[] = [];
  const sources: unknown[] = [];

  for (const entry of entries) {
    const editorEvaluation = getBindingEvaluation(
      entry.metadata,
      "editorRegistration",
    );

    if (editorEvaluation === undefined) {
      continue;
    }
    if (editorEvaluation.action !== "generate") {
      skipped.push(entry.source.name);
      continue;
    }

    sources.push(
      normalizeStaticRegistrationValue(
        {
          label: entry.source.label,
          name: entry.source.name,
          usesContext: entry.source.usesContext,
        },
        `sources.${entry.source.name}`,
      ),
    );

    if ((entry.source.fields?.length ?? 0) === 0) {
      continue;
    }
    if (!shouldGenerateFeature(entry.metadata, "editorFieldsList")) {
      skippedFields.push(entry.source.name);
      continue;
    }

    fields[entry.source.name] = normalizeStaticRegistrationValue(
      entry.source.fields,
      `fields.${entry.source.name}`,
    ) as readonly BindingSourceField[];
  }

  return {
    fields,
    skipped,
    skippedFields,
    sources,
  };
}

export function createEditorBindingSourceRegistrationSource(
  sources: DefinedBindingSource | readonly DefinedBindingSource[],
  options: CreateEditorBindingSourceRegistrationSourceOptions = {},
): string {
  const importSource = options.importSource ?? "@wordpress/blocks";
  const functionName = options.functionName ?? "registerWpTypiaBindingSources";
  const entries = createBindingSourceRegistrationPlan(asSourceList(sources));
  const registration = createEditorRegistrationEntries(entries);
  if (registration.sources.length === 0) {
    return [
      "// No editor block binding sources were generated.",
      ...(registration.skipped.length > 0
        ? [
            `// Skipped editor registration for ${registration.skipped.join(
              ", ",
            )}; registerBlockBindingsSource() requires WordPress 6.7+.`,
          ]
        : []),
      "",
    ].join("\n");
  }

  const serializedSources = JSON.stringify(registration.sources, null, 2);
  const serializedFields = JSON.stringify(registration.fields, null, 2);
  const hasGeneratedFields = Object.keys(registration.fields).length > 0;
  const lines = [
    `import { registerBlockBindingsSource } from ${JSON.stringify(importSource)};`,
    "",
    `const sources = ${serializedSources};`,
    ...(hasGeneratedFields ? [`const fieldsBySource = ${serializedFields};`] : []),
    "",
    `export function ${functionName}() {`,
    "  if (typeof registerBlockBindingsSource !== \"function\") {",
    "    return;",
    "  }",
    "  for (const source of sources) {",
    ...(hasGeneratedFields
      ? [
          "    const fields = fieldsBySource[source.name];",
          "    registerBlockBindingsSource({",
          "      ...source,",
          "      ...(fields ? { getFieldsList: () => fields } : {}),",
          "    });",
        ]
      : ["    registerBlockBindingsSource(source);"]),
    "  }",
    "}",
  ];

  if (registration.skipped.length > 0) {
    lines.push(
      "",
      `// Skipped editor registration for ${registration.skipped.join(
        ", ",
      )}; registerBlockBindingsSource() requires WordPress 6.7+.`,
    );
  }
  if (registration.skippedFields.length > 0) {
    lines.push(
      "",
      `// Skipped getFieldsList() for ${registration.skippedFields.join(
        ", ",
      )}; getFieldsList() requires WordPress 6.9+.`,
    );
  }
  lines.push("");

  return lines.join("\n");
}
