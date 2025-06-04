console.log("AI Search JS loaded");
console.log("Container found:", document.querySelector('.ai-search-container'));
// AI Search functionality
class AISearch {
    constructor() {
        this.searchContainer = document.querySelector('.ai-search-container');
        console.log('Rendering search bar...');
        this.searchInput = null;
        this.suggestionsContainer = null;
        this.isExpanded = false;
        this.debounceTimer = null;
        this.init();
    }

    init() {
        // Only create the container if it doesn't exist (for backward compatibility)
        if (!this.searchContainer) {
            this.searchContainer = document.createElement('div');
            this.searchContainer.className = 'ai-search-container';
            document.body.appendChild(this.searchContainer);
        }
        // Remove any previous content (in case of re-initialization)
        this.searchContainer.innerHTML = '';
        
        // Create search button
        const searchButton = document.createElement('button');
        searchButton.className = 'ai-search-button';
        searchButton.innerHTML = '<i class="bi bi-search"></i>';
        searchButton.type = 'button';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'ai-search-close';
        closeButton.innerHTML = '<i class="bi bi-x"></i>';
        closeButton.style.display = 'none';
        closeButton.type = 'button';
        
        // Create search input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'ai-search-input-container';
        
        // Create search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search for XR solution';
        this.searchInput.className = 'ai-search-input';
        
        // Create suggestions container
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'ai-search-suggestions';
        
        // Assemble components
        inputContainer.appendChild(searchButton);
        inputContainer.appendChild(this.searchInput);
        inputContainer.appendChild(closeButton);
        inputContainer.appendChild(this.suggestionsContainer);
        this.searchContainer.appendChild(inputContainer);
        
        // Add event listeners
        this.addEventListeners(closeButton, searchButton);

        // After rendering, log the container's innerHTML
        setTimeout(() => {
            console.log('ai-search-container innerHTML after render:', this.searchContainer.innerHTML);
            if (!this.searchContainer.innerHTML.trim()) {
                console.error('ai-search-container is still empty after rendering!');
            }
        }, 1000);
    }

    addEventListeners(closeButton, searchButton) {
        searchButton.addEventListener('click', () => {
            this.toggleSearch();
        });
        closeButton.addEventListener('click', () => {
            this.toggleSearch();
        });
        // Handle input with debouncing
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 100); // Small delay for better performance
        });
        // Add Enter key handler
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.searchInput.value.trim();
                if (query) {
                    this.handleSearch(query, true);
                }
            }
        });
        // Add Esc key handler
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleSearch();
            }
        });
        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchContainer.contains(e.target) && this.isExpanded) {
                this.toggleSearch();
            }
        });
    }

    toggleSearch() {
        this.isExpanded = !this.isExpanded;
        this.searchContainer.classList.toggle('expanded');
        const closeButton = this.searchContainer.querySelector('.ai-search-close');
        if (this.isExpanded) {
            this.searchInput.focus();
            if (closeButton) closeButton.style.display = 'flex';
        } else {
            this.searchInput.value = '';
            this.suggestionsContainer.innerHTML = '';
            if (closeButton) closeButton.style.display = 'none';
        }
    }

    async handleSearch(query, isEnterPressed = false) {
        if (!query) {
            this.suggestionsContainer.innerHTML = '';
            return;
        }

        // Simulate AI-powered suggestions based on query
        const suggestions = this.generateSuggestions(query);
        
        if (isEnterPressed && suggestions.length > 0) {
            // If Enter was pressed and we have suggestions, navigate to the first suggestion
            this.handleSuggestionClick(suggestions[0]);
        } else {
            this.displaySuggestions(suggestions);
        }
    }

    generateSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        
        // Helper function to check if query matches any word in a string
        const matchesAnyWord = (text, query) => {
            const words = text.toLowerCase().split(/\s+/);
            return words.some(word => word.includes(query));
        };

        // Helper function to add suggestion if it matches
        const addIfMatches = (title, type, description, url) => {
            if (matchesAnyWord(title, lowerQuery) || matchesAnyWord(description, lowerQuery)) {
                suggestions.push({ title, type, description, url });
            }
        };

        // XR Products and Solutions
        addIfMatches(
            'XRtouch - VR/AR Controller',
            'product',
            'Hand-held accessory for enhanced VR/AR interaction with 6DoF tracking',
            '/xrtouch'
        );
        addIfMatches(
            'LearnXR™ Platform',
            'product',
            'Interactive XR learning platform for schools and education',
            'https://learnxr.altiereality.com'
        );
        addIfMatches(
            'ReliconnectVR™',
            'product',
            'Virtual pilgrimage and religious experience platform',
            'https://play.google.com/store/apps/details?id=com.altiereality.reliconnect'
        );

        // Education and Training
        addIfMatches(
            'LearnXR™ Labs for Schools',
            'service',
            'Complete XR lab setup for educational institutions',
            '/learnxr-labs'
        );
        addIfMatches(
            'Interactive 3D Learning Models',
            'feature',
            'Immersive educational content for better understanding',
            '/education'
        );
        addIfMatches(
            'Virtual Science Labs',
            'feature',
            'Safe and interactive virtual laboratory experiences',
            '/education'
        );

        // Industry Solutions
        addIfMatches(
            'Medical XR Solutions',
            'service',
            'XR applications for healthcare and medical training',
            '/medical'
        );
        addIfMatches(
            'EstateXR - Real Estate VR',
            'service',
            'Virtual property tours and visualization',
            '/architecture'
        );
        addIfMatches(
            'Defence XR Solutions',
            'service',
            'Training and simulation solutions for defence',
            '/defence'
        );
        addIfMatches(
            'Altie Studios - Gaming',
            'service',
            'Immersive gaming experiences and development',
            '/gaming'
        );

        // Demo and Contact
        addIfMatches(
            'Book a Demo',
            'action',
            'Schedule a personalized demo of our XR solutions',
            '#contact'
        );
        addIfMatches(
            'Contact Sales',
            'action',
            'Get in touch with our sales team',
            '#contact'
        );

        // Company Information
        addIfMatches(
            'About Altie Reality',
            'info',
            'Learn about our mission and vision',
            '/about'
        );
        addIfMatches(
            'Our Team',
            'info',
            'Meet the people behind Altie Reality',
            '/team'
        );

        // Career Opportunities
        addIfMatches(
            'Careers at Altie Reality',
            'career',
            'Join our team and shape the future of XR',
            '/career'
        );

        // Sort suggestions by relevance
        suggestions.sort((a, b) => {
            const aTitleMatch = a.title.toLowerCase().includes(lowerQuery);
            const bTitleMatch = b.title.toLowerCase().includes(lowerQuery);
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            return 0;
        });
        
        return suggestions;
    }

    displaySuggestions(suggestions) {
        this.suggestionsContainer.innerHTML = '';
        
        if (suggestions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'ai-search-suggestion';
            noResults.innerHTML = `
                <div class="suggestion-title">No results found</div>
                <div class="suggestion-description">Try different keywords or browse our services</div>
            `;
            this.suggestionsContainer.appendChild(noResults);
            return;
        }
        
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'ai-search-suggestion';
            
            const titleElement = document.createElement('div');
            titleElement.className = 'suggestion-title';
            titleElement.textContent = suggestion.title;
            
            const descriptionElement = document.createElement('div');
            descriptionElement.className = 'suggestion-description';
            descriptionElement.textContent = suggestion.description;
            
            const typeElement = document.createElement('div');
            typeElement.className = 'suggestion-type';
            typeElement.textContent = suggestion.type;
            
            suggestionElement.appendChild(titleElement);
            suggestionElement.appendChild(descriptionElement);
            suggestionElement.appendChild(typeElement);
            
            suggestionElement.addEventListener('click', () => {
                this.handleSuggestionClick(suggestion);
            });
            
            this.suggestionsContainer.appendChild(suggestionElement);
        });
    }

    handleSuggestionClick(suggestion) {
        // Handle suggestion click based on type and URL
        if (suggestion.url) {
            if (suggestion.url.startsWith('http')) {
                window.open(suggestion.url, '_blank');
            } else if (suggestion.url.startsWith('#')) {
                // Scroll to section if it's an anchor link
                const element = document.querySelector(suggestion.url);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                window.location.href = suggestion.url;
            }
        } else {
            // Fallback to type-based navigation
            switch (suggestion.type) {
                case 'service':
                    window.location.href = '/services';
                    break;
                case 'article':
                    window.location.href = '/blog';
                    break;
                case 'action':
                    window.location.href = '/contact';
                    break;
            }
        }
        
        // Close the search after navigation
        this.toggleSearch();
    }
}

// Initialize AI Search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AISearch();
}); 