import { AuthForm } from "@/components/auth-form";
import { getI18n } from "@/lib/i18n/server";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string; email?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { t } = await getI18n();
  const { next, email } = await searchParams;
  const redirectTo = next && next.startsWith("/") ? next : "/dashboard";
  const query = new URLSearchParams();
  if (next) {
    query.set("next", redirectTo);
  }
  if (email) {
    query.set("email", email);
  }
  const loginLink = query.toString()
    ? `/login?${query.toString()}`
    : "/login";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            {t("auth.tournamentHint")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            {t("auth.registerTitle")}
          </h1>
          {email && (
            <p className="mt-2 text-sm text-zinc-500">
              {t("auth.registerWithInvite", { email })}
            </p>
          )}
        </div>
        <AuthForm
          mode="register"
          redirectTo={redirectTo}
          defaultEmail={email ?? ""}
          loginLink={loginLink}
        />
      </div>
    </div>
  );
}
