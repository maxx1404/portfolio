/**
 * MAXSON MATHEW — PORTFOLIO OS
 * chatbot.js — AI Chatbot powered by Anthropic API
 *
 * Primary:  Calls Anthropic /v1/messages with CONFIG.ANTHROPIC_API_KEY
 * Fallback: Rule-based Q&A if key is placeholder 'xyxyxy' or API fails
 *
 * Uses streaming for typewriter effect on responses.
 */

'use strict';

const ChatbotManager = (() => {

  /* ============================================================
     FALLBACK Q&A — used when API key is not set
     ============================================================ */
  const FALLBACK_QA = [
    { patterns: ['who are you','what are you','about you','tell me about'],
      answer: "I'm an AI assistant built into Maxson's portfolio. Ask me anything about him — his projects, skills, background, or how to reach him." },
    { patterns: ['cgpa','gpa','grades','marks','score','9.22'],
      answer: "Maxson has a CGPA of 9.22 in his BE in AI/ML at BMSIT, Bengaluru. Results just came in — he's pretty proud of that." },
    { patterns: ['project','resume matcher','ambulance','krishidrishti','iplr'],
      answer: "Maxson has built: (1) AI-Powered Resume Matcher using SBERT + Azure AI Foundry, (2) Ambulance Distribution System at IISc processing 700k+ data points with 88% effectiveness, and (3) KrishiDrishti — an AR farming system that won 2nd place at NeuroNova Hackathon." },
    { patterns: ['skill','python','pytorch','tensorflow','language','framework'],
      answer: "Maxson works in Python, Java, C, MySQL, and JavaScript. On the AI/ML side: PyTorch, TensorFlow, Hugging Face, Scikit-learn. For GenAI: SBERT, Semantic Kernel, Prompt Engineering, Azure AI Foundry." },
    { patterns: ['endava','intern','internship','work','experience','job'],
      answer: "Maxson is currently a Junior Developer Intern at Endava (Jan 2026–present), working with MySQL, HTML/CSS/JavaScript in Agile teams — building full-stack features and optimising database layers." },
    { patterns: ['hackathon','code red','neuronova','achievement','award','win'],
      answer: "He led CODE RED 3.0 — a national 24hr hackathon with 3,000+ registrations and 60-member team. Won 2nd at NeuroNova (AR/VR), 3rd at Enfinity Startup Festival, and Overall Champion at Reva University across 4 events." },
    { patterns: ['ncc','leadership','cell','president','entrepreneurship'],
      answer: "Maxson was President of the Entrepreneurship Cell (35-person team, 10+ events, 500+ students) and Junior Under Officer in NCC — selected for the Best Cadet Competition." },
    { patterns: ['poet','poetry','white orchid','floating','book','write'],
      answer: "Yes — Maxson is a published poet. His poem 'White Orchids' is featured in the anthology 'Floating' by Writer's Pocket. The engineer and the poet share the same brain." },
    { patterns: ['contact','email','reach','hire','available','opportunity','linkedin','github'],
      answer: "Reach Maxson at mailtomaxson@gmail.com, GitHub: github.com/maxx1404, or LinkedIn: linkedin.com/in/maxson-mathew-9022082b1. He's open to good opportunities." },
    { patterns: ['iisc','isc','research','bangalore','cdpg'],
      answer: "Maxson built his Ambulance Distribution System at IISc Bangalore's CDPG — processing 700,000+ real traffic data points. Real research exposure, not just classroom projects." },
    { patterns: ['side project','ipl','rag','llm eval','small project'],
      answer: "Maxson's side projects include an IPL Win Predictor, a RAG pipeline built from scratch (no LangChain), and an LLM Evaluation Framework. All in progress — real work, not tutorial clones." },
    { patterns: ['education','bmsit','college','university','degree','bms'],
      answer: "Maxson is completing his BE in Artificial Intelligence and Machine Learning at BMS Institute of Technology and Management, Bengaluru (2022–present). CGPA: 9.22." },
  ];

  function getFallbackAnswer(question) {
    const q = question.toLowerCase();
    for (const entry of FALLBACK_QA) {
      if (entry.patterns.some(p => q.includes(p))) {
        return entry.answer;
      }
    }
    return "I don't have a specific answer for that in fallback mode. For the full AI chatbot experience, add your Anthropic API key to js/config.js. Or reach out to Maxson directly at mailtomaxson@gmail.com.";
  }

  /* ============================================================
     RENDER HELPERS
     ============================================================ */

  function isApiKeyValid() {
    return CONFIG.ANTHROPIC_API_KEY &&
           CONFIG.ANTHROPIC_API_KEY !== 'xyxyxy' &&
           CONFIG.ANTHROPIC_API_KEY.length > 10;
  }

  function getMessagesContainer() {
    return document.getElementById('chat-messages');
  }

  function scrollToBottom() {
    const container = getMessagesContainer();
    if (container) container.scrollTop = container.scrollHeight;
  }

  function appendMessage(role, text) {
    const container = getMessagesContainer();
    if (!container) return null;

    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    msgEl.appendChild(avatar);
    msgEl.appendChild(bubble);
    container.appendChild(msgEl);
    scrollToBottom();
    return bubble;
  }

  function showTyping() {
    const container = getMessagesContainer();
    if (!container) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message assistant';
    wrapper.id = 'chat-typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = '🤖';

    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(typing);
    container.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  function removeTyping() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
  }

  /* ============================================================
     SEND MESSAGE
     ============================================================ */

  // Conversation history for multi-turn context
  let conversationHistory = [];

  async function sendMessage(userText) {
    if (!userText.trim()) return;

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    // Disable input while processing
    if (input) input.value = '';
    if (sendBtn) sendBtn.disabled = true;

    // Show user message
    appendMessage('user', userText);

    // Add to history
    conversationHistory.push({ role: 'user', content: userText });

    // Show typing indicator
    const typingEl = showTyping();

    if (!isApiKeyValid()) {
      // Fallback mode
      await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
      removeTyping();
      const answer = getFallbackAnswer(userText);
      appendMessage('assistant', answer);
      conversationHistory.push({ role: 'assistant', content: answer });
    } else {
      // Live API mode
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CONFIG.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: CONFIG.ANTHROPIC_MODEL,
            max_tokens: 400,
            system: CONFIG.CHATBOT_SYSTEM_PROMPT,
            messages: conversationHistory,
          }),
        });

        const data = await response.json();

        removeTyping();

        if (data.error) {
          const errMsg = `API error: ${data.error.message}. Check your API key in js/config.js.`;
          appendMessage('assistant', errMsg);
          conversationHistory.push({ role: 'assistant', content: errMsg });
        } else {
          const reply = data.content?.[0]?.text || 'No response received.';
          appendMessage('assistant', reply);
          conversationHistory.push({ role: 'assistant', content: reply });
        }

      } catch (err) {
        removeTyping();
        const errMsg = 'Could not reach the API. Check your internet connection and API key.';
        appendMessage('assistant', errMsg);
        console.error('Chatbot API error:', err);
      }
    }

    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }

  /* ============================================================
     INIT — wire up the chat window UI
     ============================================================ */
  function init() {
    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const notice  = document.getElementById('chat-api-notice');

    // Show/hide API key notice
    if (notice) {
      notice.style.display = isApiKeyValid() ? 'none' : 'block';
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (input) sendMessage(input.value);
      });
    }

    // Enter key to send (Shift+Enter for newline)
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(input.value);
        }
      });
    }

    // Suggestion chips
    document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sendMessage(btn.dataset.question);
      });
    });

    // Opening greeting — once per session
    if (!sessionStorage.getItem('chat-greeted')) {
      setTimeout(() => {
        appendMessage('assistant',
          "Hey! I'm Maxson's portfolio assistant. Ask me anything — his projects, skills, background, or whether he's available for opportunities.");
        sessionStorage.setItem('chat-greeted', '1');
      }, 400);
    }
  }

  return { init, sendMessage };

})();
