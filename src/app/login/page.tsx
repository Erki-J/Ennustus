import { AuthForm } from "@/components/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; email?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, email } = await searchParams;
  const redirectTo = next && next.startsWith("/") ? next : "/dashboard";
  const query = new URLSearchParams();
  if (next) {
    query.set("next", redirectTo);
  }
  if (email) {
    query.set("email", email);
  }
  const registerLink = query.toString()
    ? `/register?${query.toString()}`
    : "/register";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            MM / EM ennustus
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Logi sisse</h1>
          {email && (
            <p className="mt-2 text-sm text-zinc-500">
              Kutse on saadetud aadressile: {email}
            </p>
          )}
        </div>
        <AuthForm
          mode="login"
          redirectTo={redirectTo}
          defaultEmail={email ?? ""}
          registerLink={registerLink}
        />
      </div>
    </div>
  );
}
