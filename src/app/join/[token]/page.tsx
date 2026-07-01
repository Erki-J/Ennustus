import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinGroupForm } from "@/components/join-group-form";
import { getAuthUserEmail } from "@/lib/auth/get-auth-email";
import {
  getInvitationByToken,
  getInvitationHistoryOffer,
} from "@/lib/groups/queries";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const loggedInEmail = await getAuthUserEmail();
  const joinPath = `/join/${token}`;
  const authQuery = new URLSearchParams({
    next: joinPath,
    email: invitation.email,
  });
  const loginHref = `/login?${authQuery.toString()}`;
  const registerHref = `/register?${authQuery.toString()}`;

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isPending = invitation.status === "pending";
  const isRevoked = invitation.status === "revoked";
  const canJoin = isPending && !isExpired && !isRevoked;

  const historyOffer =
    loggedInEmail &&
    canJoin &&
    loggedInEmail.toLowerCase() === invitation.email.toLowerCase()
      ? await getInvitationHistoryOffer(token)
      : { hasHistory: false, historyNickname: null };

  function invalidInviteMessage() {
    if (isRevoked || isExpired) {
      return "See kutse on aegunud. Küsi adminilt uut kutset.";
    }
    return "See kutse on juba kasutatud.";
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Kutse ennustusgruppi
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            {invitation.group_name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{invitation.tournament_name}</p>
        </div>

        {!canJoin ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {invalidInviteMessage()}
          </p>
        ) : !loggedInEmail ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Kutse on saadetud aadressile{" "}
              <span className="font-medium">{invitation.email}</span>. Logi sisse
              või loo konto sama e-mailiga.
            </p>
            <Link
              href={registerHref}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Registreeru ja liitu
            </Link>
            <Link
              href={loginHref}
              className="btn-secondary flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium"
            >
              Logi sisse
            </Link>
          </div>
        ) : loggedInEmail.toLowerCase() !== invitation.email.toLowerCase() ? (
          <div className="space-y-3">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Oled sisse logitud kui {loggedInEmail}, aga kutse on saadetud
              aadressile {invitation.email}. Logi välja ja kasuta õige e-mailiga
              kontot.
            </p>
            <Link
              href={loginHref}
              className="block text-center text-sm font-medium text-emerald-700 hover:underline"
            >
              Logi sisse teise kontoga
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Enne ennustamist vali hüüdnimi, mida teised mängijad näevad.
            </p>
            <JoinGroupForm
              token={token}
              hasHistory={historyOffer.hasHistory}
              historyNickname={historyOffer.historyNickname}
            />
          </div>
        )}
      </div>
    </div>
  );
}
