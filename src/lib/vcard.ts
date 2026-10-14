export type FormatMode = "original" | "lk" | "custom";
export type Separator = "_" | "-" | " ";
export type Status = "valid" | "invalid" | "duplicate";

export interface Options {
  prefix: string;
  counter: boolean;
  startIndex: number;
  separator: Separator;
  pad: number; // 0 = no padding
  mode: FormatMode;
  countryCode: string;
  dedupe: boolean;
}

export interface Row {
  index: number;
  name: string;
  original: string;
  phone: string;
  status: Status;
}

export interface Result {
  rows: Row[];
  stats: { total: number; valid: number; invalid: number; duplicates: number };
  vcf: string;
}

/** Pull the most phone-like cell out of a messy line (CSV, TSV, quotes). */
export function extractCandidate(line: string): string {
  const trimmed = line.trim();
  if (!/[,\t;]/.test(trimmed)) return trimmed.replace(/["']/g, "");
  const cells = trimmed.split(/[,\t;]/).map((c) => c.replace(/["']/g, "").trim());
  let best = "";
  let bestDigits = 0;
  for (const c of cells) {
    const d = c.replace(/\D/g, "").length;
    if (d > bestDigits && d >= 7) {
      best = c;
      bestDigits = d;
    }
  }
  return best || cells.find((c) => c.length > 0) || "";
}

export function sanitize(raw: string): string {
  const t = raw.trim();
  const plus = t.startsWith("+");
  const digits = t.replace(/\D/g, "");
  return plus && digits ? `+${digits}` : digits;
}

export function formatNumber(clean: string, mode: FormatMode, countryCode = ""): string {
  if (!clean) return clean;
  if (mode === "original") return clean;
  if (clean.startsWith("+")) return clean;
  if (mode === "lk") {
    if (/^0\d{9}$/.test(clean)) return `+94${clean.slice(1)}`;
    if (/^94\d{9}$/.test(clean)) return `+${clean}`;
    if (/^7\d{8}$/.test(clean)) return `+94${clean}`;
    return clean;
  }
  const cc = countryCode.replace(/\D/g, "");
  if (!cc) return clean;
  if (clean.startsWith(cc) && clean.length > 10) return `+${clean}`;
  return `+${cc}${clean.replace(/^0+/, "")}`;
}

export function isValidLength(phone: string): boolean {
  const n = phone.replace(/\D/g, "").length;
  return n >= 9 && n <= 15;
}

export function buildName(o: Pick<Options, "prefix" | "counter" | "startIndex" | "separator" | "pad">, i: number): string {
  const base = o.prefix.trim() || "Contact";
  if (!o.counter) return base;
  const n = String(o.startIndex + i);
  const num = o.pad > 0 ? n.padStart(o.pad, "0") : n;
  const sep = o.separator === "-" ? " - " : o.separator;
  return `${base}${sep}${num}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function buildVCard(name: string, phone: string): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(name)}`,
    `N:;${esc(name)};;;`,
    `TEL;TYPE=CELL:${phone}`,
    "END:VCARD",
  ].join("\r\n");
}

export function processInput(text: string, o: Options): Result {
  const lines = text.split(/\r?\n/);
  const rows: Row[] = [];
  const seen = new Set<string>();
  let valid = 0, invalid = 0, duplicates = 0;
  const cards: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const original = extractCandidate(line);
    const phone = formatNumber(sanitize(original), o.mode, o.countryCode);
    let status: Status;
    let name = "";
    if (!isValidLength(phone)) {
      status = "invalid";
      invalid++;
    } else if (o.dedupe && seen.has(phone)) {
      status = "duplicate";
      duplicates++;
    } else {
      seen.add(phone);
      status = "valid";
      name = buildName(o, valid);
      valid++;
      cards.push(buildVCard(name, phone));
    }
    rows.push({ index: rows.length + 1, name, original: line.trim(), phone, status });
  }
  return {
    rows,
    stats: { total: rows.length, valid, invalid, duplicates },
    vcf: cards.length ? cards.join("\r\n") + "\r\n" : "",
  };
}
