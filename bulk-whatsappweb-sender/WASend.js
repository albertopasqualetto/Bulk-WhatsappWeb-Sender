import wwebpkg from 'whatsapp-web.js';
const { MessageMedia } = wwebpkg;

import { createWAClient, destroyClient } from './WAClient.js';
import fs from 'fs';
import cliProgress from 'cli-progress';

import parsePhoneNumber from 'libphonenumber-js';

import mime from 'mime-types';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const log_file = fs.createWriteStream(__dirname + '/log.txt', { flags: 'w' });

const { SingleBar, Presets } = cliProgress;

//Whatsapp magic
export default function sendMessages(numbersFile, messageToSend, mediaToSend) {
  const options = global.options;
  const pupPath = global.pupPath;
  const delayms = global.delayms;

  const client = createWAClient({
    localAuth: options.localAuth,
    headless: process.env.NODE_ENV === 'dev' ? false : true,
    executablePath: pupPath,
  });

  client.on('ready', async () => {
    log('WWEB READY');
    try {
      await client.sendPresenceAvailable();

      let myNumberCountry = parsePhoneNumber("+" + (client.info.wid.user)).country;

      let numbersArr;
      try {
        numbersArr = readNumbersFromFile(numbersFile);
      } catch (err) {
        log(err, true);
        throw err;
      }
      const bar = new SingleBar({
        format: 'Send messages |{bar}| {value}/{total} {percentage}% | ETA: {eta_formatted} | {suffix}',
        hideCursor: true,
      }, Presets.shades_classic);

      let sentCount = 0;
      let failedCount = 0;

      const suffix = () => `sent:${sentCount} failed:${failedCount}`;

      bar.start(Math.max(numbersArr.length, 1), 0, { suffix: suffix() });

      for (const [idx, number] of numbersArr.entries()) {
        let parsed_number = parseNumber(number, myNumberCountry);
        if (parsed_number === null) {
          failedCount += 1;
          log(number + ": INVALID NUMBER", true);
          bar.increment(1, { suffix: suffix() });
          continue;
        }

        try {
          const success = await sendEverything(client, parsed_number + "@c.us", messageToSend, mediaToSend);
          if (success) sentCount += 1;
          else failedCount += 1;
        } catch (err) {
          failedCount += 1;
          log(err, true);
        }

        bar.increment(1, { suffix: suffix() });

        const isLast = idx === numbersArr.length - 1;
        if (!isLast) {
          await new Promise((resolve) => setTimeout(resolve, randBetween(delayms[0], delayms[1])));
        }
      }

      bar.update(numbersArr.length, { suffix: suffix() });
      bar.stop();

      await client.sendPresenceUnavailable();
      log('ALL DONE!');
    } catch (err) {
      log(err, true);
    } finally {
      await destroyClient(client);
    }
  });
}

function readNumbersFromFile(numbersFile) {
  const content = fs.readFileSync(numbersFile).toString();
  const isVcf = String(numbersFile).toLowerCase().endsWith('.vcf') || /BEGIN:VCARD/i.test(content);

  let rawNumbers = [];

  if (isVcf) {
    rawNumbers = extractNumbersFromVcf(content);
  } else {
    rawNumbers = extractNumbersFromText(content);
  }
  return rawNumbers.map((n) => String(n).trim()).filter(Boolean);
}

function extractNumbersFromText(content) {
  // Backward compatible: supports comma-separated and newline-separated lists.
  return content.split(/,|\r?\n/);
}

function extractNumbersFromVcf(vcfContent) {
  // Unfold RFC6350 folded lines: CRLF + (space/tab) indicates continuation.
  const unfolded = vcfContent.replace(/\r?\n[\t ]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const numbers = [];

  for (const line of lines) {
    const match = /^TEL[^:]*:(.*)$/i.exec(line);
    if (!match) continue;

    let value = (match[1] ?? '').trim();
    if (!value) continue;

    // Common forms: tel:+123..., TEL;TYPE=CELL:+123..., TEL;VALUE=uri:tel:+123...
    value = value.replace(/^tel:/i, '');
    value = value.replace(/^uri:tel:/i, '');

    numbers.push(value);
  }

  return numbers;
}


async function sendEverything(WWebClient, chatId, messageToSend, mediaToSend) {
  //if number is not on Whatsapp
  if (!(await WWebClient.isRegisteredUser(chatId))) {
    log(chatId.split('@c.us')[0] + ": NOT ON WHATSAPP");
    return false;
  }
  else {
    let thisChat = await WWebClient.getChatById(chatId);

    //send seen
    await thisChat.sendSeen();

    //send "typing..."
    await thisChat.sendStateTyping();

    const hasText = typeof messageToSend === 'string' && messageToSend.trim() !== '';
    const hasMedia = Array.isArray(mediaToSend) && mediaToSend.length > 0;

    if (hasMedia) {
      for (let mediaPath of mediaToSend) {
        const isVideo = mime.lookup(mediaPath).startsWith('video');
        const sendOptions = {};

        if (hasText)
          sendOptions.caption = messageToSend;
        if (isVideo)
          sendOptions.sendMediaAsDocument = true;   // Workaround for library issue with videos

        await thisChat.sendMessage(MessageMedia.fromFilePath(mediaPath), sendOptions);
      }
    }
    else if (hasText) {
      await thisChat.sendMessage(messageToSend);
    }

    log(chatId.split('@c.us')[0] + ": SENT");
    return true;
  }
}

function parseNumber(number, country) {
  try {
    let parsed = parsePhoneNumber(number, country);
    return parsed.number.toString().replace(/[- )(+]/g, '');    //clean number
  } catch (err) {
    log(err, true);
    return null;
  }
}


function log(msg, error = false) {
  let today = new Date();
  let formattedDateTime = '[' + today.toISOString().slice(0, 19).replace('T', ' ') + '] ';

  if (!error) {
    console.log(formattedDateTime + "INFO: " + msg);
    log_file.write(formattedDateTime + "INFO: " + msg + '\n');
  }
  else {
    console.error(formattedDateTime + "ERROR: " + msg);
    log_file.write(formattedDateTime + "ERROR: " + msg + '\n');
  }
}


function randBetween(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}
