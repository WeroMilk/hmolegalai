/**
 * Genera iconos PWA con fondo blanco y logo centrado para "Añadir a pantalla principal".
 * El logo queda dentro del 80% del canvas (zona segura maskable) para que siempre se vea completo.
 * Ejecutar: node scripts/generate-pwa-icons.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const publicDir = path.join(__dirname, "..", "public");
const logoPath = path.join(publicDir, "logo.png");
const sizes = [192, 512];
const bgHex = "#ffffff";
const safeRatio = 0.8; // logo ocupa 80% del lado (zona segura para maskable)

async function generate() {
  try {
    const logo = sharp(logoPath);
    const meta = await logo.metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    for (const size of sizes) {
      const safeSize = Math.floor(size * safeRatio);
      const scale = Math.min(safeSize / w, safeSize / h);
      const scaledW = Math.round(w * scale);
      const scaledH = Math.round(h * scale);
      const x = Math.round((size - scaledW) / 2);
      const y = Math.round((size - scaledH) / 2);

      const resized = await logo
        .clone()
        .resize(scaledW, scaledH)
        .toBuffer();

      await sharp({
        create: {
          width: size,
          height: size,
          channels: 3,
          background: bgHex,
        },
      })
        .composite([{ input: resized, left: x, top: y }])
        .png()
        .toFile(path.join(publicDir, `icon-${size}.png`));

      console.log(`✓ icon-${size}.png generado`);
    }
    console.log("✓ Iconos PWA generados en public/");
  } catch (err) {
    console.error("Error generando iconos PWA:", err.message);
    process.exit(1);
  }
}

generate();
