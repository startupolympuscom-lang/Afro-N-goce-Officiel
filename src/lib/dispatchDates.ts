// Afro Dispatch works in local days (YYYY-MM-DD), while records store ISO timestamps in UTC.

export const localDay = (value: string | Date) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const todayLocal = () => localDay(new Date());

/** Timestamp for a record entered for `day`: now for today, midday for a past day. */
export const timestampForDay = (day: string) => (day === todayLocal() ? new Date() : new Date(`${day}T12:00:00`)).toISOString();

/** Check-ins keep both a UTC date and a timestamp: match the day on either. */
export const isPointageOn = (pointage: { date: string; timestamp?: string }, day: string) =>
  pointage.date === day || (!!pointage.timestamp && localDay(pointage.timestamp) === day);
