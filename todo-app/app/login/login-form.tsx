"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "./actions";

const initialState: AuthState = {};

const inputClass =
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const buttonClass =
  "w-full rounded-md px-4 py-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );

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
          autoComplete="current-password"
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

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          name="intent"
          value="signin"
          disabled={pending}
          className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
        >
          Đăng nhập
        </button>
        <button
          type="submit"
          name="intent"
          value="signup"
          disabled={pending}
          className={`${buttonClass} border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50`}
        >
          Đăng ký
        </button>
      </div>
    </form>
  );
}
