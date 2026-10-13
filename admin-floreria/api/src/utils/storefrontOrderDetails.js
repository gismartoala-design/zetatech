function clean(value) {
  const text = String(value || "").trim();
  return text || null;
}

function buildStorefrontOrderDetails(payload = {}) {
  const senderName = clean(payload.senderName);
  const senderEmail = clean(payload.senderEmail);
  const senderPhone = clean(payload.senderPhone || payload.phone);
  const senderDocument = clean(payload.senderDocument)?.toUpperCase() || null;
  const senderDocumentType = senderDocument ? clean(payload.senderDocumentType) || "CEDULA" : null;
  // Older checkout sessions may not include a document. Validate new data
  // without invalidating existing orders or pending payment callbacks.
  if (senderDocument) {
    const formats = { CEDULA: /^\d{10}$/, RUC: /^\d{13}$/, PASAPORTE: /^[A-Z0-9-]{5,20}$/ };
    if (!Object.hasOwn(formats, senderDocumentType) || !formats[senderDocumentType].test(senderDocument)) {
      const error = new Error("Revisa el documento del comprador.");
      error.statusCode = 400;
      throw error;
    }
  }
  const receiverName = clean(payload.receiverName);
  const receiverPhone = clean(payload.receiverPhone);
  const exactAddress = clean(payload.exactAddress || payload.sector);
  const deliveryDateTime = clean(payload.deliveryDateTime);
  const cardMessage = clean(payload.cardMessage);
  const observations = clean(payload.observations);
  const paymentMethod = clean(payload.paymentMethod || payload.paymentLabel);

  const noteRows = [
    ["Quién envía", senderName],
    ["Tipo de documento", senderDocumentType],
    ["Documento del comprador", senderDocument],
    ["Correo de quien envía", senderEmail],
    ["Teléfono de quien envía", senderPhone],
    ["Quién recibe", receiverName],
    ["Teléfono de quien recibe", receiverPhone],
    ["Dirección exacta", exactAddress],
    ["Hora de entrega", deliveryDateTime],
    ["Mensaje para tarjeta", cardMessage],
    ["Observaciones", observations],
    ["Método de pago", paymentMethod],
  ].filter(([, value]) => value);

  return {
    senderName,
    senderEmail,
    senderPhone,
    senderDocument,
    senderDocumentType,
    receiverName,
    receiverPhone,
    exactAddress,
    deliveryDateTime,
    cardMessage,
    observations,
    paymentMethod,
    orderNotes: noteRows.map(([label, value]) => `${label}: ${value}`).join(" | "),
  };
}

module.exports = {
  buildStorefrontOrderDetails,
};
