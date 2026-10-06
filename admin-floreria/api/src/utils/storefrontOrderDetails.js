function clean(value) {
  const text = String(value || "").trim();
  return text || null;
}

function buildStorefrontOrderDetails(payload = {}) {
  const senderName = clean(payload.senderName);
  const senderEmail = clean(payload.senderEmail);
  const senderPhone = clean(payload.senderPhone || payload.phone);
  const receiverName = clean(payload.receiverName);
  const receiverPhone = clean(payload.receiverPhone);
  const exactAddress = clean(payload.exactAddress || payload.sector);
  const deliveryDateTime = clean(payload.deliveryDateTime);
  const cardMessage = clean(payload.cardMessage);
  const observations = clean(payload.observations);
  const paymentMethod = clean(payload.paymentMethod || payload.paymentLabel);

  const noteRows = [
    ["Quién envía", senderName],
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
