import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";
  const number = searchParams.get("number");

  if (!number) return NextResponse.json({ url: null });

  // Extrai número do JID se necessário
  const num = number.includes("@") ? number.split("@")[0] : number;

  try {
    const resp = await evolutionApi.get(
      `/chat/fetchProfilePictureUrl/${instance}?number=${encodeURIComponent(num)}`
    );
    const url =
      resp.data?.profilePictureUrl ||
      resp.data?.url ||
      resp.data?.picture ||
      null;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
