import { useEffect, useState } from "react";

function parseScheduleDateTime(date: string, time: string): Date | null {
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const dt = new Date(`${date}T${time}:00+07:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function isAgendaItemLive(
  date: string,
  timeStart: string,
  timeEnd: string,
  now: Date
): boolean {
  const start = parseScheduleDateTime(date, timeStart);
  if (!start || now < start) return false;

  const end = parseScheduleDateTime(date, timeEnd);
  if (end && now > end) return false;

  return true;
}

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
