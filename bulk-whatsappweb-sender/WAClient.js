import wwebpkg from 'whatsapp-web.js';
const { Client, LocalAuth, NoAuth } = wwebpkg;

import qrcode from 'qrcode-terminal';

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
  });

  client.on('disconnected', (reason) => {
    console.error('WWEB DISCONNECTED' + (reason ? `: ${reason}` : ''));
  });

  // Always initialize as part of client creation.
  client.initialize();

  return client;
}
