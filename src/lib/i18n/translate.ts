import type { Messages, Translator } from "@/lib/i18n/types";

function resolveMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let value: unknown = messages;

  for (const part of parts) {
    if (typeof value !== "object" || value === null || !(part in value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }

  return typeof value === "string" ? value : undefined;
}

export function createTranslator(messages: Messages): Translator {
  return (key, params) => {
    const template = resolveMessage(messages, key) ?? key;

    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params[name] ?? `{${name}}`),
    );
  };
}
