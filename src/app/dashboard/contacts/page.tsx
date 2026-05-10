import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContatosPage() {
  const contatos = await prisma.contact.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Contatos</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Últimos contatos sincronizados pelo webhook.
          </p>
        </div>
        <a
          href="/dashboard"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          Voltar
        </a>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-700">
          <div className="col-span-5">Nome</div>
          <div className="col-span-4">Número</div>
          <div className="col-span-3">Atualizado</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {contatos.length ? (
            contatos.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                <div className="col-span-5 text-zinc-900">{c.name}</div>
                <div className="col-span-4 text-zinc-700">{c.number}</div>
                <div className="col-span-3 text-zinc-500">
                  {new Date(c.updatedAt).toLocaleString("pt-BR")}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-zinc-600">
              Nenhum contato encontrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
