import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

// GET /api/debug/messages?instance=adc&jid=123@lid
// Retorna a resposta bruta da Evolution API para findMessages
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";
  const jid = searchParams.get("jid");

  if (!jid) {
    return NextResponse.json({ erro: "Parâmetro ?jid= obrigatório" }, { status: 400 });
  }

  // Tenta a busca com a chave exata
  const tentativas: any[] = [];

  const jids = Array.from(new Set([
    jid,
    jid.includes("@lid") ? jid.replace("@lid", "@s.whatsapp.net") : null,
    jid.includes("@lid") ? jid.replace("@lid", "@c.us") : null,
    jid.includes("@s.whatsapp.net") ? jid.replace("@s.whatsapp.net", "@lid") : null,
  ].filter(Boolean) as string[]));

  for (const candidato of jids) {
    try {
      const resp = await evolutionApi.post(`/chat/findMessages/${instance}`, {
        where: { key: { remoteJid: candidato } },
      });
      tentativas.push({ jid: candidato, status: resp.status, data: resp.data });
    } catch (e) {
      tentativas.push({
        jid: candidato,
        erro: axios.isAxiosError(e)
          ? { status: e.response?.status, data: e.response?.data }
          : String(e),
      });
    }
  }

  // Tenta também sem filtro (só instance) para ver estrutura de resposta
  try {
    const resp = await evolutionApi.post(`/chat/findMessages/${instance}`, {});
    tentativas.push({ jid: "(sem filtro, primeiros resultados)", status: resp.status, data: resp.data });
  } catch (e) {
    tentativas.push({
      jid: "(sem filtro)",
      erro: axios.isAxiosError(e)
        ? { status: e.response?.status, data: e.response?.data }
        : String(e),
    });
  }

  return NextResponse.json({ instance, jidBuscado: jid, tentativas });
}
