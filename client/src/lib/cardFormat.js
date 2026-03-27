export function normalizeCardNumber(value = "") {
  return value.replace(/\D/g, "").slice(0, 19);
}

export function isAmexCardNumber(digits = "") {
  return /^3[47]/.test(digits);
}

export function formatCardNumberMasked(value = "") {
  const digits = normalizeCardNumber(value);

  if (isAmexCardNumber(digits)) {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }

  return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

export function monthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    return { value: month, label: month };
  });
}

export function yearOptions(start = new Date().getFullYear(), count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const year = String(start + i);
    return { value: year, label: year };
  });
}
