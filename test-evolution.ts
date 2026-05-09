import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function testConnection() {
  console.log(`Testando conexão com: ${EVOLUTION_API_URL}`);
  
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        apikey: EVOLUTION_API_KEY,
      }
    });
    
    console.log('✅ Conexão bem sucedida!');
    console.log('Instâncias encontradas:', response.data);
  } catch (error: any) {
    console.error('❌ Erro na conexão:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Dados:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testConnection();
