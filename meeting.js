import {deleteField,updateDoc,db,doc,collection,query,where,getDocs} from "./script.js";
import { globalSelectedValue as selectedId,initializePage } from "./script.js";
document.addEventListener('DOMContentLoaded', function() {
    initializeMeetingPage();
});

let countdown;
let timerInterval;

export async function initializeMeetingPage() {
    
    console.log(selectedId);
    try {
        const brandRef = doc(db, "brands", selectedId);
        console.log(brandRef);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            querySnapshot.forEach(docSnapshot => {
                const data = docSnapshot.data();
                console.log("Fetched Meeting data:", data);
                // Now we populate the HTML with the fetched data
                populateMeetingTasks(data);
            });
        } else {
            console.log("No meeting data found for the selected brand.");
        }
    } catch (error) {
        console.error("Error fetching quarterly goals data:", error);
    }
}
function populateMeetingTasks(data) {
    const meetingTopicList = document.getElementById('meeting-topic-list');
    const completedTopicsList = document.getElementById('completed-topics-list');
    
    // Clear existing tasks from the lists
    meetingTopicList.innerHTML = '';
    completedTopicsList.innerHTML = '';
    // Assuming `data` is an object with tasks
    for (const taskId in data) {
        if(taskId === 'brandId') continue;
        if (data.hasOwnProperty(taskId)) {
            const task = data[taskId];
            console.log(task);
            if (task.completed) {
                addTaskToList(task, completedTopicsList, true,taskId);
            } else {
                addTaskToList(task, meetingTopicList, false,taskId);
            }
        }
    }
}
function addTaskToList(task, listElement, isCompleted,key) {
    const taskItem = document.createElement('li');
    taskItem.className = 'meeting-task-item';
    taskItem.draggable = true;
    console.log(task);
    taskItem.id = `meeting-task-${key}`;
    taskItem.ondragstart = dragMeeting;

    taskItem.innerHTML = `
        <span>${task.name}</span>
        <div class="meeting-task-actions">
            <select class="discussion-type" onchange="updateTaskBackground(this,${key})">
                <option value="inform" ${task.status === 'inform' ? 'selected' : ''}>Inform</option>
                <option value="discuss" ${task.status === 'discuss' ? 'selected' : ''}>Discuss</option>
                <option value="solve" ${task.status === 'solve' ? 'selected' : ''}>Solve</option>
            </select>
            <button class="meeting-start-btn" onclick="startDiscussion(this)"><i class="fas fa-play"></i></button>
            <button class="meeting-done-btn" onclick="markAsMeetingCompleted(this)"><i class="fas fa-check"></i></button>
            <button class="meeting-delete-task-btn" onclick="deleteMeetingTask(this)"><i class="fas fa-times"></i></button>
        </div>
    `;

    if (isCompleted) {
        taskItem.classList.add('meeting-completed');
    }

    listElement.appendChild(taskItem);
}

async function handleAddMeetingTask(event) {
    if (event.key === 'Enter') {
        const inputId = event.target.id;
        const taskText = document.getElementById(inputId).value.trim();
        if (taskText !== '') {
            const brandRef = doc(db, "brands", selectedId);
            const quarterlyGoalsRef = collection(db, "meeting");
            const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const meetingDocRef = doc(db, "meeting", docSnapshot.id);
                    const newTaskId = `${new Date().getTime()}`; // unique ID for the new task
                    const newTask = {
                        name: taskText,
                        status: "inform", // Default status
                        completed: false
                    };

                    // Update the Firestore document with the new task
                    await updateDoc(meetingDocRef, {
                        [newTaskId]: newTask
                    });

                    // Add the task to the UI
                    addMeetingTaskToUI(newTask, 'meeting-topic-list', newTaskId);
                });
            } else {
                console.log("No meeting data found for the selected brand.");
            }

            document.getElementById(inputId).value = '';
            hideAddMeetingTaskModal();
        }
    }
}

function addMeetingTaskToUI(task, listId, taskId) {
    const taskList = document.getElementById(listId);
    const taskItem = document.createElement('li');
    taskItem.className = 'meeting-task-item';
    taskItem.draggable = true;
    taskItem.id = `meeting-task-${taskId}`; // use the generated task ID
    taskItem.ondragstart = dragMeeting;

    taskItem.innerHTML = `
        <span>${task.name}</span>
        <div class="meeting-task-actions">
            <select class="discussion-type" onchange="updateTaskBackground(this,${taskId})">
                <option value="inform" ${task.status === 'inform' ? 'selected' : ''}>Inform</option>
                <option value="discuss" ${task.status === 'discuss' ? 'selected' : ''}>Discuss</option>
                <option value="solve" ${task.status === 'solve' ? 'selected' : ''}>Solve</option>
            </select>
            <button class="meeting-start-btn" onclick="startDiscussion(this)"><i class="fas fa-play"></i></button>
            <button class="meeting-done-btn" onclick="markAsMeetingCompleted(this)"><i class="fas fa-check"></i></button>
            <button class="meeting-delete-task-btn" onclick="deleteMeetingTask(this)"><i class="fas fa-times"></i></button>
        </div>
    `;

    taskList.appendChild(taskItem);
}

async function deleteMeetingTask(button) {
    const taskItem = button.parentElement.parentElement;
    const taskId = taskItem.id.replace('meeting-task-', '');
console.log(taskId);
    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const meetingDocRef = querySnapshot.docs[0].ref;
            // Remove the task from the Firestore document
            await updateDoc(meetingDocRef, {
                [`${taskId}`]: deleteField(),
            });

            // Remove the task from the UI
            taskItem.remove();
        } else {
            console.log("No meeting document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error deleting meeting task:", error);
    }
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


async function markAsMeetingCompleted(button) {
    const taskItem = button.parentElement.parentElement;
    const taskId = taskItem.id.replace('meeting-task-', '');

    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const meetingDocRef = querySnapshot.docs[0].ref;

            // Update the task's completed status in Firestore
            await updateDoc(meetingDocRef, {
                [`${taskId}.completed`]: true,
            });
            taskItem.classList.add('meeting-completed');
            const completedList = document.getElementById('completed-topics-list');
            completedList.appendChild(taskItem);
            launchMeetingConfetti();
        } else {
            console.log("No meeting document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error marking meeting task as completed:", error);
    }
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

async function updateTaskBackground(selectElement, taskId) {
    console.log(selectElement.value, taskId);
    const taskItem = selectElement.parentElement.parentElement;
    const newStatus = selectElement.value;

    // Update the background color based on the selected value
    switch (newStatus) {
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

    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const meetingDocRef = querySnapshot.docs[0].ref;

            // Update the task's status in Firestore
            await updateDoc(meetingDocRef, {
                [`${taskId}.status`]: newStatus,
            });

            console.log("Task status updated in Firestore:", newStatus);
        } else {
            console.log("No meeting document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error updating task background and status:", error);
    }
}
window.updateTaskBackground = updateTaskBackground;
window.addFiveMinutes=addFiveMinutes;
window.completeDiscussion=completeDiscussion;
window.resumeTimer=resumeTimer;
window.pauseTimer=pauseTimer;
window.showAddMeetingTaskModal=showAddMeetingTaskModal;
window.hideAddMeetingTaskModal=hideAddMeetingTaskModal;
window.startDiscussion=startDiscussion;
window.handleAddMeetingTask=handleAddMeetingTask;
window.deleteMeetingTask=deleteMeetingTask;
window.markAsMeetingCompleted=markAsMeetingCompleted;
window.stopTimer=stopTimer;
window.populateMeetingTasks=populateMeetingTasks;