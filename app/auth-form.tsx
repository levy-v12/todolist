"use client";

import { useActionState, type ReactNode } from "react";
import type { AuthState } from "./login/actions";

const initialState: AuthState = {};

const inputClass =
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export const authLinkClass =
  "rounded-sm font-medium text-blue-700 underline hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

// Form email + mật khẩu dùng chung; `action` là Server Action truyền từ trang.
export function AuthForm({
  action,
  submitLabel,
  passwordAutoComplete,
  children,
}: {
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-800">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="text-sm text-green-800">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>

      {children}
    </form>
  );
}
