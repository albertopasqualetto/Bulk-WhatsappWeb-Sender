import os from 'os';
import path from 'path';
import { getChromiumPath } from 'browser-paths';
import acceptedRevs from './node_modules/puppeteer-core/lib/cjs/puppeteer/revisions.js';
import { install } from '@puppeteer/browsers';
import * as url from 'url';

export function detectCompiledRuntime(importMetaUrl) {
  const __dirname = url.fileURLToPath(new URL('.', importMetaUrl));
  return __dirname.startsWith(path.join(os.tmpdir(), 'caxa'));
}

export async function resolvePuppeteerExecutablePath({ compiled, localChromium }) {
  if (compiled) {
    return await downloadLocalChromium();
  }

  if (localChromium) {
    return ''; // repo convention: empty string means “use system default”
  }

  return (await getChromiumPath()) || (await downloadLocalChromium());
}

async function downloadLocalChromium() {
  console.log('Downloading Chromium...');
  const browserVersion = acceptedRevs.PUPPETEER_REVISIONS.chrome;
  console.log(`Installing Chromium version: ${browserVersion}`);

  const browser = await install({
    browser: 'chrome',
    buildId: browserVersion,
  });

  return browser.executablePath;
}
