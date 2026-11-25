export const REPEAT_FREQUENCIES = [
  "everyday",
  "every_week",
  "every_weekday",
  "every_month",
  "every_year",
  "custom",
] as const;

export type RepeatFrequency = (typeof REPEAT_FREQUENCIES)[number];

export type RepeatRule = {
  enabled: boolean;
  frequency: RepeatFrequency;
  intervalDays?: number;
  weekdays?: number[]; // 0 = CN, 1 = T2 ... 6 = T7
};

export const REPEAT_PRESET_LABELS: Record<RepeatFrequency, string> = {
  everyday: "Hàng ngày (Everyday)",
  every_week: "Hàng tuần (Every week)",
  every_weekday: "Ngày làm việc T2–T6 (Every weekday)",
  every_month: "Hàng tháng (Every month)",
  every_year: "Hàng năm (Every year)",
  custom: "Tuỳ chỉnh (Custom)",
};

export const WEEKDAY_OPTIONS = [
  { day: 1, short: "T2", rrule: "MO" },
  { day: 2, short: "T3", rrule: "TU" },
  { day: 3, short: "T4", rrule: "WE" },
  { day: 4, short: "T5", rrule: "TH" },
  { day: 5, short: "T6", rrule: "FR" },
  { day: 6, short: "T7", rrule: "SA" },
  { day: 0, short: "CN", rrule: "SU" },
] as const;

const WEEKDAY_MAP = new Map<number, (typeof WEEKDAY_OPTIONS)[number]>(
  WEEKDAY_OPTIONS.map((item) => [item.day, item]),
);

export function isRepeatFrequency(value: unknown): value is RepeatFrequency {
  return (
    typeof value === "string" &&
    (REPEAT_FREQUENCIES as readonly string[]).includes(value)
  );
}

export function validateRepeatRule(
  raw: unknown,
): { ok: true; repeatRule: RepeatRule | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, repeatRule: null };
  }

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Cấu hình lặp lại không hợp lệ." };
    }
  }

  if (parsed === null) {
    return { ok: true, repeatRule: null };
  }

  if (typeof parsed !== "object") {
    return { ok: false, error: "Cấu hình lặp lại không hợp lệ." };
  }

  const candidate = parsed as Record<string, unknown>;
  const enabled = Boolean(candidate.enabled);
  if (!enabled) {
    return { ok: true, repeatRule: null };
  }

  if (!isRepeatFrequency(candidate.frequency)) {
    return { ok: false, error: "Tần suất lặp lại không hợp lệ." };
  }

  const rule: RepeatRule = {
    enabled: true,
    frequency: candidate.frequency,
  };

  if (candidate.frequency === "custom") {
    const rawInterval = candidate.intervalDays ?? 1;
    const interval = Number(rawInterval);
    if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
      return {
        ok: false,
        error: "Số ngày lặp lại phải là số nguyên từ 1 đến 365.",
      };
    }

    const weekdays: number[] = [];
    if (Array.isArray(candidate.weekdays)) {
      const seen = new Set<number>();
      for (const item of candidate.weekdays) {
        const dayNum = Number(item);
        if (!Number.isInteger(dayNum) || dayNum < 0 || dayNum > 6) {
          return { ok: false, error: "Ngày lặp lại trong tuần không hợp lệ." };
        }
        if (!seen.has(dayNum)) {
          seen.add(dayNum);
          weekdays.push(dayNum);
        }
      }
    }

    rule.intervalDays = interval;
    if (weekdays.length > 0) {
      rule.weekdays = weekdays;
    }
  }

  return { ok: true, repeatRule: rule };
}

export function formatRepeatSummaryVi(rule?: RepeatRule | null): string {
  if (!rule || !rule.enabled) return "";
  switch (rule.frequency) {
    case "everyday":
      return "Hàng ngày";
    case "every_week":
      return "Hàng tuần";
    case "every_weekday":
      return "Thứ 2 – Thứ 6";
    case "every_month":
      return "Hàng tháng";
    case "every_year":
      return "Hàng năm";
    case "custom": {
      const days = rule.intervalDays ?? 1;
      const dayLabels = (rule.weekdays ?? [])
        .map((d) => WEEKDAY_MAP.get(d)?.short)
        .filter((s): s is string => Boolean(s));
      const parts: string[] = [];
      if (days > 1 || dayLabels.length === 0) {
        parts.push(`Mỗi ${days} ngày`);
      }
      if (dayLabels.length > 0) {
        parts.push(dayLabels.join(", "));
      }
      return parts.join(" • ");
    }
  }
}

export function toGoogleCalendarRRule(rule?: RepeatRule | null): string | null {
  if (!rule || !rule.enabled) return null;
  switch (rule.frequency) {
    case "everyday":
      return "RRULE:FREQ=DAILY";
    case "every_week":
      return "RRULE:FREQ=WEEKLY";
    case "every_weekday":
      return "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
    case "every_month":
      return "RRULE:FREQ=MONTHLY";
    case "every_year":
      return "RRULE:FREQ=YEARLY";
    case "custom": {
      const days = Math.max(1, rule.intervalDays ?? 1);
      const byDay = (rule.weekdays ?? [])
        .map((d) => WEEKDAY_MAP.get(d)?.rrule)
        .filter((s): s is string => Boolean(s));
      if (byDay.length > 0 && days === 1) {
        return `RRULE:FREQ=WEEKLY;BYDAY=${byDay.join(",")}`;
      }
      return `RRULE:FREQ=DAILY;INTERVAL=${days}`;
    }
  }
}

function parseLocalDateKey(dateKey: string): Date | null {
  const parts = dateKey.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  const dt = new Date(y, m, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function doesRepeatOccurOnDate(
  startDateKey: string,
  targetDateKey: string,
  rule?: RepeatRule | null,
): boolean {
  if (!rule || !rule.enabled) {
    return startDateKey === targetDateKey;
  }
  const start = parseLocalDateKey(startDateKey);
  const target = parseLocalDateKey(targetDateKey);
  if (!start || !target) return startDateKey === targetDateKey;
  if (target.getTime() < start.getTime()) return false;
  if (startDateKey === targetDateKey) return true;

  switch (rule.frequency) {
    case "everyday":
      return true;
    case "every_week":
      return target.getDay() === start.getDay();
    case "every_weekday": {
      const dow = target.getDay();
      return dow >= 1 && dow <= 5;
    }
    case "every_month":
      return target.getDate() === start.getDate();
    case "every_year":
      return (
        target.getMonth() === start.getMonth() &&
        target.getDate() === start.getDate()
      );
    case "custom": {
      const interval = Math.max(1, rule.intervalDays ?? 1);
      const diffDays = Math.round(
        (target.getTime() - start.getTime()) / 86_400_000,
      );
      const weekdays = rule.weekdays ?? [];
      if (weekdays.length > 0 && !weekdays.includes(target.getDay())) {
        return false;
      }
      return diffDays % interval === 0;
    }
  }
}
