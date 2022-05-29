module.exports.ask = askInput;

const inquirer = require('inquirer');
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt');
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

//Ask message and media
function askInput(callback){
    inquirer
        .prompt([
            {
                type: 'file-tree-selection',
                name: 'numbers',
                message: "Select the file with telephone numbers (They must be written with country code as a prefix and comma(,) separated) (Confirm with \'Enter\'):",
            },
            {
                type: 'file-tree-selection',
                name: 'message',
                message: "Select the file containing text you want to send (Do not select entire folders) (Select with \'Space\' and confirm with \'Enter\'):",
                multiple: true,
            },
            {
                type: 'file-tree-selection',
                name: 'media',
                message: "Select which media/files you want to send (Do not select entire folders) (Select with \'Space\' and confirm with \'Enter\'):",	//TODO Implement sending all media in a folder  //TODO implement sending gifs (by converting to video first)
                multiple: true,
            },
        ])
        .then((answers) => {
            /* numbersFile=answers.numbers;
            messageToSend=answers.message;
            mediaToSend=answers.media; */
            callback(answers.numbers, answers.message, answers.media);
        });
        //TODO something to catch?
}