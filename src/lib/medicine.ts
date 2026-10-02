export function getIndiaCalendarDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") => parts.find((item) => item.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) throw new Error("Could not determine the India calendar date.");
  return `${year}-${month}-${day}`;
}

export function isMedicineTakenToday(
  medicine: { taken: boolean; lastTakenDate: string | null },
  date = new Date()
): boolean {
  return medicine.taken && medicine.lastTakenDate === getIndiaCalendarDate(date);
}
