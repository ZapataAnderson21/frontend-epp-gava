const fieldLabels: Record<string, string> = {
  stockMinimum: "Stock minimo",
};

const validationTranslations: Array<[RegExp, string]> = [
  [
    /^stockMinimum must not be less than 0$/i,
    "El stock minimo no puede ser negativo. Puedes dejarlo en 0.",
  ],
  [
    /^stockMinimum must be a number conforming to the specified constraints$/i,
    "El stock minimo debe ser un numero valido. Puedes usar 0 si no deseas controlar un minimo.",
  ],
];

function translateValidationMessage(message: string) {
  const trimmed = message.trim();
  const translation = validationTranslations.find(([pattern]) => pattern.test(trimmed));

  if (translation) return translation[1];

  return Object.entries(fieldLabels).reduce(
    (current, [field, label]) => current.replace(new RegExp(field, "g"), label),
    trimmed,
  );
}

export default function formatApiErrorMessage(message: unknown, fallback = "Error en la solicitud") {
  if (Array.isArray(message)) {
    const translatedMessages = message
      .flatMap((item) => String(item).split(","))
      .map(translateValidationMessage)
      .filter(Boolean);

    return Array.from(new Set(translatedMessages)).join(" ") || fallback;
  }

  if (typeof message === "string") {
    return message
      .split(",")
      .map(translateValidationMessage)
      .filter(Boolean)
      .join(" ") || fallback;
  }

  if (message && typeof message === "object" && "message" in message) {
    return formatApiErrorMessage((message as { message: unknown }).message, fallback);
  }

  return fallback;
}
