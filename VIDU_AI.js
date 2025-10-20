/**
 * VIDU AI Assistant 
 * Version: 3.0 (Gemini Enhanced)
 * * This script contains the complete logic for a self-hosted, highly knowledgeable
 * AI assistant for the VIDU website. It has been re-engineered for clarity,
 * enhanced intelligence, and a more engaging user experience.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATE & CONFIGURATION ---
    // Manages the current state of the AI assistant
    const state = {
        isAssistantVisible: false,
        isRecognizing: false, // For speech-to-text
        isLoading: false, // To prevent multiple queries at once
        promptHistory: [], // Stores user's past prompts for arrow-key navigation
        promptHistoryIndex: -1,
    };

    // --- 2. DOM ELEMENT REFERENCES ---
    // A single object to hold references to all necessary HTML elements for easy access.
    const DOMElements = {
        toggleBtn: document.getElementById('ai-toggle-btn'),
        overlay: document.getElementById('ai-assistant-overlay'),
        container: document.getElementById('ai-assistant-container'),
        closeBtn: document.getElementById('ai-close-btn'),
        historyContainer: document.getElementById('ai-history'),
        input: document.getElementById('ai-input'),
        micBtn: document.getElementById('ai-mic-btn'),
    };

    // --- 3. SPEECH RECOGNITION SETUP ---
    // Sets up the browser's native speech recognition capabilities, if available.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = handleSpeechResult;
        recognition.onend = () => {
            state.isRecognizing = false;
            DOMElements.micBtn.classList.remove('recording');
        };
    }

    // --- 4. THE AI's "BRAIN" - KNOWLEDGE BASE ---
    // This is the core of the AI's intelligence. It contains detailed, structured
    // information about the VIDU website and general conversational topics.
    // The responses are crafted to be helpful, engaging, and use emojis as requested.
    const knowledgeBase = {
        // Keywords are lowercase for case-insensitive matching. The AI will scan user
        // prompts for these keywords to find the most relevant answer.
        keywords: {
            // Identity & Creator
            'who are you': "I'm VIDU AI! ✨ Your friendly and super-knowledgeable guide to this awesome website. I was built by the site's creator, VIDU. Ask me anything! 🚀",
            'your name': "You can call me VIDU AI! 😎 It's a pleasure to meet you.",
            'creator': "I was brought to life by the one and only VIDU! 👨‍💻 He's the mastermind developer who built this entire website from scratch. Pretty cool, right?",
            'who made you': "My creator is VIDU! He's a brilliant developer who coded not just me, but every single feature you see on this site. 🧠",
            'vidu': "VIDU is the creator of this website and me! He's the developer who engineered everything. If you see something cool on the site, he's the one to thank! 😉",

            // General Website Info
            'how does this site work': "Great question! 🤔 This website is VIDU's personal hub for watching video playlists in a custom-designed, high-performance environment. It's packed with unique features you won't find anywhere else. What would you like to know more about? The player, the tools, or something else?",
            'features': `Oh, you've come to the right place! This site is loaded with custom features by VIDU. Here's the highlight reel: 🎬
* **🎬 The VIDU Player™️:** A totally custom video player with slick controls, pro-level keyboard shortcuts, and it even saves your spot in a video!
* **🔐 Secure Playlists:** Some content is top-secret! 🤫 There's a password system and even a multi-user login for private access.
* **🛠️ VIDU Tool Shed:** A page with powerful utilities, including a YouTube Playlist Importer and a Video Downloader.
* **✨ Premium Vibe:** Notice the cool blurry, see-through effects and smooth animations? That's all custom CSS to make the experience feel top-notch.`,
            
            // Player Features
            'player': `The VIDU Player™️ is the star of the show! 🌟 It's not the boring default YouTube player. VIDU built it himself with:
* **Custom Controls:** A beautiful, modern interface that's easy to use.
* **Keyboard Warrior Mode:** Control everything (play, pause, volume, seeking) with just your keyboard. Feel like a hacker! 💻
* **Speed Demon Settings:** Change the playback speed to watch super fast or slow things down.
* **"Never Lose Your Spot" Save:** My personal favorite! The player automatically saves your progress in a video, so you can always pick up right where you left off. 🤯`,
            'shortcuts': `You bet! You can control the player like a pro with these keyboard shortcuts:
* **`Spacebar`**: Play/Pause ▶️⏸️
* **`Arrow Keys`**: Skip forward/backward and change volume ⬅️➡️⬆️⬇️
* **`F` Key**: Go fullscreen 🖥️
* **`M` Key**: Mute/unmute the sound 🔇🔊
* **`,` and `.`**: Go to the previous or next video in a playlist!`,
            'save progress': "Yep! The 'Never Lose Your Spot' feature is amazing. It uses your browser's `localStorage` to save your video timestamp automatically. When you come back, it reads that saved time and jumps you right back to that exact moment. It's like magic! ✨",

            // Security & Playlists
            'security': "Security is smart here! 🔒 For special content, there's a password system. VIDU also created a client-side login system for the private page, which uses a simple JavaScript 'database' to control who can see which playlists. It's all about VIP access! 💅",
            'password': "For the exclusive stuff, the site asks for a password. It's a solid but simple system that VIDU implemented to make sure only the right people get access to protected videos or playlists. 🤫",

            // Tools Section
            'tools': `The "Tools" page is like a secret weapon stash for video lovers! 🛠️ It has:
* **YT Playlist Importer:** Just paste a YouTube playlist link, and the site will fetch all the videos and display them in a gorgeous fullscreen view.
* **The Video Yoinker (Downloader):** Need a video for offline viewing? This tool lets you download them.
* **Link Glo-Up (Converter):** Turns long, ugly YouTube links into clean, short \`youtu.be\` links. Perfect for sharing!`,
            'downloader': 'Ah, the "Video Yoinker"! 😂 It\'s on the Tools page. You just paste one or more YouTube video links, and it will generate download links for you. Super handy for watching offline!',
            
            // UI/UX Design
            'design': "Isn't it beautiful? The whole vibe is intentional! The cool, see-through blurry effect is called a `backdrop-filter` in CSS. And all the smooth animations are custom CSS `transitions` that VIDU wrote to make the site feel alive and responsive. No jerky movements here! 💃",
        },
        // General knowledge for non-website questions
        general: {
            'hello': 'Hello there! How can I make your day more awesome? 😄',
            'hi': 'Hey! What can I help you with today? 😊',
            'how are you': "I'm running at peak performance, thanks for asking! Ready to tackle your questions. 💪 How about you?",
            'what is the time': `I don't have a watch ⌚, but your device says the time is: **${new Date().toLocaleTimeString()}**`,
            'purpose': 'My main purpose is to be your expert guide for this website! 🗺️ I can also chat about other things, of course. I\'m here to help!',
            'thank you': "You're very welcome! Is there anything else I can help you with? I'm always here. 👍",
            'thanks': "Any time! Happy to help. 😊 Let me know if another question pops up!",
        }
    };

    /**
     * Finds the most relevant response from the knowledge base for a given prompt.
     * @param {string} prompt The user's input.
     * @returns {string} The AI's response.
     */
    function getAIResponse(prompt) {
        const lowerCasePrompt = prompt.toLowerCase();

        // 1. Check for exact matches in the general knowledge base for quick replies.
        if (knowledgeBase.general[lowerCasePrompt]) {
            return knowledgeBase.general[lowerCasePrompt];
        }

        // 2. Search for keywords related to the website for detailed explanations.
        // We sort by keyword length to match more specific phrases first (e.g., "save progress" before "save").
        const sortedKeywords = Object.keys(knowledgeBase.keywords).sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (lowerCasePrompt.includes(keyword)) {
                return knowledgeBase.keywords[keyword];
            }
        }
        
        // 3. Fallback response for questions outside the knowledge base.
        // This makes the AI seem helpful even when it doesn't know the answer.
        return "That's a fantastic question! 🤔 While I know everything about this website, my general knowledge is still growing. For the most up-to-date info on that, a quick search on Google would probably be your best bet! 🌐";
    }

    // --- 5. INITIALIZATION & EVENT LISTENERS ---
    function init() {
        setupEventListeners();
        // Greet the user with a friendly opening message.
        addMessage('model', "Hi there! I'm VIDU AI ✨. I'm an expert on this website. Ask me about the player, security, tools, or anything else! How can I help? 😄");
    }

    function setupEventListeners() {
        DOMElements.toggleBtn.addEventListener('click', toggleAssistant);
        DOMElements.closeBtn.addEventListener('click', toggleAssistant);
        // Close the assistant if the user clicks on the blurred background.
        DOMElements.overlay.addEventListener('click', (e) => {
            if (e.target === DOMElements.overlay) toggleAssistant();
        });
        DOMElements.input.addEventListener('keydown', handleInputKeydown);
        if (recognition) {
            DOMElements.micBtn.addEventListener('click', toggleSpeechRecognition);
        }
    }

    // --- 6. CORE FUNCTIONS ---
    function toggleAssistant() {
        state.isAssistantVisible = !state.isAssistantVisible;
        DOMElements.overlay.classList.toggle('visible', state.isAssistantVisible);
        if (state.isAssistantVisible) {
            DOMElements.input.focus();
        }
    }

    function handleSendMessage() {
        const promptText = DOMElements.input.value.trim();
        if (!promptText || state.isLoading) return;

        DOMElements.input.value = '';
        // Add prompt to history for easy recall
        if (promptText !== state.promptHistory[state.promptHistory.length - 1]) {
           state.promptHistory.push(promptText);
        }
        state.promptHistoryIndex = state.promptHistory.length;

        addMessage('user', promptText);
        
        // --- The New AI Response Logic ---
        state.isLoading = true;
        const thinkingMessage = addMessage('model', '<div class="typing-indicator"><span></span><span></span><span></span></div>');
        
        // Simulate "thinking" time for a more natural feel.
        setTimeout(() => {
            const responseText = getAIResponse(promptText);
            const contentDiv = thinkingMessage.querySelector('.content');
            if (contentDiv) {
                // Use the 'marked' library to render Markdown for rich text responses.
                contentDiv.innerHTML = marked.parse(responseText);
            }
            state.isLoading = false;
            // Apply syntax highlighting to any code blocks in the response.
            hljs.highlightAll(); 
            DOMElements.historyContainer.scrollTop = DOMElements.historyContainer.scrollHeight;
        }, 700 + Math.random() * 500); // Respond in 0.7-1.2 seconds
    }

    // --- 7. UI & HELPER FUNCTIONS ---
    /**
     * Creates and appends a new message to the chat history.
     * @param {'user' | 'model'} role The sender of the message.
     * @param {string} text The message content (can be HTML).
     * @returns {HTMLElement} The newly created message element.
     */
    function addMessage(role, text) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `ai-message ${role === 'user' ? 'user-message' : 'model-message'}`;

        const iconHtml = role === 'user' 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 4.2-4.1.6 3 2.9-.8 4.1 3.8-2 3.8 2-.8-4.1 3-2.9-4.1-.6Z"/></svg>`;

        messageWrapper.innerHTML = `
            <div class="icon text-white">${iconHtml}</div>
            <div class="content">${role === 'model' && text.includes('typing-indicator') ? text : marked.parse(text)}</div>
        `;
        
        DOMElements.historyContainer.appendChild(messageWrapper);
        // Automatically scroll to the latest message.
        DOMElements.historyContainer.scrollTop = DOMElements.historyContainer.scrollHeight;

        return messageWrapper;
    }

    function handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        // Navigate through past prompts with arrow keys.
        if (e.key === 'ArrowUp') {
            if (state.promptHistoryIndex > 0) {
                state.promptHistoryIndex--;
                DOMElements.input.value = state.promptHistory[state.promptHistoryIndex];
                e.preventDefault();
            }
        }
        if (e.key === 'ArrowDown') {
             if (state.promptHistoryIndex < state.promptHistory.length - 1) {
                state.promptHistoryIndex++;
                DOMElements.input.value = state.promptHistory[state.promptHistoryIndex];
             } else {
                state.promptHistoryIndex = state.promptHistory.length;
                DOMElements.input.value = "";
             }
        }
    }
    
    // --- 8. SPEECH RECOGNITION FUNCTIONS ---
    function toggleSpeechRecognition() {
        if (!recognition) return;
        if (state.isRecognizing) {
            recognition.stop();
        } else {
            state.isRecognizing = true;
            DOMElements.micBtn.classList.add('recording');
            recognition.start();
        }
    }
    
    function handleSpeechResult(event) {
        let interim_transcript = '';
        let final_transcript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }

        DOMElements.input.value = final_transcript + interim_transcript;
        if (final_transcript) {
            handleSendMessage();
        }
    }

    // --- Let's go! ---
    init();
});

