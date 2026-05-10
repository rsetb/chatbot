import { NextResponse } from "next/server";
import axios from "axios";

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || "http://localhost:8080",
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || "",
    "Content-Type": "application/json",
  },
});

function normalizarLista(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.instances)) return d.instances;
    if (Array.isArray(d.data)) return d.data;
    return [data];
  }
  return [];
}

export async function GET() {
  try {
    const resp = await evolutionApi.get("/instance/fetchInstances");
    const lista = normalizarLista(resp.data);
    return NextResponse.json({ ok: true, instances: lista, raw: resp.data });
  } catch (e) {
    if (axios.isAxiosError(e))
      return NextResponse.json({ ok: false, erro: e.response?.data ?? e.message }, { status: 500 });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { instanceName } = await req.json();
  if (!instanceName?.trim())
    return NextResponse.json({ ok: false, erro: "instanceName obrigatório" }, { status: 400 });

  try {
    const resp = await evolutionApi.post("/instance/create", {
      instanceName: instanceName.trim(),
      integration: "WHATSAPP-BAILEYS",
    });
    return NextResponse.json({ ok: true, instance: resp.data });
  } catch (e) {
    if (axios.isAxiosError(e))
      return NextResponse.json({ ok: false, erro: e.response?.data ?? e.message }, { status: 500 });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get("instance");
  if (!instance)
    return NextResponse.json({ ok: false, erro: "instance obrigatório" }, { status: 400 });

  try {
    await evolutionApi.delete(`/instance/delete/${instance}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (axios.isAxiosError(e))
      return NextResponse.json({ ok: false, erro: e.response?.data ?? e.message }, { status: 500 });
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
