"use client";

import { useLocale, useTranslations } from "@/lib/i18n/provider";
import { translateTeamName } from "@/lib/i18n/teams";
import { teamOptionsWithCurrent } from "@/lib/bonus/team-options";

type BonusTeamSelectProps = {
  name: string;
  options: string[];
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

export function BonusTeamSelect({
  name,
  options,
  defaultValue,
  placeholder,
  className = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm",
  required = true,
}: BonusTeamSelectProps) {
  const t = useTranslations();
  const locale = useLocale();
  const displayOptions = teamOptionsWithCurrent(options, defaultValue);
  const selectPlaceholder = placeholder ?? t("bonus.selectTeam");

  if (displayOptions.length === 0) {
    return (
      <input
        name={name}
        type="text"
        defaultValue={defaultValue ?? ""}
        placeholder={t("bonus.teamPlaceholder")}
        required={required}
        className={className}
      />
    );
  }

  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      className={className}
    >
      <option value="">{selectPlaceholder}</option>
      {displayOptions.map((team) => (
        <option key={team} value={team}>
          {translateTeamName(team, locale)}
        </option>
      ))}
    </select>
  );
}
