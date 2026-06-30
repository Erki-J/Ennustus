"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  login,
  register,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = {};

type AuthFormProps = {
  mode: "login" | "register";
  redirectTo?: string;
  defaultEmail?: string;
  registerLink?: string;
  loginLink?: string;
};

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Palun oota…" : label}
    </button>
  );
}

export function AuthForm({
  mode,
  redirectTo = "/dashboard",
  defaultEmail = "",
  registerLink = "/register",
  loginLink = "/login",
}: AuthFormProps) {
  const action = mode === "login" ? login : register;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={redirectTo} />

      {mode === "register" && (
        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm font-medium">
            Nimi
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
            placeholder="Sinu nimi"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          readOnly={Boolean(defaultEmail)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2 read-only:bg-zinc-50"
          placeholder="sinu@email.ee"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Parool
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "register" ? 8 : undefined}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
        />
      </div>

      {mode === "register" && (
        <div>
          <label
            htmlFor="password_confirm"
            className="mb-1 block text-sm font-medium"
          >
            Korda parooli
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-600 focus:ring-2"
          />
        </div>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton
        label={mode === "login" ? "Logi sisse" : "Registreeru"}
        pending={pending}
      />

      <p className="text-center text-sm text-zinc-600">
        {mode === "login" ? (
          <>
            Pole kontot?{" "}
            <Link href={registerLink} className="font-medium text-emerald-700 hover:underline">
              Registreeru
            </Link>
          </>
        ) : (
          <>
            Juba registreeritud?{" "}
            <Link href={loginLink} className="font-medium text-emerald-700 hover:underline">
              Logi sisse
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
