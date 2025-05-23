## 🚀 Hướng dẫn cài đặt & chạy Gemini API

### 🧰 1. Cài đặt dự án

```bash
# Bước 1: Clone repository về máy
git clone https://github.com/NhinQuanhLanCuoi9999/Gemini-API.git

# Bước 2: Di chuyển vào thư mục dự án
cd Gemini-API

# Bước 3: Cài đặt các thư viện cần thiết
npm install express node-fetch ws date-fns
```

---

### ▶️ 2. Khởi chạy server

```bash
node chat.mjs
```

Khi chạy thành công, terminal sẽ hiển thị:

```bash
🚀 Server chạy tại http://localhost:3000
```

---

### 💬 3. Sử dụng chatbot

- Mở trình duyệt và truy cập: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- Nhập API key + model của bạn để bắt đầu cuộc trò chuyện.
- Giao diện realtime, hỗ trợ nhớ context, lưu log.

---

### 📁 Ghi chú

- File `logs.txt` sẽ được tạo để lưu lại lịch sử chat.
- Để tránh push log lên git, hãy thêm dòng sau vào `.gitignore`:

```bash
logs.txt
```
