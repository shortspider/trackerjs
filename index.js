// Made by Gemini
// --- JavaScript Logic ---

const START_DATETIME_KEY = 'trackerStartDateTime';
const DAILY_SAVING_KEY = 'trackerDailySaving';
const TRACKER_LABEL_KEY = 'trackerLabel';
const TREAT_LOG_KEY = 'trackerTreatLog'; // New key for the JSON array of treats
let intervalId;

// Load settings when the page is fully loaded
document.addEventListener('DOMContentLoaded', loadSettings);

/**
 * Helper function to format a Date object into 'YYYY-MM-DD' (date) and 'HH:MM' (time).
 */
function getFormattedDateTime(date) {
    // Get components using local time zone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return {
        date: `${year}-${month}-${day}`, // Format required by input type="date"
        time: `${hours}:${minutes}`      // Format required by input type="time"
    };
}

/**
 * Gets a currency formatter.
 */
function getCurrencyFormatter() {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Retrieves the current treats log array from Local Storage.
 * Returns an array, or an empty array if none exists.
 */
function getTreatsLog() {
    const logJson = localStorage.getItem(TREAT_LOG_KEY);
    try {
        return logJson ? JSON.parse(logJson) : [];
    } catch (e) {
        console.error("Error parsing treat log from localStorage:", e);
        return [];
    }
}

/**
 * Calculates the sum of all treat amounts in the log.
 * @param {Array} treatLog - The array of treat objects.
 * @returns {number} The total amount spent on treats.
 */
function calculateTotalTreatsSpent(treatLog) {
    return treatLog.reduce((sum, treat) => sum + treat.amount, 0);
}


/**
 * Loads and displays the stored tracking settings, and sets defaults if empty.
 */
function loadSettings() {
    const startDateTime = localStorage.getItem(START_DATETIME_KEY);
    const dailySaving = localStorage.getItem(DAILY_SAVING_KEY);
    const trackerLabel = localStorage.getItem(TRACKER_LABEL_KEY);

    // Get elements
    const inputGroup = document.querySelector('.input-group');
    const trackerDisplay = document.getElementById('trackerDisplay');
    const displayDateTime = document.getElementById('displayDateTime');
    const displayLabel = document.getElementById('displayLabel');
    const startDateInput = document.getElementById('startDate');
    const startTimeInput = document.getElementById('startTime');
    const trackerLabelInput = document.getElementById('trackerLabel');
    const treatInputGroup = document.getElementById('treatInputGroup');

    // Hide treat input on initial load
    if (treatInputGroup) {
        treatInputGroup.classList.add('hidden');
    }

    // Clear any existing interval before starting a new one
    if (intervalId) {
        clearInterval(intervalId);
    }

    if (startDateTime && dailySaving && trackerLabel) {
        // Tracker is running: Hide input, show display
        inputGroup.classList.add('hidden');
        trackerDisplay.classList.remove('hidden');

        const dateOptions = {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        };
        // Display the label and the combined date and time
        displayLabel.textContent = trackerLabel;
        displayDateTime.textContent = new Date(startDateTime).toLocaleDateString(undefined, dateOptions);

        // Start the live update
        updateTracker();
        intervalId = setInterval(updateTracker, 1000); // Update every second
    } else {
        // Tracker is NOT running: Show input, set defaults
        inputGroup.classList.remove('hidden');
        trackerDisplay.classList.add('hidden');

        // Set default label value from storage if available
        if (trackerLabel) {
            trackerLabelInput.value = trackerLabel;
        }

        // Set default date and time to current
        const now = new Date();
        const formatted = getFormattedDateTime(now);

        // Set the input fields to the current date and time
        startDateInput.value = formatted.date;
        startTimeInput.value = formatted.time;
    }
}

/**
 * Saves the user input to Local Storage and initializes the tracker.
 */
function saveSettings() {
    // Get values from input fields
    const trackerLabelInput = document.getElementById('trackerLabel').value.trim();
    const startDateInput = document.getElementById('startDate').value;
    const startTimeInput = document.getElementById('startTime').value;
    const dailySavingInput = parseFloat(document.getElementById('dailySaving').value);

    if (!trackerLabelInput) {
        alert('Please enter a label for what you are tracking.');
        return;
    }

    if (!startDateInput || !startTimeInput) {
        alert('Please select both a start date and a start time.');
        return;
    }

    if (isNaN(dailySavingInput) || dailySavingInput < 0) {
        alert('Please enter a valid daily saving amount (0 or greater).');
        return;
    }

    // Combine date and time into a single ISO 8601 string: YYYY-MM-DDTHH:MM:00
    const startDateTime = `${startDateInput}T${startTimeInput}:00`;

    // Save all three values to Local Storage
    localStorage.setItem(TRACKER_LABEL_KEY, trackerLabelInput);
    localStorage.setItem(START_DATETIME_KEY, startDateTime);
    localStorage.setItem(DAILY_SAVING_KEY, dailySavingInput.toString());

    // Initialize treat log to an empty array only if it doesn't exist yet
    if (localStorage.getItem(TREAT_LOG_KEY) === null) {
        localStorage.setItem(TREAT_LOG_KEY, JSON.stringify([]));
    }

    // Reload state to switch to display mode
    loadSettings();
}

/**
 * Toggles the visibility of the treat input form.
 */
function toggleTreatInput() {
    const treatInputGroup = document.getElementById('treatInputGroup');
    treatInputGroup.classList.toggle('hidden');
    // Clear the input fields when showing it
    document.getElementById('treatAmount').value = '';
    document.getElementById('treatLabel').value = '';
}

/**
 * Logs the treat amount, updates total treats spent, and refreshes the tracker.
 */
function logTreat() {
    const treatAmountInput = document.getElementById('treatAmount').value;
    const treatAmount = parseFloat(treatAmountInput);
    const treatLabel = document.getElementById('treatLabel').value.trim();

    if (!treatLabel) {
        alert('Please enter a description for the treat.');
        return;
    }

    if (isNaN(treatAmount) || treatAmount <= 0) {
        alert('Please enter a valid amount greater than zero.');
        return;
    }

    // --- CHECK FOR SUFFICIENT SAVINGS ---
    const startDateTimeStr = localStorage.getItem(START_DATETIME_KEY);
    const dailySaving = parseFloat(localStorage.getItem(DAILY_SAVING_KEY));
    const treatLog = getTreatsLog();
    const currentTotalTreats = calculateTotalTreatsSpent(treatLog);

    const startDate = new Date(startDateTimeStr);
    const now = new Date();
    const timeElapsedMs = now - startDate;
    const totalSeconds = Math.floor(timeElapsedMs / 1000);

    const secondsInDay = 24 * 60 * 60;
    const savingPerSecond = dailySaving / secondsInDay;
    const grossMoneySaved = totalSeconds * savingPerSecond; // Total saved without subtracting treats

    // Check if the current treat, when added to existing treats, exceeds gross savings
    if (currentTotalTreats + treatAmount > grossMoneySaved) {
        const remainingSavings = grossMoneySaved - currentTotalTreats;
        const formatter = getCurrencyFormatter();
        alert(`Cannot log treat. Your available net savings are currently ${formatter.format(remainingSavings)}. Treat amount (${formatter.format(treatAmount)}) is too high.`);
        return; // Stop the function if there aren't enough savings
    }
    // --- END CHECK ---

    // Create a new treat object
    const newTreat = {
        label: treatLabel,
        amount: treatAmount,
        timestamp: new Date().toISOString()
    };

    // Add the new treat to the log
    treatLog.push(newTreat);

    // Save the updated log
    localStorage.setItem(TREAT_LOG_KEY, JSON.stringify(treatLog));

    // Hide the input group and clear the fields
    document.getElementById('treatInputGroup').classList.add('hidden');
    document.getElementById('treatAmount').value = '';
    document.getElementById('treatLabel').value = '';

    // Refresh the display to show the updated savings and list
    updateTracker();
}

/**
 * Renders the list of logged treats.
 * @param {Array} treatLog - The array of treat objects.
 * @param {Intl.NumberFormat} formatter - The currency formatter object.
 */
function renderTreatsList(treatLog, formatter) {
    const treatListElement = document.getElementById('treatList');
    const treatListContainer = document.getElementById('treatListContainer');

    if (treatLog.length === 0) {
        treatListContainer.classList.add('hidden');
        treatListElement.innerHTML = '';
        return;
    }

    treatListContainer.classList.remove('hidden');

    // Reverse the log to show the newest treats first
    const reversedLog = [...treatLog].reverse();

    treatListElement.innerHTML = reversedLog.map(treat => {
        // Format the date/time for display
        const date = new Date(treat.timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="treat-item">
                <span class="treat-item-label">${treat.label} (${date})</span>
                <span class="treat-item-amount">-${formatter.format(treat.amount)}</span>
            </div>
        `;
    }).join('');
}


/**
 * Calculates and updates the time elapsed and money saved (net).
 */
function updateTracker() {
    const startDateTimeStr = localStorage.getItem(START_DATETIME_KEY);
    const dailySaving = parseFloat(localStorage.getItem(DAILY_SAVING_KEY));

    // Treat logic
    const treatLog = getTreatsLog();
    const totalTreatsSpent = calculateTotalTreatsSpent(treatLog);

    if (!startDateTimeStr || isNaN(dailySaving)) return;

    // Use the stored string directly to create the Date object
    const startDate = new Date(startDateTimeStr);
    const now = new Date();
    const timeElapsedMs = now - startDate;

    const timeDisplay = document.getElementById('timeDisplay');
    const moneySavedDisplay = document.getElementById('moneySavedDisplay');
    const treatsSpentDisplay = document.getElementById('treatsSpentDisplay');
    const formatter = getCurrencyFormatter();

    // --- Time Calculation ---
    if (timeElapsedMs < 0) {
        // Date is in the future. Using CSS class for styling.
        timeDisplay.innerHTML = `<div class="date-message">Start time is in the future!</div>`;
        moneySavedDisplay.textContent = '$0.00';
        treatsSpentDisplay.textContent = formatter.format(totalTreatsSpent);
        clearInterval(intervalId);
        return;
    }

    // Convert milliseconds to time units
    let totalSeconds = Math.floor(timeElapsedMs / 1000);
    let seconds = totalSeconds;

    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    hours %= 24;
    minutes %= 60;
    seconds %= 60;

    const timeUnits = [
        { value: days, label: 'Days' },
        { value: hours, label: 'Hours' },
        { value: minutes, label: 'Minutes' },
        { value: seconds, label: 'Seconds' },
    ];

    const timeHtml = timeUnits.map(unit => `
        <div class="time-unit">
            <div>${unit.value.toString().padStart(2, '0')}</div>
            <span>${unit.label}</span>
        </div>
    `).join('');

    timeDisplay.innerHTML = timeHtml;

    // --- Money Calculation ---
    const secondsInDay = 24 * 60 * 60;
    const savingPerSecond = dailySaving / secondsInDay;
    const grossMoneySaved = totalSeconds * savingPerSecond; // Total saved without subtracting treats

    // Calculate NET savings
    let netMoneySaved = grossMoneySaved - totalTreatsSpent;

    // Ensure savings don't go below zero
    if (netMoneySaved < 0) {
        netMoneySaved = 0;
    }

    // Display the net money saved and the total treats spent
    moneySavedDisplay.textContent = formatter.format(netMoneySaved);
    treatsSpentDisplay.textContent = formatter.format(totalTreatsSpent);

    // Render the list of treats
    renderTreatsList(treatLog, formatter);
}

/**
 * Clears Local Storage and resets the tracker view.
 */
function resetTracker() {
    if (confirm('Are you sure you want to reset the tracker? All data will be lost.')) {
        localStorage.removeItem(TRACKER_LABEL_KEY);
        localStorage.removeItem(START_DATETIME_KEY);
        localStorage.removeItem(DAILY_SAVING_KEY);
        localStorage.removeItem(TREAT_LOG_KEY); // Clear the entire JSON treat log
        clearInterval(intervalId); // Stop the update loop

        // Clear input fields
        document.getElementById('trackerLabel').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('dailySaving').value = '';

        // Reset the treat input visibility and list
        document.getElementById('treatInputGroup').classList.add('hidden');
        document.getElementById('treatListContainer').classList.add('hidden');

        loadSettings(); // Reload to show the input form and set defaults
    }
}