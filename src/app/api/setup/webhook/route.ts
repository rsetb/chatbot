import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

// POST /api/setup/webhook
// Configura o webhook na Evolution API apontando para este chatbot
export async function POST(req: Request) {
  const instance = process.env.EVOLUTION_INSTANCE_NAME || "adc";
  const nextauthUrl = process.env.NEXTAUTH_URL || "";

  if (!nextauthUrl) {
    return NextResponse.json(
      { ok: false, erro: "NEXTAUTH_URL não configurado no ambiente" },
      { status: 500 }
    );
  }

  const webhookUrl = `${nextauthUrl}/api/webhooks/evolution`;

  try {
    const resp = await evolutionApi.post(`/webhook/set/${instance}`, {
      url: webhookUrl,
      enabled: true,
      webhookByEvents: false,
      webhookBase64: false,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED",
      ],
    });

    return NextResponse.json({ ok: true, webhookUrl, resposta: resp.data });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { ok: false, erro: error.response?.data ?? error.message, webhookUrl },
        { status: error.response?.status ?? 500 }
      );
    }
    return NextResponse.json({ ok: false, erro: String(error) }, { status: 500 });
  }
}

// GET /api/setup/webhook — consulta o webhook atual
export async function GET() {
  const instance = process.env.EVOLUTION_INSTANCE_NAME || "adc";
  try {
    const resp = await evolutionApi.get(`/webhook/find/${instance}`);
    return NextResponse.json({ ok: true, webhook: resp.data });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { ok: false, erro: error.response?.data ?? error.message },
        { status: error.response?.status ?? 500 }
      );
    }
    return NextResponse.json({ ok: false, erro: String(error) }, { status: 500 });
  }
}
