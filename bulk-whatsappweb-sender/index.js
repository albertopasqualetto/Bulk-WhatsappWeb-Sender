//TODO use baileys?
import askInput from "./questions.js";
import sendMessages from "./WASend.js";

// import fs from 'fs';     // was used in pkg compilation
import { program } from 'commander';
import packageJSON from './package.json' with { type: "json" };
import { detectCompiledRuntime, resolvePuppeteerExecutablePath } from './puppeteerSetup.js';
import pressAnyKey from 'press-any-key';

// process.env.CAXA is true if compiled, undefined if no NO
global.pupPath = '';        // '' means that the path is the default one
global.delayms = [30000, 50000];

// used in compilation
global.compiled = detectCompiledRuntime(import.meta.url);


program
  // .name('Bulk-WhatsappWeb-Sender')
  .name('npm run start')
  .description('Send bulk messages to a telephone number list. \nStart and then follow the instructions.')
  .version(packageJSON.version);

program
  .option('-n, --numbers <numbersFile>', 'pass numbers file as a parameter')
  .option('-m, --message [msg]', 'write message directly as a parameter, overwrites \'--text-file\'')
  .option('-M, --no-message', 'do not send text, overwrites \'--message\' and \'--text-file\'')
  .option('-t, --text-file [textFile]', 'pass message to send as a file')
  .option('-f, --files [mediaFiles...]', 'pass media to send with their path')
  .option('-F, --no-files', 'do not send files, overwrites \'--files\'')
  .option('-d, --low-delay', 'send messages with a low delay, use this if you are confident that you won\'t be banned')
  .option('-D, --high-delay', 'send messages with a high delay, use this if you are sending from a new/unused number (high probability of being banned)')
  .option('-a, --local-auth', 'use LocalAuth authentication mode instead of NoAuth (keep your account logged in)', false)
  .option('-c, --local-chromium', 'use local Chromium executable instead of installed Chrome', false);

program.parse();
const options = program.opts();
global.options = options;

if (options.lowDelay) {
  global.delayms = [500, 9000];
}
else if (options.highDelay) {
  global.delayms = [60000, 600000];
}

global.pupPath = await resolvePuppeteerExecutablePath({
  compiled: global.compiled,
  localChromium: options.localChromium,
});


askInput(sendMessages);   //Bootstrap


if (global.compiled)
  pressAnyKey("Press any key to exit...");  //TODO DOES NOT WAIT!
