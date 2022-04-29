const questions=require('./questions');
const WASend=require('./WASend');

questions.ask(WASend.send);