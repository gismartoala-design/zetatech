export function normalizeNoteLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseStorefrontOrderNotes(notes?: string | null) {
  const details: Record<string, string> = {};
  if (!notes) return details;

  notes.split("|").forEach((part) => {
    const [rawLabel, ...valueParts] = part.split(":");
    const value = valueParts.join(":").trim();
    if (!rawLabel || !value) return;

    const label = normalizeNoteLabel(rawLabel);
    const keyByLabel: Record<string, string> = {
      "quien envia": "senderName",
      envia: "senderName",
      "correo de quien envia": "senderEmail",
      "telefono de quien envia": "senderPhone",
      "quien recibe": "receiverName",
      recibe: "receiverName",
      "telefono de quien recibe": "receiverPhone",
      "direccion exacta": "exactAddress",
      sector: "exactAddress",
      "hora de entrega": "deliveryDateTime",
      "fecha entrega": "deliveryDateTime",
      "mensaje para tarjeta": "cardMessage",
      observaciones: "observations",
      "metodo de pago": "paymentMethod",
      "metodo pago": "paymentMethod",
      "comprobante url": "paymentProofImageUrl",
      "comprobante archivo": "paymentProofFileName",
      cupon: "coupon",
    };

    const key = keyByLabel[label];
    if (key) details[key] = value;
  });

  return details;
}

