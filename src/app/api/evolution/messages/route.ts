import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";

function extrairRegistros(resposta: any) {
  if (Array.isArray(resposta)) return { total: resposta.length, records: resposta };
  const mensagens = resposta?.messages;
  const mensagensInternas = mensagens?.messages;
  if (mensagens && Array.isArray(mensagens.records)) {
    return { total: Number(mensagens.total ?? mensagens.records.length), records: mensagens.records };
  }
  if (mensagensInternas && Array.isArray(mensagensInternas.records)) {
    return {
      total: Number(mensagensInternas.total ?? mensagensInternas.records.length),
      records: mensagensInternas.records,
    };
  }
  if (mensagens && Array.isArray(mensagens)) return { total: mensagens.length, records: mensagens };
  if (Array.isArray(resposta?.records)) return { total: Number(resposta.total ?? resposta.records.length), records: resposta.records };
  return { total: 0, records: [] as any[] };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";
    const remoteJid = searchParams.get("remoteJid");
    const limit = Number(searchParams.get("limit") || "50");

    if (!remoteJid) {
      return NextResponse.json({ ok: false, error: "remoteJid é obrigatório" }, { status: 400 });
    }

    const candidatos = Array.from(
      new Set(
        [
          remoteJid,
          remoteJid.includes("@lid") ? remoteJid.replace("@lid", "@s.whatsapp.net") : null,
          remoteJid.includes("@lid") ? remoteJid.replace("@lid", "@c.us") : null,
          remoteJid.includes("@s.whatsapp.net") ? remoteJid.replace("@s.whatsapp.net", "@c.us") : null,
          !remoteJid.includes("@") ? `${remoteJid}@s.whatsapp.net` : null,
        ].filter(Boolean) as string[]
      )
    );

    for (const candidato of candidatos) {
      const resposta = await EvolutionService.findMessages(instance, candidato, limit);
      const { total, records } = extrairRegistros(resposta);
      if (records.length) {
        return NextResponse.json({ ok: true, total, records, remoteJidUsado: candidato });
      }
    }

    return NextResponse.json({ ok: true, total: 0, records: [], remoteJidUsado: candidatos[0] });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
