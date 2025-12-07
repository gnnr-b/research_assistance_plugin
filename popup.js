document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const clearKeyBtn = document.getElementById('clearKey');
  const startBtn = document.getElementById('start');
  const topicInput = document.getElementById('topic');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');

  // Load saved key if present
  chrome.storage.local.get(['openaiApiKey'], (items) => {
    if (items.openaiApiKey) apiKeyInput.value = items.openaiApiKey;
  });

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return;
    chrome.storage.local.set({ openaiApiKey: key }, () => {
      statusEl.textContent = 'API key saved (stored locally).';
    });
  });

  clearKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    chrome.storage.local.remove('openaiApiKey', () => {
      statusEl.textContent = 'API key cleared.';
    });
  });

  startBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) {
      statusEl.textContent = 'Please enter a topic.';
      return;
    }

    statusEl.textContent = 'Starting research...';
    resultEl.textContent = '';

    chrome.runtime.sendMessage({ type: 'startResearch', topic });
  });

  // Receive progress and result messages from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'progress') {
      statusEl.textContent = msg.status || 'Working...';
      if (msg.detail) {
        resultEl.textContent = msg.detail;
      }
    }

    if (msg.type === 'result') {
      statusEl.textContent = 'Done';
      resultEl.textContent = msg.text || '';
    }

    if (msg.type === 'error') {
      statusEl.textContent = 'Error: ' + (msg.message || 'Unknown');
    }
  });
});
