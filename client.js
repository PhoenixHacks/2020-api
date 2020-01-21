
const
    client = require("socket.io-client"),
    io = client.connect("http://localhost:3001", {
        path: '/announcements'
    });

io.on("announcements", (msg) => console.log(msg.announcements));
