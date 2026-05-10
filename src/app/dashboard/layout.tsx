import { ReactNode } from "react";
import { MessageSquare, Users, Settings, Tag, BarChart } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Chatbot Multi</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
            <MessageSquare className="w-5 h-5" />
            <span>Atendimentos</span>
          </Link>
          <Link href="/dashboard/contacts" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
            <Users className="w-5 h-5" />
            <span>Contatos</span>
          </Link>
          <Link href="/dashboard/tags" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
            <Tag className="w-5 h-5" />
            <span>Etiquetas</span>
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
            <BarChart className="w-5 h-5" />
            <span>Relatórios</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
