/** Gera dígitos verificadores de CPF (algoritmo oficial). */
function cpfCheckDigits(baseNine: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(baseNine[i]) * (10 - i);
  }
  let first = 11 - (sum % 11);
  if (first >= 10) first = 0;

  sum = 0;
  const ten = baseNine + String(first);
  for (let i = 0; i < 10; i++) {
    sum += Number(ten[i]) * (11 - i);
  }
  let second = 11 - (sum % 11);
  if (second >= 10) second = 0;

  return `${first}${second}`;
}

/**
 * Gera CPF válido (11 dígitos) derivado de uma semente estável (ex.: token).
 * Não é CPF real de pessoa — apenas passa validação de formato/checksum da API.
 */
export function generateValidCpf(seed?: string): string {
  const hash = (seed || "love365")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const base: number[] = [];
  for (let i = 0; i < 9; i++) {
    base.push(((hash + i * 17) % 9) + 1);
  }

  const baseStr = base.join("");
  const checks = cpfCheckDigits(baseStr);
  return `${baseStr}${checks}`;
}

/** Formata CPF ###.###.###-## */
export function formatCpfMasked(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length !== 11) {
    return formatCpfMasked(generateValidCpf());
  }
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function buildTaxIdForCustomer(seed?: string): {
  digits: string;
  masked: string;
} {
  const digits = generateValidCpf(seed);
  return {
    digits,
    masked: formatCpfMasked(digits),
  };
}
