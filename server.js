// server.js

const discord = require('discord.js');

//const { channel_id, bot_token, port } = require('./config');
const CHANNEL_ID = process.env.CHANNEL_ID || '666881141126725642';
const BOT_TOKEN = process.env.BOT_TOKEN || 'NjY2ODUxNTEzNzI0OTYwNzg5.Xh_SmA.SjjrZQi7q_eHfB-E9wke3hCeIw8';
const PORT = process.env.PORT || 3001;

let channel;
let announcements = [];
const INDEX = 'index.html';

const server = require('express')()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const bot = new discord.Client({
  autorun: true,
  token: BOT_TOKEN
});

const io = require('socket.io')(server, {
  path: '/announcements',
  serveClient: false,
});

const deletedMessageFilter = () => {
  return (message) => {
    return !message.deleted;
  };
};

const isEdited = (message) => {
  return message.edits.length > 1;
}

const getMostRecentEdit = (message) => {
  return message.edits.shift()
}

const commonMessageFilter = () => {
  return (oldMessage, newMessage) => {
    return oldMessage.id === newMessage.id;
  }
}

const findByMessage = (list, time) => {
  let index = list.map( (element) => {
    return element.message;
  }).indexOf(time);
  return list[index];
}

bot.on('ready', (event) => {
  console.log('Logged in as %s - %s\n', bot.user.tag, bot.user.id);
  channel = bot.channels.get(CHANNEL_ID);

  // Get Announcements
  channel.fetchMessages({ limit: 20 })
  .then(messages => {
    messages = messages.filter(deletedMessageFilter());
    announcements = messages.map(m => ({
      "id": m.id,
      "time": m.createdAt,
      "message": (isEdited(m) ? getMostRecentEdit(m) : m.content)
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
    // When a new message is created, add it to the announcements
    if (m.channel.id === CHANNEL_ID) {
      announcements.push({
        "id": m.id,
        "time": m.createdAt, 
        "message": m.content
      });
      io.emit('announcements', announcements);
    }
  });

  bot.on('messageUpdate', (om, nm) => {
    // Find the message edited in announcements and replace the content
    if (nm.channel.id === CHANNEL_ID) {
      let m = announcements.find(m => m.id === om.id);
      m.message = nm.content;
      io.emit('announcements', announcements);
    }
  });

  bot.on('messageDelete', (m) => {
    // Find the message deleted in announcements and remove it
    if (m.channel.id === CHANNEL_ID) {
      let index = announcements.findIndex(a => a.id === m.id);
      announcements.splice(index, 1);
      io.emit('announcements', announcements);
    }
  });
});

bot.login(BOT_TOKEN)