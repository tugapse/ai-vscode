// This file contains the TypeScript logic for your webview.
// It will be compiled into JavaScript and loaded by index.html.

// Declare acquireVsCodeApi to avoid TypeScript errors.
// This function is globally injected by VS Code into webviews.
declare function acquireVsCodeApi(): any;

// Acquire the VS Code API object
const vscode = acquireVsCodeApi();

const chatContainer = document.getElementById('chat-container') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;

let chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = []; // Stores the chat history for display and API calls

function appendMessage(sender: 'user' | 'ai' | 'loading', text: string, isTemporary: boolean = false): void {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else if (sender === 'ai') {
        messageDiv.classList.add('ai-message');
    } else if (sender === 'loading') {
        messageDiv.classList.add('loading-message');
    }
    messageDiv.textContent = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom

    if (isTemporary) {
        messageDiv.dataset.temporary = 'true';
    }
}

function removeTemporaryMessage(): void {
    const tempMessage = chatContainer.querySelector('[data-temporary="true"]');
    if (tempMessage) {
        chatContainer.removeChild(tempMessage);
    }
}

async function sendMessage(): Promise<void> {
    const message = chatInput.value.trim();
    if (!message) {
        return;
    }

    appendMessage('user', message);
    chatHistory.push({ role: 'user', parts: [{ text: message }] });
    chatInput.value = ''; // Clear input

    sendButton.disabled = true;
    chatInput.disabled = true;
    appendMessage('loading', 'AI is thinking...', true); // Add temporary loading message

    try {
        // Send message to the extension host
        vscode.postMessage({
            command: 'sendMessageToAI',
            text: message,
            chatHistory: chatHistory // Send the full history for context
        });
    } catch (error: any) {
        removeTemporaryMessage();
        appendMessage('ai', 'Error: Could not send message to extension host.');
        console.error('Error sending message to extension:', error);
        sendButton.disabled = false;
        chatInput.disabled = false;
    }
}

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        sendMessage();
    }
});

// Handle messages from the extension host
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    switch (message.command) {
        case 'aiResponse':
            removeTemporaryMessage(); // Remove loading message
            appendMessage('ai', message.text);
            chatHistory.push({ role: 'model', parts: [{ text: message.text }] }); // Add AI response to history
            sendButton.disabled = false;
            chatInput.disabled = false;
            break;
        case 'aiError':
            removeTemporaryMessage(); // Remove loading message
            appendMessage('ai', 'Error: ' + message.text);
            sendButton.disabled = false;
            chatInput.disabled = false;
            break;
    }
});

// Initial welcome message
appendMessage('ai', 'Hello! How can I assist you with your code today?');
