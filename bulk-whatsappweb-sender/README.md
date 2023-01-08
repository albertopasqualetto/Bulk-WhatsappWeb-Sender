# bulk-whatsappweb-sender

This tool permits people to send WhatsApp messages in bulk through WhatsApp Web with a nice CLI interface.

**This software is not completely reliable and tested!**

Actually there are [some bans reported by users](https://github.com/pedroslopez/whatsapp-web.js/issues/1872), so use it at your own risk!!

## How to

Clone the repo, decompress it, open a terminal in the folder and start the program with `npm run start`, then follow the instructions.

Numbers without country prefix fallback on the same country prefix of the sender number.

Use `--help` flag to see all the command line options.

:x: It is able to send videos only if Google Chrome is installed (not sure if Edge and other browsers are supported).

:x: It is not able to send gifs and to send all the content of a folder.

:x: It can only send videos with a maximum size of 16MB and documents with a maximum size of 100MB.

:x: Temporarily videos are sent as documents (with 100MB limit).

This is based on the beautiful [whatsapp-web.js node package](https://github.com/pedroslopez/whatsapp-web.js).

## Build (with CAXA)

To create an executable in order to use it on a computer without Node.js installed.

You need to have [Node.js](https://nodejs.org/) installed.

Then, open a terminal in the project folder and run `npm install` and `npm run build`.

It will be slow.

## Disclaimer
This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at https://whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

I am not responsible for any ban caused by this software.
Read [this](https://faq.whatsapp.com/1104252539917581/?locale=en_US) article to try to avoiding bans.