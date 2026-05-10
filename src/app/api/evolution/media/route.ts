import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

// POST /api/evolution/media
// Body: { instance, message }  — message é o objeto WAMessage completo
export async function POST(req: Request) {
  try {
    const { instance, message } = await req.json();
    if (!instance || !message)
      return NextResponse.json({ ok: false, erro: "instance e message obrigatórios" }, { status: 400 });

    const resp = await evolutionApi.post(`/chat/getBase64FromMediaMessage/${instance}`, {
      message,
      convertToMp4: false,
    });

    const base64: string | undefined = resp.data?.base64;
    const mimetype: string = resp.data?.mimetype || "application/octet-stream";

    if (!base64)
      return NextResponse.json({ ok: false, erro: "sem base64 na resposta" }, { status: 404 });

    return NextResponse.json({ ok: true, base64, mimetype, dataUrl: `data:${mimetype};base64,${base64}` });
  } catch (e) {
    if (axios.isAxiosError(e))
      return NextResponse.json({ ok: false, erro: e.response?.data ?? e.message }, { status: 500 });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
