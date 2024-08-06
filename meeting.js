document.addEventListener('DOMContentLoaded', function() {
    initializeMeetingPage();
});

let countdown;
let timerInterval;

function initializeMeetingPage() {
    // Any initialization specific to the meeting module can go here
}

function handleAddMeetingTask(event) {
    if (event.key === 'Enter') {
        const inputId = event.target.id;
        const taskText = document.getElementById(inputId).value;
        if (taskText.trim() !== '') {
            if (inputId === 'new-meeting-topic-input') {
                addMeetingTask(taskText, 'meeting-topic-list');
            }
            document.getElementById(inputId).value = '';
            hideAddMeetingTaskModal();
        }
    }
}

function addMeetingTask(taskText, listId) {
    const taskList = document.getElementById(listId);
    const taskItem = document.createElement('li');
    taskItem.className = 'meeting-task-item';
    taskItem.draggable = true;
    taskItem.id = `meeting-task-${new Date().getTime()}`; // unique id
    taskItem.ondragstart = dragMeeting;
    taskItem.innerHTML = `
        <span>${taskText}</span>
        <div class="meeting-task-actions">
            <select class="discussion-type" onchange="updateTaskBackground(this)">
                <option value="inform">Inform</option>
                <option value="discuss">Discuss</option>
                <option value="solve">Solve</option>
            </select>
            <button class="meeting-start-btn" onclick="startDiscussion(this)"><i class="fas fa-play"></i></button>
            <button class="meeting-done-btn" onclick="markAsMeetingCompleted(this)"><i class="fas fa-check"></i></button>
            <button class="meeting-delete-task-btn" onclick="deleteMeetingTask(this)"><i class="fas fa-times"></i></button>
        </div>
    `;
    taskList.appendChild(taskItem);
}

function deleteMeetingTask(button) {
    const taskItem = button.parentElement.parentElement;
    taskItem.remove();
}

function startDiscussion(button) {
    const taskItem = button.parentElement.parentElement;
    const taskTitle = taskItem.querySelector('span').textContent;
    taskItem.classList.add('discussion-started');

    document.getElementById('discussion-title').innerHTML = `<strong>Discussing:</strong> <span class="light-font">${taskTitle}</span>`;
    document.getElementById('countdown-timer').textContent = "10:00";
    document.getElementById('discussion-modal').style.display = 'flex';
    document.querySelector('.content-wrapper').classList.add('blur-background');

    countdown = 600; // 10 minutes in seconds
    startTimer();
}


function markAsMeetingCompleted(button) {
    const taskItem = button.parentElement.parentElement;
    taskItem.classList.add('meeting-completed');
    const completedList = document.getElementById('completed-topics-list');
    completedList.appendChild(taskItem);
    launchMeetingConfetti();
}

function launchMeetingConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function allowDropMeeting(event) {
    event.preventDefault();
}

function dragMeeting(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function dropMeeting(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const taskItem = document.getElementById(data);
    if (event.target.tagName === 'UL') {
        event.target.appendChild(taskItem);
    } else if (event.target.closest('.meeting-task-bucket')) {
        event.target.closest('.meeting-task-bucket').querySelector('.meeting-task-list').appendChild(taskItem);
    }
}

function showAddMeetingTaskModal() {
    document.getElementById('add-meeting-task-modal').style.display = 'flex';
    document.body.classList.add('modal-open');
    document.querySelector('.content-wrapper').classList.add('blur-background');
}

function hideAddMeetingTaskModal() {
    document.getElementById('add-meeting-task-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
    document.querySelector('.content-wrapper').classList.remove('blur-background');
}

function startTimer() {
    timerInterval = setInterval(() => {
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;

        document.getElementById('countdown-timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (countdown === 0) {
            clearInterval(timerInterval);
        } else {
            countdown--;
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    document.getElementById('pause-timer-btn').style.display = 'none';
    document.getElementById('resume-timer-btn').style.display = 'inline-block';
}

function resumeTimer() {
    startTimer();
    document.getElementById('resume-timer-btn').style.display = 'none';
    document.getElementById('pause-timer-btn').style.display = 'inline-block';
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('discussion-modal').style.display = 'none';
    document.querySelector('.content-wrapper').classList.remove('blur-background');
}

function completeDiscussion() {
    stopTimer();
    const taskItem = document.querySelector('.discussion-started');
    if (taskItem) {
        taskItem.classList.remove('discussion-started');
        markAsMeetingCompleted(taskItem.querySelector('.meeting-done-btn'));
    }
}

function addFiveMinutes() {
    countdown += 300; // Add 5 minutes in seconds
}

function updateTaskBackground(selectElement) {
    const taskItem = selectElement.parentElement.parentElement;
    switch (selectElement.value) {
        case 'inform':
            taskItem.style.backgroundColor = '#e7f3ff'; // Light blue
            break;
        case 'discuss':
            taskItem.style.backgroundColor = '#fff4e7'; // Light orange
            break;
        case 'solve':
            taskItem.style.backgroundColor = '#e7ffe7'; // Light green
            break;
    }
}
