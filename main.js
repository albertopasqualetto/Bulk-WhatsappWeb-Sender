const { Client, LocalAuth } = require('whatsapp-web.js');

const qrcode = require('qrcode-terminal');


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
	console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
	console.log('READY');
	client.sendMessage('001234567890@c.us', 'Test message');
	console.log('MESSAGE SENT')
});


//const number='001234567890';
//const chatId=number+"@c.us";
//client.sendSeen('001234567890@c.us');
//client.sendMessage('001234567890@c.us', 'Test message');
