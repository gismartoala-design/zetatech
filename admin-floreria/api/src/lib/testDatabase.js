const fs = require("fs");
const path = require("path");

const fixturePath = path.join(__dirname, "../../data/database.test.json");

function isEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.USE_TEST_DATABASE === "true";
}

function readDatabase() {
  if (!isEnabled()) return null;
  try {
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  } catch (error) {
    console.error("No se pudo leer la base JSON de pruebas:", error.message);
    return null;
  }
}

function findUserByEmail(email) {
  const database = readDatabase();
  return database?.users?.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

function findUserById(id) {
  const database = readDatabase();
  return database?.users?.find((user) => user.id === id) || null;
}

module.exports = { isEnabled, readDatabase, findUserByEmail, findUserById };
