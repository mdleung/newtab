// options.js - All functionality for the options page

/**
 * @file Manages the settings page for the Minimal Search Tab extension.
 * @author Matthew Leung
 * @version 1.0.0
 * @description This file includes functionality for:
 * - Loading and saving search engine preferences.
 * - Displaying available and selected search engines.
 * - Adding, removing, and reordering selected search engines via a drag-and-drop interface.
 * - Providing user feedback on settings changes.
 * - Resetting settings to default values.
 */

// --- CONSTANTS ---

/**
 * Predefined list of available search engines.
 * Each engine has a name, a search URL, and a domain.
 * @const {Object<string, {name: string, url: string, domain: string}>}
 */
const SEARCH_ENGINES = {
    'perplexity': {
        name: 'Perplexity',
        url: 'https://www.perplexity.ai/search?q=',
        domain: 'perplexity.ai'
    },
    'duckduckgo': {
        name: 'DuckDuckGo',
        url: 'https://duck.com/?q=',
        domain: 'duck.com'
    },
    'yandex': {
        name: 'Yandex',
        url: 'https://yandex.com/search/?text=',
        domain: 'yandex.com'
    },
    'brave': {
        name: 'Brave Search',
        url: 'https://search.brave.com/search?q=',
        domain: 'search.brave.com'
    },
    'youtube': {
        name: 'YouTube',
        url: 'https://www.youtube.com/results?search_query=',
        domain: 'youtube.com'
    },
    'bing': {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=',
        domain: 'bing.com'
    },
    'chatgpt': {
        name: 'ChatGPT',
        url: 'https://chatgpt.com/?q=',
        domain: 'chatgpt.com'
    },
    'google': {
        name: 'Google',
        url: 'https://www.google.com/search?q=',
        domain: 'google.com'
    }
};

/**
 * Default settings for the extension.
 * @const {Object}
 * @property {string[]} selectedEngines - Default list of selected search engine IDs.
 */
const DEFAULT_SETTINGS = {
    selectedEngines: ['duckduckgo', 'perplexity', 'bing', 'youtube', 'chatgpt', 'google']
};

// --- DOM ELEMENTS ---

let availableEnginesContainer;
let selectedEnginesContainer;
let emptyState;
let saveStatus;

// --- GLOBAL STATE ---

/**
 * Holds the current settings for the extension.
 * Initialized with default values and updated from storage.
 * @type {Object}
 */
let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Stores the element being dragged.
 * @type {HTMLElement|null}
 */
let draggedElement = null;

// --- INITIALIZATION ---

/**
 * Initializes the options page on DOM content load.
 */
document.addEventListener('DOMContentLoaded', async () => {
    initializeDOMElements();
    await loadSettings();
    setupEventListeners();
    updateEngineDisplay();
    showSaveStatus('Settings loaded');
});

/**
 * Caches references to key DOM elements.
 */
function initializeDOMElements() {
    availableEnginesContainer = document.getElementById('availableEngines');
    selectedEnginesContainer = document.getElementById('selectedEngines');
    emptyState = document.getElementById('emptyState');
    saveStatus = document.getElementById('saveStatus');
}

// --- SETTINGS MANAGEMENT ---

/**
 * Loads settings from chrome.storage.sync or falls back to localStorage.
 */
async function loadSettings() {
    try {
        // Check if chrome.storage is available
        if (typeof chrome === 'undefined' || !chrome.storage) {
            console.log('Chrome storage API not available, using localStorage fallback');
            // Use localStorage as fallback for testing
            const stored = localStorage.getItem('searchEngineSettings');
            if (stored) {
                currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } else {
                currentSettings = { ...DEFAULT_SETTINGS };
            }
        } else {
            const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
            currentSettings = { ...DEFAULT_SETTINGS, ...settings };
        }
        
        // Ensure selectedEngines is an array and remove 'andi' if present
        if (!Array.isArray(currentSettings.selectedEngines)) {
            currentSettings.selectedEngines = DEFAULT_SETTINGS.selectedEngines;
        }
        currentSettings.selectedEngines = currentSettings.selectedEngines.filter(engine => engine !== 'andi' && engine !== 'bagoodex' && engine !== 'deepseek');
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showSaveStatus('Error loading settings', 'error');
        currentSettings = { ...DEFAULT_SETTINGS };
    }
}

/**
 * Saves the current settings to chrome.storage.sync or localStorage.
 */
async function saveSettings() {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.sync.set(currentSettings);
        } else {
            // Fallback for non-extension environments
            localStorage.setItem('searchEngineSettings', JSON.stringify(currentSettings));
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showSaveStatus('Error saving settings', 'error');
    }
}

/**
 * Resets all settings to their default values.
 */
async function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.clear();
                await chrome.storage.sync.set(DEFAULT_SETTINGS);
            } else {
                localStorage.removeItem('searchEngineSettings');
            }
            await loadSettings();
            updateEngineDisplay();
            showSaveStatus('Settings reset to defaults');
        } catch (error) {
            console.error('Error resetting settings:', error);
            showSaveStatus('Error resetting settings', 'error');
        }
    }
}

// --- EVENT LISTENERS ---

/**
 * Sets up all event listeners for the page.
 */
function setupEventListeners() {
    // Listener for adding engines
    availableEnginesContainer.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-engine-btn');
        if (addBtn) {
            const engineItem = addBtn.closest('.engine-item');
            const engineId = engineItem.dataset.engine;
            addEngine(engineId);
        }
    });

    // Listener for removing engines
    selectedEnginesContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-engine-btn');
        if (removeBtn) {
            const engineItem = removeBtn.closest('.engine-item');
            const engineId = engineItem.dataset.engine;
            removeEngine(engineId);
        }
    });

    // Setup drag-and-drop functionality
    setupDragAndDrop();

    // Listen for storage changes to keep settings in sync
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                loadSettings().then(updateEngineDisplay);
            }
        });
    }

    // Keyboard shortcuts for power users
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handles keyboard shortcuts for adding/removing engines.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleKeyboardShortcuts(e) {
    // Use number keys 1-8 to quickly add/remove engines
    if (e.key >= '1' && e.key <= '8') {
        const engines = Object.keys(SEARCH_ENGINES);
        const engineIndex = parseInt(e.key) - 1;
        if (engines[engineIndex]) {
            const engineId = engines[engineIndex];
            if (currentSettings.selectedEngines.includes(engineId)) {
                removeEngine(engineId);
            } else {
                addEngine(engineId);
            }
        }
    }
}

// --- DRAG AND DROP ---

/**
 * Sets up drag-and-drop event listeners for reordering selected engines.
 */
function setupDragAndDrop() {
    selectedEnginesContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('engine-item')) {
            draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    selectedEnginesContainer.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('engine-item')) {
            e.target.classList.remove('dragging');
            draggedElement = null;
        }
    });

    selectedEnginesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = getDragAfterElement(selectedEnginesContainer, e.clientY);
        if (afterElement == null) {
            selectedEnginesContainer.appendChild(draggedElement);
        } else {
            selectedEnginesContainer.insertBefore(draggedElement, afterElement);
        }
    });

    selectedEnginesContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        updateEngineOrder();
    });
}

/**
 * Determines the position to insert a dragged element.
 * @param {HTMLElement} container - The container of draggable elements.
 * @param {number} y - The vertical coordinate of the drag event.
 * @returns {HTMLElement|null} The element to insert before, or null.
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.engine-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- ENGINE MANAGEMENT ---

/**
 * Adds a search engine to the selected list.
 * @param {string} engineId - The ID of the engine to add.
 */
async function addEngine(engineId) {
    if (!currentSettings.selectedEngines.includes(engineId)) {
        currentSettings.selectedEngines.push(engineId);
        await saveSettings();
        updateEngineDisplay();
        showSaveStatus(`${SEARCH_ENGINES[engineId].name} added`);
    }
}

/**
 * Removes a search engine from the selected list.
 * @param {string} engineId - The ID of the engine to remove.
 */
async function removeEngine(engineId) {
    const index = currentSettings.selectedEngines.indexOf(engineId);
    if (index > -1) {
        currentSettings.selectedEngines.splice(index, 1);
        await saveSettings();
        updateEngineDisplay();
        showSaveStatus(`${SEARCH_ENGINES[engineId].name} removed`);
    }
}

/**
 * Updates the engine order based on drag-and-drop actions.
 */
async function updateEngineOrder() {
    const engineItems = selectedEnginesContainer.querySelectorAll('.engine-item');
    const newOrder = Array.from(engineItems).map(item => item.dataset.engine);
    
    currentSettings.selectedEngines = newOrder;
    await saveSettings();
    showSaveStatus('Engine order updated');
}

// --- UI UPDATES ---

/**
 * Updates both the available and selected engine lists in the UI.
 */
function updateEngineDisplay() {
    updateAvailableEngines();
    updateSelectedEngines();
}

/**
 * Updates the display of available engines, disabling buttons for already selected ones.
 */
function updateAvailableEngines() {
    const engineItems = availableEnginesContainer.querySelectorAll('.engine-item');
    
    engineItems.forEach(item => {
        const engineId = item.dataset.engine;
        const addBtn = item.querySelector('.add-engine-btn');
        const isSelected = currentSettings.selectedEngines.includes(engineId);
        
        if (isSelected) {
            addBtn.disabled = true;
            addBtn.innerHTML = `\n                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n                    <path d="M9 12l2 2 4-4"></path>\n                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>\n                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>\n                </svg>\n            `;
            addBtn.title = 'Already added';
            item.classList.add('selected');
        } else {
            addBtn.disabled = false;
            addBtn.innerHTML = `\n                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n                    <line x1="12" y1="5" x2="12" y2="19"></line>\n                    <line x1="5" y1="12" x2="19" y2="12"></line>\n                </svg>\n            `;
            addBtn.title = 'Add to new tab';
            item.classList.remove('selected');
        }
    });
}

/**
 * Renders the list of selected search engines.
 */
function updateSelectedEngines() {
    selectedEnginesContainer.innerHTML = '';
    
    if (currentSettings.selectedEngines.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    currentSettings.selectedEngines.forEach(engineId => {
        const engine = SEARCH_ENGINES[engineId];
        if (!engine) return;
        
        const engineItem = document.createElement('div');
        engineItem.className = 'engine-item selected-engine';
        engineItem.dataset.engine = engineId;
        engineItem.draggable = true;
        
        engineItem.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </div>
            <div class="engine-info">
                <div class="engine-name">${engine.name}</div>
                <div class="engine-url">${engine.domain}</div>
            </div>
            <div class="engine-actions">
                <button class="remove-engine-btn" title="Remove from new tab">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        
        selectedEnginesContainer.appendChild(engineItem);
    });
}

/**
 * Displays a status message to the user (e.g., "Settings saved").
 * @param {string} message - The message to display.
 * @param {'success'|'error'} type - The type of message.
 */
function showSaveStatus(message, type = 'success') {
    const statusIcon = saveStatus.querySelector('.status-icon');
    const statusText = saveStatus.querySelector('.status-icon').nextSibling;
    
    // Update icon based on type
    if (type === 'error') {
        statusIcon.innerHTML = `\n            <circle cx="12" cy="12" r="10"></circle>\n            <line x1="15" y1="9" x2="9" y2="15"></line>\n            <line x1="9" y1="9" x2="15" y2="15"></line>\n        `;
        saveStatus.style.color = '#ef4444';
    } else {
        statusIcon.innerHTML = `\n            <path d="M9 12l2 2 4-4"></path>\n            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>\n            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>\n        `;
        saveStatus.style.color = '#22c55e';
    }
    
    // Update text
    if (statusText) {
        statusText.textContent = ` ${message}`;
    } else {
        // If there's no text node, create one
        const textNode = document.createTextNode(` ${message}`);
        saveStatus.appendChild(textNode);
    }
    
    // Add animation
    saveStatus.style.opacity = '0';
    saveStatus.style.transform = 'translateY(10px)';
    
    requestAnimationFrame(() => {
        saveStatus.style.transition = 'all 0.3s ease';
        saveStatus.style.opacity = '1';
        saveStatus.style.transform = 'translateY(0)';
    });
    
    // Reset to default after 3 seconds
    if (type !== 'success' || message !== 'Settings saved automatically') {
        setTimeout(() => {
            showSaveStatus('Settings saved automatically');
        }, 3000);
    }
}







