  document.addEventListener("DOMContentLoaded", () => {
    const personalizeBtn = document.getElementById('personalizeBtn');
    const personalizeModal = document.getElementById('personalizeModal');
    const savePersonalize = document.getElementById('savePersonalize');
    const cancelPersonalize = document.getElementById('cancelPersonalize');
    const personalizeInput = document.getElementById('personalizeInput');

    personalizeBtn.addEventListener('click', () => {
      const stored = localStorage.getItem('geminiPersonalize');
      personalizeInput.value = stored || '';
      personalizeModal.classList.remove('hidden');
    });

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

    if (typeof sendPrompt === 'function') {
      const originalSendPrompt = sendPrompt;
      sendPrompt = function(prompt) {
        const custom = localStorage.getItem('geminiPersonalize');
        const fullPrompt = custom ? `[SYSTEM PROMPT : ${custom}] ${prompt}` : prompt;
        originalSendPrompt(fullPrompt);
      }
    }
  });