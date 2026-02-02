/**
 * Genera favicon.ico desde public/logo.png para Google y navegadores.
 * Ejecutar: node scripts/generate-favicon.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

const logoPath = path.join(__dirname, "..", "public", "logo.png");
const outputPath = path.join(__dirname, "..", "app", "favicon.ico");

async function generate() {
  try {
    // Redimensionar a 48x48 (tamaño recomendado por Google) para evitar errores de to-ico
    const resizedBuffer = await sharp(logoPath)
      .resize(48, 48)
      .png()
      .toBuffer();

    const icoBuffer = await toIco([resizedBuffer]);
    fs.writeFileSync(outputPath, icoBuffer);
    console.log("✓ favicon.ico generado correctamente en app/favicon.ico");
  } catch (err) {
    console.error("Error generando favicon:", err.message);
    process.exit(1);
  }
}

generate();
