const questions=require('./questions');
const WASend=require('./WASend');
const fs=require('fs');
const path=require('path');

process.env.NODE_LAUNCH_MODE = 'native';	//'native'= "node index.js"; 'compiled'=index.exe
global.pupPath='';

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


questions.ask(WASend.send);		//Bootstrap