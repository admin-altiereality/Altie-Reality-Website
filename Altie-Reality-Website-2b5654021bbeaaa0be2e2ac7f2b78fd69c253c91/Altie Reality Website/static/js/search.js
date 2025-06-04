class SearchButton {
    constructor() {
        this.initializeSearch();
        this.searchableContent = {
            'LearnXR': {
                url: 'https://learnxr.altiereality.com',
                description: 'XR + AI based solution for Education. Interactive 3D Learning Models, Virtual Science Labs, AR Learning Cards, and more.'
            },
            'ReliconnectVR': {
                url: 'https://play.google.com/store/apps/details?id=com.altiereality.reliconnect',
                description: 'VR Pilgrimage app for religious experiences. Available on Google Play Store.'
            },
            'MetaMatch': {
                url: 'https://metamatch.altiereality.com',
                description: 'Social platform for connecting in the metaverse.'
            },
            'XRtouch': {
                url: 'https://www.altiereality.com/XRtouch',
                description: 'Interactive XR touch solutions for various industries.'
            },
            'Medical': {
                url: 'https://www.altiereality.com/medical',
                description: 'XR solutions for medical training and healthcare.'
            },
            'Real Estate': {
                url: 'https://www.altiereality.com/architecture',
                description: 'Virtual tours and 3D visualization for real estate.'
            },
            'Defence': {
                url: 'https://www.altiereality.com/defence',
                description: 'XR solutions for defense training and simulation.'
            },
            'Gaming': {
                url: 'https://www.altiereality.com/gaming',
                description: 'Altie Studios - Gaming solutions and experiences.'
            },
            'Careers': {
                url: 'https://www.altiereality.com/career',
                description: 'Career opportunities at Altie Reality.'
            }
        };
    }

    // Levenshtein distance function for fuzzy matching
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // Check if text matches query with fuzzy matching
    fuzzyMatch(text, query) {
        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // Direct match
        if (textLower.includes(queryLower)) return true;
        
        // Split into words for better matching
        const textWords = textLower.split(/\s+/);
        const queryWords = queryLower.split(/\s+/);
        
        // Check each query word against text words
        return queryWords.every(queryWord => {
            // Try exact match first
            if (textWords.some(textWord => textWord.includes(queryWord))) return true;
            
            // Try fuzzy match if exact match fails
            return textWords.some(textWord => {
                const distance = this.levenshteinDistance(textWord, queryWord);
                // Allow for 1 character difference for short words (<=4 chars)
                // or 2 characters for longer words
                const maxDistance = textWord.length <= 4 ? 1 : 2;
                return distance <= maxDistance;
            });
        });
    }

    initializeSearch() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        
        const searchWindow = document.createElement('div');
        searchWindow.className = 'search-window';
        searchWindow.innerHTML = `
            <div class="search-header">
                <h3>Search</h3>
                <button class="close-search-btn">×</button>
            </div>
            <div class="search-input-container">
                <input type="text" placeholder="Search...">
                <button class="search-submit-btn">Search</button>
            </div>
            <div class="search-results"></div>
        `;
        
        searchContainer.appendChild(searchButton);
        searchContainer.appendChild(searchWindow);
        document.body.appendChild(searchContainer);
        
        // Add event listeners
        searchButton.addEventListener('click', () => {
            searchWindow.style.display = 'flex';
            searchButton.style.display = 'none';
            searchWindow.querySelector('input').focus();
        });
        
        const closeSearchBtn = searchWindow.querySelector('.close-search-btn');
        closeSearchBtn.addEventListener('click', () => {
            searchWindow.style.display = 'none';
            searchButton.style.display = 'flex';
        });
        
        const searchInput = searchWindow.querySelector('input');
        const searchSubmitBtn = searchWindow.querySelector('.search-submit-btn');
        
        // Add input event listener for real-time suggestions
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) { // Start showing suggestions after 2 characters
                this.performSearch(query);
            } else {
                document.querySelector('.search-results').innerHTML = '';
            }
        });
        
        searchSubmitBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                this.performSearch(query);
            }
        });
        
        // Allow Enter key to trigger search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchSubmitBtn.click();
            }
        });

        // Close search window when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchWindow.contains(e.target) && !searchButton.contains(e.target)) {
                searchWindow.style.display = 'none';
                searchButton.style.display = 'flex';
            }
        });

        // Adjust search button position to avoid overlapping with Altie bot
        const adjustPosition = () => {
            const altieBot = document.querySelector('.chat-widget');
            if (altieBot) {
                const altieBotRect = altieBot.getBoundingClientRect();
                const searchButtonRect = searchButton.getBoundingClientRect();
                
                // If search button overlaps with Altie bot, move it up
                if (searchButtonRect.bottom > altieBotRect.top) {
                    searchButton.style.bottom = (window.innerHeight - altieBotRect.top + 20) + 'px';
                } else {
                    searchButton.style.bottom = '90px'; // Default position
                }
            }
        };

        // Adjust position on load and resize
        window.addEventListener('load', adjustPosition);
        window.addEventListener('resize', adjustPosition);
        adjustPosition(); // Initial adjustment
    }

    performSearch(query) {
        const searchResults = document.querySelector('.search-results');
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';

        const results = [];

        // Search through main content sections
        const sections = document.querySelectorAll('section, .cta-section, .book-demo-section');
        sections.forEach(section => {
            const sectionId = section.id;
            const sectionTitle = section.querySelector('h2, h3, .section-title')?.textContent || '';
            const sectionContent = section.textContent;

            if (this.fuzzyMatch(sectionContent, query)) {
                const paragraphs = section.querySelectorAll('p, h3, h4, .cta-text, .demo-text');
                const matches = [];

                paragraphs.forEach(p => {
                    const text = p.textContent;
                    if (this.fuzzyMatch(text, query)) {
                        matches.push({
                            text: p.textContent,
                            element: p.tagName.toLowerCase()
                        });
                    }
                });

                // Add button text to matches
                const buttons = section.querySelectorAll('button, .cta-button, .demo-button');
                buttons.forEach(button => {
                    const text = button.textContent;
                    if (this.fuzzyMatch(text, query)) {
                        matches.push({
                            text: button.textContent,
                            element: 'button'
                        });
                    }
                });

                if (matches.length > 0) {
                    results.push({
                        type: 'section',
                        sectionId,
                        sectionTitle,
                        matches
                    });
                }
            }
        });

        // Search through linked content
        Object.entries(this.searchableContent).forEach(([key, content]) => {
            if (this.fuzzyMatch(key, query) || this.fuzzyMatch(content.description, query)) {
                results.push({
                    type: 'link',
                    title: key,
                    url: content.url,
                    description: content.description
                });
            }
        });

        // Display results
        if (results.length > 0) {
            let html = '<div class="search-results-list">';
            
            // Group results by type
            const sectionResults = results.filter(r => r.type === 'section');
            const linkResults = results.filter(r => r.type === 'link');

            // Display section results
            if (sectionResults.length > 0) {
                html += '<div class="search-section-results">';
                sectionResults.forEach(result => {
                    html += `
                        <div class="search-result-item">
                            <h4><a href="#${result.sectionId}">${result.sectionTitle}</a></h4>
                            <div class="search-matches">
                                ${result.matches.map(match => `
                                    <div class="search-match">
                                        <${match.element}>${this.highlightText(match.text, query)}</${match.element}>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            // Display link results
            if (linkResults.length > 0) {
                html += '<div class="search-link-results">';
                linkResults.forEach(result => {
                    html += `
                        <div class="search-result-item">
                            <h4><a href="${result.url}" target="_blank">${result.title}</a></h4>
                            <div class="search-match">
                                <p>${this.highlightText(result.description, query)}</p>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            html += '</div>';
            searchResults.innerHTML = html;

            // Add click handlers for smooth scrolling
            searchResults.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        document.querySelector('.search-window').style.display = 'none';
                        document.querySelector('.search-button').style.display = 'flex';
                    }
                });
            });
        } else {
            searchResults.innerHTML = '<div class="no-results">No results found for "' + query + '"</div>';
        }
    }

    highlightText(text, query) {
        // Split query into words for highlighting
        const queryWords = query.toLowerCase().split(/\s+/);
        let highlightedText = text;
        
        queryWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
}

// Initialize the search button when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchButton();
}); 