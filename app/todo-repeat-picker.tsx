"use client";

import {
  REPEAT_FREQUENCIES,
  REPEAT_PRESET_LABELS,
  WEEKDAY_OPTIONS,
  formatRepeatSummaryVi,
  type RepeatFrequency,
  type RepeatRule,
} from "@/lib/repeat";
import { RefreshIcon } from "./icons";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export function TodoRepeatPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: RepeatRule | null;
  onChange: (next: RepeatRule | null) => void;
  disabled?: boolean;
}) {
  const enabled = Boolean(value?.enabled);
  const frequency: RepeatFrequency = value?.frequency ?? "everyday";
  const intervalDays = value?.intervalDays ?? 1;
  const weekdays = value?.weekdays ?? [];

  function handleToggle() {
    if (disabled) return;
    if (enabled) {
      onChange(null);
    } else {
      onChange({
        enabled: true,
        frequency: "everyday",
      });
    }
  }

  function handleFrequencyChange(nextFreq: RepeatFrequency) {
    if (nextFreq === "custom") {
      onChange({
        enabled: true,
        frequency: "custom",
        intervalDays: value?.intervalDays ?? 1,
        weekdays: value?.weekdays ?? [],
      });
    } else {
      onChange({
        enabled: true,
        frequency: nextFreq,
      });
    }
  }

  function handleIntervalChange(raw: string) {
    const parsed = Math.max(1, Math.min(365, Number(raw) || 1));
    onChange({
      enabled: true,
      frequency: "custom",
      intervalDays: parsed,
      weekdays,
    });
  }

  function handleToggleWeekday(day: number) {
    const exists = weekdays.includes(day);
    const nextDays = exists
      ? weekdays.filter((d) => d !== day)
      : [...weekdays, day];
    onChange({
      enabled: true,
      frequency: "custom",
      intervalDays,
      weekdays: nextDays,
    });
  }

  const summary = formatRepeatSummaryVi(value);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RefreshIcon className="size-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-800">
            Lặp lại (Repeat)
          </span>
          {summary ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              {summary}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Bật lặp lại task"
          disabled={disabled}
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
            enabled ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block size-4 transform rounded-full bg-white shadow-xs transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled ? (
        <div className="flex flex-col gap-2.5 border-t border-slate-200/80 pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {REPEAT_FREQUENCIES.map((freq) => {
              const active = frequency === freq;
              return (
                <button
                  key={freq}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => handleFrequencyChange(freq)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${focusRing} ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {REPEAT_PRESET_LABELS[freq]}
                </button>
              );
            })}
          </div>

          {frequency === "custom" ? (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="repeat-interval-days"
                  className="text-xs font-medium text-slate-700"
                >
                  Số ngày lặp lại
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Mỗi</span>
                  <input
                    id="repeat-interval-days"
                    type="number"
                    min={1}
                    max={365}
                    disabled={disabled}
                    value={intervalDays}
                    onChange={(event) =>
                      handleIntervalChange(event.target.value)
                    }
                    className={`w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-900 ${focusRing}`}
                  />
                  <span className="text-xs text-slate-500">ngày</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">
                  Ngày lặp lại trong tuần
                </span>
                <div
                  role="group"
                  aria-label="Chọn ngày lặp lại trong tuần"
                  className="flex flex-wrap gap-1"
                >
                  {WEEKDAY_OPTIONS.map((opt) => {
                    const selected = weekdays.includes(opt.day);
                    return (
                      <button
                        key={opt.day}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        onClick={() => handleToggleWeekday(opt.day)}
                        className={`size-8 rounded-lg border text-xs font-semibold transition-colors ${focusRing} ${
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {opt.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
