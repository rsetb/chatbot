import axios from 'axios';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'sua-api-key-aqui';

const evolutionApi = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    apikey: EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
});

export class EvolutionService {
  /**
   * Envia uma mensagem de texto simples
   */
  static async sendText(instanceName: string, number: string, text: string) {
    try {
      const response = await evolutionApi.post(`/message/sendText/${instanceName}`, {
        number,
        options: {
          delay: 1200,
          presence: 'composing',
        },
        textMessage: {
          text,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem via Evolution API:', error);
      throw error;
    }
  }

  /**
   * Envia uma mídia (imagem, documento, vídeo)
   */
  static async sendMedia(instanceName: string, number: string, base64: string, fileName: string, caption?: string) {
    try {
      const response = await evolutionApi.post(`/message/sendMedia/${instanceName}`, {
        number,
        options: {
          delay: 1200,
          presence: 'composing',
        },
        mediaMessage: {
          mediatype: 'document',
          caption,
          media: base64,
          fileName,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mídia via Evolution API:', error);
      throw error;
    }
  }

  /**
   * Verifica o status de uma instância
   */
  static async getInstanceStatus(instanceName: string) {
    try {
      const response = await evolutionApi.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status da instância:', error);
      throw error;
    }
  }
}
