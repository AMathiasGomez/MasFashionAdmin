const DEFAULT_COUNTRY_CODE = '57';

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length > 10) {
    return digits;
  }

  return `${DEFAULT_COUNTRY_CODE}${digits}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
