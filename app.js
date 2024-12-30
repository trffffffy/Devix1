import { firebaseConfig } from './firebase-config.js';
import { geminiService } from './gemini-service.js';

// Get Firebase functions
const { initializeApp, getAuth, signInWithPopup, GoogleAuthProvider } = window.initFirebase();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Update provider settings
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.setCustomParameters({
    prompt: 'select_account',
    // Add localhost to allowed domains
    auth_domain: window.location.hostname
});

// DOM Elements
const authContainer = document.getElementById('authContainer');
const mainContainer = document.getElementById('mainContainer');
const googleSignIn = document.getElementById('googleSignIn');
const signOutBtn = document.getElementById('signOut');
const sendButton = document.getElementById('sendButton');
const userInput = document.getElementById('userInput');
const messages = document.getElementById('messages');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const header = document.getElementById('header');
const subHeader = document.getElementById('subHeader');
const promptDescription = document.getElementById('promptDescription');
const promptButtons = document.getElementById('promptButtons');
const refreshPrompts = document.getElementById('refreshPrompts');

// Add image handling variables
let currentImage = null;
const imageButton = document.querySelector('.input-actions button:nth-child(2)');
const imageInput = document.createElement('input');
imageInput.type = 'file';
imageInput.accept = 'image/*';
imageInput.style.display = 'none';
document.body.appendChild(imageInput);

// Ensure elements exist before adding event listeners
if (googleSignIn) {
    googleSignIn.addEventListener('click', async () => {
        try {
            const currentDomain = window.location.hostname;
            const allowedDomains = ['localhost', '127.0.0.1'];
            
            if (!allowedDomains.includes(currentDomain)) {
                throw new Error(`Domain ${currentDomain} is not authorized. Please access through localhost or 127.0.0.1`);
            }

            const result = await signInWithPopup(auth, provider);
            console.log('Authentication successful:', result.user.email);
            
        } catch (error) {
            console.error('Detailed auth error:', error);
            const authError = document.getElementById('authError');
            authError.textContent = error.message;
            authError.classList.remove('hidden');
        }
    });
}

if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    });
}

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.classList.add('fade-out');
        setTimeout(() => {
            authContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mainContainer.classList.add('fade-in');
        }, 500);
    } else {
        mainContainer.classList.add('fade-out');
        setTimeout(() => {
            mainContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
            authContainer.classList.add('fade-in');
        }, 500);
    }
});

// Handle file upload
if (uploadButton) {
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Handle file processing here
            const reader = new FileReader();
            reader.onload = (e) => {
                userInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
}

// Add image input handler
imageButton.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            // Show image preview
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
            
            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i data-feather="x"></i>';
            removeBtn.onclick = () => {
                preview.remove();
                currentImage = null;
            };
            preview.appendChild(removeBtn);
            
            userInput.parentElement.insertBefore(preview, userInput);
            
            // Store image data
            currentImage = await geminiService.getImageData(file);
            
            // Update feather icons
            feather.replace();
        } catch (error) {
            console.error('Error handling image:', error);
            appendMessage('error', 'Failed to process image. Please try again.');
        }
    }
});

// Add loading state
let isGeneratingResponse = false;

// Handle message sending with AI response
if (sendButton) {
    sendButton.addEventListener('click', async () => {
        const message = userInput.value.trim();
        if ((message || currentImage) && !isGeneratingResponse) {
            try {
                // Show user message with image if present
                appendMessage('user', message, false, currentImage);
                
                // Clear input and image
                userInput.value = '';
                const imagePreview = document.querySelector('.image-preview');
                if (imagePreview) {
                    imagePreview.remove();
                }
                
                // Hide prompts and header
                header.classList.add('fade-out');
                subHeader.classList.add('fade-out');
                promptDescription.classList.add('fade-out');
                promptButtons.classList.add('fade-out');
                refreshPrompts.classList.add('fade-out');
                
                setTimeout(() => {
                    header.classList.add('hidden');
                    subHeader.classList.add('hidden');
                    promptDescription.classList.add('hidden');
                    promptButtons.classList.add('hidden');
                    refreshPrompts.classList.add('hidden');
                }, 500);
                
                // Show loading message
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'loading-spinner';
                loadingDiv.innerHTML = `
                    <div class="thinking-dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                    <div class="loading-text">AI is crafting a response...</div>
                `;
                messages.appendChild(loadingDiv);
                
                // Get AI response with image
                const response = await geminiService.generateResponse(message, currentImage);
                currentImage = null;
                
                // Remove loading message
                messages.removeChild(loadingDiv);
                
                // Show AI response
                appendMessage('ai', response, true);
                
            } catch (error) {
                console.error('AI Response Error:', error);
                appendMessage('error', 'Sorry, I encountered an error processing your request.');
            } finally {
                isGeneratingResponse = false;
                sendButton.disabled = false;
            }
        }
    });
}

function appendMessage(sender, content, animate = false, imageData = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (animate) {
        messageDiv.classList.add('fade-in');
    }
    
    // Add image if present
    if (imageData) {
        const img = document.createElement('img');
        img.src = `data:${imageData.type};base64,${imageData.base64}`;
        img.className = 'message-image';
        messageDiv.appendChild(img);
    }
    
    if (sender === 'ai' && content.includes('```')) {
        // Handle code blocks with syntax highlighting
        const parts = content.split(/```(\w+)?/);
        parts.forEach((part, index) => {
            if (index % 2 === 0) {
                // Regular text
                if (part.trim()) {
                    const textEl = document.createElement('p');
                    textEl.textContent = part;
                    textEl.style.whiteSpace = 'pre-wrap';
                    textEl.style.wordWrap = 'break-word';
                    textEl.style.wordBreak = 'break-word';
                    textEl.style.overflowWrap = 'break-word';
                    messageDiv.appendChild(textEl);
                }
            } else {
                // Code block
                const codeBlock = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = parts[index + 1] || '';
                code.className = part ? `language-${part}` : '';
                code.style.whiteSpace = 'pre-wrap';
                code.style.wordBreak = 'break-word';
                codeBlock.appendChild(code);
                messageDiv.appendChild(codeBlock);
            }
        });
    } else {
        const textEl = document.createElement('p');
        textEl.textContent = content;
        textEl.style.whiteSpace = 'pre-wrap';
        textEl.style.wordWrap = 'break-word';
        textEl.style.wordBreak = 'break-word';
        textEl.style.overflowWrap = 'break-word';
        messageDiv.appendChild(textEl);
    }
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Add keyboard shortcut for sending messages
if (userInput) {
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });
}

// Ensure text box stays at the bottom and messages appear above it
const inputBox = document.querySelector('.input-box');
inputBox.style.marginTop = 'auto';
