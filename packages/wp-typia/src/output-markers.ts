export type OutputMarkerKind = 'dryRun' | 'progress' | 'success' | 'warning';

export type OutputMarkerOptions = {
  env?: NodeJS.ProcessEnv;
  forceAscii?: boolean;
  term?: string | undefined;
};

const UNICODE_OUTPUT_MARKERS: Record<OutputMarkerKind, string> = {
  dryRun: '🧪',
  progress: '⏳',
  success: '✅',
  warning: '⚠️',
};

const ASCII_OUTPUT_MARKERS: Record<OutputMarkerKind, string> = {
  dryRun: '[dry-run]',
  progress: '[...]',
  success: '[ok]',
  warning: '[!]',
};

const ASCII_ENV_TRUTHY_VALUES = new Set(['1', 'on', 'true', 'yes']);
const ASCII_ENV_FALSY_VALUES = new Set(['0', 'off', 'false', 'no']);

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readAsciiPreferenceFromEnv(
  env: NodeJS.ProcessEnv,
): boolean | undefined {
  const rawValue = env.WP_TYPIA_ASCII;
  if (typeof rawValue !== 'string') {
    return undefined;
  }

  const normalizedValue = rawValue.trim().toLowerCase();
  if (ASCII_ENV_TRUTHY_VALUES.has(normalizedValue)) {
    return true;
  }
  if (ASCII_ENV_FALSY_VALUES.has(normalizedValue)) {
    return false;
  }

  return undefined;
}

function hasNoColorPreference(env: NodeJS.ProcessEnv): boolean {
  return typeof env.NO_COLOR === 'string';
}

export function prefersAsciiOutput(options: OutputMarkerOptions = {}): boolean {
  if (options.forceAscii) {
    return true;
  }

  const env = options.env ?? process.env;
  const envPreference = readAsciiPreferenceFromEnv(env);
  if (envPreference !== undefined) {
    return envPreference;
  }
  if (hasNoColorPreference(env)) {
    return true;
  }

  const term = options.term ?? env.TERM;
  if (term === 'dumb') {
    return true;
  }

  const locale = (env.LC_ALL ?? env.LC_CTYPE ?? env.LANG ?? '').toUpperCase();
  if (locale.includes('UTF-8') || locale.includes('UTF8')) {
    return false;
  }
  if (locale === 'C' || locale === 'POSIX') {
    return true;
  }
  if (
    locale.includes('ASCII') ||
    locale.includes('ANSI_X3') ||
    locale.includes('8859')
  ) {
    return true;
  }

  return false;
}

export function getOutputMarker(
  kind: OutputMarkerKind,
  options: OutputMarkerOptions = {},
): string {
  return prefersAsciiOutput(options)
    ? ASCII_OUTPUT_MARKERS[kind]
    : UNICODE_OUTPUT_MARKERS[kind];
}

export function formatOutputMarker(
  kind: OutputMarkerKind,
  text: string,
  options: OutputMarkerOptions = {},
): string {
  return `${getOutputMarker(kind, options)} ${text}`;
}

export function stripLeadingOutputMarker(
  text: string,
  kind?: OutputMarkerKind,
): string {
  const markers = kind
    ? [UNICODE_OUTPUT_MARKERS[kind], ASCII_OUTPUT_MARKERS[kind]]
    : Array.from(
        new Set([
          ...Object.values(UNICODE_OUTPUT_MARKERS),
          ...Object.values(ASCII_OUTPUT_MARKERS),
        ]),
      );
  const markerPattern = markers.map((marker) => escapeRegExp(marker)).join('|');

  return text.replace(new RegExp(`^(?:${markerPattern})\\s*`, 'u'), '');
}
