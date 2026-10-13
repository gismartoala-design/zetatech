export type CustomerDocumentType = "CEDULA" | "RUC" | "PASAPORTE";

export function isValidCustomerDocument(value: string, type: CustomerDocumentType) {
  const document = value.trim().toUpperCase();
  if (type === "CEDULA") return /^\d{10}$/.test(document);
  if (type === "RUC") return /^\d{13}$/.test(document);
  return /^[A-Z0-9-]{5,20}$/.test(document);
}

export function isValidContactPhone(value: string) {
  return /^\+?[\d\s().-]+$/.test(value.trim()) && /^\d{7,15}$/.test(value.replace(/\D/g, ""));
}
