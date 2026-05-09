"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Send, User, Paperclip, MoreVertical } from "lucide-react";

export default function DashboardPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Connect to local socket server
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socketInstance.on("newMessage", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    
    const newMsg = { id: Date.now().toString(), body: input, fromMe: true, createdAt: new Date() };
    setMessages((prev) => [...prev, newMsg]);
    // In a real app, you would also post to an API that calls Evolution API
    // socket.emit("sendMessage", { ticketId: "...", text: input });
    setInput("");
  };

  return (
    <div className="flex h-full">
      {/* Sidebar de Tickets (Lista de conversas) */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <input 
            type="text" 
            placeholder="Buscar conversas..." 
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Item de conversa mockado */}
          <div className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 bg-blue-50">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-gray-800">João Silva</h4>
              <span className="text-xs text-gray-500">10:42</span>
            </div>
            <p className="text-sm text-gray-600 truncate mt-1">Preciso de ajuda com meu pedido.</p>
          </div>
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
              <h2 className="font-semibold text-gray-800">João Silva</h2>
              <span className="text-xs text-green-500">Online</span>
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
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-md">
              <p className="text-gray-800">Olá, preciso de ajuda com meu pedido.</p>
              <span className="text-[10px] text-gray-500 mt-1 block text-right">10:42</span>
            </div>
          </div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg shadow-sm max-w-md ${msg.fromMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                <p className="text-gray-800">{msg.body}</p>
                <span className="text-[10px] text-gray-500 mt-1 block text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
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
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite uma mensagem..." 
            className="flex-1 p-3 border-none bg-gray-100 rounded-lg focus:outline-none"
          />
          <button 
            onClick={sendMessage}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
