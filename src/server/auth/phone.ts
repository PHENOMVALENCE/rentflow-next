export function normalizeTanzaniaPhone(value: string) {
  const digits = value.trim().replace(/[^0-9+]/g, "");
  let normalized = digits.replace(/^\+/, "");

  if (/^0\d{9}$/.test(normalized)) normalized = `255${normalized.slice(1)}`;
  if (/^\d{9}$/.test(normalized)) normalized = `255${normalized}`;

  if (!/^255\d{9}$/.test(normalized)) {
    throw new Error("Use a valid Tanzanian phone number.");
  }

  return normalized;
}

export function localTanzaniaPhone(value: string) {
  const normalized = normalizeTanzaniaPhone(value);
  return `0${normalized.slice(3)}`;
}

export function maskTanzaniaPhone(value: string) {
  const normalized = normalizeTanzaniaPhone(value);
  return `${normalized.slice(0, 5)}****${normalized.slice(-3)}`;
}
