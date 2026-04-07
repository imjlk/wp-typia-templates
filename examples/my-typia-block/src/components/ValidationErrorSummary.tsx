import { __ } from "@wordpress/i18n";

interface ValidationErrorSummaryProps {
  errors: string[];
}

export function ValidationErrorSummary({
  errors,
}: ValidationErrorSummaryProps) {
  return (
    <>
      <p>
        <strong>{__("Validation Errors:", "my_typia_block")}</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: "1em" }}>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </>
  );
}
