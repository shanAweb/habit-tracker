export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function prettyToday() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}
