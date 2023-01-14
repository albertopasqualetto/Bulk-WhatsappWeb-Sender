import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

import fs from 'fs';

//Ask message and media
export default function askInput(callback){
    inquirer
        .prompt([
            {
                type: 'file-tree-selection',
                name: 'numbers',
                message: "Select the file with telephone numbers (They must be comma(,) separated) (Confirm with \'Enter\'):",
                when: (typeof options.numbers === 'undefined')
            },
            {
                type: 'input',    //maybe substitute with type editor
                name: 'message',
                message: "Insert the text you want to send (Formatting: *bold*, _italic_, ~strikethrough~, ```monospace```; no new line admitted; you can also add emojis)\n(Then press \'Enter\'):",
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

            if (typeof options.numbers !== 'undefined')          //not specified as a parameter -> using inquirer's answer
                numbersFile = options.numbers;
            else                                                //specified as a parameter
                numbersFile = answers.numbers;

            if(options.message === false)                               //flag --no-message
                messageToSend = '';
            else if(typeof options.message === 'undefined' && typeof options.textFile === 'undefined')   //not specified as a parameter -> using inquirer's answer
                messageToSend = answers.message;    //TODO message should be modified in order to not auto escape /n to //n
            else if(typeof options.message !== 'undefined'){    //flag --message
                if(options.message !== true)                    //message not empty
                    messageToSend = options.message.trim();
                else                                            //message empty
                    messageToSend = '';
            }
            else if(options.textFile === true)                  //using --text-file flag, but no file specified -> no text to send
                messageToSend = '';
            else                                                //using --text-file flag and file specified -> read it to string
                messageToSend = fs.readFileSync(options.textFile).toString();

            if(options.files === false)                                 //flag --no-files
                filesToSend = [];
            else if(typeof options.files === 'undefined')       //not specified as a parameter -> using inquirer's answer
                filesToSend = answers.files;
            else if(options.files === true)                     //using --files flag, but no file specified -> no files to send
                filesToSend = [];
            else                                                //using --files flag and 1+ files specified -> pass their path to WASend
                filesToSend = options.files;


            callback(numbersFile, messageToSend, filesToSend);
        });
        //TODO something to catch?
}