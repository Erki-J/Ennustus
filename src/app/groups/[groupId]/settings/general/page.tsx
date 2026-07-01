import { notFound } from "next/navigation";
import { LocaleForm } from "@/components/settings/locale-form";
import { getSettingsLayoutContext } from "@/lib/settings/access";
import { isAppLocale } from "@/lib/settings/locale";

type SettingsGeneralPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsGeneralPage({ params }: SettingsGeneralPageProps) {
  const { groupId } = await params;
  const layoutContext = await getSettingsLayoutContext(groupId);

  if (!layoutContext) {
    notFound();
  }

  const locale = isAppLocale(layoutContext.profile.locale)
    ? layoutContext.profile.locale
    : "et";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-zinc-900">Üldine</h2>
      <p className="mt-1 text-sm text-zinc-600">Sinu isiklikud seaded.</p>
      <div className="mt-4">
        <LocaleForm locale={locale} />
      </div>
    </section>
  );
}
