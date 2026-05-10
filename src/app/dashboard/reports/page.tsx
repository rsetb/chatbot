import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const totalTickets = await prisma.ticket.count();
  const totalMensagens = await prisma.message.count();
  const totalContatos = await prisma.contact.count();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Relatórios</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Indicadores básicos do sistema.
          </p>
        </div>
        <a
          href="/dashboard"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          Voltar
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">Tickets</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{totalTickets}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">Mensagens</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{totalMensagens}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-sm text-zinc-600">Contatos</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{totalContatos}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Para relatórios por atendente (tempo médio, taxa de resolução, etc.), vamos
        precisar habilitar a atribuição de tickets e registrar eventos de auditoria.
      </div>
    </div>
  );
}
