const socket = new WebSocket('ws://localhost:3000');
const resultContainer = document.getElementById('resultContainer');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

const modelInfoElement = document.getElementById("model-info");
modelInfoElement.innerText = "Đang load mô hình...";


const waitForModelName = setInterval(() => {
    const session = localStorage.getItem("geminiSession");
    if (session) {
        try {
            const parsed = JSON.parse(session);
            const model = parsed.modelName;
            if (model && model.trim() !== "") {
                modelInfoElement.innerText = `Được xây dựng trên API mô hình ${model}`;
                clearInterval(waitForModelName);
            }
        } catch (err) {
            console.error("❌ Lỗi parse localStorage:", err);
        }
    }
}, 500);

let modelName = localStorage.getItem("modelName") || "không rõ";
let isAuthenticated = false;
let apiKey = null;
let hasSentAuth = false;

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
(() => {
  const modelOptions = [
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
  ];

  // Tạo phần tử giao diện
  const container = document.createElement('div');
  container.className = 'fixed top-4 right-4 z-50';
  container.innerHTML = `
    <button id="modelBtn" class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition">
      Đổi mô hình
    </button>
    <div id="dropdownMenu" class="opacity-0 scale-95 hidden origin-top-right transition-all duration-200 ease-out mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
      ${modelOptions.map(option => `
        <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer model-option" data-model="${option}">
          ${option}
        </div>
      `).join('')}
    </div>
  `;
  document.body.appendChild(container);

  const btn = container.querySelector('#modelBtn');
  const menu = container.querySelector('#dropdownMenu');

  // Toggle dropdown với animation
  btn.addEventListener('click', () => {
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      menu.classList.remove('hidden');
      requestAnimationFrame(() => {
        menu.classList.remove('opacity-0', 'scale-95');
        menu.classList.add('opacity-100', 'scale-100');
      });
    } else {
      menu.classList.add('opacity-0', 'scale-95');
      menu.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => menu.classList.add('hidden'), 200);
    }
  });

  // Chọn model → lưu vào localStorage
  container.querySelectorAll('.model-option').forEach(item => {
    item.addEventListener('click', () => {
      const selectedModel = item.getAttribute('data-model');
      const oldSession = JSON.parse(localStorage.getItem('geminiSession')) || {};
      const updatedSession = {
        ...oldSession,
        modelName: selectedModel,
      };
      localStorage.setItem('modelName', selectedModel);
      localStorage.setItem('geminiSession', JSON.stringify(updatedSession));

      // Ẩn dropdown
      menu.classList.add('opacity-0', 'scale-95');
      menu.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => menu.classList.add('hidden'), 200);

      alert(`✅ Đã chọn mô hình: ${selectedModel}`);
    });
  });

  // Click ngoài thì ẩn dropdown
  window.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      menu.classList.add('opacity-0', 'scale-95');
      menu.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => menu.classList.add('hidden'), 200);
    }
  });
})();
function requestAuth() {
    if (hasSentAuth) return;

    if (document.getElementById('authModal')) {
        document.getElementById('authModal').classList.remove('hidden');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';

    const content = document.createElement('div');
    content.className = 'bg-[#1a1a1a] border-2 border-purple-600 text-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md flex flex-col gap-4 animate-fade-in';

    const title = document.createElement('h2');
    title.textContent = '🔮 Nhập thông tin xác thực';
    title.className = 'text-2xl font-bold text-center text-purple-300';
    content.appendChild(title);

    const apiKeyInput = document.createElement('input');
    apiKeyInput.placeholder = '🔑 Nhập API Key...';
    apiKeyInput.className = 'bg-[#2c2c2c] text-white border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600';
    content.appendChild(apiKeyInput);

    // Tạo dropdown cho model
    const modelDropdown = document.createElement('select');
    modelDropdown.className = 'bg-[#2c2c2c] text-white border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600';
    
    const modelOptions = [
        'gemini-2.5-flash-preview-05-20',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
    ];

    const defaultOption = document.createElement('option');
    defaultOption.textContent = '📦 Chọn model Gemini...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    modelDropdown.appendChild(defaultOption);

    modelOptions.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelDropdown.appendChild(option);
    });

    content.appendChild(modelDropdown);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'flex justify-center';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '✨ Xác nhận';
    confirmBtn.className = 'px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition shadow-lg';
    confirmBtn.onclick = () => {
        const inputKey = apiKeyInput.value.trim();
        const inputModel = modelDropdown.value;

        if (inputKey && inputModel && inputModel !== defaultOption.textContent) {
            localStorage.setItem('geminiSession', JSON.stringify({ apiKey: inputKey, modelName: inputModel }));
            localStorage.setItem('modelName', inputModel);
            socket.send(JSON.stringify({ type: 'auth', apiKey: inputKey, modelName: inputModel }));
            hasSentAuth = true;
            modal.remove();
        } else {
            alert('🚫 Bạn chưa nhập đủ thông tin!');
        }
    };

    buttonGroup.appendChild(confirmBtn);
    content.appendChild(buttonGroup);

    modal.appendChild(content);
    document.body.appendChild(modal);
}


socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'auth_request') {
        requestAuth();
    }

    if (data.type === 'auth_success') {
        isAuthenticated = true;
        alert(data.message);
    }

    if (data.type === 'auth_fail') {
        isAuthenticated = false;
        alert(data.message);
        localStorage.removeItem('geminiSession');
        hasSentAuth = false;
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
