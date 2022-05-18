module.exports.send = SendMessages

const { Client, LocalAuth, NoAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const path = require('path');
const fs = require('fs');

//Whatsapp magic
function SendMessages(numbersFile, messageToSend, mediaToSend){
    const client = new Client({
        authStrategy: options.localAuth ? new LocalAuth() : new NoAuth(),
        puppeteer: {
            headless: true,
            executablePath: pupPath,
            //executablePath: './.local-chromium/win64-982053/chrome-win/chrome.exe',   //for pkg output win
            //executablePath: './.local-chromium/linux-982053/chrome-linux/chrome',     //for pkg output linux
            //executablePath: '/usr/bin/google-chrome',                                 //for sending videos from chrome caveat //TODO can I use Edge?
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


    client.on('ready', async () => {
        console.log('WWEB READY');
        await client.sendPresenceAvailable();

        let numbersArr;
        try{
            //const numbers = fs.readFileSync(path.resolve('numbers.txt'));
            const numbers = fs.readFileSync(numbersFile);
            numbersArr = numbers.toString().split(",");
        } catch(err){
            console.error(err);
        }

        for(let number of numbersArr) {
            if(number=='')
                continue;
            else{
                let sanitized_number = number.toString().replace(/[- )(+]/g, "");	//numbers already with a prefix	//TODO add numbers without a prefix

                await sendEverything(client, sanitized_number+'@c.us', messageToSend, mediaToSend);   //'@c.us' represents a person's userdId

                //delay to try avoiding ban
                //TODO how much delay?
                await new Promise((resolve, reject) => setTimeout(resolve, randBetween(500, 9000)));	//in ms
                //await new Promise((resolve, reject) => setTimeout(resolve, 5000));	//in ms
            }
        }
        await client.sendPresenceUnavailable();
        await client.destroy(); //TODO why do I need this?
        console.log('ALL DONE!');
    });
}


async function sendEverything(WWebClient, chatId, messageToSend, mediaToSend){
    //if number is not on Whatsapp
    if(! (await WWebClient.isRegisteredUser(chatId))){
        console.log(chatId+': NOT ON WHATSAPP');
    }
    else{
        //if message exists
        if(messageToSend!='')
            await WWebClient.sendMessage(chatId, messageToSend);
        //if media exists
        for(let mediaPath of mediaToSend)
            await WWebClient.sendMessage(chatId, MessageMedia.fromFilePath(mediaPath));

        console.log(chatId+': SENT');
    }
}


function randBetween(min, max) {
	return Math.floor(
	  	Math.random() * (max - min + 1) + min
	)
}