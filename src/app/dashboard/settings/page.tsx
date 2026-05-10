export default function ConfiguracoesPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Configurações</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Ajustes gerais do sistema.
          </p>
        </div>
        <a
          href="/dashboard"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          Voltar
        </a>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Nesta versão, as configurações serão movidas para telas de:
        Departamentos, Usuários, Respostas Rápidas e Instâncias.
      </div>
    </div>
  );
}

