const { channel_id, bot_token, PORT } = require('./config.json');
let channel = null
let announcements = []

const discord_bot = () => {
  const bot = new (require('discord.js')).Client({
    autorun: true,
    token: bot_token
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
      }));
    }).catch(console.error);

    bot.on('message', m => {
      if (m.channel.id === channel_id) {
        announcements.push({
          "time": m.createdAt, 
          "message": m.content 
        });
        //io.emit('announcements', announcements)
      }
    });
  });
}

const socket_server = () => {
  const server = require('http').createServer();
  const io = require('socket.io')(server, {
    path: '/announcements',
    serveClient: false,
  });

  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected.`);
    socket.emit('announcements', announcements);
    
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected.`);
      //socket.connect();
    });
  });
}



server.listen(PORT, () => {
  console.log('listening on *:' + PORT);
});