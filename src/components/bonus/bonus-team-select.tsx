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
  placeholder = "Vali meeskond",
  className = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm",
  required = true,
}: BonusTeamSelectProps) {
  const displayOptions = teamOptionsWithCurrent(options, defaultValue);

  if (displayOptions.length === 0) {
    return (
      <input
        name={name}
        type="text"
        defaultValue={defaultValue ?? ""}
        placeholder="Meeskond"
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
      <option value="">{placeholder}</option>
      {displayOptions.map((team) => (
        <option key={team} value={team}>
          {team}
        </option>
      ))}
    </select>
  );
}
