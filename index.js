const questions=require('./questions');
const WASend=require('./WASend');
const fs=require('fs');
const path=require('path');
const { program } = require('commander');

process.env.NODE_LAUNCH_MODE = 'native';	//'native'= "node index.js"; 'compiled'=index.exe
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


// TODO download chromium only if needed
if(!options.localChromium){
	//Check if chrome is installed
	fs.access(require('get-google-chrome-path').getGoogleChromePath(), fs.constants.F_OK, (err) => {
		if(err){
			if(process.env.NODE_LAUNCH_MODE === 'compiled'){
				let dirPlatVer=fs.readdirSync(path.join(__dirname,'.local-chromium'));		//e.g.: ./.local-chromium
				let dirPlat=fs.readdirSync(path.join(__dirname,'.local-chromium',dirPlatVer));	//e.g.: ./.local-chromium/linux-*
				pupPath=path.join(__dirname,'.local-chromium',dirPlatVer,dirPlat,'chrome')	//e.g.: ./.local-chromium/linux-*/chrome-linux/chrome
			}
			//else pupPath=''
		}
		else{
			pupPath=require('get-google-chrome-path').getGoogleChromePath();
		}
	});
}

/* var numbersFile;
var messageToSend;
var mediaToSend; */

questions.ask(WASend.send);		//Bootstrap

/* await questions.ask();
WASend.send(numbersFile, messageToSend, mediaToSend); */