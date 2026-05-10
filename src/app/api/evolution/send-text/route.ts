import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";

type Body = {
  instance?: string;
  remoteJid?: string;
  number?: string;
  text?: string;
};

function normalizarNumeroDestino(body: Body) {
  if (body.number && typeof body.number === "string") return body.number.trim();
  const remoteJid = (body.remoteJid || "").trim();
  if (!remoteJid) return null;

  if (remoteJid.includes("@")) return remoteJid.split("@")[0];
  return remoteJid;
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
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

