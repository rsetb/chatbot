# Chatbot Multi - Sistema de Multiatendimento para WhatsApp

Este é um sistema completo de multiatendimento para WhatsApp, integrado com a Evolution API. Permite que múltiplos atendentes gerenciem conversas simultâneas em uma única interface web.

## 🚀 Funcionalidades

- **Caixa de Entrada Unificada**: Interface intuitiva similar ao WhatsApp Web para gerenciar conversas.
- **Múltiplos Dispositivos**: Suporte a várias instâncias do WhatsApp através da Evolution API.
- **WebSockets em Tempo Real**: Mensagens recebidas e enviadas atualizam instantaneamente na tela do usuário usando Socket.io.
- **Distribuição de Atendimento**: Criação de filas e departamentos. Transferência de chats entre atendentes.
- **Respostas Rápidas**: Atalhos pré-cadastrados para agilizar o atendimento.
- **Gestão de Etiquetas**: Organize conversas usando tags personalizadas.
- **Autenticação e Permissões**: Sistema de login com NextAuth (Admin, Supervisor e Atendente).

## 🛠️ Tecnologias Utilizadas

- **Frontend/Backend**: Next.js 14 (App Router)
- **Estilização**: Tailwind CSS + Lucide Icons
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Tempo Real**: Socket.io + Servidor Node customizado
- **Integração WhatsApp**: Evolution API (via Webhooks e Endpoints)
- **Autenticação**: NextAuth.js com JWT e Bcrypt

## ⚙️ Pré-requisitos

1. **Node.js** (v18+)
2. **PostgreSQL** (Rodando localmente ou na nuvem)
3. **Evolution API** instalada (ex: via EasyPanel na VPS)

## 📦 Como Instalar e Rodar

1. Clone o repositório ou acesse a pasta do projeto.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env`:
   Crie um arquivo `.env` na raiz do projeto e defina as variáveis:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/chatbot_multi?schema=public"
   NEXTAUTH_SECRET="seu-segredo-super-seguro"
   NEXTAUTH_URL="http://localhost:3000"
   EVOLUTION_API_URL="http://ip-da-sua-vps:8080"
   EVOLUTION_API_KEY="sua-api-key-global"
   ```
4. Execute as migrations do banco de dados:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Inicie o servidor de desenvolvimento (que roda junto com o Socket.io):
   ```bash
   npm run dev
   ```
6. Acesse `http://localhost:3000` no navegador.

## 📖 Manual do Usuário (Resumo)

### 1. Administradores
- Têm acesso a todas as abas. Podem criar novos usuários (atendentes/supervisores), criar departamentos, cadastrar instâncias do WhatsApp (Evolution API) e ver relatórios globais.

### 2. Supervisores
- Podem ver o desempenho dos atendentes de seus departamentos e transferir tickets livremente, além de auditar conversas.

### 3. Atendentes
- Ao fazer login, são direcionados para a aba de **Atendimentos**.
- Na barra lateral esquerda, visualizam as conversas atribuídas a eles.
- Podem usar a caixa de texto inferior para responder aos clientes, enviar mídias (clicando no ícone do clipe) e usar o atalho `/` para respostas rápidas.
- Para transferir um atendimento, basta clicar nos três pontos verticais (canto superior direito do chat) e selecionar "Transferir".

## 🔌 Configurando a Evolution API

Para que o sistema receba mensagens, você precisa configurar um Webhook na sua instância da Evolution API apontando para:
`http://seu-dominio.com/api/webhooks/evolution`

Eventos necessários: `messages.upsert`, `connection.update`.

## 🧪 Testes

Para rodar os testes unitários (Vitest/Jest - a ser configurado):
```bash
npm run test
```

---
*Desenvolvido seguindo as melhores práticas de Clean Code e arquitetura modular.*
