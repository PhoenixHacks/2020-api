// server.js

const server = require('http').createServer();
const discord = require('discord.js');

const { channel_id, bot_token, PORT } = require('./config.json');
let PORT = process.env.PORT || 3000
let channel = null
let announcements = []

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

server.listen(PORT, () => { console.log('listening on *:' + PORT); });