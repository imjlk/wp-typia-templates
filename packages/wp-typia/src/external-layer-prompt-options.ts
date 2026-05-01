export type ExternalLayerSelectOption = {
  description?: string;
  extends: string[];
  id: string;
};

export function formatExternalLayerSelectHint(
  option: ExternalLayerSelectOption,
): string | undefined {
  const details = [
    option.description,
    option.extends.length > 0
      ? `extends ${option.extends.join(', ')}`
      : undefined,
  ].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  return details.length > 0 ? details.join(' · ') : undefined;
}

export function toExternalLayerPromptOptions(
  options: ExternalLayerSelectOption[],
) {
  return options.map((option) => ({
    hint: formatExternalLayerSelectHint(option),
    label: option.id,
    value: option.id,
  }));
}
