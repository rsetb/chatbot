import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";
import { prisma } from "@/lib/prisma";

function normalizarLista(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor;
  if (!valor || typeof valor !== "object") return [];
  const v = valor as Record<string, unknown>;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.chats)) return v.chats;
  return [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";

    const rawChats = await EvolutionService.findChats(instance);
    const lista = normalizarLista(rawChats) as Record<string, unknown>[];

    // Evolution API uses 'id' as the JID field — normalise to remoteJid
    const normalizado = lista.map((c) => ({
      ...c,
      remoteJid: (c.remoteJid as string | undefined) || (c.id as string | undefined) || "",
    })) as Record<string, unknown>[];

    // Enrich names from our contacts table (webhook stores pushName there)
    const numbers = normalizado
      .map((c) => {
        const jid = (c.remoteJid as string) || "";
        return jid.includes("@") ? jid.split("@")[0] : jid;
      })
      .filter(Boolean);

    const dbContacts = await prisma.contact.findMany({
      where: { number: { in: numbers } },
      select: { number: true, name: true },
    });
    const nameMap = new Map(dbContacts.map((c) => [c.number, c.name]));

    const enriched = normalizado.map((c) => {
      const jid = (c.remoteJid as string) || "";
      const number = jid.includes("@") ? jid.split("@")[0] : jid;
      const dbName = nameMap.get(number);
      return {
        ...c,
        name: dbName || (c.name as string | undefined) || (c.pushName as string | undefined) || null,
      };
    });

    return NextResponse.json({ ok: true, chats: enriched });
  } catch (error) {
    return NextResponse.json({ ok: false, erro: String(error) }, { status: 500 });
  }
}
