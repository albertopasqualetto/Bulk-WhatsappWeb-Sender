module.exports.ask = askInput;

const inquirer = require('inquirer');
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt');
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

const fs = require('fs');

//Ask message and media
function askInput(callback){
    inquirer
        .prompt([
            {
                type: 'file-tree-selection',
                name: 'numbers',
                message: "Select the file with telephone numbers (They must be written with country code as a prefix and comma(,) separated) (Confirm with \'Enter\'):",
                when: (typeof options.numbers === 'undefined')
            },
            {
                type: 'input',    //TODO substitute with type editor?
                name: 'message',
                message: "Insert the text you want to send (Formatting: *bold*, _italic_, ~strikethrough~, ```monospace```; no new line admitted; you can also add emojis)\n(Then press \'Enter\'):",
                /* validate(input) {            //TODO to remove?
                    if (/\S/g.test(input))
                        return true;
                    else{
                        flagMessage=false;
                        return true;
                    }
                }, */
                when: (options.message !== false && typeof options.message === 'undefined' && typeof options.textFile === 'undefined')
            },
            {
                type: 'file-tree-selection',
                name: 'files',
                message: "Select which media/files you want to send (Do not select entire folders) (Select with \'Space\' and confirm with \'Enter\'):",	//TODO Implement sending all media in a folder  //TODO implement sending gifs (by converting to video first)
                multiple: true,
                when: (options.files !== false && typeof options.files === 'undefined')
            },
        ])
        .then((answers) => {
            //Select args answers or inquirer's answers
            let numbersFile;
            let messageToSend;
            let filesToSend;

            if(typeof options.numbers === 'undefined')          //not specified as a parameter -> using inquirer's answer
                numbersFile=answers.numbers;
            else                                                //specified as a parameter
                numbersFile=options.numbers;

            if(options.message === false)                               //flag --no-message
                messageToSend='';
            else if(typeof options.message === 'undefined' && typeof options.textFile === 'undefined')   //not specified as a parameter -> using inquirer's answer
                messageToSend=answers.message;
            else if(typeof options.message !== 'undefined'){    //flag --message
                if(options.message !== true)                    //message not empty
                    messageToSend=options.message.trim();
                else                                            //message empty
                    messageToSend='';
            }
            else if(options.textFile === true)                  //using --text-file flag, but no file specified -> no text to send
                messageToSend='';
            else                                                //using --text-file flag and file specified -> read it to string
                messageToSend = fs.readFileSync(options.text).toString();

            if(options.files === false)                                 //flag --no-files
                filesToSend=[];
            else if(typeof options.files === 'undefined')       //not specified as a parameter -> using inquirer's answer
                filesToSend=answers.files;
            else if(options.files === true)                     //using --files flag, but no file specified -> no files to send
                filesToSend=[];
            else                                                //using --files flag and 1+ files specified -> pass their path to WASend
                filesToSend=options.files;


            callback(numbersFile, messageToSend, filesToSend);
        });
        //TODO something to catch?
}