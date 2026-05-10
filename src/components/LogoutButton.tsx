"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-50 text-red-600 transition-colors"
    >
      <LogOut className="w-5 h-5" />
      <span>Sair</span>
    </button>
  );
}
