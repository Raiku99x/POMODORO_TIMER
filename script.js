// Timer State
let timeLeft = 25 * 60;
let isRunning = false;
let isWorkMode = true;
let timerInterval = null;
let WORK_TIME = 25 * 60;
let BREAK_TIME = 5 * 60;
let currentTask = null;

// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const workModeBtn = document.getElementById('workMode');
const breakModeBtn = document.getElementById('breakMode');
const todaySessionsEl = document.getElementById('todaySessions');
const totalTimeEl = document.getElementById('totalTime');
const weekViewBtn = document.getElementById('weekView');
const monthViewBtn = document.getElementById('monthView');
const statsCanvas = document.getElementById('statsChart');
const ctx = statsCanvas.getContext('2d');
const notificationSound = document.getElementById('notificationSound');
const darkModeToggle = document.getElementById('darkModeToggle');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const saveSettingsBtn = document.getElementById('saveSettings');
const cancelSettingsBtn = document.getElementById('cancelSettings');
const workDurationInput = document.getElementById('workDuration');
const breakDurationInput = document.getElementById('breakDuration');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const currentTaskDisplay = document.getElementById('currentTaskDisplay');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadDarkMode();
    loadTasks();
    loadStats();
    updateDisplay();
    updateTodayStats();
    drawChart('week');
    renderTasks();
});

// Dark Mode
function loadDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    drawChart(weekViewBtn.classList.contains('active') ? 'week' : 'month');
}

// Settings
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('timerSettings') || '{}');
    WORK_TIME = (settings.workTime || 25) * 60;
    BREAK_TIME = (settings.breakTime || 5) * 60;
    timeLeft = isWorkMode ? WORK_TIME : BREAK_TIME;
    workDurationInput.value = WORK_TIME / 60;
    breakDurationInput.value = BREAK_TIME / 60;
}

function saveSettings() {
    const workTime = parseInt(workDurationInput.value) || 25;
    const breakTime = parseInt(breakDurationInput.value) || 5;
    
    WORK_TIME = workTime * 60;
    BREAK_TIME = breakTime * 60;
    
    localStorage.setItem('timerSettings', JSON.stringify({
        workTime: workTime,
        breakTime: breakTime
    }));
    
    if (!isRunning) {
        timeLeft = isWorkMode ? WORK_TIME : BREAK_TIME;
        updateDisplay();
    }
    
    settingsPanel.classList.add('hidden');
}

function cancelSettings() {
    loadSettings();
    settingsPanel.classList.add('hidden');
}

function toggleSettings() {
    settingsPanel.classList.toggle('hidden');
}

// Task Management
function loadTasks() {
    return JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
}

function saveTasks(tasks) {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    const tasks = loadTasks();
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks(tasks);
    taskInput.value = '';
    renderTasks();
}

function deleteTask(id) {
    let tasks = loadTasks();
    tasks = tasks.filter(task => task.id !== id);
    
    if (currentTask && currentTask.id === id) {
        currentTask = null;
        currentTaskDisplay.textContent = 'No task selected';
    }
    
    saveTasks(tasks);
    renderTasks();
}

function selectTask(id) {
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        currentTask = task;
        currentTaskDisplay.textContent = `Working on: ${task.text}`;
        renderTasks();
    }
}

function renderTasks() {
    const tasks = loadTasks();
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (currentTask && currentTask.id === task.id) {
            taskItem.classList.add('active');
        }
        
        taskItem.innerHTML = `
            <span>${task.text}</span>
            <div class="task-actions">
                <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
            </div>
        `;
        
        taskItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('task-delete')) {
                selectTask(task.id);
            }
        });
        
        taskList.appendChild(taskItem);
    });
}

// Make deleteTask available globally
window.deleteTask = deleteTask;

// Timer Functions
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft <= 0) {
                completeSession();
            }
        }, 1000);
    }
}

function pauseTimer() {
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timeLeft = isWorkMode ? WORK_TIME : BREAK_TIME;
    updateDisplay();
}

function completeSession() {
    pauseTimer();
    playNotification();
    
    if (isWorkMode) {
        saveSession();
        updateTodayStats();
        drawChart(weekViewBtn.classList.contains('active') ? 'week' : 'month');
        
        if (currentTask) {
            alert(`Work session complete! Great work on: ${currentTask.text} 🎉`);
        } else {
            alert('Work session complete! Take a break! 🎉');
        }
    } else {
        alert('Break complete! Ready for another session? 💪');
    }
    
    // Auto switch mode
    isWorkMode = !isWorkMode;
    updateModeButtons();
    timeLeft = isWorkMode ? WORK_TIME : BREAK_TIME;
    updateDisplay();
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateModeButtons() {
    if (isWorkMode) {
        workModeBtn.classList.add('active');
        breakModeBtn.classList.remove('active');
    } else {
        workModeBtn.classList.remove('active');
        breakModeBtn.classList.add('active');
    }
}

function playNotification() {
    notificationSound.play().catch(err => console.log('Audio play failed:', err));
}

// Data Management
function saveSession() {
    const today = new Date().toISOString().split('T')[0];
    let sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '{}');
    
    if (!sessions[today]) {
        sessions[today] = { count: 0, minutes: 0 };
    }
    
    sessions[today].count++;
    sessions[today].minutes += WORK_TIME / 60;
    
    localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
}

function loadStats() {
    return JSON.parse(localStorage.getItem('pomodoroSessions') || '{}');
}

function updateTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const sessions = loadStats();
    const todayData = sessions[today] || { count: 0, minutes: 0 };
    
    todaySessionsEl.textContent = todayData.count;
    
    const hours = Math.floor(todayData.minutes / 60);
    const mins = todayData.minutes % 60;
    totalTimeEl.textContent = `${hours}h ${mins}m`;
}

// Chart Functions
function drawChart(view) {
    const sessions = loadStats();
    const dates = getDatesForView(view);
    const data = dates.map(date => {
        const sessionData = sessions[date] || { count: 0, minutes: 0 };
        return sessionData.count;
    });
    
    const labels = dates.map(date => formatDateLabel(date, view));
    
    // Clear canvas
    ctx.clearRect(0, 0, statsCanvas.width, statsCanvas.height);
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = statsCanvas.width - padding * 2;
    const chartHeight = statsCanvas.height - padding * 2;
    const maxValue = Math.max(...data, 1);
    const barWidth = chartWidth / data.length - 10;
    
    // Colors based on theme
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#eaeaea' : '#333';
    const barColor1 = isDark ? '#e94560' : '#667eea';
    const barColor2 = isDark ? '#d63651' : '#764ba2';
    
    // Draw bars
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * (chartWidth / data.length) + 5;
        const y = statsCanvas.height - padding - barHeight;
        
        // Bar gradient
        const gradient = ctx.createLinearGradient(0, y, 0, statsCanvas.height - padding);
        gradient.addColorStop(0, barColor1);
        gradient.addColorStop(1, barColor2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Value on top
        if (value > 0) {
            ctx.fillStyle = textColor;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 5);
        }
        
        // Label
        ctx.fillStyle = isDark ? '#b8b8b8' : '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, statsCanvas.height - padding + 20);
    });
    
    // Update summary stats
    updateSummaryStats(sessions, dates);
}

function getDatesForView(view) {
    const dates = [];
    const today = new Date();
    const days = view === 'week' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

function formatDateLabel(dateStr, view) {
    const date = new Date(dateStr);
    if (view === 'week') {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

function updateSummaryStats(sessions, dates) {
    let totalSessions = 0;
    let totalMinutes = 0;
    let bestDay = { date: '-', count: 0 };
    
    dates.forEach(date => {
        const data = sessions[date] || { count: 0, minutes: 0 };
        totalSessions += data.count;
        totalMinutes += data.minutes;
        
        if (data.count > bestDay.count) {
            bestDay = { date, count: data.count };
        }
    });
    
    document.getElementById('periodSessions').textContent = totalSessions;
    document.getElementById('periodTime').textContent = `${Math.floor(totalMinutes / 60)}h`;
    
    if (bestDay.count > 0) {
        const bestDate = new Date(bestDay.date);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][bestDate.getDay()];
        document.getElementById('bestDay').textContent = `${dayName} (${bestDay.count})`;
    } else {
        document.getElementById('bestDay').textContent = '-';
    }
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

workModeBtn.addEventListener('click', () => {
    if (!isRunning) {
        isWorkMode = true;
        updateModeButtons();
        timeLeft = WORK_TIME;
        updateDisplay();
    }
});

breakModeBtn.addEventListener('click', () => {
    if (!isRunning) {
        isWorkMode = false;
        updateModeButtons();
        timeLeft = BREAK_TIME;
        updateDisplay();
    }
});

weekViewBtn.addEventListener('click', () => {
    weekViewBtn.classList.add('active');
    monthViewBtn.classList.remove('active');
    drawChart('week');
});

monthViewBtn.addEventListener('click', () => {
    monthViewBtn.classList.add('active');
    weekViewBtn.classList.remove('active');
    drawChart('month');
});

darkModeToggle.addEventListener('click', toggleDarkMode);
settingsBtn.addEventListener('click', toggleSettings);
saveSettingsBtn.addEventListener('click', saveSettings);
cancelSettingsBtn.addEventListener('click', cancelSettings);
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});