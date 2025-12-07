// Background service worker: orchestrates the research workflow and calls OpenAI securely

async function callOpenAI(apiKey, messages, opts = {}) {
  const body = {
    model: opts.model || 'gpt-4o-mini',
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.max_tokens ?? 800
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function sendProgress(status, detail) {
  chrome.runtime.sendMessage({ type: 'progress', status, detail });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'startResearch') {
    (async () => {
      try {
        const topic = msg.topic;
        // Load API key from storage
        const items = await chrome.storage.local.get(['openaiApiKey']);
        const apiKey = items.openaiApiKey;
        if (!apiKey) {
          chrome.runtime.sendMessage({ type: 'error', message: 'No OpenAI API key saved in extension. Enter and save it in the popup.' });
          return;
        }

        sendProgress('Creating concise outline...');

        const outlinePrompt = [
          { role: 'system', content: 'You are a concise research assistant. Produce short outlines and final briefs only.' },
          { role: 'user', content: `Create a concise research outline for the topic: "${topic}". Provide 3-5 bullet points with short phrases (no more than 10 words each). Return only the bullets.` }
        ];

        const outline = await callOpenAI(apiKey, outlinePrompt, { max_tokens: 200 });
        sendProgress('Outline ready', outline);

        // Gather page info from active tab
        sendProgress('Gathering page information from active tab...');
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          chrome.runtime.sendMessage({ type: 'error', message: 'No active tab found to gather page information.' });
          return;
        }
        const tab = tabs[0];

        const [injectionResult] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const title = document.title || '';
            const url = location.href;
            const meta = document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '';
            const selection = window.getSelection ? (window.getSelection().toString() || '') : '';
            const text = (document.body && document.body.innerText) ? document.body.innerText.slice(0, 20000) : '';
            return { title, url, meta, selection, text };
          }
        });

        const pageData = injectionResult?.result || { title: '', url: '', meta: '', selection: '', text: '' };
        sendProgress('Page information collected', `Title: ${pageData.title}\nURL: ${pageData.url}\nMeta: ${pageData.meta}`);

        // Create final brief using outline and pageData
        sendProgress('Composing final brief...');

        const finalMessages = [
          { role: 'system', content: 'You are a concise research assistant. Produce a brief final report (150-300 words) that follows a small outline and uses provided page content. If page content is relevant, cite the page using its URL in parentheses.' },
          { role: 'user', content: `Topic: ${topic}\n\nOutline:\n${outline}\n\nPage information:\nTitle: ${pageData.title}\nURL: ${pageData.url}\nMeta: ${pageData.meta}\nSelection (if any): ${pageData.selection}\nPage text (excerpt): ${pageData.text.slice(0, 4000)}` },
          { role: 'user', content: 'Produce a short final brief (3-6 short paragraphs or bullets). Start with a 1-line summary, then 2-3 findings, and finish with a one-sentence recommendation. Keep it concise.' }
        ];

        const finalText = await callOpenAI(apiKey, finalMessages, { max_tokens: 700 });

        chrome.runtime.sendMessage({ type: 'result', text: finalText });
      } catch (err) {
        chrome.runtime.sendMessage({ type: 'error', message: err.message || String(err) });
      }
    })();
    // indicate we'll respond asynchronously
    return true;
  }
});
