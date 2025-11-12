// Made with Gemini

// --- JavaScript Logic ---

const START_DATE_KEY = 'trackerStartDate';
const DAILY_SAVING_KEY = 'trackerDailySaving';
let intervalId;

// Load settings when the page is fully loaded
document.addEventListener('DOMContentLoaded', loadSettings);

/**
 * Loads and displays the stored tracking settings.
 */
function loadSettings() {
    const startDate = localStorage.getItem(START_DATE_KEY);
    const dailySaving = localStorage.getItem(DAILY_SAVING_KEY);

    // Get elements
    const inputGroup = document.querySelector('.input-group');
    const trackerDisplay = document.getElementById('trackerDisplay');
    const displayDate = document.getElementById('displayDate');

    // Clear any existing interval before starting a new one
    if (intervalId) {
        clearInterval(intervalId);
    }

    if (startDate && dailySaving) {
        // Settings found: Hide input, show tracker
        inputGroup.classList.add('hidden');
        trackerDisplay.classList.remove('hidden');

        // Display the start date in a readable format
        displayDate.textContent = new Date(startDate).toLocaleDateString();

        // Start the live update
        updateTracker();
        intervalId = setInterval(updateTracker, 1000); // Update every second
    } else {
        // No settings: Show input, hide tracker
        inputGroup.classList.remove('hidden');
        trackerDisplay.classList.add('hidden');
    }
}

/**
 * Saves the user input to Local Storage and initializes the tracker.
 */
function saveSettings() {
    // Get values from input fields
    const startDateInput = document.getElementById('startDate').value;
    const dailySavingInput = parseFloat(document.getElementById('dailySaving').value);

    if (!startDateInput) {
        alert('Please select a start date.');
        return;
    }

    if (isNaN(dailySavingInput) || dailySavingInput < 0) {
        alert('Please enter a valid daily saving amount (0 or greater).');
        return;
    }

    // Save to Local Storage
    localStorage.setItem(START_DATE_KEY, startDateInput);
    localStorage.setItem(DAILY_SAVING_KEY, dailySavingInput.toString());

    // Reload state to switch to display mode
    loadSettings();
}

/**
 * Calculates and updates the time elapsed and money saved.
 */
function updateTracker() {
    const startDateStr = localStorage.getItem(START_DATE_KEY);
    const dailySaving = parseFloat(localStorage.getItem(DAILY_SAVING_KEY));

    if (!startDateStr || isNaN(dailySaving)) return;

    const startDate = new Date(startDateStr);
    const now = new Date();
    const timeElapsedMs = now - startDate;

    const timeDisplay = document.getElementById('timeDisplay');
    const moneySavedDisplay = document.getElementById('moneySavedDisplay');

    // --- Time Calculation ---
    if (timeElapsedMs < 0) {
        // Date is in the future
        timeDisplay.innerHTML = `
            <div style="color: #D32F2F; width: 100%; text-align: center;">
                Start date is in the future!
            </div>
        `;
        moneySavedDisplay.textContent = '$0.00';
        clearInterval(intervalId);
        return;
    }

    // Convert milliseconds to time units
    let seconds = Math.floor(timeElapsedMs / 1000);
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
    // Total seconds passed * (Daily Saving / Seconds in a Day)
    const secondsInDay = 24 * 60 * 60;
    const savingPerSecond = dailySaving / secondsInDay;
    const totalMoneySaved = (timeElapsedMs / 1000) * savingPerSecond;

    // Display the money saved, formatted as currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    moneySavedDisplay.textContent = formatter.format(totalMoneySaved);
}

/**
 * Clears Local Storage and resets the tracker view.
 */
function resetTracker() {
    if (confirm('Are you sure you want to reset the tracker? All data will be lost.')) {
        localStorage.removeItem(START_DATE_KEY);
        localStorage.removeItem(DAILY_SAVING_KEY);
        clearInterval(intervalId); // Stop the update loop
        // Clear input fields for a fresh start
        document.getElementById('startDate').value = '';
        document.getElementById('dailySaving').value = '';
        loadSettings(); // Reload to show the input form
    }
}