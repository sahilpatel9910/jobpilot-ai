const DATE_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC"
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false
});

export function formatApplicationDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatApplicationDateTime(value: string) {
  return DATE_TIME_FORMATTER.format(new Date(value));
}
