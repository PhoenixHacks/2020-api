// server.js
const CHANNEL_ID = process.env.CHANNEL_ID || '666881141126725642';
const BOT_TOKEN = process.env.BOT_TOKEN || 'NjY2ODUxNTEzNzI0OTYwNzg5.Xh_SmA.SjjrZQi7q_eHfB-E9wke3hCeIw8';
const PORT = process.env.PORT || 3001;
let announcements = [], channel;

const deletedMessageFilter = () => ((message) => !message.deleted);
const isEdited = (message) => message.edits.length > 1;
const getMostRecentEdit = (message) => message.edits.shift();

class DiscordBot {
  constructor(ss) {
    const bot = new (require('discord.js')).Client({
      autorun: true,
      token: BOT_TOKEN
    });

    this.bot = bot;
    this.ss = ss;
  }

  onReady = () => {
    // When the bot is initialized...
    this.bot.on('ready', () => {
      console.log('Logged in as %s - %s\n', this.bot.user.tag, this.bot.user.id);
      channel = this.bot.channels.get(CHANNEL_ID);
  
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

      this.ss.onConnection()
      this.onMessage();
      this.onMessageUpdate();
      this.onMessageDelete();
    });
  }

  onMessage = () => {
    // When a new message is created, add it to the announcements
    this.bot.on('message', m => {
      if (m.channel.id === CHANNEL_ID) {
        announcements.push({
          "id": m.id,
          "time": m.createdAt, 
          "message": m.content
        });
        this.ss.emit();
      }
    });
  }

  onMessageUpdate = () => {
    // Find the message edited in announcements and replace the content
    this.bot.on('messageUpdate', (om, nm) => {
      if (nm.channel.id === CHANNEL_ID) {
        let m = announcements.find(m => m.id === om.id);
        m.message = nm.content;
        this.ss.emit();
      }
    });
  }

  onMessageDelete = () => {
    // Find the message deleted in announcements and remove it
    this.bot.on('messageDelete', (m) => {
      if (m.channel.id === CHANNEL_ID) {
        let index = announcements.findIndex(a => a.id === m.id);
        announcements.splice(index, 1);
        this.ss.emit();
      }
    });
  }

  login = () => {
    this.bot.login(BOT_TOKEN);
  }
}

class SocketServer {
  constructor() {
    const server = require('express')()
      .use((req, res) => res.sendFile('index.html', { root: __dirname }))
      .listen(PORT, () => console.log(`Listening on ${PORT}`));

    const io = require('socket.io')(server, {
      path: '/announcements',
      serveClient: false,
    });

    this.io = io;
  }

  onConnection = () => {
    // When a user connects to the server, open a socket and emit announcements.
    this.io.on('connection', (socket) => {
      console.log(`Socket ${socket.id} connected.`);
      socket.emit('announcements', announcements);
      
      socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected.`);
      });
    });
  }

  emit = () => {
    this.io.emit('announcements', announcements);
  }
}

let ss = new SocketServer();
let dbot = new DiscordBot(ss);

dbot.onReady();
dbot.login();