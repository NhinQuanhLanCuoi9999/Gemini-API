import express from 'express';
import path from 'path';                                          import fetch from 'node-fetch';                                   import fs from 'fs';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';                           
const app = express();
const port = 3000;                                                
app.use(express.json());
app.use(express.urlencoded({ extended: true }));                  
function saveLog(ip, prompt, apiResponse) {
    const date = new Date();
    const formattedTime = format(date, 'dd/MM/yyyy | HH:mm:ss', { locale: enGB });
    const logData = `IP: ${ip}\nContent: ${prompt}\nAPI: ${apiResponse}\nThời gian: ${formattedTime}\n~~~~~~~~~~~~~~~~~~~~~~~~~\n`;

    fs.appendFile('logs.txt', logData, (err) => {
        if (err) {
            console.error('Lỗi khi ghi log:', err);
        } else {
            console.log('Log đã được lưu.');
        }
    });
}

app.post('/callGemini', async (req, res) => {
    const { prompt } = req.body;
    const apiKey = 'AIzaSyA5LS3Oob4RagASnJHXeZ1dU0NW7pZOtY4';
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const body = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        const resultText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

        if (resultText) {
            saveLog(req.ip, prompt, resultText);
            res.json({ result: resultText });
        } else {
            const errorMsg = 'Nội dung không phù hợp, vui lòng gửi nội dung khác.';
            saveLog(req.ip, prompt, errorMsg);
            res.json({ result: errorMsg });
        }
    } catch (error) {
        const errorMsg = 'Đã xảy ra lỗi khi gọi API Gemini';
        saveLog(req.ip, prompt, errorMsg);
        res.status(500).json({ error: errorMsg });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve('index.html'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.resolve('styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.resolve('script.js'));
});

app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
