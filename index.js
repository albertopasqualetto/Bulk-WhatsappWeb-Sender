const questions=require('./questions');
const WASend=require('./WASend');
const fs=require('fs');
const path=require('path');
const { platform } = require('os');
const { program } = require('commander');

//process.pkg is true if compiled, false if not 
global.pupPath='';
global.delay = [30000, 50000];


program
	.name('Bulk-WhatsappWeb-Sender')
	.description('Send bulk messages to a telephone number list')
	.version(require('./package.json').version);

program
	.option('-n, --numbers <numbersFile>', 'pass numbers file as a parameter')
	.option('-m, --message [msg]', 'write message directly as a parameter, overwrites \'--text-file\'')
	.option('-M, --no-message', 'do not send text, overwrites \'--message\' and \'--text-file\'')
	.option('-t, --text-file [textFile]', 'pass message to send as a file')
	.option('-f, --files [mediaFiles...]', 'pass media to send with their path')
	.option('-F, --no-files', 'do not send files, overwrites \'--files\'')
	.option('-d, --low-delay', 'send messages with a low delay')
	.option('-D, --high-delay', 'send messages with a high delay')
	.option('-la, --local-auth', 'use LocalAuth authentication mode instead of NoAuth (keep your account logged in)', false)
	.option('-lc, --local-chromium', 'use local Chromium executable instead of installed Chrome', false);

program.parse();
global.options= program.opts();

if(options.lowDelay){
	DELAY = [500, 9000];
}
else if(options.highDelay){
	DELAY = [60000, 600000];
}

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
var filesToSend; */

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