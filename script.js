document.addEventListener("DOMContentLoaded", function () {
    updateSystemStatus();
    loadFeedingSchedule();
    loadFeedingHistory();
    loadActivityLog();
    displayManualFeedingHistory();  
    document.getElementById("monitor-button").addEventListener("click", monitorSystem);
    const feedButton = document.querySelector("#manual-feeding button");
    if (feedButton) {
        feedButton.addEventListener("click", manualFeeding);
    }
});
// Function to activate the servo motor
function activateServo() {
    fetch('http://<ARDUINO_IP>/activate')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

// Function to deactivate the servo motor
function deactivateServo() {
    fetch('http://<ARDUINO_IP>/deactivate')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

function updateSystemStatus() {
    document.getElementById("system-status").textContent = "Online";
    const lastFeedTime = localStorage.getItem("lastManualFeedTime");
    let lastFeedDisplay = "N/A";
    if (lastFeedTime) {
        const date = new Date(lastFeedTime);
        lastFeedDisplay = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        });
    }
    document.getElementById("last-feeding").textContent = lastFeedDisplay;
    const feedingTimes = JSON.parse(localStorage.getItem("feedingTimes")) || [];
    const nextFeeding = feedingTimes.length > 0 ? convertTo12Hour(feedingTimes[0]) : "Not scheduled";
    document.getElementById("next-feeding").textContent = nextFeeding;
}

function setScheduledFeeding() {
    let selectedTime = document.getElementById("scheduled-time").value;
    if (!selectedTime) return;
    

    let feedingTimes = [selectedTime];
    localStorage.setItem("feedingTimes", JSON.stringify(feedingTimes));
    
  
    const time12h = convertTo12Hour(selectedTime);
    addToActivityLog(`New feeding schedule set to ${time12h}`);
    
    
    updateSystemStatus();
    loadFeedingSchedule();
}

function manualFeeding() {
    const now = new Date();
    
   
    localStorage.setItem("lastManualFeedTime", now.toString());
    
    
    const formattedTime = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    });
    
    
    localStorage.setItem("lastFeeding", formattedTime);
    
    
    if (document.getElementById("last-feeding")) {
        document.getElementById("last-feeding").textContent = formattedTime;
    }
    
    displayManualFeedingHistory();
    
    
    addToActivityLog("Manual feeding dispensed");
    
   
    showConfirmationMessage();
}

function showConfirmationMessage() {
    const confirmationMessage = document.getElementById("confirmation-message");
    if (confirmationMessage) {
        confirmationMessage.textContent = "Food dispensed successfully!";
        setTimeout(() => {
            confirmationMessage.textContent = "";
        }, 3000);
    }
}

function displayManualFeedingHistory() {
    const historyList = document.getElementById("feeding-history");
    

    if (!historyList) return;

   
    historyList.innerHTML = "";

   
    const lastFeedTime = localStorage.getItem("lastManualFeedTime");
    if (lastFeedTime) {
        const date = new Date(lastFeedTime);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'numeric', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        });
        
        const listItem = document.createElement("li");
        listItem.textContent = `${formattedTime} on ${formattedDate}`;
        historyList.appendChild(listItem);
    } else {
        const listItem = document.createElement("li");
        listItem.textContent = "No feeding history available";
        listItem.style.fontStyle = "italic";
        listItem.style.color = "#666";
        historyList.appendChild(listItem);
    }
}

function monitorSystem() {
    console.log("Monitor button clicked!"); 
    let logEntry = `Pet detected at ${new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    })}`;
    addActivityLog(logEntry);
}

function powerOnSystem() {
    document.getElementById("power-status").textContent = "System is online.";
    document.getElementById("power-off-button").style.display = "inline-block";
    document.getElementById("power-on-button").style.display = "none";
    document.getElementById("system-status").textContent = "Online";
    document.getElementById("status-indicator").textContent = "🟢"; 
    document.getElementById("status-indicator").style.color = "green"; 
}

function powerOffSystem() {
    let confirmShutdown = confirm("Are you sure you want to power off the system?");
    if (confirmShutdown) {
        document.getElementById("power-status").textContent = "System is currently off.";
        document.getElementById("power-off-button").style.display = "none";
        document.getElementById("power-on-button").style.display = "inline-block";
        document.getElementById("system-status").textContent = "Offline";
        document.getElementById("status-indicator").textContent = "🔴"; 
        document.getElementById("status-indicator").style.color = "red"; 
    }
}


function saveSchedule(time) {
    localStorage.setItem("feedingSchedule", time);
    loadFeedingSchedule();
}

function saveFeedingHistory(entry) {
    localStorage.setItem("feedingHistory", entry);
}

function saveActivityLog(entry) {
    let logs = JSON.parse(localStorage.getItem("activityLog")) || [];
    logs.push(entry);
    
  
    if (logs.length > 5) logs.shift();
    
    localStorage.setItem("activityLog", JSON.stringify(logs));
}

function loadFeedingSchedule() {
    let feedingTimes = JSON.parse(localStorage.getItem("feedingTimes")) || [];
    let scheduleList = document.getElementById("current-schedule");
    
    if (!scheduleList) return; 
    
    scheduleList.innerHTML = "";
    
    if (feedingTimes.length === 0) {
        let listItem = document.createElement("li");
        listItem.textContent = "Not scheduled";
        scheduleList.appendChild(listItem);
    } else {
        feedingTimes.forEach(time => {
            let listItem = document.createElement("li");
            listItem.textContent = convertTo12Hour(time);
            scheduleList.appendChild(listItem);
        });
    }
}

function loadFeedingHistory() {
    let history = localStorage.getItem("feedingHistory") || "N/A";
    let historyList = document.getElementById("feeding-history");
    historyList.innerHTML = "";
    let listItem = document.createElement("li");
    listItem.textContent = history;
    historyList.appendChild(listItem);
}

function loadActivityLog() {
    let logs = JSON.parse(localStorage.getItem("activityLog")) || [];
    let logList = document.getElementById("activity-log");
    logList.innerHTML = "";
    logs.forEach(entry => {
        let listItem = document.createElement("li");
        listItem.textContent = entry;
        logList.appendChild(listItem);
    });
}

function convertTo12Hour(time24) {
    if (!time24) return "Not scheduled";
    
    const parts = time24.split(':');
    const hours = parts[0];
    const minutes = parts[1];
    
    let period = "AM";
    let hours12 = parseInt(hours);
    
    if (hours12 >= 12) {
        period = "PM";
        if (hours12 > 12) {
            hours12 -= 12;
        }
    }
    if (hours12 === 0) {
        hours12 = 12;
    }
    
    return `${hours12}:${minutes} ${period}`;
}

function addToActivityLog(activity) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    });
    const dateStr = now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
    });
    
    
    let logs = JSON.parse(localStorage.getItem("activityLog")) || [];
    
    
    if (logs.length >= 5) {
        logs.pop(); 
    }
    
    
    logs.unshift(`${timestamp} on ${dateStr}: ${activity}`);
    
   
    localStorage.setItem("activityLog", JSON.stringify(logs));
    
    
    displayActivityLog();
}

function displayActivityLog() {
    const logList = document.getElementById("activity-log");
    if (!logList) return;
    
    const logs = JSON.parse(localStorage.getItem("activityLog")) || [];
    logList.innerHTML = "";
    
    if (logs.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No activity recorded";
        li.style.fontStyle = "italic";
        li.style.color = "#666";
        logList.appendChild(li);
    } else {
        logs.forEach(log => {
            const li = document.createElement("li");
            li.textContent = log;
            logList.appendChild(li);
        });
    }
}

function setScheduledFeeding() {
    let selectedTime = document.getElementById("scheduled-time").value;
    if (!selectedTime) return;
    
   
    let feedingTimes = [selectedTime];
    localStorage.setItem("feedingTimes", JSON.stringify(feedingTimes));
    
    
    const time12h = convertTo12Hour(selectedTime);
    addToActivityLog(`Feeding schedule set to ${time12h}`);
    
    
    updateSystemStatus();
    loadFeedingSchedule();
}


document.addEventListener("DOMContentLoaded", function() {
    
    displayManualFeedingHistory();
    displayActivityLog();
    
   
    if (document.getElementById("system-status")) {
        updateSystemStatus();
    }
});
