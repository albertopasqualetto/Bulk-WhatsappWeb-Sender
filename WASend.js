module.exports.send = SendMessages

const { Client, LocalAuth, NoAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const path = require('path');
const fs = require('fs');

var log_file = fs.createWriteStream(__dirname + '/log.txt', {flags : 'w'});

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
        log('WWEB AUTHENTICATION FAILURE'+msg, true);
    });


    client.on('ready', async () => {
        log('WWEB READY');
        await client.sendPresenceAvailable();

        let numbersArr;
        try{
            //const numbers = fs.readFileSync(path.resolve('numbers.txt'));
            const numbers = fs.readFileSync(numbersFile);
            numbersArr = numbers.toString().split(",");
        } catch(err){
            log(err,true);
        }

        for(let number of numbersArr) {
            if(number=='')
                continue;
            else{
                let sanitized_number = number.toString().replace(/[- )(+]/g, "");	//numbers already with a prefix	//TODO add numbers without a prefix

                await sendEverything(client, sanitized_number+'@c.us', messageToSend, mediaToSend);   //'@c.us' represents a person's userdId

                //delay to try avoiding ban
                await new Promise((resolve, reject) => setTimeout(resolve, randBetween(delay[0], delay[1])));	//in ms
                //await new Promise((resolve, reject) => setTimeout(resolve, 5000));	//in ms
            }
        }
        await client.sendPresenceUnavailable();
        await client.destroy(); //TODO why do I need this?
        log('ALL DONE!');
    });
}


async function sendEverything(WWebClient, chatId, messageToSend, mediaToSend){
    //if number is not on Whatsapp
    if(! (await WWebClient.isRegisteredUser(chatId))){
        log(chatId+': NOT ON WHATSAPP');
    }
    else{
        let thisChat = await WWebClient.getChatById(chatId);

        //send seen
        await thisChat.sendSeen();

        //send "typing..."
        await thisChat.sendStateTyping();

        //if message exists
        if(messageToSend!='')
            await thisChat.sendMessage(messageToSend);
        //if media exists
        for(let mediaPath of mediaToSend)
            await thisChat.sendMessage(MessageMedia.fromFilePath(mediaPath));

        log(chatId+': SENT');
    }
}

function log(msg, error=false) {
    let today=new Date();
    let formattedDateTime='['+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()+'] ';

    if(!error){
        console.log(msg);
        log_file.write(formattedDateTime+'INFO: '+msg+'\n');
    }
    else{
        console.error(msg);
        log_file.write(formattedDateTime+'ERROR: '+msg+'\n');
    }
}


function randBetween(min, max) {
	return Math.floor(
	  	Math.random() * (max - min + 1) + min
	)
}