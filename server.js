import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
    const files = {
        '/': { path: './public/index.html', contentType: 'text/html'},
        '/index.html': { path: './public/index.html', contentType: 'text/html'},
        '/script.js': { path: './public/script.js', contentType: 'text/javascript'},
    }
    if (files[req.url]) {
        const filePath = files[req.url].path;
        const contentType = files[req.url].contentType;
        try {
            const data = await fs.promises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading index.html')
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Requested resource not found :-(...');
    }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const userName = new URL(req.url, 'http://localhost').searchParams.get('username');
    ws._user = userName;
    console.log(`Client connected... via User: ${userName}`);
    sendMsg({ 'type': 'system', 'text': `${userName} joined`});
        
    ws.on('message', (payload) => {
        const data = JSON.parse(payload);
        console.log(data);

        sendMsg({ type: 'chat', username: data.username, text: data.text });
    });

    ws.on('close', (code, reason) => {
        console.log(code, reason.toString(), ws._user);
        sendMsg({type: 'system', text: `${ws._user} left`});
    });

    ws.on('error', (err) => {
        console.log(`Error: ${err}`);
    });
});

function sendMsg(payload) {
    wss.clients.forEach(client => {
        if (client.readyState == WebSocket.OPEN) {
            console.log(JSON.stringify(payload));
            client.send(JSON.stringify(payload));
        }
    });
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


