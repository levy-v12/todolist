"use client";

import { useActionState } from "react";
import { addTodo, type AddTodoState } from "./actions";

const initialState: AddTodoState = { successCount: 0 };

export function TodoForm() {
  const [state, formAction, pending] = useActionState(addTodo, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="title" className="text-sm font-medium text-zinc-800">
        Công việc mới
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          // Đổi key sau mỗi lần thêm thành công để xoá ô nhập.
          key={state.successCount}
          id="title"
          name="title"
          type="text"
          defaultValue={state.title}
          autoComplete="off"
          aria-describedby={state.error ? "title-error" : undefined}
          className="block w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang thêm..." : "Thêm"}
        </button>
      </div>
      {state.error ? (
        <p id="title-error" role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
