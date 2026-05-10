"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { Send, Paperclip, MoreVertical, ArrowLeftRight, X } from "lucide-react";
import { io, Socket } from "socket.io-client";

const INSTANCE = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || "adc";

type ChatEvolution = {
  id?: string;
  remoteJid?: string;
  name?: string;
  pushName?: string;
  unreadCount?: number;
  updatedAt?: string;
  lastMessage?: any;
};

type MensagemEvolution = {
  key?: { id?: string; remoteJid?: string; fromMe?: boolean };
  messageTimestamp?: number;
  pushName?: string;
  messageType?: string;
  message?: any;
};

type Agent = { id: string; name: string; email: string; role: string };

type PendingFile = {
  file: File;
  base64: string;
  mimetype: string;
  previewUrl: string | null;
};

function normalizarListaResposta(valor: any): any[] {
  if (Array.isArray(valor)) return valor;
  if (!valor || typeof valor !== "object") return [];
  if (Array.isArray(valor.data)) return valor.data;
  if (Array.isArray(valor.messages)) return valor.messages;
  if (Array.isArray(valor.chats)) return valor.chats;
  if (valor.response && Array.isArray(valor.response)) return valor.response;
  if (valor.response && Array.isArray(valor.response.data)) return valor.response.data;
  return [];
}

const TIPO_LABEL: Record<string, string> = {
  audioMessage: "🎵 Áudio",
  imageMessage: "📷 Imagem",
  videoMessage: "🎬 Vídeo",
  documentMessage: "📎 Documento",
  documentWithCaptionMessage: "📎 Documento",
  stickerMessage: "🎭 Sticker",
  locationMessage: "📍 Localização",
  contactMessage: "👤 Contato",
  pollCreationMessage: "📊 Enquete",
  reactionMessage: "👍 Reação",
  protocolMessage: "",
};

function extrairTextoMensagem(m: MensagemEvolution): string {
  const msg = m.message || {};
  const tipo = m.messageType;
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    (msg.audioMessage ? "🎵 Áudio" : null) ||
    (msg.stickerMessage ? "🎭 Sticker" : null) ||
    (msg.imageMessage ? "📷 Imagem" : null) ||
    (msg.videoMessage ? "🎬 Vídeo" : null) ||
    (msg.documentMessage ? "📎 Documento" : null) ||
    (msg.locationMessage ? "📍 Localização" : null) ||
    (msg.contactMessage ? `👤 ${msg.contactMessage.displayName ?? "Contato"}` : null) ||
    (msg.pollCreationMessage ? `📊 Enquete: ${msg.pollCreationMessage.name ?? ""}` : null) ||
    (msg.reactionMessage ? `${msg.reactionMessage.text ?? "👍"} Reação` : null) ||
    // Fallback: messageType field present when message body is empty in DB
    (tipo ? (TIPO_LABEL[tipo] ?? "📎 Mídia") : "📎 Mídia")
  );
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Avatar com foto ou iniciais
function Avatar({ nome, foto, size = "md" }: { nome: string; foto?: string | null; size?: "sm" | "md" }) {
  const [erro, setErro] = useState(false);
  const px = size === "sm" ? "w-9 h-9 text-xs" : "w-10 h-10 text-sm";
  if (foto && !erro) {
    return (
      <img
        src={foto}
        alt={nome}
        onError={() => setErro(true)}
        className={`${px} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${px} rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {iniciais(nome) || "?"}
    </div>
  );
}

// Modal de transferência
function ModalTransferir({
  remoteJid,
  onClose,
}: {
  remoteJid: string;
  onClose: () => void;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [transferindo, setTransferindo] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((j) => setAgents(Array.isArray(j) ? j : []))
      .catch(() => {});
  }, []);

  async function transferir(agentId: string) {
    setTransferindo(agentId);
    try {
      await fetch("/api/tickets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteJid, agentId }),
      });
      setSucesso(true);
      setTimeout(onClose, 1200);
    } finally {
      setTransferindo(null);
    }
  }

  const roleLabel: Record<string, string> = { ADMIN: "Admin", SUPERVISOR: "Supervisor", AGENT: "Agente" };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Transferir atendimento</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sucesso ? (
          <p className="text-green-600 text-sm py-4 text-center">Transferido com sucesso!</p>
        ) : agents.length ? (
          <div className="space-y-2">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => void transferir(a.id)}
                disabled={transferindo === a.id}
                className="w-full flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 disabled:opacity-50"
              >
                <Avatar nome={a.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{a.name}</p>
                  <p className="text-xs text-zinc-500">{roleLabel[a.role] ?? a.role}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 py-4 text-center">Nenhum agente encontrado.</p>
        )}
      </div>
    </div>
  );
}

// ─── Inline media renderer ───────────────────────────────────────────────────

function MessageContent({ m, instance }: { m: MensagemEvolution; instance: string }) {
  const tipo = m.messageType;
  const msg = m.message || {};
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erroMedia, setErroMedia] = useState(false);

  async function fetchMedia() {
    if (mediaUrl || carregando) return;
    setCarregando(true);
    setErroMedia(false);
    try {
      const res = await fetch("/api/evolution/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance, message: m }),
      });
      const json = await res.json();
      if (json.dataUrl) setMediaUrl(json.dataUrl);
      else setErroMedia(true);
    } catch {
      setErroMedia(true);
    } finally {
      setCarregando(false);
    }
  }

  // Auto-carrega áudio
  useEffect(() => {
    if (tipo === "audioMessage" || tipo === "pttMessage") void fetchMedia();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (tipo === "audioMessage" || tipo === "pttMessage") {
    if (mediaUrl) return <audio controls src={mediaUrl} className="max-w-[240px] mt-1" />;
    if (erroMedia) return <span className="text-xs text-red-400">Falha ao carregar áudio</span>;
    return <span className="text-xs text-zinc-400 animate-pulse">🎵 Carregando áudio...</span>;
  }

  if (tipo === "imageMessage") {
    const thumb = msg.imageMessage?.jpegThumbnail as string | undefined;
    const caption = msg.imageMessage?.caption as string | undefined;
    return (
      <div className="space-y-1">
        <button
          onClick={fetchMedia}
          disabled={carregando}
          className="relative block rounded-lg overflow-hidden"
        >
          {mediaUrl ? (
            <img
              src={mediaUrl}
              alt="Imagem"
              className="max-w-[260px] rounded-lg cursor-zoom-in"
              onClick={(e) => { e.stopPropagation(); window.open(mediaUrl, "_blank"); }}
            />
          ) : thumb ? (
            <>
              <img src={`data:image/jpeg;base64,${thumb}`} alt="" className="max-w-[260px] rounded-lg blur-sm opacity-80" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white text-xs font-medium rounded-lg">
                {carregando ? "Carregando..." : "📷 Toque para ver"}
              </span>
            </>
          ) : (
            <div className="w-48 h-32 bg-zinc-200 rounded-lg flex items-center justify-center text-3xl">
              {carregando ? <span className="text-xs text-zinc-500">Carregando...</span> : "📷"}
            </div>
          )}
        </button>
        {caption && <p className="text-gray-800 text-sm">{caption}</p>}
      </div>
    );
  }

  if (tipo === "videoMessage") {
    const caption = msg.videoMessage?.caption as string | undefined;
    return (
      <div className="space-y-1">
        {mediaUrl ? (
          <video controls src={mediaUrl} className="max-w-[260px] rounded-lg" />
        ) : (
          <button
            onClick={fetchMedia}
            disabled={carregando}
            className="flex items-center gap-2 bg-zinc-100 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200"
          >
            🎬 {carregando ? "Carregando..." : "Ver vídeo"}
          </button>
        )}
        {caption && <p className="text-gray-800 text-sm">{caption}</p>}
      </div>
    );
  }

  if (tipo === "documentMessage" || tipo === "documentWithCaptionMessage") {
    const doc = msg.documentMessage ?? msg.documentWithCaptionMessage?.message?.documentMessage ?? {};
    const fileName: string = doc.fileName ?? doc.title ?? "Documento";
    return mediaUrl ? (
      <a
        href={mediaUrl}
        download={fileName}
        className="flex items-center gap-2 bg-zinc-100 rounded-lg px-3 py-2 text-sm text-blue-600 hover:bg-zinc-200"
      >
        📎 {fileName}
      </a>
    ) : (
      <button
        onClick={fetchMedia}
        disabled={carregando}
        className="flex items-center gap-2 bg-zinc-100 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200"
      >
        📎 {carregando ? "Carregando..." : fileName}
      </button>
    );
  }

  if (tipo === "stickerMessage") {
    return mediaUrl ? (
      <img src={mediaUrl} alt="Sticker" className="w-28 h-28" />
    ) : (
      <button onClick={fetchMedia} disabled={carregando} className="text-sm text-zinc-500">
        🎭 {carregando ? "Carregando..." : "Ver sticker"}
      </button>
    );
  }

  // texto / reação / enquete / location / outros
  const texto = extrairTextoMensagem(m);
  if (!texto) return null;
  return <p className="text-gray-800 whitespace-pre-wrap">{texto}</p>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [carregandoChats, setCarregandoChats] = useState(false);
  const [chats, setChats] = useState<ChatEvolution[]>([]);
  const [chatSelecionado, setChatSelecionado] = useState<ChatEvolution | null>(null);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemEvolution[]>([]);
  const [erroMensagens, setErroMensagens] = useState<string | null>(null);
  const [remoteJidMensagens, setRemoteJidMensagens] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [input, setInput] = useState("");
  const [busca, setBusca] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [modalTransferir, setModalTransferir] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);

  const remoteJidRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { remoteJidRef.current = remoteJidMensagens; }, [remoteJidMensagens]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPendingFile({
        file,
        base64: result.split(",")[1],
        mimetype: file.type,
        previewUrl: file.type.startsWith("image/") ? result : null,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const mensagensEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [mensagens]);

  const carregarChats = useCallback(async () => {
    setCarregandoChats(true);
    try {
      const res = await fetch(`/api/evolution/chats?instance=${INSTANCE}`, { cache: "no-store" });
      const json = await res.json();
      setChats(normalizarListaResposta(json?.chats) as ChatEvolution[]);
    } catch {
      setChats([]);
    } finally {
      setCarregandoChats(false);
    }
  }, []);

  const recarregarMensagens = useCallback(async (remoteJid: string) => {
    setCarregandoMensagens(true);
    setErroMensagens(null);
    try {
      const url = `/api/evolution/messages?instance=${INSTANCE}&remoteJid=${encodeURIComponent(remoteJid)}&limit=50`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setMensagens([]);
        setErroMensagens(`Falha ao buscar mensagens (HTTP ${res.status}).`);
        return;
      }
      const json = await res.json();
      const arr = normalizarListaResposta(json?.records) as MensagemEvolution[];
      setMensagens(arr.slice().reverse());
    } catch {
      setMensagens([]);
      setErroMensagens("Falha ao buscar mensagens.");
    } finally {
      setCarregandoMensagens(false);
    }
  }, []);

  useEffect(() => { carregarChats(); }, [carregarChats]);

  useEffect(() => {
    if (remoteJidMensagens) recarregarMensagens(remoteJidMensagens);
  }, [remoteJidMensagens, recarregarMensagens]);

  // Polling de fallback 7s
  useEffect(() => {
    if (!remoteJidMensagens) return;
    const id = window.setInterval(() => recarregarMensagens(remoteJidMensagens), 7000);
    return () => window.clearInterval(id);
  }, [remoteJidMensagens, recarregarMensagens]);

  // Socket.io tempo real
  useEffect(() => {
    const socket: Socket = io({ transports: ["websocket", "polling"] });
    socket.on("globalUpdate", ({ contact }: { contact?: { number?: string } }) => {
      carregarChats();
      const jid = remoteJidRef.current;
      if (jid && contact?.number && jid.includes(contact.number)) {
        recarregarMensagens(jid);
      }
    });
    return () => { socket.disconnect(); };
  }, [carregarChats, recarregarMensagens]);

  // Busca foto de perfil ao selecionar chat
  useEffect(() => {
    setFotoPerfil(null);
    if (!remoteJidMensagens) return;
    const num = remoteJidMensagens.includes("@") ? remoteJidMensagens.split("@")[0] : remoteJidMensagens;
    fetch(`/api/evolution/profile-picture?instance=${INSTANCE}&number=${encodeURIComponent(num)}`)
      .then((r) => r.json())
      .then((j) => setFotoPerfil(j.url ?? null))
      .catch(() => {});
  }, [remoteJidMensagens]);

  const enviarMensagem = useCallback(async () => {
    if (!remoteJidMensagens) return;
    setEnviando(true);
    try {
      // Envio de mídia
      if (pendingFile) {
        const res = await fetch("/api/evolution/send-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instance: INSTANCE,
            remoteJid: remoteJidMensagens,
            base64: pendingFile.base64,
            mimetype: pendingFile.mimetype,
            fileName: pendingFile.file.name,
            caption: input.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setErroMensagens(`Falha ao enviar: ${json?.erro ?? `HTTP ${res.status}`}`);
          return;
        }
        setPendingFile(null);
        setInput("");
        await recarregarMensagens(remoteJidMensagens);
        return;
      }

      // Envio de texto
      const texto = input.trim();
      if (!texto) return;
      const res = await fetch("/api/evolution/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: INSTANCE, remoteJid: remoteJidMensagens, text: texto }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const detalhe = json?.error
          ? typeof json.error === "string" ? json.error : JSON.stringify(json.error)
          : `HTTP ${res.status}`;
        setErroMensagens(`Falha ao enviar: ${detalhe}`);
        return;
      }
      setInput("");
      await recarregarMensagens(remoteJidMensagens);
    } catch {
      setErroMensagens("Falha ao enviar mensagem.");
    } finally {
      setEnviando(false);
    }
  }, [input, remoteJidMensagens, recarregarMensagens, pendingFile]);

  const chatsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return chats;
    return chats.filter((c) => {
      const nome = (c.name || c.pushName || c.remoteJid || "").toLowerCase();
      return nome.includes(termo);
    });
  }, [busca, chats]);

  const nomeChat = chatSelecionado?.name || chatSelecionado?.pushName || chatSelecionado?.remoteJid || "Selecione uma conversa";

  return (
    <div className="flex h-full">
      {modalTransferir && remoteJidMensagens && (
        <ModalTransferir remoteJid={remoteJidMensagens} onClose={() => setModalTransferir(false)} />
      )}

      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {carregandoChats ? (
            <div className="p-4 text-sm text-gray-600">Carregando conversas...</div>
          ) : chatsFiltrados.length ? (
            chatsFiltrados.map((c, idx) => {
              const nome = c.name || c.pushName || c.remoteJid || `Chat ${idx + 1}`;
              const ativo = chatSelecionado?.remoteJid && c.remoteJid === chatSelecionado.remoteJid;
              const jidParaMensagens = c?.lastMessage?.key?.remoteJid || c.remoteJid;
              return (
                <button
                  key={(c.id || c.remoteJid || String(idx)) as string}
                  onClick={() => {
                    setChatSelecionado(c);
                    setRemoteJidMensagens(jidParaMensagens || null);
                  }}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 ${ativo ? "bg-blue-50" : ""}`}
                >
                  <Avatar nome={nome} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-800 truncate">{nome}</h4>
                      {typeof c.unreadCount === "number" && c.unreadCount > 0 && (
                        <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {c.lastMessage ? extrairTextoMensagem(c.lastMessage as MensagemEvolution) : ""}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-sm text-gray-600">Nenhuma conversa encontrada.</div>
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-[#efeae2]">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Avatar nome={nomeChat} foto={fotoPerfil} />
            <div>
              <h2 className="font-semibold text-gray-800">{nomeChat}</h2>
              <span className="text-xs text-gray-400">{remoteJidMensagens || ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {remoteJidMensagens && (
              <button
                onClick={() => setModalTransferir(true)}
                title="Transferir atendimento"
                className="flex items-center gap-1.5 text-xs text-zinc-600 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Transferir
              </button>
            )}
            <button className="text-gray-500 hover:text-gray-700 p-1">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!remoteJidMensagens ? (
            <div className="text-sm text-gray-500">Selecione uma conversa para ver o histórico.</div>
          ) : carregandoMensagens ? (
            <div className="text-sm text-gray-500">Carregando mensagens...</div>
          ) : erroMensagens ? (
            <div className="text-sm text-red-600">{erroMensagens}</div>
          ) : mensagens.length ? (
            mensagens.map((m, idx) => {
              const fromMe = Boolean(m.key?.fromMe);
              const ts = m.messageTimestamp ? new Date(m.messageTimestamp * 1000) : null;
              return (
                <div key={m.key?.id || String(idx)} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-lg shadow-sm max-w-md text-sm ${
                      fromMe ? "bg-[#d9fdd3] rounded-tr-none" : "bg-white rounded-tl-none"
                    }`}
                  >
                    <MessageContent m={m} instance={INSTANCE} />
                    <span className="text-[10px] text-gray-400 mt-1 block text-right">
                      {ts ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">Nenhuma mensagem encontrada.</div>
          )}
          <div ref={mensagensEndRef} />
        </div>

        {/* Preview arquivo pendente */}
        {pendingFile && (
          <div className="bg-white px-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
              {pendingFile.previewUrl ? (
                <img src={pendingFile.previewUrl} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded bg-zinc-200 flex items-center justify-center text-2xl flex-shrink-0">
                  {pendingFile.mimetype.startsWith("audio/") ? "🎵" : pendingFile.mimetype.startsWith("video/") ? "🎬" : "📎"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{pendingFile.file.name}</p>
                <p className="text-xs text-zinc-500">{(pendingFile.file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setPendingFile(null)} className="text-zinc-400 hover:text-red-500 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            title="Enviar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void enviarMensagem(); } }}
            placeholder={pendingFile ? "Legenda (opcional)..." : "Digite uma mensagem..."}
            className="flex-1 p-3 border-none bg-gray-100 rounded-lg focus:outline-none text-sm"
          />
          <button
            disabled={!remoteJidMensagens || enviando || (!input.trim() && !pendingFile)}
            onClick={() => void enviarMensagem()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
