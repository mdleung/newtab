// popup.js - Handles interactions in the popup menu

/**
 * @file Provides functionality for the popup menu of the Minimal Search Tab extension.
 * @author Matthew Leung
 * @version 1.0.0
 * @description This file includes event listeners for:
 * - Opening a new tab with the custom search interface.
 * - Navigating to the settings page.
 * - Displaying information about the extension.
 */

// --- EVENT LISTENERS ---

/**
 * Opens the new tab page with the custom search interface.
 */
document.getElementById("openNewTab").addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://newtab/" });
    window.close();
});

/**
 * Opens the settings page for the extension.
 */
document.getElementById("openSettings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
});

/**
 * Displays information about the extension in an alert dialog.
 */
document.getElementById("aboutBtn").addEventListener("click", () => {
    alert("Minimal Search Tab v1.0.0\n\nA privacy-focused search interface for your new tab page.\n\nNo data collection • Local storage only");
});

