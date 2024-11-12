const resultContainer = document.getElementById('resultContainer');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

document.getElementById('queryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const inputPrompt = document.getElementById('inputPrompt').value;
    document.getElementById('inputPrompt').value = '';
    document.getElementById('loadingMessage').style.display = 'block';
    displayUserMessage(inputPrompt);
    fetchGeminiAPI(inputPrompt)                                           .then(() => {
            document.getElementById('loadingMessage').style.display = 'none';
        });
});

function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = 'Bạn: ' + message;
    resultContainer.appendChild(messageElement);
    scrollToBottom();
}                                                                 
async function fetchGeminiAPI(prompt) {
    try {
        const response = await fetch('/callGemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        const data = await response.json();
        const resultText = data.result || 'Không có kết quả';
        displayGeminiResponse(resultText);
    } catch (error) {
        displayGeminiResponse('Đã xảy ra lỗi khi gọi API: ' + error.message);
    }
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

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Đã sao chép vào clipboard!');
    }).catch(err => {
        alert('Lỗi khi sao chép: ' + err);
    });
}

function scrollToBottom() {
    resultContainer.scroll({
        top: resultContainer.scrollHeight,
        behavior: 'smooth'
    });
}

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

document.getElementById('sendButton').addEventListener('click', function() {
    const inputPrompt = document.getElementById('inputPrompt').value;
    if (inputPrompt) {
        document.getElementById('loadingMessage').style.display = 'block';
        displayUserMessage(inputPrompt);
        document.getElementById('inputPrompt').value = '';
        fetchGeminiAPI(inputPrompt)
            .then(() => {
                document.getElementById('loadingMessage').style.display = 'none';
            });
    }
});

