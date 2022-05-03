module.exports.send = SendMessages

const { Client, NoAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const path = require('path');
const fs = require('fs');

//Whatsapp magic
function SendMessages(numbersFile, messageToSend, mediaToSend){
    const client = new Client({
        authStrategy: new NoAuth(),
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
                
                console.log('SENDING MESSAGE TO '+numbersArr[i]);   //TODO write log once message is sent
                
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
}


function randBetween(min, max) {  
	return Math.floor(
	  	Math.random() * (max - min + 1) + min
	)
}