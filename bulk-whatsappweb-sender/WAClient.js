import wwebpkg from 'whatsapp-web.js';
const { Client, LocalAuth, NoAuth } = wwebpkg;

import qrcode from 'qrcode-terminal';

// Track active clients for cleanup on process exit
const activeClients = new Set();

export function createWAClient({
  localAuth = false,
  headless = true,
  executablePath = '',
} = {}) {
  const client = new Client({
    authStrategy: localAuth ? new LocalAuth() : new NoAuth(),
    puppeteer: {
      headless,
      executablePath,
    },
  });

  activeClients.add(client);

  // Always print QR if the library emits it.
  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
  });

  // Centralized lifecycle hooks (callers can still attach their own listeners).
  client.on('authenticated', () => {
    console.log('WWEB AUTHENTICATED');
  });

  client.on('auth_failure', (msg) => {
    console.error('WWEB AUTHENTICATION FAILURE' + (msg ? `: ${msg}` : ''));
    destroyClient(client);
  });

  client.on('disconnected', (reason) => {
    console.error('WWEB DISCONNECTED' + (reason ? `: ${reason}` : ''));
    destroyClient(client);
  });

  // Always initialize as part of client creation.
  client.initialize();

  return client;
}

export async function destroyClient(client) {
  try {
    await client.destroy();
  } catch (err) {
    console.error('Error destroying client:', err);
  }
  activeClients.delete(client);
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Cleaning up...`);
  await Promise.all([...activeClients].map(c => destroyClient(c)));
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
