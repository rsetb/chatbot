"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, User, Paperclip, MoreVertical } from "lucide-react";

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
  message?: any;
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

function extrairTextoMensagem(m: MensagemEvolution): string {
  const msg = m.message || {};
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    "[mensagem]"
  );
}

export default function DashboardPage() {
  const [carregandoChats, setCarregandoChats] = useState(false);
  const [chats, setChats] = useState<ChatEvolution[]>([]);
  const [chatSelecionado, setChatSelecionado] = useState<ChatEvolution | null>(null);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemEvolution[]>([]);
  const [erroMensagens, setErroMensagens] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function carregarChats() {
      setCarregandoChats(true);
      try {
        const res = await fetch("/api/evolution/chats?instance=adc", { cache: "no-store" });
        const json = await res.json();
        const lista = normalizarListaResposta(json?.chats);
        setChats(lista as ChatEvolution[]);
      } catch {
        setChats([]);
      } finally {
        setCarregandoChats(false);
      }
    }

    carregarChats();
  }, []);

  useEffect(() => {
    async function carregarMensagens(remoteJid: string) {
      setCarregandoMensagens(true);
      setErroMensagens(null);
      try {
        const url = `/api/evolution/messages?instance=adc&remoteJid=${encodeURIComponent(remoteJid)}&limit=50`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setMensagens([]);
          setErroMensagens(`Falha ao buscar mensagens (HTTP ${res.status}).`);
          return;
        }
        const json = await res.json();
        const arr = normalizarListaResposta(json?.messages) as MensagemEvolution[];
        setMensagens(arr.slice().reverse());
      } catch {
        setMensagens([]);
        setErroMensagens("Falha ao buscar mensagens.");
      } finally {
        setCarregandoMensagens(false);
      }
    }

    if (chatSelecionado?.remoteJid) {
      carregarMensagens(chatSelecionado.remoteJid);
    }
  }, [chatSelecionado?.remoteJid]);

  const chatsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return chats;
    return chats.filter((c) => {
      const nome = (c.name || c.pushName || c.remoteJid || "").toLowerCase();
      return nome.includes(termo);
    });
  }, [busca, chats]);

  return (
    <div className="flex h-full">
      {/* Sidebar de Tickets (Lista de conversas) */}
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
              return (
                <button
                  key={(c.id || c.remoteJid || String(idx)) as string}
                  onClick={() => setChatSelecionado(c)}
                  className={`w-full text-left p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${ativo ? "bg-blue-50" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-800">{nome}</h4>
                    {typeof c.unreadCount === "number" && c.unreadCount > 0 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {c.unreadCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">&nbsp;</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {c.lastMessage?.message?.conversation ||
                      c.lastMessage?.message?.extendedTextMessage?.text ||
                      c.lastMessage?.message?.imageMessage?.caption ||
                      ""}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-sm text-gray-600">Nenhuma conversa encontrada.</div>
          )}
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col bg-[#efeae2]">
        {/* Header do Chat */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="text-gray-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                {chatSelecionado?.name || chatSelecionado?.pushName || chatSelecionado?.remoteJid || "Selecione uma conversa"}
              </h2>
              <span className="text-xs text-gray-500">
                {chatSelecionado?.remoteJid ? chatSelecionado.remoteJid : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="text-gray-500 hover:text-gray-700">
              <MoreVertical />
            </button>
          </div>
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!chatSelecionado?.remoteJid ? (
            <div className="text-sm text-gray-600">Selecione uma conversa para ver o histórico.</div>
          ) : carregandoMensagens ? (
            <div className="text-sm text-gray-600">Carregando mensagens...</div>
          ) : erroMensagens ? (
            <div className="text-sm text-red-700">{erroMensagens}</div>
          ) : mensagens.length ? (
            mensagens.map((m, idx) => {
              const fromMe = Boolean(m.key?.fromMe);
              const texto = extrairTextoMensagem(m);
              const ts = m.messageTimestamp ? new Date(m.messageTimestamp * 1000) : null;
              return (
                <div key={m.key?.id || String(idx)} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-lg shadow-sm max-w-md ${
                      fromMe ? "bg-[#d9fdd3] rounded-tr-none" : "bg-white rounded-tl-none"
                    }`}
                  >
                    <p className="text-gray-800">{texto}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block text-right">
                      {ts ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-600">Nenhuma mensagem encontrada para esta conversa.</div>
          )}
        </div>

        {/* Área de Input */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-center gap-3">
          <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setInput((v) => v)}
            placeholder="Digite uma mensagem..." 
            className="flex-1 p-3 border-none bg-gray-100 rounded-lg focus:outline-none"
          />
          <button 
            onClick={() => setInput("")}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
