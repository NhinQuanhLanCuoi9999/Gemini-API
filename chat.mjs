import express from 'express';
import path from 'path';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

// Cấu hình express để xử lý các yêu cầu tĩnh (HTML, CSS, JS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoint để gọi Gemini
app.post('/callGemini', async (req, res) => {
    const { prompt } = req.body;
    const apiKey = 'AIzaSyA5LS3Oob4RagASnJHXeZ1dU0NW7pZOtY4'; // API key của bạn
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

        // Kiểm tra nếu API trả về kết quả hợp lệ
        const resultText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

        // Trả lời API
        if (resultText) {
            res.json({ result: resultText });
        } else {
            res.json({ result: 'Nội dung không phù hợp, vui lòng gửi nội dung khác.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi khi gọi API Gemini' });
    }
});

// Đưa toàn bộ HTML vào trong server (kết hợp backend và frontend)
app.get('/', (req, res) => {
    // Trả về index.html
    res.sendFile(path.resolve('index.html'));  // Trả về index.html từ thư mục gốc
});

// Cấu hình để phục vụ tệp CSS
app.get('/styles.css', (req, res) => {
    // Trả về styles.css
    res.sendFile(path.resolve('styles.css'));  // Trả về styles.css từ thư mục gốc
});

// Lắng nghe kết nối từ client
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
