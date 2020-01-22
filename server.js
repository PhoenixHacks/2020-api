// server.js

//const server = require('http').createServer();
const discord = require('discord.js');

//const { channel_id, bot_token, port } = require('./config');
const CHANNEL_ID = process.env.CHANNEL_ID// || channel_id
const BOT_TOKEN = process.env.BOT_TOKEN// || bot_token
const PORT = process.env.PORT// || port

let channel = null
let announcements = []
const INDEX = 'index.html';

const server = require('express')()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const bot = new discord.Client({
  autorun: true,
  token: bot_token
});

const io = require('socket.io')(server, {
  path: '/announcements',
  serveClient: false,
});

bot.on('ready', (event) => {
  console.log('Logged in as %s - %s\n', bot.user.tag, bot.user.id);
  channel = bot.channels.get(channel_id);

  // Get Announcements
  channel.fetchMessages({ limit: 20 })
  .then(messages => {
    announcements = messages.map(m => ({
      "time": m.createdAt,
      "message": m.content 
    })).reverse();
  }).catch(console.error);

  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected.`);
    socket.emit('announcements', announcements);
    
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected.`);
      //socket.connect();
    });
  });

  bot.on('message', m => {
    if (m.channel.id === channel_id) {
      announcements.push({
        "time": m.createdAt, 
        "message": m.content 
      });
      io.emit('announcements', announcements)
    }
  });
});

bot.login(bot_token)

//server.listen(PORT, () => { console.log('listening on *:' + PORT); });