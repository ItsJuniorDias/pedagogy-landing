// -----------------------------------------------------------------------------
// server-mercadopago/server.ts
//
// Entrypoint standalone. Só existe para rodar o plugin sozinho (dev local ou
// como serviço separado no Render). Se você já tem o backend Fastify de
// analytics, NÃO use este arquivo: registre o plugin lá dentro.
//
//   npm install
//   npm run dev      → http://localhost:3333
//   npm start        → produção (compila e roda)
// -----------------------------------------------------------------------------

import Fastify from "fastify";
import cors from "@fastify/cors";
import mercadopagoConversions from "./mercadopago-conversions.js";

const PORT = Number(process.env.PORT || 3333);

// Origens que podem chamar /api/lead e /api/checkout/attach.
// O webhook do MP e o GET de status não precisam de CORS, mas não atrapalha.
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS ||
  "https://pedagogy.com.br,https://www.pedagogy.com.br,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
        : undefined,
  },
  // Render/Cloudflare ficam na frente: sem isto, req.ip é o IP do proxy e a
  // EMQ cai (client_ip_address errado). O plugin já lê x-forwarded-for, mas
  // isto conserta o fallback.
  trustProxy: true,
});

await app.register(cors, {
  origin: (origin, cb) => {
    // Sem Origin = curl, webhook do MP, health check → libera.
    if (!origin) return cb(null, true);
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

await app.register(mercadopagoConversions);

// Health check — o Render usa pra saber se o serviço subiu.
app.get("/health", async () => ({
  ok: true,
  mp: Boolean(process.env.MP_ACCESS_TOKEN),
  capi: Boolean(process.env.META_CAPI_TOKEN),
  testEvent: process.env.META_TEST_EVENT_CODE || null,
}));

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  if (!process.env.MP_ACCESS_TOKEN) {
    app.log.warn(
      "MP_ACCESS_TOKEN ausente — /api/subscriptions/:id/status vai devolver 404 sempre.",
    );
  }
  if (!process.env.META_CAPI_TOKEN) {
    app.log.warn("META_CAPI_TOKEN ausente — nenhum evento sai para a CAPI.");
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
