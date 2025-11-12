// Made by Gemini
// --- JavaScript Logic ---

const START_DATETIME_KEY = 'trackerStartDateTime';
const DAILY_SAVING_KEY = 'trackerDailySaving';
const TRACKER_LABEL_KEY = 'trackerLabel';
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
 * Loads and displays the stored tracking settings, and sets defaults if empty.
 */
function loadSettings() {
    const startDateTime = localStorage.getItem(START_DATETIME_KEY);
    const dailySaving = localStorage.getItem(DAILY_SAVING_KEY);
    const trackerLabel = localStorage.getItem(TRACKER_LABEL_KEY); // Load the label

    // Get elements
    const inputGroup = document.querySelector('.input-group');
    const trackerDisplay = document.getElementById('trackerDisplay');
    const displayDateTime = document.getElementById('displayDateTime');
    const displayLabel = document.getElementById('displayLabel');
    const startDateInput = document.getElementById('startDate');
    const startTimeInput = document.getElementById('startTime');
    const trackerLabelInput = document.getElementById('trackerLabel');

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
    const trackerLabelInput = document.getElementById('trackerLabel').value.trim(); // Get label
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

    // Reload state to switch to display mode
    loadSettings();
}

/**
 * Calculates and updates the time elapsed and money saved.
 */
function updateTracker() {
    const startDateTimeStr = localStorage.getItem(START_DATETIME_KEY);
    const dailySaving = parseFloat(localStorage.getItem(DAILY_SAVING_KEY));

    if (!startDateTimeStr || isNaN(dailySaving)) return;

    // Use the stored string directly to create the Date object
    const startDate = new Date(startDateTimeStr);
    const now = new Date();
    const timeElapsedMs = now - startDate;

    const timeDisplay = document.getElementById('timeDisplay');
    const moneySavedDisplay = document.getElementById('moneySavedDisplay');

    // --- Time Calculation ---
    if (timeElapsedMs < 0) {
        // Date is in the future
        timeDisplay.innerHTML = `
            <div style="color: #D32F2F; width: 100%; text-align: center;">
                Start time is in the future!
            </div>
        `;
        moneySavedDisplay.textContent = '$0.00';
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
    const totalMoneySaved = totalSeconds * savingPerSecond;

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
        localStorage.removeItem(TRACKER_LABEL_KEY); // Clear the label
        localStorage.removeItem(START_DATETIME_KEY);
        localStorage.removeItem(DAILY_SAVING_KEY);
        clearInterval(intervalId); // Stop the update loop

        // Clear input fields so loadSettings can set the new current defaults
        document.getElementById('trackerLabel').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('dailySaving').value = '';
        loadSettings(); // Reload to show the input form and set defaults
    }
}