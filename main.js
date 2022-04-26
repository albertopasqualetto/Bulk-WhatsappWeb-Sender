const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);	//TODO use npm minimist to get args files
const filepath = args[0];

const media = MessageMedia.fromFilePath('./image.png');
fs.readFile(path.resolve('message.txt'), function(err, data) {	//TODO also accept message from args
	if(err) throw err;
	const message = data.toString();
});

//TODO use "Caveat for sending videos and gifs" only if needed with predefined paths to Chrome

//TODO ask to use media and text


const client = new Client({
	authStrategy: new LocalAuth(),
	puppeteer: {
		headless: false,
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
	fs.readFile(path.resolve('numbers.txt'), function(err, data) {
		if(err) throw err;
		var numbersArr = data.toString().split(",");
		for(i in numbersArr) {
			var sanitized_number = numbersArr[i].toString().replace(/[- )(+]/g, "");	//numbers already with a prefix	//TODO add numbers without a prefix
			var chatId=sanitized_number+'@c.us';	//'@c.us' represents a person's userdId

			//if media exists
			client.sendMessage(chatId, media);
			//if message exists
			client.sendMessage(chatId, message);


			console.log('MESSAGE SENT TO '+numbersArr[i]);
		}
		console.log('ALL DONE!')
	});
});



/* client.on('ready', () => {
	console.log('READY');
	client.sendMessage('001234567890@c.us', 'Test message');
	console.log('MESSAGE SENT')
}); */

/* const chatId=number+'@c.us';	//'@c.us' represents a person's userdId
client.sendSeen('001234567890@c.us');
client.sendMessage('001234567890@c.us', 'Test message'); */
