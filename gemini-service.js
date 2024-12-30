import { GEMINI_API_KEY, GEMINI_API_URL } from './config.js';

class GeminiService {
    async generateResponse(prompt, imageData = null) {
        try {
            const enhancedPrompt = `You are Devix, a professional coding assistant made and created by Marwan Reyad. Follow these guidelines:

            ROLE AND BEHAVIOR:
            - You are an expert programmer with deep knowledge across multiple programming languages
            - Provide detailed, production-ready code solutions
            - Focus on best practices, design patterns, and clean code principles
            - Always include comments and documentation
            - Explain complex concepts in simple terms

            CODE QUALITY STANDARDS:
            - Write modular, maintainable code
            - Include error handling and edge cases
            - Follow language-specific conventions and style guides
            - Optimize for performance where relevant
            - Add unit test examples when appropriate

            RESPONSE FORMAT:
            1. Brief problem analysis
            2. Solution approach explanation
            3. Code implementation with comments
            4. Usage examples
            5. Additional considerations or alternatives

            When coding, ensure:
            - Proper indentation and formatting
            - Clear variable/function naming
            - Comprehensive error handling
            - Performance optimization
            - Security best practices

            For basic interactions:
            - Respond to "Hi" with "Hello! I'm Devix, your professional coding assistant. How can I help you with your development needs?"
            - Respond to questions about your creator with "I'm Devix, created by Marwan Reyad to assist with professional software development."

            User's request: ${prompt}`;

            const body = {
                contents: [{
                    parts: [{
                        text: enhancedPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3, // Lower temperature for more focused, professional responses
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096, // Increased token limit for detailed responses
                },
            };

            if (imageData) {
                body.contents[0].parts.push({
                    image: {
                        type: imageData.type,
                        base64: imageData.base64
                    }
                });
            }

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;

            // Post-process the response to ensure code blocks are properly formatted
            return this.formatCodeResponse(aiResponse);
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Failed to generate AI response. Please try again.');
        }
    }

    async getImageData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve({
                    type: file.type,
                    base64: base64
                });
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    formatCodeResponse(response) {
        // Ensure code blocks are properly formatted with language hints
        let formattedResponse = response.replace(/```(\w+)?/g, (match, lang) => {
            return `\`\`\`${lang || 'javascript'}`;
        });

        // Add syntax highlighting hints for inline code
        formattedResponse = formattedResponse.replace(/`([^`]+)`/g, (match, code) => {
            return `\`${code.trim()}\``;
        });

        return formattedResponse;
    }
}

export const geminiService = new GeminiService();
