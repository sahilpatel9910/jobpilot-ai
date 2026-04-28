export const MAX_RESUME_CHARACTERS = 30000;
export const MAX_JOB_DESCRIPTION_CHARACTERS = 30000;
export const MAX_TITLE_CHARACTERS = 160;
export const MAX_COMPANY_CHARACTERS = 120;
export const MAX_URL_CHARACTERS = 500;

export type SanitizedField = {
  value: string;
  wasTrimmed: boolean;
  removedMarkup: boolean;
  lengthExceeded: boolean;
};

export function sanitizeTextField(value: unknown, maxLength: number): SanitizedField {
  const raw = typeof value === "string" ? value : "";
  const withoutDangerousBlocks = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withoutTags = withoutDangerousBlocks.replace(/<\/?[^>]+>/g, " ");
  const normalized = withoutTags
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    value: normalized,
    wasTrimmed: raw !== normalized,
    removedMarkup: raw !== withoutTags,
    lengthExceeded: normalized.length > maxLength
  };
}

export function sanitizeSingleLineField(value: unknown, maxLength: number) {
  const sanitized = sanitizeTextField(value, maxLength);

  return {
    ...sanitized,
    value: sanitized.value.replace(/\s+/g, " ").slice(0, maxLength)
  };
}

