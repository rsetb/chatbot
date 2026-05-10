import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";

export async function GET() {
  try {
    const instancias = await EvolutionService.fetchInstances();
    return NextResponse.json({ ok: true, instancias });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

