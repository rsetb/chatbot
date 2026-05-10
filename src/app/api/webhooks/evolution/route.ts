import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Importaremos o io futuramente para emitir via Socket.io

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook Evolution Recebido:', JSON.stringify(body, null, 2));

    const { event, instance, data } = body;

    // Tratamento para nova mensagem recebida
    if (event === 'messages.upsert') {
      const messageData = data.messages[0];
      
      // Ignorar mensagens enviadas por você mesmo ou de status
      if (!messageData || messageData.key.fromMe || messageData.key.remoteJid === 'status@broadcast') {
        return NextResponse.json({ success: true });
      }

      const remoteJid = messageData.key.remoteJid;
      const number = remoteJid.split('@')[0];
      const messageId = messageData.key.id;
      
      // Extrair o texto da mensagem (pode variar dependendo do tipo da mensagem)
      const text = messageData.message?.conversation || 
                   messageData.message?.extendedTextMessage?.text || 
                   'Mensagem multimídia ou não suportada';

      // 1. Encontrar ou criar o contato
      let contact = await prisma.contact.findUnique({
        where: { number },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            number,
            name: messageData.pushName || number,
          },
        });
      } else if (messageData.pushName && contact.name !== messageData.pushName) {
        // Atualiza o nome quando pushName chegar diferente do registrado
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: { name: messageData.pushName },
        });
      }

      // 2. Verificar a instância
      let instanceRecord = await prisma.instance.findUnique({
        where: { instanceId: instance },
      });

      if (!instanceRecord) {
        instanceRecord = await prisma.instance.create({
          data: {
            name: instance,
            instanceId: instance,
            status: 'CONNECTED',
          },
        });
      }

      // 3. Encontrar um ticket aberto para este contato, se não, criar um
      let ticket = await prisma.ticket.findFirst({
        where: {
          contactId: contact.id,
          status: {
            in: ['PENDING', 'OPEN'],
          },
        },
      });

      if (!ticket) {
        ticket = await prisma.ticket.create({
          data: {
            contactId: contact.id,
            instanceId: instanceRecord.id,
            status: 'PENDING',
          },
        });
      }

      // 4. Salvar a mensagem no banco
      const message = await prisma.message.create({
        data: {
          messageId,
          body: text,
          fromMe: false,
          ticketId: ticket.id,
        },
      });

      // 5. Emitir via Socket.io para o Frontend atualizar em tempo real
      const io = (global as any).io;
      if (io) {
        io.to(`ticket-${ticket.id}`).emit('newMessage', { ticket, message, contact });
        io.emit('globalUpdate', { ticket, message, contact });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no Webhook da Evolution API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
