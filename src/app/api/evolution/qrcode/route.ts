import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

// GET /api/evolution/qrcode?instance=nome
// Retorna { base64, code, status }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get("instance");
  if (!instance)
    return NextResponse.json({ ok: false, erro: "instance obrigatório" }, { status: 400 });

  // 1. Estado da conexão
  let state = "unknown";
  try {
    const stateResp = await evolutionApi.get(`/instance/connectionState/${instance}`);
    state = stateResp.data?.instance?.state ?? stateResp.data?.state ?? "unknown";
  } catch {}

  if (state === "open") {
    return NextResponse.json({ ok: true, state: "connected", base64: null });
  }

  // 2. Busca QR
  try {
    const resp = await evolutionApi.get(`/instance/connect/${instance}`);
    const base64 = resp.data?.base64 ?? resp.data?.qrcode?.base64 ?? null;
    const code = resp.data?.code ?? resp.data?.qrcode?.code ?? null;
    return NextResponse.json({ ok: true, state, base64, code });
  } catch (e) {
    if (axios.isAxiosError(e))
      return NextResponse.json(
        { ok: false, state, erro: e.response?.data ?? e.message },
        { status: e.response?.status ?? 500 }
      );
    return NextResponse.json({ ok: false, state, erro: String(e) }, { status: 500 });
  }
}
