"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type EstadoFormulario = {
  email: string;
  senha: string;
};

function obterMensagemErro(codigo: string | null) {
  if (!codigo) return null;
  if (codigo === "CredentialsSignin") return "Email ou senha inválidos.";
  if (codigo === "AccessDenied") return "Acesso negado.";
  return "Não foi possível entrar. Tente novamente.";
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
            <div className="h-6 w-24 rounded bg-zinc-200" />
            <div className="mt-4 h-4 w-64 rounded bg-zinc-100" />
            <div className="mt-6 space-y-4">
              <div className="h-10 rounded bg-zinc-100" />
              <div className="h-10 rounded bg-zinc-100" />
              <div className="h-10 rounded bg-zinc-200" />
            </div>
          </div>
        </div>
      }
    >
      <LoginConteudo />
    </Suspense>
  );
}

function LoginConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erroQuery = useMemo(() => obterMensagemErro(searchParams.get("error")), [searchParams]);

  const [estado, setEstado] = useState<EstadoFormulario>({
    email: "",
    senha: "",
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(erroQuery);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const resultado = await signIn("credentials", {
      redirect: false,
      email: estado.email,
      password: estado.senha,
    });

    setCarregando(false);

    if (!resultado || resultado.error) {
      setErro(obterMensagemErro(resultado?.error ?? "CredentialsSignin"));
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-zinc-200">
        <h1 className="text-2xl font-semibold text-zinc-900">Entrar</h1>
        <p className="mt-1 text-sm text-zinc-600">Acesse o painel de multiatendimento.</p>

        <form className="mt-6 space-y-4" onSubmit={entrar}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={estado.email}
              onChange={(e) => setEstado((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500"
              placeholder="admin@rsetbrasil.com.br"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={estado.senha}
              onChange={(e) => setEstado((prev) => ({ ...prev, senha: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {erro ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
