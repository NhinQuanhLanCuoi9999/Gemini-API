const socket = new WebSocket('ws://localhost:3000');
const resultContainer = document.getElementById('resultContainer');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

let isAuthenticated = false;
let apiKey = null;
let modelName = null;
let hasSentAuth = false; // 💡 Dùng để ngăn nhập lặp

function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = 'Bạn: ' + message;
    resultContainer.appendChild(messageElement);
    scrollToBottom();
}

function displayGeminiResponse(response) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'gemini-response');
    try {
        const htmlContent = marked.parse(response);
        messageElement.innerHTML = 'Gemini: ' + htmlContent;

        const codeBlocks = messageElement.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            const button = document.createElement('button');
            button.textContent = 'Copy';
            button.classList.add('copy-button');
            button.addEventListener('click', () => copyToClipboard(block.textContent));
            block.parentElement.appendChild(button);
        });
    } catch (err) {
        messageElement.textContent = 'Gemini: ' + response;
    }
    resultContainer.appendChild(messageElement);
    scrollToBottom();
}

function scrollToBottom() {
    resultContainer.scroll({
        top: resultContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Đã sao chép vào clipboard!'))
        .catch(err => alert('Lỗi khi sao chép: ' + err));
}

function sendPrompt(prompt) {
    if (!isAuthenticated) {
        alert('Bạn chưa xác thực API Key & Model.');
        return;
    }
    socket.send(JSON.stringify({ type: 'chat', prompt }));
}

document.getElementById('queryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const inputPrompt = document.getElementById('inputPrompt').value;
    if (!inputPrompt) return;
    document.getElementById('inputPrompt').value = '';
    displayUserMessage(inputPrompt);
    sendPrompt(inputPrompt);
});

document.getElementById('sendButton').addEventListener('click', function() {
    const inputPrompt = document.getElementById('inputPrompt').value;
    if (!inputPrompt) return;
    document.getElementById('inputPrompt').value = '';
    displayUserMessage(inputPrompt);
    sendPrompt(inputPrompt);
});

socket.onopen = () => {
    const saved = localStorage.getItem('geminiSession');
    if (saved) {
        const session = JSON.parse(saved);
        apiKey = session.apiKey;
        modelName = session.modelName;
        socket.send(JSON.stringify({ type: 'auth', apiKey, modelName }));
        hasSentAuth = true;
    }
};

function requestAuth() {
    if (hasSentAuth) return; // ✅ Ngăn nhập trùng lần 2
    apiKey = prompt('🔑 Nhập API Key:');
    modelName = prompt('📦 Nhập tên model (ví dụ: gemini-2.0-flash):');
    if (apiKey && modelName) {
        localStorage.setItem('geminiSession', JSON.stringify({ apiKey, modelName }));
        socket.send(JSON.stringify({ type: 'auth', apiKey, modelName }));
        hasSentAuth = true;
    }
}

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'auth_request') {
        requestAuth(); // Sẽ không bị gọi nhiều lần nữa
    }

    if (data.type === 'auth_success') {
        isAuthenticated = true;
        alert(data.message);
    }

    if (data.type === 'auth_fail') {
        isAuthenticated = false;
        alert(data.message);
        localStorage.removeItem('geminiSession');
        hasSentAuth = false; // Cho phép nhập lại khi fail
        requestAuth();
    }

    if (data.type === 'chat_response') {
        displayGeminiResponse(data.result);
    }
};

resultContainer.addEventListener('scroll', function() {
    if (resultContainer.scrollTop < resultContainer.scrollHeight - resultContainer.clientHeight) {
        scrollToBottomBtn.style.display = 'flex';
    } else {
        scrollToBottomBtn.style.display = 'none';
    }
});

scrollToBottomBtn.addEventListener('click', function() {
    scrollToBottom();
    scrollToBottomBtn.style.display = 'none';
});
