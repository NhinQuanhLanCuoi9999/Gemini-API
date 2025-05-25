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

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const existing = Array.from(container.children).find(toast => toast.textContent.trim() === message);
    if (existing) return;

    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-400 text-black'
    };

    toast.className = `${colors[type]} text-white px-6 py-3 rounded-full shadow-lg mb-4 transition-all duration-500 animate-slide-up pointer-events-auto`;
    toast.innerHTML = `<span class="text-sm font-semibold">${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function displayGeminiResponse(response) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', 'gemini-response');

  const textContainer = document.createElement('div');
  textContainer.classList.add('animate-fade-in');
  messageElement.innerHTML = '<strong class="text-indigo-600">Gemini:</strong> ';
  messageElement.appendChild(textContainer);

  resultContainer.appendChild(messageElement);
  scrollToBottom();

  try {
    const htmlContent = marked.parse(response);

    typeHTMLGradually(textContainer, htmlContent, () => {
      // Gắn nút Copy vào code blocks
      const codeBlocks = messageElement.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('code-block-wrapper');
        wrapper.style.position = 'relative';
        wrapper.style.marginTop = '1rem';

        const pre = block.parentElement;
        pre.replaceWith(wrapper);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.textContent = 'Copy';
        button.classList.add('copy-button');
        Object.assign(button.style, {
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '6px 10px',
          fontSize: '12px',
          backgroundColor: '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: '10',
          opacity: '0.9'
        });

        button.addEventListener('click', () => {
          copyToClipboard(block.textContent);
          button.textContent = 'Đã copy!';
          setTimeout(() => button.textContent = 'Copy', 1500);
        });

        wrapper.appendChild(button);
      });
    });
  } catch (err) {
    textContainer.textContent = response;
  }
}


function typeHTMLGradually(container, html, callback) {
  let index = 0;
  const speed = 10;
  const tempDiv = document.createElement('div');

  function type() {
    if (index <= html.length) {
      tempDiv.innerHTML = html.slice(0, index);
      container.innerHTML = tempDiv.innerHTML;
      index++;
      setTimeout(type, speed);
    } else if (callback) {
      callback();
    }
  }

  type();
}



function scrollToBottom() {
    resultContainer.scroll({
        top: resultContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showToast('✅ Đã sao chép vào clipboard!', 'success'))
        .catch(err => showToast('❌ Lỗi khi sao chép: ' + err, 'error'));
}
function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.style.whiteSpace = 'pre-wrap';

    const strong = document.createElement('strong');
    strong.textContent = 'Bạn:';

    messageElement.appendChild(strong);
    messageElement.appendChild(document.createTextNode('\n' + message));

    resultContainer.appendChild(messageElement);
    scrollToBottom();
}

function sendPrompt(prompt) {


    if (!isAuthenticated) {
        showToast('🚫 Bạn chưa xác thực API Key & Model.', 'error');
        return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
        showToast('🔌 Kết nối WebSocket chưa sẵn sàng!', 'error');
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

    const container = document.getElementById('modelContainer');
    const menu = document.getElementById('dropdownMenu');
    const btn = document.getElementById('modelBtn');

    menu.innerHTML = modelOptions.map(option => `
      <div class="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 text-sm text-gray-800 model-option" data-model="${option}">
        <i class="fas fa-microchip mr-2 text-blue-500"></i>${option}
      </div>
    `).join('');

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
            setTimeout(() => menu.classList.add('hidden'), 300);
        }
    });

    const attachClickHandlers = () => {
        container.querySelectorAll('.model-option').forEach(item => {
            item.addEventListener('click', () => {
                const selectedModel = item.getAttribute('data-model');
                const oldSession = JSON.parse(localStorage.getItem('geminiSession')) || {};
                const updatedSession = { ...oldSession, modelName: selectedModel };
                localStorage.setItem('modelName', selectedModel);
                localStorage.setItem('geminiSession', JSON.stringify(updatedSession));
                menu.classList.add('opacity-0', 'scale-95');
                menu.classList.remove('opacity-100', 'scale-100');
                setTimeout(() => menu.classList.add('hidden'), 300);
                showToast(`✅ Đã chọn mô hình: ${selectedModel}`, 'success');
            });
        });
    };
    attachClickHandlers();

    window.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            menu.classList.add('opacity-0', 'scale-95');
            menu.classList.remove('opacity-100', 'scale-100');
            setTimeout(() => menu.classList.add('hidden'), 300);
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
            showToast('🚫 Bạn chưa nhập đủ thông tin!', 'warning');
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
        showToast(data.message, 'success');
    }

    if (data.type === 'auth_fail') {
        isAuthenticated = false;
        showToast(data.message, 'error');
        localStorage.removeItem('geminiSession');
        hasSentAuth = false;
        requestAuth();
    }

    if (data.type === 'chat_response') {
        displayGeminiResponse(data.result);
    }
};

resultContainer.addEventListener('scroll', function () {
    if (resultContainer.scrollTop < resultContainer.scrollHeight - resultContainer.clientHeight) {
        scrollToBottomBtn.style.display = 'flex';
    } else {
        scrollToBottomBtn.style.display = 'none';
    }
});

scrollToBottomBtn.addEventListener('click', function () {
    scrollToBottom();
    scrollToBottomBtn.style.display = 'none';
});
