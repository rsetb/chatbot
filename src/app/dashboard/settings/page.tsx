"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, RefreshCw, Wifi, WifiOff, QrCode, Users, Webhook } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Instance = {
  // nested instance object (Evolution API v1/v2 legacy)
  instance?: { instanceName?: string; status?: string; state?: string };
  // flat fields (Evolution API v2 DB format)
  instanceName?: string;
  name?: string;
  status?: string;
  state?: string;
  connectionStatus?: string | { state?: string; status?: string };
  key?: { instanceName?: string; remoteJid?: string };
  // any other unknown fields
  [key: string]: unknown;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function instanceName(i: Instance): string {
  return (
    i.instance?.instanceName ??
    i.instanceName ??
    i.name ??
    (i.key?.instanceName as string | undefined) ??
    "—"
  );
}

function instanceState(i: Instance): string {
  const cs = i.connectionStatus;
  const csStr = typeof cs === "string" ? cs : (cs?.state ?? cs?.status ?? "");
  return (
    i.instance?.state ??
    i.instance?.status ??
    i.state ??
    i.status ??
    csStr ??
    ""
  ).toLowerCase();
}

// ─── QR Modal ────────────────────────────────────────────────────────────────

function QrModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [base64, setBase64] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buscarQr = useCallback(async () => {
    try {
      const res = await fetch(`/api/evolution/qrcode?instance=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (json.state === "connected") {
        setConnected(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      if (json.base64) setBase64(json.base64);
      else setErro(json.erro ? JSON.stringify(json.erro) : "Aguardando QR code...");
    } catch {
      setErro("Erro ao buscar QR code.");
    }
  }, [name]);

  useEffect(() => {
    buscarQr();
    intervalRef.current = setInterval(buscarQr, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [buscarQr]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">Conectar WhatsApp</h2>
        <p className="text-sm text-zinc-500 mb-4">Instância: <strong>{name}</strong></p>

        {connected ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Wifi className="text-green-500 w-12 h-12" />
            <p className="text-green-700 font-semibold">Conectado com sucesso!</p>
          </div>
        ) : base64 ? (
          <div className="flex flex-col items-center gap-3">
            <img src={base64} alt="QR Code WhatsApp" className="w-64 h-64 rounded-lg border border-zinc-200" />
            <p className="text-xs text-zinc-500">Escaneie com o WhatsApp → Configurações → Aparelhos conectados</p>
            <p className="text-xs text-zinc-400">Atualizando automaticamente...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <RefreshCw className="animate-spin text-zinc-400 w-8 h-8" />
            <p className="text-sm text-zinc-500">{erro ?? "Gerando QR code..."}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-zinc-200 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

// ─── Aba Instâncias ───────────────────────────────────────────────────────────

function AbaInstancias() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [rawData, setRawData] = useState<unknown>(null);
  const [carregando, setCarregando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [qrInstance, setQrInstance] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/evolution/instances");
      const json = await res.json();
      setInstances(json.instances ?? []);
      setRawData(json.raw ?? null);
    } catch {
      setErro("Erro ao carregar instâncias.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criar() {
    if (!novoNome.trim()) return;
    setCriando(true);
    setErro(null);
    try {
      const res = await fetch("/api/evolution/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: novoNome.trim() }),
      });
      const json = await res.json();
      if (!json.ok) { setErro(JSON.stringify(json.erro)); return; }
      setNovoNome("");
      await carregar();
      setQrInstance(novoNome.trim());
    } catch {
      setErro("Erro ao criar instância.");
    } finally {
      setCriando(false);
    }
  }

  async function deletar(name: string) {
    if (!confirm(`Deletar instância "${name}"?`)) return;
    await fetch(`/api/evolution/instances?instance=${encodeURIComponent(name)}`, { method: "DELETE" });
    await carregar();
  }

  return (
    <div className="space-y-6">
      {qrInstance && <QrModal name={qrInstance} onClose={() => { setQrInstance(null); carregar(); }} />}

      {/* Debug: raw API response */}
      {rawData !== null && (
        <details className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs">
          <summary className="cursor-pointer font-semibold text-amber-800 mb-2">Debug: resposta bruta da Evolution API</summary>
          <pre className="overflow-auto max-h-60 text-amber-900 whitespace-pre-wrap break-all">{JSON.stringify(rawData, null, 2)}</pre>
        </details>
      )}

      {/* Criar nova instância */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3">Nova instância WhatsApp</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da instância (ex: atendimento1)"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === "Enter" && void criar()}
          />
          <button
            onClick={() => void criar()}
            disabled={criando || !novoNome.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {criando ? "Criando..." : "Criar"}
          </button>
        </div>
        {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
      </div>

      {/* Lista de instâncias */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <span className="text-xs font-semibold text-zinc-700">Instâncias ({instances.length})</span>
          <button onClick={carregar} className="text-zinc-500 hover:text-zinc-700">
            <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="divide-y divide-zinc-100">
          {instances.length ? instances.map((inst, idx) => {
            const name = instanceName(inst);
            const state = instanceState(inst);
            const connected = state === "open" || state === "connected";
            return (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {connected
                    ? <Wifi className="w-4 h-4 text-green-500" />
                    : <WifiOff className="w-4 h-4 text-zinc-400" />
                  }
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{name}</p>
                    <p className={`text-xs ${connected ? "text-green-600" : "text-zinc-400"}`}>
                      {state || "desconhecido"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!connected && (
                    <button
                      onClick={() => setQrInstance(name)}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      <QrCode className="w-3 h-3" />
                      Conectar
                    </button>
                  )}
                  <button
                    onClick={() => void deletar(name)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }) : (
            <p className="px-4 py-6 text-sm text-zinc-500">
              {carregando ? "Carregando..." : "Nenhuma instância encontrada."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Aba Usuários ─────────────────────────────────────────────────────────────

function AbaUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "AGENT" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    setUsers(Array.isArray(json) ? json : []);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) { setErro(json.erro ?? "Erro ao criar usuário."); return; }
      setForm({ name: "", email: "", password: "", role: "AGENT" });
      setSucesso(true);
      await carregar();
    } catch {
      setErro("Erro ao criar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function deletar(id: string, name: string) {
    if (!confirm(`Remover usuário "${name}"?`)) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    await carregar();
  }

  const roleLabel: Record<string, string> = { ADMIN: "Admin", SUPERVISOR: "Supervisor", AGENT: "Agente" };

  return (
    <div className="space-y-6">
      {/* Formulário novo usuário */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3">Novo usuário</h3>
        <form onSubmit={(e) => void criar(e)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="AGENT">Agente</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          {sucesso && <p className="text-xs text-green-600">Usuário criado com sucesso!</p>}
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {salvando ? "Salvando..." : "Criar usuário"}
          </button>
        </form>
      </div>

      {/* Lista de usuários */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <span className="text-xs font-semibold text-zinc-700">Usuários ({users.length})</span>
        </div>
        <div className="divide-y divide-zinc-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                  {roleLabel[u.role] ?? u.role}
                </span>
                <button
                  onClick={() => void deletar(u.id, u.name)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Aba Webhook ──────────────────────────────────────────────────────────────

function AbaWebhook() {
  const [info, setInfo] = useState<any>(null);
  const [configurando, setConfigurando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/setup/webhook")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  async function configurar() {
    setConfigurando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/setup/webhook", { method: "POST" });
      const json = await res.json();
      setResultado(json.ok ? `Webhook configurado: ${json.webhookUrl}` : `Erro: ${JSON.stringify(json.erro)}`);
      const res2 = await fetch("/api/setup/webhook");
      setInfo(await res2.json());
    } catch {
      setResultado("Erro ao configurar webhook.");
    } finally {
      setConfigurando(false);
    }
  }

  const webhookUrl = info?.webhook?.url ?? info?.webhook?.webhook?.url ?? null;
  const habilitado = info?.webhook?.enabled ?? info?.webhook?.webhook?.enabled ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-800 mb-3">Webhook atual</h3>
        {webhookUrl ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${habilitado ? "bg-green-500" : "bg-zinc-400"}`} />
              <span className="text-xs text-zinc-600">{habilitado ? "Habilitado" : "Desabilitado"}</span>
            </div>
            <p className="text-sm font-mono text-zinc-800 bg-zinc-50 rounded-lg px-3 py-2 break-all">{webhookUrl}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Nenhum webhook configurado.</p>
        )}
      </div>

      {resultado && (
        <div className={`rounded-lg px-4 py-3 text-sm ${resultado.startsWith("Erro") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {resultado}
        </div>
      )}

      <button
        onClick={() => void configurar()}
        disabled={configurando}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Webhook className="w-4 h-4" />
        {configurando ? "Configurando..." : "Configurar webhook agora"}
      </button>

      <p className="text-xs text-zinc-500">
        O webhook faz a Evolution API enviar cada mensagem recebida para o chatbot em tempo real.
        Deve ser configurado uma vez por instância.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "instancias" | "usuarios" | "webhook";

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>("instancias");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "instancias", label: "Instâncias", icon: <QrCode className="w-4 h-4" /> },
    { id: "usuarios", label: "Usuários", icon: <Users className="w-4 h-4" /> },
    { id: "webhook", label: "Webhook", icon: <Webhook className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Configurações</h1>
        <p className="mt-1 text-sm text-zinc-600">Instâncias WhatsApp, usuários e webhook.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "instancias" && <AbaInstancias />}
      {tab === "usuarios" && <AbaUsuarios />}
      {tab === "webhook" && <AbaWebhook />}
    </div>
  );
}
