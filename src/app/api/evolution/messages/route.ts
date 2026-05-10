import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";

function extrairRegistros(resposta: any) {
  if (Array.isArray(resposta)) return { total: resposta.length, records: resposta };
  const mensagens = resposta?.messages;
  if (mensagens && Array.isArray(mensagens.records)) {
    return { total: Number(mensagens.total ?? mensagens.records.length), records: mensagens.records };
  }
  if (mensagens && Array.isArray(mensagens)) return { total: mensagens.length, records: mensagens };
  if (Array.isArray(resposta?.records)) return { total: Number(resposta.total ?? resposta.records.length), records: resposta.records };
  return { total: 0, records: [] as any[] };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instance = searchParams.get("instance") || "adc";
    const remoteJid = searchParams.get("remoteJid");
    const limit = Number(searchParams.get("limit") || "50");

    if (!remoteJid) {
      return NextResponse.json({ ok: false, error: "remoteJid é obrigatório" }, { status: 400 });
    }

    const resposta = await EvolutionService.findMessages(instance, remoteJid, limit);
    const { total, records } = extrairRegistros(resposta);
    return NextResponse.json({ ok: true, total, records });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
