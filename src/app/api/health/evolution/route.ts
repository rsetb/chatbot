import { NextResponse } from "next/server";
import { EvolutionService } from "@/services/evolution";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instance = searchParams.get("instance") || process.env.EVOLUTION_INSTANCE_NAME || "adc";
  const testJid = searchParams.get("jid"); // opcional: testa envio para um JID

  const resultado: Record<string, any> = {
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
    instance,
  };

  // 1. Lista instâncias
  try {
    const instancias = await EvolutionService.fetchInstances();
    resultado.instancias = instancias;
  } catch (e) {
    resultado.instancias_erro = axios.isAxiosError(e)
      ? { status: e.response?.status, data: e.response?.data }
      : String(e);
  }

  // 2. Status da instância
  try {
    const status = await EvolutionService.getInstanceStatus(instance);
    resultado.status = status;
  } catch (e) {
    resultado.status_erro = axios.isAxiosError(e)
      ? { status: e.response?.status, data: e.response?.data }
      : String(e);
  }

  // 3. Teste de envio (só se vier ?jid=...)
  if (testJid) {
    try {
      const resp = await EvolutionService.sendText(instance, testJid, "🔧 Teste diagnóstico");
      resultado.teste_envio = { ok: true, resp };
    } catch (e) {
      resultado.teste_envio = axios.isAxiosError(e)
        ? { ok: false, status: e.response?.status, data: e.response?.data }
        : { ok: false, erro: String(e) };
    }
  }

  return NextResponse.json(resultado);
}
