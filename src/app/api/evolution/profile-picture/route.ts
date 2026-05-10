import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

function extrairUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  return (d.profilePictureUrl ?? d.url ?? d.picture ?? null) as string | null;
}

async function tentarBuscar(instance: string, number: string): Promise<string | null> {
  try {
    const resp = await evolutionApi.get(
      `/chat/fetchProfilePictureUrl/${instance}?number=${encodeURIComponent(number)}`
    );
    return extrairUrl(resp.data);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";
  const number = searchParams.get("number");

  if (!number) return NextResponse.json({ url: null });

  const num = number.includes("@") ? number.split("@")[0] : number;

  // 1. Tenta com o número puro
  const url1 = await tentarBuscar(instance, num);
  if (url1) return NextResponse.json({ url: url1 });

  // 2. Tenta com o JID completo (inclui @lid ou @s.whatsapp.net)
  if (number.includes("@")) {
    const url2 = await tentarBuscar(instance, number);
    if (url2) return NextResponse.json({ url: url2 });
  }

  // 3. Tenta com @s.whatsapp.net
  const url3 = await tentarBuscar(instance, `${num}@s.whatsapp.net`);
  return NextResponse.json({ url: url3 });
}
