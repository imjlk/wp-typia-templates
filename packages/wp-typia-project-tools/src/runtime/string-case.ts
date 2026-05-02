const COMMON_ACRONYM_PREFIXES = [
  'HTML',
  'HTTP',
  'JSON',
  'REST',
  'UUID',
  'API',
  'CSS',
  'CTA',
  'DOM',
  'PHP',
  'SQL',
  'SVG',
  'URL',
  'XML',
  'ID',
  'JS',
  'UI',
  'WP',
] as const;

const COMMON_ACRONYM_PREFIX_SET = new Set<string>(COMMON_ACRONYM_PREFIXES);

function capitalizeSegment(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function splitAcronymBoundary(value: string): string {
  return value.replace(/[A-Z]{2,}[a-z]+/g, (segment) => {
    for (const prefix of COMMON_ACRONYM_PREFIXES) {
      const suffix = segment.slice(prefix.length);
      if (segment.startsWith(prefix) && /^[A-Z][a-z]/.test(suffix)) {
        return `${prefix}-${suffix}`;
      }
    }

    const uppercaseRun = /^[A-Z]+/.exec(segment)?.[0] ?? '';
    if (
      uppercaseRun.length < 4 ||
      COMMON_ACRONYM_PREFIX_SET.has(uppercaseRun)
    ) {
      return segment;
    }

    return `${uppercaseRun.slice(0, -1)}-${uppercaseRun.slice(-1)}${segment.slice(
      uppercaseRun.length,
    )}`;
  });
}

/**
 * Normalize arbitrary text into a kebab-case identifier.
 * Acronym runs stay grouped, with a boundary before the next capitalized word.
 * Ambiguous acronym+lowercase inputs like `URLslug` intentionally stay as one
 * word because there is no PascalCase boundary marker before the lowercase
 * suffix.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A lowercase kebab-case string with collapsed separators.
 */
export function toKebabCase(input: string): string {
  return splitAcronymBoundary(input.trim())
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

/**
 * Normalize arbitrary text into a snake_case identifier.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A lowercase snake_case string derived from the kebab-case form.
 */
export function toSnakeCase(input: string): string {
  return toKebabCase(input).replace(/-/g, '_');
}

/**
 * Normalize arbitrary text into a PascalCase identifier.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A PascalCase string derived from the normalized kebab-case form.
 */
export function toPascalCase(input: string): string {
  return toKebabCase(input)
    .split('-')
    .filter(Boolean)
    .map(capitalizeSegment)
    .join('');
}

/**
 * Normalize arbitrary text into a camelCase identifier.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A camelCase string derived from the normalized PascalCase form.
 */
export function toCamelCase(input: string): string {
  const pascalCase = toPascalCase(input);
  return `${pascalCase.charAt(0).toLowerCase()}${pascalCase.slice(1)}`;
}

/**
 * Convert delimited text to PascalCase while preserving each segment's
 * existing internal casing.
 *
 * @param input Raw text split on non-alphanumeric boundaries.
 * @returns A PascalCase string that preserves acronyms inside segments.
 */
export function toSegmentPascalCase(input: string): string {
  return input
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalizeSegment)
    .join('');
}

/**
 * Normalize arbitrary text into a human-readable title.
 *
 * @param input Raw text that may contain spaces, punctuation, or camelCase.
 * @returns A title-cased string derived from the normalized kebab-case form.
 */
export function toTitleCase(input: string): string {
  return toKebabCase(input)
    .split('-')
    .filter(Boolean)
    .map(capitalizeSegment)
    .join(' ');
}
