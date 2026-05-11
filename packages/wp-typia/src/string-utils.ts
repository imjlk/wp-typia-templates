export function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
