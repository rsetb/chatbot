import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";

    const chats = await EvolutionService.findChats(instance);
    return NextResponse.json({ ok: true, chats });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

