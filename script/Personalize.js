document.addEventListener("DOMContentLoaded", () => {
  const personalizeModal = document.getElementById('personalizeModal');
  const savePersonalize = document.getElementById('savePersonalize');
  const cancelPersonalize = document.getElementById('cancelPersonalize');
  const personalizeInput = document.getElementById('personalizeInput');

  cancelPersonalize.addEventListener('click', () => {
    personalizeModal.classList.add('hidden');
  });

  savePersonalize.addEventListener('click', () => {
    const value = personalizeInput.value.trim();
    localStorage.setItem('geminiPersonalize', value);
    personalizeModal.classList.add('hidden');
    if (typeof showToast === 'function') {
      showToast('✅ Đã lưu cá nhân hóa!', 'success');
    }
  });

  if (typeof window.sendPrompt === 'function') {
    const originalSendPrompt = window.sendPrompt;
    window.sendPrompt = function(prompt) {
      const custom = localStorage.getItem('geminiPersonalize');
      const fullPrompt = custom ? `[SYSTEM PROMPT : ${custom}] ${prompt}` : prompt;
      originalSendPrompt(fullPrompt);
    }
  }
});