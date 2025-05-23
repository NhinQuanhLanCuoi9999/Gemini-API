import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import http from 'http';

const app = express();
const port = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

const clientSessions = new Map();

function saveLog(ip, prompt, apiResponse) {
    const date = new Date();
    const formattedTime = format(date, 'dd/MM/yyyy | HH:mm:ss', { locale: enGB });
    const logData = `IP: ${ip}\nContent: ${prompt}\nAPI: ${apiResponse}\nThời gian: ${formattedTime}\n~~~~~~~~~~~~~~~~~~~~~~~~~\n`;
    fs.appendFile('logs.txt', logData, (err) => {
        if (err) console.error('Lỗi khi ghi log:', err);
        else console.log('✅ Log đã được lưu.');
    });
}

wss.on('connection', (ws, req) => {
    ws.send(JSON.stringify({ type: 'auth_request' }));

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'auth') {
            const { apiKey, modelName } = data;
            const modelLink = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(modelLink, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
                    }),
                });
                const resData = await response.json();

                if (resData.candidates) {
                    clientSessions.set(ws, {
                        apiKey,
                        modelLink,
                        ip: req.socket.remoteAddress,
                        chatHistory: [] // 💾 add context memory
                    });
                    ws.send(JSON.stringify({ type: 'auth_success', message: '✅ Xác thực thành công!' }));
                } else {
                    ws.send(JSON.stringify({ type: 'auth_fail', message: '❌ API Key hoặc Model sai. Thử lại.' }));
                }
            } catch (err) {
                ws.send(JSON.stringify({ type: 'auth_fail', message: '❌ Lỗi kết nối API. Thử lại.' }));
            }
        }

        if (data.type === 'chat') {
            const session = clientSessions.get(ws);
            if (!session) {
                ws.send(JSON.stringify({ type: 'auth_request' }));
                return;
            }

            // 💬 Gộp history + prompt
            const fullConversation = [...session.chatHistory];

            fullConversation.push({
                role: 'user',
                parts: [{ text: data.prompt }]
            });

            const body = {
                contents: fullConversation
            };

            try {
                const response = await fetch(session.modelLink, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                const responseData = await response.json();
                const resultText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ Không có phản hồi';

                // 🧠 Thêm vào history để nhớ tiếp
                session.chatHistory.push(
                    { role: 'user', parts: [{ text: data.prompt }] },
                    { role: 'model', parts: [{ text: resultText }] }
                );

                saveLog(session.ip, data.prompt, resultText);
                ws.send(JSON.stringify({ type: 'chat_response', result: resultText }));
            } catch (err) {
                ws.send(JSON.stringify({ type: 'chat_response', result: '❌ Lỗi khi gọi API' }));
            }
        }
    });

    ws.on('close', () => {
        clientSessions.delete(ws);
    });
});

server.listen(port, () => {
    console.log(`🚀 Server chạy tại http://localhost:${port}`);
});
