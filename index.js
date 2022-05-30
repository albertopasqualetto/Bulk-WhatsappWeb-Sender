const questions=require('./questions');
const WASend=require('./WASend');
const fs=require('fs');
const path=require('path');
const { platform } = require('os');
const { program } = require('commander');

//process.pkg is true if compiled, false if not 
global.pupPath='';

program
	.name('Bulk-WhatsappWeb-Sender')
	.description('Send bulk messages to a telephone number list')
	.version('1.2.0');

program
	/* .option('-n, --numbers')		//TODO use args options to bypass interaction
	.option('-w, --write-message')
	.option('-r, --read-message')
	.option('-f, --files') */
	.option('-la, --local-auth', 'use LocalAuth authentication mode instead of NoAuth (keep your account logged in)', false)
	.option('-lc, --local-chromium', 'use local Chromium executable instead of installed Chrome', false);

program.parse();
global.options= program.opts();


// TODO download chromium only if needed https://github.com/vercel/pkg/issues/204#issuecomment-333288567
if(process.pkg){
	pupPath=getInternalChromiumPath();
}

if(!options.localChromium){
	//Check if Chrome is installed		//TODO also check Chromium (and Edge?)
	if(fs.existsSync(require('get-google-chrome-path').getGoogleChromePath()))
		pupPath=require('get-google-chrome-path').getGoogleChromePath();
}

/* var numbersFile;
var messageToSend;
var mediaToSend; */

questions.ask(WASend.send);		//Bootstrap

/* await questions.ask();
WASend.send(numbersFile, messageToSend, mediaToSend); */
function getInternalChromiumPath(){
	// return 'C:\Users\alber\Desktop\Bulk-WhatsappWeb-Sender\build\.local-chromium\win64-982053\chrome-win\chrome.exe';
	let execDir=path.join(process.execPath, '..');
	let dirPlatVer=fs.readdirSync(path.join(execDir,'.local-chromium'))[0];		//e.g.: ./.local-chromium
	let dirPlat=fs.readdirSync(path.join(execDir,'.local-chromium',dirPlatVer))[0];	//e.g.: ./.local-chromium/linux-*
	if(process.platform === 'win32')
		return path.join(execDir,'.local-chromium',dirPlatVer,dirPlat,'chrome.exe');	//e.g.: ./.local-chromium/linux-*/chrome-win/chrome.exe
	else if(process.platform === 'linux')
		return path.join(execDir,'.local-chromium',dirPlatVer,dirPlat,'chrome');	//e.g.: ./.local-chromium/linux-*/chrome-linux/chrome
}