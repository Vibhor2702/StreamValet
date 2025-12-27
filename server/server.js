const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const connectMongo = require('./config/mongo');
const { corsOptions } = require('./middlewares/security');
const { seed } = require('./scripts/seed');

async function bootstrap() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ .env file missing! Copy .env.example to .env to fix.');
  }


  await connectMongo();
  await seed({ ensureConnection: false });

  const server = http.createServer(app);
  // Serve thumbnails statically (YouTube Studio style requirement)
  app.use('/thumbnails', require('express').static(path.join(__dirname, 'thumbnails')));

  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
    },
  });

  app.set('io', io);

  // Set server timeout to 2 minutes for large uploads
  server.setTimeout(120000);

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log('Socket connected', socket.id);
  });

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
