import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { isValidCustomerDocument, isValidContactPhone } from "../shared/checkout";
import { parseStorefrontOrderNotes } from "../admin-floreria/client/src/features/orders/utils/order-notes";

const require = createRequire(import.meta.url);
const { buildStorefrontOrderDetails } = require("../admin-floreria/api/src/utils/storefrontOrderDetails.js");

test("document and phone formats accept local and international buyers", () => {
  assert.equal(isValidCustomerDocument("0912345678", "CEDULA"), true);
  assert.equal(isValidCustomerDocument("0912345678001", "RUC"), true);
  assert.equal(isValidCustomerDocument("AB123456", "PASAPORTE"), true);
  assert.equal(isValidCustomerDocument("123", "CEDULA"), false);
  assert.equal(isValidCustomerDocument("abcdefghij", "CEDULA"), false);
  assert.equal(isValidContactPhone("0991234567"), true);
  assert.equal(isValidContactPhone("+593 99 123 4567"), true);
  assert.equal(isValidContactPhone("not-a-number"), false);
  assert.equal(isValidContactPhone("123"), false);
});

test("buyer identity survives storage in order notes and parsing by the admin", () => {
  for (const [senderDocumentType, senderDocument] of [["CEDULA", "0912345678"], ["RUC", "0912345678001"], ["PASAPORTE", "AB123456"]]) {
    const details = buildStorefrontOrderDetails({ senderName: "Cliente de prueba", senderPhone: "0991234567", senderDocumentType, senderDocument, observations: "Llamar antes de entregar" });
    const admin = parseStorefrontOrderNotes(details.orderNotes);
    assert.equal(admin.senderDocument, senderDocument);
    assert.equal(admin.senderDocumentType, senderDocumentType);
    assert.equal(admin.senderPhone, "0991234567");
    assert.equal(admin.observations, "Llamar antes de entregar");
    assert.ok(!details.orderNotes.includes("Mensaje para tarjeta"));
  }
});

test("invalid document data is rejected; old orders remain readable", () => {
  assert.throws(() => buildStorefrontOrderDetails({ senderDocument: "12", senderDocumentType: "CEDULA" }), { statusCode: 400 });
  assert.throws(() => buildStorefrontOrderDetails({ senderDocument: "0912345678", senderDocumentType: "UNKNOWN" }), { statusCode: 400 });
  assert.equal(buildStorefrontOrderDetails({ senderName: "Pedido antiguo" }).senderDocument, null);
  assert.equal(parseStorefrontOrderNotes("Quién envía: Cliente anterior | Teléfono de quien envía: 0991234567").senderPhone, "0991234567");
});
