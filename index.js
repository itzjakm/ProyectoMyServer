const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const serveIndex = require('serve-index');
const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://192.168.1.109:5173', 'https://proyectomy.itzjakmeirmoss.repl.co'],
        credentials: true,
    },
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use('/admin', express.static('dist'), serveIndex('dist', { icons: true }));
/* Serve files in public */
app.use(express.static('public'));
async function sendUsersArr() {
    let users = await io.fetchSockets();
    users = users.map(s => {
        if (s.personalName || s.seatNumber)
            return { str: `${s.personalName}:${s.seatNumber}`, id: s.id };
        return { str: s.id, id: s.id };
    });
    io.of('/manager').emit('UsersArr', users);
}

io.of('/manager').on('connection', socket => {
    console.log('a manager connected');
    sendUsersArr();
    socket.on('disconnect', () => {
        console.log('manager disconnected');
    });
    socket.on('dingM', e => {
        io.in(e).emit('ding');
    });
    socket.on('hideModalM', e => {
        if (!e) io.emit('hideModal');
        io.in(e).emit('hideModal');
    });
    socket.on('showModalM', e => {
        if (!e) io.emit('showModal');
        io.in(e).emit('showModal');
    });
});

io.on('connection', async socket => {
    console.log('a user connected');
    sendUsersArr();

    socket.on('seatNumber', e => {
        socket.seatNumber = e;
        sendUsersArr();
    });
    socket.on('personalName', e => {
        socket.personalName = e;
        sendUsersArr();
    });
    socket.on('disconnect', () => {
        sendUsersArr();
        console.log('user disconnected');
    });
});

instrument(io, {
    auth: false,
    mode: 'development',
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
