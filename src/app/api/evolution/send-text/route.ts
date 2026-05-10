import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";
import axios from "axios";

type Body = {
  instance?: string;
  remoteJid?: string;
  number?: string;
  text?: string;
};

function normalizarNumeroDestino(body: Body): string | null {
  // Prefere o campo number se vier explicitamente
  if (body.number && typeof body.number === "string") return body.number.trim();
  // Usa o remoteJid completo (inclui @lid, @s.whatsapp.net, @g.us, etc.)
  const remoteJid = (body.remoteJid || "").trim();
  return remoteJid || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const instance = (body.instance || process.env.EVOLUTION_INSTANCE_NAME || "adc").trim();
    const text = (body.text || "").trim();
    const number = normalizarNumeroDestino(body);

    if (!text) {
      return NextResponse.json({ ok: false, error: "text é obrigatório" }, { status: 400 });
    }
    if (!number) {
      return NextResponse.json({ ok: false, error: "remoteJid ou number é obrigatório" }, { status: 400 });
    }

    const resposta = await EvolutionService.sendText(instance, number, text);
    return NextResponse.json({ ok: true, resposta });
  } catch (error) {
    // Extrai mensagem de erro da Evolution API se disponível
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const detail = error.response?.data ?? error.message;
      console.error("Erro Evolution API send-text:", status, JSON.stringify(detail));
      return NextResponse.json({ ok: false, error: detail }, { status });
    }
    const msg = error instanceof Error ? error.message : "Erro interno";
    console.error("Erro send-text:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
