// change name of this file to config.js
const client_id = "Your client ID" // An 18 digit long number as a string
module.exports = {
    "channel_id": "Discord Channel ID", // An 18 digit long number as a string
    "bot_token": "Discord Bot Token", // A very long string made of characters, numbers, and special characters.
    "port": 3001,
    "add bot to server": `https://discordapp.com/api/oauth2/authorize?client_id=${client_id}&permissions=65536&scope=bot`
}