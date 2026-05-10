import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EtiquetasPage() {
  const etiquetas = await prisma.tag.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Etiquetas</h1>
          <p className="mt-1 text-sm text-zinc-600">Organize conversas com tags.</p>
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
          <div className="col-span-7">Nome</div>
          <div className="col-span-2">Cor</div>
          <div className="col-span-3">Atualizado</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {etiquetas.length ? (
            etiquetas.map((t) => (
              <div key={t.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                <div className="col-span-7 text-zinc-900">{t.name}</div>
                <div className="col-span-2">
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.color}
                  </span>
                </div>
                <div className="col-span-3 text-zinc-500">
                  {new Date(t.updatedAt).toLocaleString("pt-BR")}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-zinc-600">
              Nenhuma etiqueta cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
