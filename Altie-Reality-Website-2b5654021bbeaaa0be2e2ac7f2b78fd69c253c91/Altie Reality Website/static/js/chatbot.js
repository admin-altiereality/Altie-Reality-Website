class AltieBot {
    constructor() {
        console.log('AltieBot constructor called');
        this.knowledgeBase = {
            'greeting': [
                'Hello! I\'m Altie, your XR assistant. How can I help you today?',
                'Hi there! I\'m Altie, ready to help you explore our XR solutions. What would you like to know?',
                'Hey! I\'m Altie. How can I assist you with XR today?',
                'Greetings! I\'m Altie, your guide to the world of XR. What can I help you with?'
            ],
            'affirmative': [
                'Great! Let me tell you about our XR solutions. We offer VR, AR, and MR experiences for various industries.',
                'Perfect! Would you like to know about our specific products like ReLiConnect or LearnXR?',
                'Excellent! I can tell you about our XR services. What interests you most - education, business, or entertainment?',
                'Wonderful! Let\'s explore our XR solutions. Would you like to know about our virtual meeting platform or educational tools?'
            ],
            'negative': [
                'No problem! Is there something specific about XR that you\'d like to learn about?',
                'That\'s okay! Would you like to know about our different XR products instead?',
                'I understand! Let me know if you have any questions about our XR services.',
                'No worries! Feel free to ask about any aspect of our XR solutions.'
            ],
            'vr': [
                'Virtual Reality (VR) creates a completely immersive digital environment that replaces the real world. Users wear VR headsets to experience these virtual worlds.',
                'VR is perfect for immersive training, gaming, and virtual tours. It completely replaces your view of the real world with a virtual one.',
                'Our VR solutions include immersive training simulations, virtual meetings, and interactive learning experiences.',
                'VR technology allows users to interact with 3D environments and objects in real-time, creating engaging and realistic experiences.'
            ],
            'ar': [
                'Augmented Reality (AR) overlays digital information onto the real world. It enhances your view of reality with computer-generated elements.',
                'AR can be experienced through smartphones, tablets, or AR glasses. It adds digital elements to your real-world view.',
                'Our AR solutions include interactive product demonstrations, educational overlays, and real-time information display.',
                'AR technology enhances real-world experiences by adding contextual digital information and interactive elements.'
            ],
            'mr': [
                'Mixed Reality (MR) combines elements of both VR and AR, allowing digital and physical objects to interact in real-time.',
                'MR creates an environment where physical and digital objects coexist and interact with each other.',
                'Our MR solutions enable seamless interaction between real and virtual elements, perfect for advanced training and visualization.',
                'MR technology allows users to manipulate both physical and digital objects simultaneously, creating unique interactive experiences.'
            ],
            'xr': [
                'XR (Extended Reality) is an umbrella term that encompasses VR, AR, and MR technologies. It creates immersive experiences that blend the physical and digital worlds.',
                'Extended Reality combines virtual, augmented, and mixed reality to create immersive digital experiences.',
                'Our XR solutions integrate various technologies to provide comprehensive immersive experiences for different industries.',
                'XR technology enables seamless transitions between real and virtual environments, offering versatile applications across sectors.'
            ],
            'features': [
                'Altie Reality offers a comprehensive suite of XR features including immersive virtual meetings, educational experiences, and interactive training solutions.',
                'Our key features include real-time collaboration, 3D visualization, interactive learning modules, and cross-platform compatibility.',
                'We provide features like spatial audio, gesture controls, and realistic avatars for an immersive experience.',
                'Our platform includes features for content creation, analytics, and user management.'
            ],
            'services': [
                'Altie Reality provides XR solutions for education, business, healthcare, and entertainment sectors.',
                'Our services include virtual meeting platforms, educational content creation, and custom XR development.',
                'We offer consultation, implementation, and support services for XR integration.',
                'Our services extend to training, maintenance, and continuous updates of XR solutions.'
            ],
            'reliconnect': [
                'ReLiConnect is our virtual meeting platform that enables immersive collaboration and communication.',
                'With ReLiConnect, you can host virtual meetings, conferences, and collaborative sessions in a 3D environment.',
                'Features include spatial audio, gesture controls, and realistic avatars for natural interaction.',
                'ReLiConnect supports cross-platform access and real-time collaboration tools.'
            ],
            'learnxr': [
                'LearnXR is our educational platform designed for K-12 students, offering interactive learning experiences.',
                'The platform provides immersive content across various subjects, making learning engaging and effective.',
                'LearnXR includes features like progress tracking, interactive assessments, and collaborative learning tools.',
                'It supports both individual and group learning experiences in virtual environments.'
            ],
            'metamatch': [
                'MetaMatch is our AI-powered matching platform for virtual events and networking.',
                'It helps connect like-minded individuals and organizations in virtual spaces.',
                'Features include intelligent matching algorithms, profile customization, and event management tools.',
                'MetaMatch facilitates meaningful connections in virtual environments.'
            ],
            'industries': [
                'Altie Reality serves multiple industries including education, healthcare, real estate, and entertainment.',
                'We provide specialized XR solutions for each industry, addressing their unique needs and challenges.',
                'Our solutions help industries enhance training, visualization, and customer engagement.',
                'We work with businesses of all sizes, from startups to large enterprises.'
            ],
            'technology': [
                'Our technology stack includes advanced VR, AR, and MR solutions with AI integration.',
                'We use cutting-edge hardware and software for optimal performance and user experience.',
                'Our platforms are built with scalability, security, and cross-platform compatibility in mind.',
                'We continuously update our technology to incorporate the latest innovations in XR.'
            ],
            'support': [
                'We offer comprehensive support through email, phone, and live chat.',
                'Our support team is available to help with technical issues, implementation, and training.',
                'We provide regular updates, documentation, and training resources for our users.',
                'For immediate assistance, contact us at support@altiereality.com.'
            ],
            'pricing': [
                'We offer flexible pricing plans tailored to different business needs and scales.',
                'Our pricing includes options for individuals, small businesses, and enterprises.',
                'We provide custom quotes for specialized requirements and large-scale implementations.',
                'Contact our sales team for detailed pricing information and special offers.'
            ],
            'contact': [
                'You can reach us at support@altiereality.com or visit our contact page for more information.',
                'For sales inquiries, contact sales@altiereality.com.',
                'Our office is located at [Your Office Address].',
                'We\'re available Monday through Friday, 9 AM to 6 PM.'
            ],
            'default': [
                'I\'m not sure about that. Could you please rephrase your question?',
                'I don\'t have information about that yet. Would you like to know about our XR services instead?',
                'I\'m still learning about that topic. Would you like to know more about our XR solutions?',
                'That\'s an interesting question! While I don\'t have a specific answer, I can tell you about our XR services.'
            ],
            'helpful': {
                'vr': [
                    'Yes, VR is very helpful! It\'s particularly useful for immersive training, virtual meetings, and interactive learning experiences.',
                    'Absolutely! VR helps create realistic simulations and immersive environments that enhance learning and collaboration.',
                    'VR is extremely helpful for creating engaging experiences that would be difficult or impossible in the real world.',
                    'Definitely! VR provides unique benefits like complete immersion, realistic simulations, and interactive 3D environments.'
                ],
                'ar': [
                    'Yes, AR is very helpful! It enhances real-world experiences by adding useful digital information and interactive elements.',
                    'Absolutely! AR helps users understand complex information by overlaying it directly in their environment.',
                    'AR is extremely helpful for training, navigation, and providing real-time information in context.',
                    'Definitely! AR makes learning and working more efficient by adding digital elements to the real world.'
                ],
                'mr': [
                    'Yes, MR is very helpful! It combines the best of VR and AR to create interactive experiences that blend real and virtual elements.',
                    'Absolutely! MR helps users interact with both physical and digital objects simultaneously.',
                    'MR is extremely helpful for advanced training and visualization where real-world interaction is important.',
                    'Definitely! MR provides unique benefits by allowing seamless interaction between real and virtual elements.'
                ],
                'xr': [
                    'Yes, XR is very helpful! It provides a comprehensive range of immersive technologies for various applications.',
                    'Absolutely! XR helps create engaging experiences that combine virtual and real-world elements.',
                    'XR is extremely helpful for creating versatile solutions that can adapt to different needs and environments.',
                    'Definitely! XR offers the flexibility to choose the right technology for each specific use case.'
                ],
                'reliconnect': [
                    'Yes, ReLiConnect is very helpful! It enables immersive virtual meetings and collaboration from anywhere.',
                    'Absolutely! ReLiConnect helps teams work together effectively in virtual spaces.',
                    'ReLiConnect is extremely helpful for remote teams and virtual events, providing realistic interaction.',
                    'Definitely! ReLiConnect makes virtual meetings more engaging and productive.'
                ],
                'learnxr': [
                    'Yes, LearnXR is very helpful! It makes learning more engaging and effective through immersive experiences.',
                    'Absolutely! LearnXR helps students understand complex concepts through interactive visualization.',
                    'LearnXR is extremely helpful for creating engaging educational content that students love.',
                    'Definitely! LearnXR enhances learning outcomes through immersive and interactive experiences.'
                ],
                'default': [
                    'Yes, our XR solutions are very helpful! They enhance learning, collaboration, and visualization across various industries.',
                    'Absolutely! Our technology helps create engaging and effective solutions for different needs.',
                    'Our solutions are extremely helpful for creating immersive and interactive experiences.',
                    'Definitely! We provide valuable tools that enhance productivity and engagement.'
                ]
            }
        };
        this.lastTopic = null;
        this.conversationContext = [];
        this.jumpInterval = null;
        this.isJumping = false;
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
            
            // Start jumping animation
            this.startJumpingAnimation(button);
            
            const window = document.createElement('div');
            window.className = 'chatbot-window';
            console.log('Created window element');
            
            const header = document.createElement('div');
            header.className = 'chatbot-header';
            header.innerHTML = `
                <h3>Altie Bot</h3>
                <div class="chatbot-controls">
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

    startJumpingAnimation(button) {
        // Jump every 3 seconds
        this.jumpInterval = setInterval(() => {
            if (!this.isJumping) {
                this.isJumping = true;
                button.classList.add('jumping');
                
                // Remove the jumping class after animation completes
                setTimeout(() => {
                    button.classList.remove('jumping');
                    this.isJumping = false;
                }, 500);
            }
        }, 3000);
    }

    stopJumpingAnimation() {
        if (this.jumpInterval) {
            clearInterval(this.jumpInterval);
            this.jumpInterval = null;
        }
    }

    toggleChat() {
        const window = document.querySelector('.chatbot-window');
        const button = document.querySelector('.chatbot-button');
        
        if (window.style.display === 'none' || window.style.display === '') {
            window.style.display = 'flex';
            // Stop jumping when chat is open
            this.stopJumpingAnimation();
            button.style.display = 'none';
        } else {
            window.style.display = 'none';
            // Resume jumping when chat is closed
            button.style.display = 'flex';
            this.startJumpingAnimation(button);
        }
    }

    closeChat() {
        const window = document.querySelector('.chatbot-window');
        const button = document.querySelector('.chatbot-button');
        window.style.display = 'none';
        // Resume jumping when chat is closed
        button.style.display = 'flex';
        this.startJumpingAnimation(button);
    }

    getRandomResponse(topic, subtopic = null) {
        if (topic === 'helpful' && subtopic) {
            const responses = this.knowledgeBase.helpful[subtopic] || this.knowledgeBase.helpful.default;
            return responses[Math.floor(Math.random() * responses.length)];
        }
        const responses = this.knowledgeBase[topic] || this.knowledgeBase['default'];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        let topic = null;

        // Check for helpful-related questions
        if (lowerMessage.match(/helpful|useful|beneficial|worth it|good|effective/i)) {
            // Use the last topic if available, otherwise default
            topic = this.lastTopic ? 'helpful' : 'default';
            return { topic: topic, subtopic: this.lastTopic || 'default' };
        }

        // Check for simple responses
        if (lowerMessage.match(/^(yes|yeah|yep|sure|ok|okay|fine|alright)$/i)) {
            topic = 'affirmative';
        }
        else if (lowerMessage.match(/^(no|nope|nah|not really|not sure)$/i)) {
            topic = 'negative';
        }
        // Check for greetings
        else if (lowerMessage.match(/^(hi|hello|hey|greetings|good (morning|afternoon|evening))/i)) {
            topic = 'greeting';
        }
        // Check for VR-related terms
        else if (lowerMessage.match(/vr|virtual reality|virtual world|immersive environment/i)) {
            topic = 'vr';
        }
        // Check for AR-related terms
        else if (lowerMessage.match(/ar|augmented reality|overlay|digital overlay/i)) {
            topic = 'ar';
        }
        // Check for MR-related terms
        else if (lowerMessage.match(/mr|mixed reality|hybrid reality/i)) {
            topic = 'mr';
        }
        // Check for XR-related terms
        else if (lowerMessage.match(/xr|extended reality|immersive tech/i)) {
            topic = 'xr';
        }
        // Check for features
        else if (lowerMessage.match(/features|capabilities|what can|what does|offerings/i)) {
            topic = 'features';
        }
        // Check for services
        else if (lowerMessage.match(/services|solutions|products|offerings/i)) {
            topic = 'services';
        }
        // Check for ReLiConnect
        else if (lowerMessage.match(/reliconnect|virtual meeting|collaboration/i)) {
            topic = 'reliconnect';
        }
        // Check for LearnXR
        else if (lowerMessage.match(/learnxr|education|learning|teaching/i)) {
            topic = 'learnxr';
        }
        // Check for MetaMatch
        else if (lowerMessage.match(/metamatch|matching|networking|events/i)) {
            topic = 'metamatch';
        }
        // Check for industries
        else if (lowerMessage.match(/industries|sectors|markets|clients/i)) {
            topic = 'industries';
        }
        // Check for technology
        else if (lowerMessage.match(/technology|tech|platform|software|hardware/i)) {
            topic = 'technology';
        }
        // Check for support
        else if (lowerMessage.match(/support|help|assistance|contact/i)) {
            topic = 'support';
        }
        // Check for pricing
        else if (lowerMessage.match(/pricing|cost|price|subscription|plan/i)) {
            topic = 'pricing';
        }
        // Check for contact information
        else if (lowerMessage.match(/contact|email|phone|address|location/i)) {
            topic = 'contact';
        }

        // Store conversation context
        this.conversationContext.push({
            message: message,
            topic: topic || 'default',
            timestamp: new Date()
        });

        // Keep only last 5 messages in context
        if (this.conversationContext.length > 5) {
            this.conversationContext.shift();
        }

        // Update last topic if a new topic was found
        if (topic) {
            this.lastTopic = topic;
        }

        return { topic: topic || 'default', subtopic: null };
    }

    sendMessage() {
        const input = document.querySelector('.chatbot-input input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage('user', message);
            input.value = '';
            
            // Process the message and get appropriate topic
            const { topic, subtopic } = this.processUserMessage(message);
            
            // Add a small delay to simulate thinking
            setTimeout(() => {
                const response = this.getRandomResponse(topic, subtopic);
                this.addMessage('bot', response);
                
                // If it's a greeting, add a follow-up question
                if (topic === 'greeting') {
                    setTimeout(() => {
                        this.addMessage('bot', 'What would you like to know about our XR solutions?');
                    }, 1000);
                }
                // If it's an affirmative response, add a follow-up question
                else if (topic === 'affirmative') {
                    setTimeout(() => {
                        this.addMessage('bot', 'Would you like to know about our specific products like ReLiConnect or LearnXR?');
                    }, 1000);
                }
                // If it's a negative response, add a follow-up question
                else if (topic === 'negative') {
                    setTimeout(() => {
                        this.addMessage('bot', 'Is there something specific about XR that you\'d like to learn about?');
                    }, 1000);
                }
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
}

// Initialize the chatbot
console.log('Creating AltieBot instance');
new AltieBot(); 