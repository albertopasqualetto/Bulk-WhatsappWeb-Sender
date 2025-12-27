import fs from 'fs';
import path from 'path';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { pathToFileURL } from 'url';
import cliProgress from 'cli-progress';

import { createWAClient } from './WAClient.js';
import { detectCompiledRuntime, resolvePuppeteerExecutablePath } from './puppeteerSetup.js';

const { SingleBar, Presets } = cliProgress;

const listOnly = process.argv.includes('--list');

function normalizeNumber(raw) {
  const tel = raw.replace(/@.*/, '');
  let parsed = parsePhoneNumberFromString(tel);
  if (!parsed && !tel.startsWith('+')) parsed = parsePhoneNumberFromString(`+${tel}`);
  return parsed ? parsed.number : tel;
}

function toVCard(numbersWithNames) {
  return numbersWithNames
    .map((item) => {
      const displayName = item.name || item.num;
      let vcard = `BEGIN:VCARD\nVERSION:4.0\nFN:${displayName}\nTEL;TYPE=CELL:${item.num}`;
      if (item.photo) {
        vcard += `\nPHOTO;MEDIATYPE=image/jpeg:${item.photo}`;
      }
      vcard += `\nPRODID:-//WhatsApp Web Contacts Export//EN\nEND:VCARD`;
      return vcard;
    })
    .join('\n');
}

async function getAllNumbers(WWebClient, { outputDir }) {
  const chats = await WWebClient.getChats();
  const contactMap = new Map();

  const bar = new SingleBar({
    format: 'Export contacts |{bar}| {value}/{total} {percentage}% | ETA: {eta_formatted} | {suffix}',
    hideCursor: true,
  }, Presets.shades_classic);
  bar.start(Math.max(chats.length, 1), 0, { suffix: 'contacts:0' });

  for (const chat of chats) {
    // Skip group chats - only process direct chats
    if (chat.isGroup) {
      console.log(`${chat.name} is a group, skipping`);
      bar.increment(1, { suffix: `contacts:${contactMap.size}` });
      continue;
    }

    const contact = await chat.getContact();
    if (!contact || !contact.id) {
      console.log('Could not get contact info for chat');
      bar.increment(1, { suffix: `contacts:${contactMap.size}` });
      continue;
    }

    // Use the serialized ID which is more reliable
    const id = contact.id._serialized;
    const normalizedNumber = normalizeNumber(id);
    const name = contact.name || contact.verifiedName || contact.pushname || null;

    if (!contactMap.has(normalizedNumber)) {
      let photo = null;
      try {
        photo = await contact.getProfilePicUrl();
      } catch {
        // Profile picture not available
      }
      contactMap.set(normalizedNumber, { name, photo });
    }
    console.log(normalizedNumber);

    bar.increment(1, { suffix: `contacts:${contactMap.size}` });
  }

  bar.update(bar.getTotal(), { suffix: `contacts:${contactMap.size}` });
  bar.stop();

  const listWithNames = Array.from(contactMap.entries()).map(([num, details]) => ({
    num,
    name: details.name,
    photo: details.photo,
  }));

  if (listOnly) {
    const list = Array.from(contactMap.keys());
    const txtContent = list.join(',');
    fs.writeFileSync(path.join(outputDir, 'contacts.txt'), txtContent);
    console.log(`Wrote ${list.length} numbers to contacts.txt`);
    return;
  }

  const vcard = toVCard(listWithNames);
  fs.writeFileSync(path.join(outputDir, 'contacts.vcf'), vcard);
  console.log(`Wrote ${listWithNames.length} contacts to contacts.vcf`);
}

export async function exportContacts({ outputDir = process.cwd() } = {}) {
  const compiled = detectCompiledRuntime(import.meta.url);
  const executablePath = await resolvePuppeteerExecutablePath({
    compiled,
    localChromium: false,
  });

  const client = createWAClient({
    localAuth: true,
    headless: true,
    executablePath,
  });

  client.on('ready', async () => {
    console.log('Client is ready!');
    try {
      client.sendPresenceAvailable();
      await getAllNumbers(client, { outputDir });
      client.sendPresenceUnavailable();
      await client.destroy();
      process.exit(0);
    } catch (err) {
      console.error(err);
      try {
        await client.destroy();
      } catch {
        // ignore
      }
      process.exit(1);
    }
  });
}

// Run as a script
const isDirectRun = (() => {
  try {
    return pathToFileURL(process.argv[1]).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  exportContacts();
}
