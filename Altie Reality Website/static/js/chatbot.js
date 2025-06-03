class AltieBot {
    constructor() {
        console.log('AltieBot constructor called');
        this.knowledgeBase = {
            'greeting': [
                'Hello! I\'m Altie Bot, your XR assistant. How can I help you today?',
                'Hi there! I\'m here to help you explore the world of XR. What would you like to know?'
            ],
            'xr': [
                'XR (Extended Reality) is an umbrella term that encompasses VR, AR, and MR technologies. It creates immersive experiences that blend the physical and digital worlds.',
                'Extended Reality combines virtual, augmented, and mixed reality to create immersive digital experiences.'
            ],
            'vr': [
                'Virtual Reality (VR) creates a completely immersive digital environment that replaces the real world. Users wear VR headsets to experience these virtual worlds.',
                'VR is perfect for immersive training, gaming, and virtual tours. It completely replaces your view of the real world with a virtual one.'
            ],
            'ar': [
                'Augmented Reality (AR) overlays digital information onto the real world. It enhances your view of reality with computer-generated elements.',
                'AR can be experienced through smartphones, tablets, or AR glasses. It adds digital elements to your real-world view.'
            ],
            'mr': [
                'Mixed Reality (MR) combines elements of both VR and AR, allowing digital and physical objects to interact in real-time.',
                'MR creates an environment where physical and digital objects coexist and interact with each other.'
            ],
            'reliconnect': [
                'ReLiConnect is Altie Reality\'s platform for creating immersive virtual meetings and collaborations. It\'s perfect for remote teams and virtual events.',
                'With ReLiConnect, you can host virtual meetings, conferences, and collaborative sessions in an immersive 3D environment.'
            ],
            'learnxr': [
                'LearnXR is our educational platform designed for K-12 students. It provides interactive XR learning experiences across various subjects.',
                'LearnXR makes learning fun and engaging through immersive virtual experiences. It\'s specifically designed for students from kindergarten to 12th grade.'
            ],
            'contact': [
                'You can reach us at support@altiereality.com or visit our contact page for more information.',
                'For support or inquiries, please email us at support@altiereality.com or use our contact form on the website.'
            ],
            'audience': [
                "Altie Reality caters to a wide range of industries including education, real estate, gaming, tourism, defence, and healthcare. Our solutions are designed for schools, businesses, and organizations looking to leverage XR technologies.",
                "We serve educational institutions, real estate developers, gaming companies, religious organizations, and more, providing immersive XR and AI-powered solutions."
            ],
            'default': [
                'I\'m not sure about that. Could you please rephrase your question?',
                'I don\'t have information about that yet. Would you like to know about our XR services instead?'
            ]
        };
        this.lastTopic = null; // Store last detected topic
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            console.log('Document still loading, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded fired, initializing chatbot');
                this.initializeChatbot();
            });
        } else {
            console.log('Document already loaded, initializing chatbot immediately');
            this.initializeChatbot();
        }
    }

    initializeChatbot() {
        console.log('Initializing chatbot UI');
        try {
            // Create chatbot elements
            const container = document.createElement('div');
            container.className = 'chatbot-container';
            console.log('Created container element');
            
            const button = document.createElement('button');
            button.className = 'chatbot-button';
            button.innerHTML = '<img src="/images/chatbot-icon.png" alt="Altie Bot">';
            console.log('Created button element');
            
            const window = document.createElement('div');
            window.className = 'chatbot-window';
            console.log('Created window element');
            
            const header = document.createElement('div');
            header.className = 'chatbot-header';
            header.innerHTML = `
                <h3>Altie Bot</h3>
                <div class="chatbot-controls">
                    <button class="minimize-btn">−</button>
                    <button class="close-btn">×</button>
                </div>
            `;
            console.log('Created header element');
            
            const messages = document.createElement('div');
            messages.className = 'chatbot-messages';
            console.log('Created messages element');
            
            const input = document.createElement('div');
            input.className = 'chatbot-input';
            input.innerHTML = `
                <input type="text" placeholder="Type your message...">
                <button>Send</button>
            `;
            console.log('Created input element');
            
            window.appendChild(header);
            window.appendChild(messages);
            window.appendChild(input);
            container.appendChild(button);
            container.appendChild(window);
            document.body.appendChild(container);
            console.log('Added all elements to DOM');

            // Add event listeners
            button.addEventListener('click', () => this.toggleChat());
            header.querySelector('.minimize-btn').addEventListener('click', () => this.minimizeChat());
            header.querySelector('.close-btn').addEventListener('click', () => this.closeChat());
            input.querySelector('button').addEventListener('click', () => this.sendMessage());
            input.querySelector('input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
            console.log('Added all event listeners');

            // Add initial greeting
            this.addMessage('bot', this.getRandomResponse('greeting'));
            console.log('Added initial greeting');
        } catch (error) {
            console.error('Error initializing chatbot:', error);
        }
    }

    toggleChat() {
        const window = document.querySelector('.chatbot-window');
        const container = document.querySelector('.chatbot-container');
        const button = document.querySelector('.chatbot-button');
        const img = button.querySelector('img');
        // Always remove minimized state when opening
        window.classList.remove('minimized');
        container.classList.remove('minimized');
        // Remove inline style overrides
        button.removeAttribute('style');
        img.removeAttribute('style');
        // Toggle visibility
        window.style.display = window.style.display === 'none' || window.style.display === '' ? 'flex' : 'none';
    }

    minimizeChat() {
        const window = document.querySelector('.chatbot-window');
        const container = document.querySelector('.chatbot-container');
        const button = document.querySelector('.chatbot-button');
        const img = button.querySelector('img');
        window.classList.add('minimized');
        container.classList.add('minimized');
        // Inline style override for minimized state
        button.style.background = 'transparent';
        button.style.boxShadow = 'none';
        button.style.border = 'none';
        button.style.outline = 'none';
        button.style.width = 'auto';
        button.style.height = 'auto';
        button.style.padding = '0';
        button.style.borderRadius = '0';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.background = 'transparent';
        img.style.border = 'none';
        img.style.borderRadius = '0';
        img.style.boxShadow = 'none';
        img.style.display = 'block';
    }

    closeChat() {
        const window = document.querySelector('.chatbot-window');
        window.style.display = 'none';
    }

    sendMessage() {
        const input = document.querySelector('.chatbot-input input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage('user', message);
            input.value = '';
            
            // Simulate bot thinking
            setTimeout(() => {
                this.processUserMessage(message);
            }, 500);
        }
    }

    addMessage(type, content) {
        const messages = document.querySelector('.chatbot-messages');
        const message = document.createElement('div');
        message.className = `message ${type}-message`;
        message.textContent = content;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        let response = '';
        let topic = null;

        // Check for keywords in the message
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            topic = 'greeting';
        } else if (lowerMessage.includes('xr') || lowerMessage.includes('extended reality')) {
            topic = 'xr';
        } else if (lowerMessage.includes('vr') || lowerMessage.includes('virtual reality')) {
            topic = 'vr';
        } else if (lowerMessage.includes('ar') || lowerMessage.includes('augmented reality')) {
            topic = 'ar';
        } else if (lowerMessage.includes('mr') || lowerMessage.includes('mixed reality')) {
            topic = 'mr';
        } else if (lowerMessage.includes('reliconnect')) {
            topic = 'reliconnect';
        } else if (lowerMessage.includes('learnxr')) {
            topic = 'learnxr';
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('support')) {
            topic = 'contact';
        } else if (
            lowerMessage.includes('who does altie reality cater to') ||
            lowerMessage.includes('target audience') ||
            lowerMessage.includes('industries served') ||
            lowerMessage.includes('who do you serve') ||
            lowerMessage.includes('who is altie reality for') ||
            lowerMessage.includes('who are your clients')
        ) {
            topic = 'audience';
        }

        // If the message is vague (e.g., "how is it helpful?"), use last topic
        if (!topic && this.lastTopic) {
            if (lowerMessage.includes('how') && lowerMessage.includes('help')) {
                // Provide a helpful answer based on last topic
                switch (this.lastTopic) {
                    case 'vr':
                        response = 'VR is helpful for immersive training, education, gaming, and virtual tours. It allows users to experience things that are difficult or impossible in the real world.';
                        break;
                    case 'ar':
                        response = 'AR is helpful for enhancing real-world experiences with digital information, making learning, navigation, and entertainment more interactive.';
                        break;
                    case 'xr':
                        response = 'XR is helpful as it combines VR, AR, and MR to create new ways of interacting with digital and physical environments.';
                        break;
                    case 'mr':
                        response = 'MR is helpful for blending real and virtual worlds, enabling new forms of collaboration and visualization.';
                        break;
                    default:
                        response = this.getRandomResponse(this.lastTopic);
                }
            } else {
                response = this.getRandomResponse(this.lastTopic);
            }
        }

        // If topic is found, update lastTopic and respond
        if (topic) {
            this.lastTopic = topic;
            response = this.getRandomResponse(topic);
        }

        // If still no response, use improved default
        if (!response) {
            response = "I'm here to help with questions about XR, Altie Reality, and our services. Could you please rephrase or ask about a specific topic like VR, AR, or our products?";
        }

        this.addMessage('bot', response);
    }

    getRandomResponse(category) {
        const responses = this.knowledgeBase[category] || this.knowledgeBase['default'];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Initialize the chatbot
console.log('Creating AltieBot instance');
new AltieBot(); 