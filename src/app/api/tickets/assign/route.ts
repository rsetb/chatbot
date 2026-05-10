import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/tickets/assign
// Body: { remoteJid, agentId }
// Encontra o ticket aberto pelo remoteJid e atribui ao agente
export async function POST(req: Request) {
  try {
    const { remoteJid, agentId } = await req.json();
    if (!remoteJid || !agentId)
      return NextResponse.json({ ok: false, erro: "remoteJid e agentId são obrigatórios" }, { status: 400 });

    const number = remoteJid.includes("@") ? remoteJid.split("@")[0] : remoteJid;

    const contact = await prisma.contact.findUnique({ where: { number } });
    if (!contact)
      return NextResponse.json({ ok: false, erro: "Contato não encontrado" }, { status: 404 });

    // Busca ticket aberto mais recente
    let ticket = await prisma.ticket.findFirst({
      where: { contactId: contact.id, status: { in: ["PENDING", "OPEN"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!ticket) {
      // Cria ticket se não existe
      const instance = await prisma.instance.findFirst();
      if (!instance)
        return NextResponse.json({ ok: false, erro: "Nenhuma instância configurada no banco" }, { status: 500 });

      ticket = await prisma.ticket.create({
        data: {
          contactId: contact.id,
          instanceId: instance.id,
          status: "OPEN",
          userId: agentId,
        },
      });
    } else {
      ticket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { userId: agentId, status: "OPEN" },
      });
    }

    // Notifica via Socket.io
    const io = (global as any).io;
    if (io) io.emit("ticketAssigned", { ticketId: ticket.id, agentId });

    return NextResponse.json({ ok: true, ticket });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
