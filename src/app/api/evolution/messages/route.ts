import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instance = searchParams.get("instance") || "adc";
    const remoteJid = searchParams.get("remoteJid");
    const limit = Number(searchParams.get("limit") || "50");

    if (!remoteJid) {
      return NextResponse.json({ ok: false, error: "remoteJid é obrigatório" }, { status: 400 });
    }

    const messages = await EvolutionService.findMessages(instance, remoteJid, limit);
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

