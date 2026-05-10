import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

type Body = {
  instance: string;
  remoteJid: string;
  base64: string;
  mimetype: string;
  fileName?: string;
  caption?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const { instance, remoteJid, base64, mimetype, fileName, caption } = body;

    if (!instance || !remoteJid || !base64 || !mimetype)
      return NextResponse.json(
        { ok: false, erro: "instance, remoteJid, base64, mimetype obrigatórios" },
        { status: 400 }
      );

    let mediatype = "document";
    if (mimetype.startsWith("image/")) mediatype = "image";
    else if (mimetype.startsWith("video/")) mediatype = "video";
    else if (mimetype.startsWith("audio/")) mediatype = "audio";

    let data;
    if (mediatype === "audio") {
      data = await evolutionApi.post(`/message/sendWhatsAppAudio/${instance}`, {
        number: remoteJid,
        options: { encoding: true },
        audioMessage: { audio: base64 },
      });
    } else {
      data = await evolutionApi.post(`/message/sendMedia/${instance}`, {
        number: remoteJid,
        options: { delay: 1200, presence: "composing" },
        mediaMessage: {
          mediatype,
          media: base64,
          fileName: fileName || "arquivo",
          caption: caption || "",
        },
      });
    }

    return NextResponse.json({ ok: true, resposta: data.data });
  } catch (e) {
    if (axios.isAxiosError(e))
      return NextResponse.json({ ok: false, erro: e.response?.data ?? e.message }, { status: e.response?.status ?? 500 });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
