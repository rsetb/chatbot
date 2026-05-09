import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = Number(process.env.PORT) || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Entrar em uma sala específica de um ticket
    socket.on('joinTicket', (ticketId) => {
      socket.join(`ticket-${ticketId}`);
      console.log(`Socket ${socket.id} joined ticket-${ticketId}`);
    });

    // Quando o agente envia uma mensagem
    socket.on('sendMessage', (data) => {
      // Aqui integrariamos com o banco e a Evolution API
      // e depois enviariamos para a sala
      io.to(`ticket-${data.ticketId}`).emit('newMessage', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Globalizar io para ser usado nos Webhooks
  (global as any).io = io;

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
