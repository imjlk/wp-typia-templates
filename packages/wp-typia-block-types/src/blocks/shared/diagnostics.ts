export type DiagnosticSeverity = "error" | "warning";

export interface DiagnosticWithMessage {
  readonly message: string;
  readonly severity: DiagnosticSeverity;
}

export function getDiagnosticSeverity(strict: boolean): DiagnosticSeverity {
  return strict ? "error" : "warning";
}

export function handleDiagnostics<TDiagnostic extends DiagnosticWithMessage>(
  diagnostics: readonly TDiagnostic[],
  onDiagnostic: ((diagnostic: TDiagnostic) => void) | undefined,
  options: {
    readonly failureHeading: string;
  },
): void {
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(
      [
        options.failureHeading,
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
