// newtab.js - Handles the functionality of the custom new tab page

/**
 * @file Provides functionality for the custom new tab page of the Minimal Search Tab extension.
 * @author Matthew Leung
 * @version 1.0.0
 * @description This file includes:
 * - Search engine configurations.
 * - Loading and saving settings.
 * - Rendering search engines.
 * - Drag-and-drop reordering.
 * - View mode toggling.
 */

// --- CONSTANTS ---

/**
 * Predefined list of available search engines.
 * Each engine has a name, a search URL, a color, an icon, and a homepage.
 * @const {Object<string, {name: string, url: string, color: string, icon: string, homepage: string}>}
 */
const SEARCH_ENGINES = {
    'duckduckgo': {
        name: "DuckDuckGo",
        url: "https://duckduckgo.com/?q=",
        color: "#de5833",
        icon: "duckduckgo.svg",
        homepage: "https://duck.com"
    },
    'perplexity': {
        name: "Perplexity",
        url: "https://www.perplexity.ai/search?q=",
        color: "#663399",
        icon: "perplexity.svg",
        homepage: "https://www.perplexity.ai"
    },
    'bing': {
        name: "Bing",
        url: "https://www.bing.com/search?q=",
        color: "#008080",
        icon: "bing.svg",
        homepage: "https://www.bing.com"
    },
    'youtube': {
        name: "YouTube",
        url: "https://www.youtube.com/results?search_query=",
        color: "#cc0000",
        icon: "youtube.svg",
        homepage: "https://www.youtube.com"
    },
    'chatgpt': {
        name: "ChatGPT",
        url: "https://chatgpt.com/?q=",
        color: "#74aa9c",
        icon: "chatgpt.svg",
        homepage: "https://chatgpt.com"
    },
    'google': {
        name: "Google",
        url: "https://www.google.com/search?q=",
        color: "#4285F4",
        icon: "google.svg",
        homepage: "https://www.google.com"
    },
    'yandex': {
        name: "Yandex",
        url: "https://yandex.com/search/?text=",
        color: "#ff0000",
        icon: "yandex.svg",
        homepage: "https://yandex.com"
    },
    'brave': {
        name: "Brave Search",
        url: "https://search.brave.com/search?q=",
        color: "#fb542b",
        icon: "brave.svg",
        homepage: "https://search.brave.com"
    }
};

/**
 * Default settings for the extension.
 * @const {Object}
 * @property {string[]} selectedEngines - Default list of selected search engine IDs.
 * @property {string} viewMode - Default view mode ("list" or "card").
 */
const DEFAULT_SETTINGS = {
    selectedEngines: ['duckduckgo', 'perplexity', 'bing', 'youtube'],
    viewMode: "list"
};

// --- SETTINGS MANAGEMENT ---

/**
 * Loads settings from chrome.storage.sync or falls back to localStorage.
 * @returns {Promise<Object>} The loaded settings.
 */
async function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
                resolve(items);
            });
        });
    } else {
        // Fallback for local testing without Chrome extension context
        const settings = JSON.parse(localStorage.getItem('searchEngineSettings')) || DEFAULT_SETTINGS;
        return Promise.resolve(settings);
    }
}

/**
 * Saves settings to chrome.storage.sync or localStorage.
 * @param {Object} settings - The settings to save.
 */
async function saveSettings(settings) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        return new Promise((resolve) => {
            chrome.storage.sync.set(settings, () => {
                resolve();
            });
        });
    } else {
        // Fallback for local testing without Chrome extension context
        localStorage.setItem('searchEngineSettings', JSON.stringify(settings));
        return Promise.resolve();
    }
}

/**
 * Updates the order of selected search engines.
 * @param {string[]} newOrder - The new order of engine IDs.
 */
async function updateEngineOrder(newOrder) {
    const settings = await loadSettings();
    settings.selectedEngines = newOrder;
    await saveSettings(settings);
    renderSearchEngines();
}

// --- UI MANAGEMENT ---

/**
 * Updates the view toggle button icon based on the current view mode.
 * @param {string} viewMode - The current view mode ("list" or "card").
 */
function updateViewToggleIcon(viewMode) {
    const cardIcon = document.getElementById("cardViewIcon");
    const listIcon = document.getElementById("listViewIcon");
    
    if (viewMode === "list") {
        // Show card icon when in list view (to switch to card view)
        cardIcon.style.display = "block";
        listIcon.style.display = "none";
    } else {
        // Show list icon when in card view (to switch to list view)
        cardIcon.style.display = "none";
        listIcon.style.display = "block";
    }
}

/**
 * Renders the list of selected search engines in the UI.
 */
async function renderSearchEngines() {
    const settings = await loadSettings();
    const selectedEngines = settings.selectedEngines || [];
    const viewMode = settings.viewMode || "list";

    const searchContainer = document.getElementById("searchEnginesContainer");
    const emptyState = document.getElementById("emptyState");
    
    if (!searchContainer) return;
    
    searchContainer.innerHTML = ""; // Clear existing engines
    searchContainer.className = `search-engines-container ${viewMode}-view`;

    // Update view toggle button icon
    updateViewToggleIcon(viewMode);

    if (selectedEngines.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    selectedEngines.forEach(engineId => {
        const engine = SEARCH_ENGINES[engineId];
        if (engine) {
            const engineCard = document.createElement("div");
            engineCard.className = "search-engine";
            engineCard.style.setProperty('--engine-color', engine.color);
            engineCard.setAttribute("data-engine-id", engineId);
            engineCard.draggable = true;

            engineCard.innerHTML = `
                <div class="engine-header">
                    <div class="engine-info">
                        <div class="engine-name">${engine.name}</div>
                        <div class="engine-domain">${engine.homepage.replace(/^https?:\/\//, "")}</div>
                    </div>
                    <div class="drag-handle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </div>
                </div>
                <div class="search-container">
                    <div class="search-input-wrapper">
                        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <textarea class="search-input" placeholder="Search ${engine.name}..." rows="1"></textarea>
                        <button class="search-btn" data-engine-url="${engine.url}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            searchContainer.appendChild(engineCard);
        }
    });

    addEventListeners();
    adjustTextareaHeights();
}

/**
 * Adds event listeners for user interactions.
 */
function addEventListeners() {
    // Search button clicks
    document.querySelectorAll(".search-btn").forEach(button => {
        button.onclick = (event) => {
            const input = event.target.closest(".search-input-wrapper").querySelector(".search-input");
            const query = input.value.trim();
            if (query) {
                const url = button.dataset.engineUrl + encodeURIComponent(query);
                window.open(url, "_blank");
            }
        };
    });

    // Search input key events
    document.querySelectorAll(".search-input").forEach(input => {
        input.onkeydown = (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault(); // Prevent new line
                const query = input.value.trim();
                if (query) {
                    const button = input.closest(".search-input-wrapper").querySelector(".search-btn");
                    const url = button.dataset.engineUrl + encodeURIComponent(query);
                    window.open(url, "_blank");
                }
            }
        };
        input.oninput = () => adjustTextareaHeight(input);
    });

    // Drag and drop for reordering
    document.querySelectorAll(".search-engine").forEach(engine => {
        engine.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", engine.dataset.engineId);
            engine.classList.add("dragging");
        };
        
        engine.ondragend = () => {
            engine.classList.remove("dragging");
        };
        
        engine.ondragover = (e) => {
            e.preventDefault();
        };
        
        engine.ondrop = async (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            const targetId = engine.dataset.engineId;
            
            if (draggedId !== targetId) {
                const settings = await loadSettings();
                const engines = settings.selectedEngines;
                const draggedIndex = engines.indexOf(draggedId);
                const targetIndex = engines.indexOf(targetId);
                
                engines.splice(draggedIndex, 1);
                engines.splice(targetIndex, 0, draggedId);
                
                settings.selectedEngines = engines;
                await saveSettings(settings);
                renderSearchEngines();
            }
        };
    });

    // Keyboard navigation
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "k") {
            event.preventDefault();
            const firstInput = document.querySelector(".search-input");
            if (firstInput) {
                firstInput.focus();
            }
        }

        // Ctrl/Cmd + 1-8 to jump to specific search engine
        if ((event.ctrlKey || event.metaKey) && event.key >= "1" && event.key <= "8") {
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            const inputs = document.querySelectorAll(".search-input");
            if (inputs[index]) {
                inputs[index].focus();
            }
        }
    });

    // View toggle button
    const viewToggleButton = document.getElementById("viewToggleBtn");
    if (viewToggleButton) {
        viewToggleButton.onclick = async () => {
            const settings = await loadSettings();
            settings.viewMode = settings.viewMode === "card" ? "list" : "card";
            await saveSettings(settings);
            renderSearchEngines();
        };
    }

    // Settings button
    const settingsButton = document.getElementById("settingsBtn");
    if (settingsButton) {
        settingsButton.onclick = () => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                // Fallback for local testing
                window.open('options.html', '_blank');
            }
        };
    }

    // Empty state settings button
    const emptySettingsButton = document.getElementById("emptySettingsBtn");
    if (emptySettingsButton) {
        emptySettingsButton.onclick = () => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                // Fallback for local testing
                window.open('options.html', '_blank');
            }
        };
    }
}

/**
 * Adjusts the height of a textarea based on its content.
 * @param {HTMLTextAreaElement} textarea - The textarea to adjust.
 */
function adjustTextareaHeight(textarea) {
    textarea.style.height = "auto"; // Reset height to recalculate
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"; // Max height 120px
}

/**
 * Adjusts the heights of all textareas in the UI.
 */
function adjustTextareaHeights() {
    document.querySelectorAll(".search-input").forEach(adjustTextareaHeight);
}

// --- INITIALIZATION ---

/**
 * Initializes the new tab page on DOM content load.
 */
document.addEventListener("DOMContentLoaded", renderSearchEngines);

