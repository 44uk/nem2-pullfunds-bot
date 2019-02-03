import Bot from './bot';
const privateKey = process.env.PRIVATE_KEY;
const url = process.env.URL || 'http://localhost:3000';
const bot = new Bot(privateKey, url);
bot.start();
process.on('SIGINT', () => {
  bot.stop();
});
