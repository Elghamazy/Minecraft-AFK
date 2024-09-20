const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const express = require('express');

const config = require('./settings.json');

// Setup express to keep Glitch alive
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000, () => {
   console.log('Server is ready.');
});

function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   if (bot.settings) {
    bot.settings.colorsEnabled = true;
}

   bot.once('spawn', () => {
      console.log('[AfkBot] Bot joined to the server');

      if (config.utils['auto-auth'].enabled) {
         const password = config.utils['auto-auth'].password;
         setTimeout(() => {
            bot.chat(`/register ${password} ${password}`);
            bot.chat(`/login ${password}`);
         }, 500);
      }

      const pos = config.position;

      if (config.position.enabled) {
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
      }

      if (config.utils['anti-afk'].enabled) {
         bot.setControlState('jump', true);
         if (config.utils['anti-afk'].sneak) {
            bot.setControlState('sneak', true);
         }
      }
   });

   bot.on('chat', (username, message) => {
      console.log(`[ChatLog] <${username}> ${message}`);
   });

   bot.on('goal_reached', () => {
      console.log(`[AfkBot] Bot arrived at target location.`);
   });

   bot.on('death', () => {
      console.log(`[AfkBot] Bot has died and was respawned.`);
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         setTimeout(() => {
            createBot();
         }, config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', (reason) => {
      console.log(`[AfkBot] Bot was kicked from the server. Reason: ${reason}`);
   });

   bot.on('error', (err) => {
      console.log(`[ERROR] ${err.message}`);
   });
}

createBot();
