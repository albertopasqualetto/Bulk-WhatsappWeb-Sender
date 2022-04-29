const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt');
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);
//const questions = require('./questions').askInput();

/* var argv = require('minimist')(process.argv.slice(2), {
	//string: 'lang',		// --lang xml
	boolean: ['text'],		// --text, -t
	boolean: ['image'],		// --image, -i
	boolean: ['audio'],		// --audio, -a
	boolean: ['video'],		// --video, -v
	alias: { t: 'text', i:'image', v:'video', a:'audio' }
}); */
// image/* video/* text/* audio/*

//var flagMessage=true;
/* var messageToSend='';
var mediaToSend=[];
var numbersFile=''; */


//TODO use "Caveat for sending videos and gifs" only if needed with predefined paths to Chrome
console.log('Videos and gifs are currently not supported');

var numbersFile='';
var messageToSend='';
var mediaToSend=[];

require('run-series')([
	function (callback){
		//Ask message and media
		answers= inquirer
		.prompt([
			{
				type: 'file-tree-selection',
				name: 'numbers',
				message: "Select the file with telephone numbers (They must be written with county code as a prefix and comma(,) separated) (Select with \'Space\' and confirm with \'Enter\'):",	//Implement sending all media in a folder
			},
			{
				type: 'input',
				name: 'message',
				message: "Insert the text you want to send (Then press Enter):",
				validate(input) {
					if (/\S/g.test(input))
						return true;
					else{
						flagMessage=false;
						return true;
					}
				},
			},
			{
				type: 'file-tree-selection',
				name: 'media',
				message: "Select which files/media you want to send (Do not select entire folders) (Select with \'Space\' and confirm with \'Enter\'):",	//Implement sending all media in a folder
				multiple: true,
			},
		])
		.then((answers) => {
			numbersFile=answers.numbers;
			messageToSend=answers.message;
			mediaToSend=answers.media;
		});
		//TODO something to catch?

		//console.log(answers);

		callback(null, 'asked');
	},
	function (callback){
		//Whatsapp magic
		const client = new Client({
			authStrategy: new LocalAuth(),
			puppeteer: {
				headless: false,
				//executablePath: './.local-chromium/linux-982053/chrome-linux/chrome',		//for pkg output
				//executablePath: '/usr/bin/google-chrome'
			}
		});

		client.initialize();

		client.on('qr', (qr) => {
			// NOTE: This event will not be fired if a session is specified.
			qrcode.generate(qr, {small: true});
		});

		client.on('auth_failure', msg => {
			// Fired if session restore was unsuccessful
			console.error('WWEB AUTHENTICATION FAILURE', msg);
		});


		client.on('ready', () => {
			console.log('WWEB READY');
			client.sendPresenceAvailable();

			try{
				//const numbers = fs.readFileSync(path.resolve('numbers.txt'));
				const numbers = fs.readFileSync(numbersFile);

				var numbersArr = numbers.toString().split(",");
				for(i in numbersArr) {
					if(numbersArr[i]=='')
						continue;
					var sanitized_number = numbersArr[i].toString().replace(/[- )(+]/g, "");	//numbers already with a prefix	//TODO add numbers without a prefix
					var chatId=sanitized_number+'@c.us';	//'@c.us' represents a person's userdId

					if(!client.isRegisteredUser(chatId)){
						console.timeLog(numbersArr[i]+' IS NOT ON WHATSAPP');
						continue;
					}

					//if message exists
					if(messageToSend!='')
						client.sendMessage(chatId, messageToSend);
					//if media exists
					(mediaToSend).forEach(mediaPath => {
						client.sendMessage(chatId, MessageMedia.fromFilePath(mediaPath));
					});
					
					console.log('MESSAGE SENT TO '+numbersArr[i]);
					
					//TODO how much delay?
					//delay to try avoiding ban
					new Promise(resolve => setTimeout(resolve, randBetween(500,4500)))	//in ms
				}
				client.sendPresenceUnavailable();
				console.log('ALL DONE!');
			} catch(err){
				console.error(err);
			}
		});
		callback(null,'wa');
	}
]);


/* //Ask message and media
answers= inquirer
        .prompt([
            {
                type: 'file-tree-selection',
                name: 'numbers',
                message: "Select the file with telephone numbers (They must be written with county code as a prefix and comma(,) separated) (Select with \'Space\' and confirm with \'Enter\'):",	//Implement sending all media in a folder
            },
            {
                type: 'input',
                name: 'message',
                message: "Insert the text you want to send (Then press Enter):",
                validate(input) {
                    if (/\S/g.test(input))
                        return true;
                    else{
                        flagMessage=false;
                        return true;
                    }
                },
            },
            {
                type: 'file-tree-selection',
                name: 'media',
                message: "Select which files/media you want to send (Do not select entire folders) (Select with \'Space\' and confirm with \'Enter\'):",	//Implement sending all media in a folder
                multiple: true,
            },
        ])
        .then((answers) => {
            //messageToSend=answers.message;
            //mediaToSend=answers.media;
            //numbersFile=answers.numbers;
        });
    //TODO something to catch?

console.log(answers); */


/* //Whatsapp magic
const client = new Client({
	authStrategy: new LocalAuth(),
	puppeteer: {
		headless: false,
		//executablePath: './.local-chromium/linux-982053/chrome-linux/chrome',		//for pkg output
		//executablePath: '/usr/bin/google-chrome'
	}
});

client.initialize();

client.on('qr', (qr) => {
	// NOTE: This event will not be fired if a session is specified.
	qrcode.generate(qr, {small: true});
});

client.on('auth_failure', msg => {
	// Fired if session restore was unsuccessful
	console.error('WWEB AUTHENTICATION FAILURE', msg);
});


client.on('ready', () => {
	console.log('WWEB READY');
	client.sendPresenceAvailable();

	try{
		//const numbers = fs.readFileSync(path.resolve('numbers.txt'));
		const numbers = fs.readFileSync(numbersFile);

		var numbersArr = numbers.toString().split(",");
		for(i in numbersArr) {
			var sanitized_number = numbersArr[i].toString().replace(/[- )(+]/g, "");	//numbers already with a prefix	//TODO add numbers without a prefix
			var chatId=sanitized_number+'@c.us';	//'@c.us' represents a person's userdId

			if(!client.isRegisteredUser(chatId)){
				console.timeLog(numbersArr[i]+' IS NOT ON WHATSAPP');
				continue;
			}

			//if message exists
			if(messageToSend)
				client.sendMessage(chatId, messageToSend);
			//if media exists
			mediaToSend.forEach(media => {
				client.sendMessage(chatId, media);
			});
			
			console.log('MESSAGE SENT TO '+numbersArr[i]);
			
			//TODO how much delay?
			//delay to try avoiding ban
			new Promise(resolve => setTimeout(resolve, randBetween(500,4500)))	//in ms
		}
		client.sendPresenceUnavailable();
		console.log('ALL DONE!')
	} catch(err){
		console.error(err);
	}
}); */



/* Returns a random number between min (inclusive) and max (inclusive) */
function randBetween(min, max) {  
	return Math.floor(
	  	Math.random() * (max - min + 1) + min
	)
}

/* client.on('ready', () => {
	console.log('READY');
	client.sendMessage('001234567890@c.us', 'Test message');
	console.log('MESSAGE SENT')
}); */

/* const chatId=number+'@c.us';	//'@c.us' represents a person's userdId
client.sendSeen('001234567890@c.us');
client.sendMessage('001234567890@c.us', 'Test message'); */
