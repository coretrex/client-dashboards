import { deleteField, updateDoc, db, doc, collection, query, where, getDocs } from "./script.js";
import { globalSelectedValue as selectedId, initializePage } from "./script.js";
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

    meetingTopicList.innerHTML = '';
    completedTopicsList.innerHTML = '';

    const order = data.order || {}; // Fetch the order object

    const sortedTasks = Object.keys(data).filter(key => key !== 'brandId' && key !== 'order').sort((a, b) => {
        return (order[a] || 0) - (order[b] || 0);
    });

    sortedTasks.forEach(taskId => {
        const task = data[taskId];
        if (task.completed) {
            addTaskToList(task, completedTopicsList, true, taskId);
        } else {
            addTaskToList(task, meetingTopicList, false, taskId);
        }
    });
}


function addTaskToList(task, listElement, isCompleted, key) {
    const taskItem = document.createElement('li');
    taskItem.className = 'meeting-task-item';
    taskItem.draggable = true;
    taskItem.id = `meeting-task-${key}`;
    taskItem.ondragstart = dragMeeting;

    const linkColor = task.url ? 'green' : 'lightgrey';

    taskItem.innerHTML = `
        <span>${task.name}</span>
        <div class="meeting-task-actions">
            <button class="hyperlink-btn" onclick="toggleHyperlinkMenu(this)">
                <i class="fas fa-link" style="color: ${linkColor};"></i>
            </button>
            <div class="hyperlink-dropdown" style="display: none;">
                <button onclick="navigateToUrl('${key}')">Navigate to URL</button>
                <button onclick="addUrl('${key}')">Add URL</button>
            </div>
            <select class="discussion-type" onchange="updateTaskBackground(this, ${key})">
                <option value="inform" ${task.status === 'inform' ? 'selected' : ''}>Inform</option>
                <option value="discuss" ${task.status === 'discuss' ? 'selected' : ''}>Discuss</option>
                <option value="solve" ${task.status === 'solve' ? 'selected' : ''}>Solve</option>
            </select>
            <button class="meeting-start-btn" onclick="startDiscussion(this)"><i class="fas fa-play"></i></button>
            <button class="meeting-done-btn" onclick="markAsMeetingCompleted(this)"><i class="fas fa-check"></i></button>
            <button class="meeting-delete-task-btn" onclick="deleteMeetingTask(this)"><i class="fas fa-times"></i></button>
                        <button class="meeting-move-up-btn" onclick="moveTaskUp(this)"><i class="fas fa-arrow-up"></i></button> <!-- Up Arrow Button -->
            <button class="meeting-move-down-btn" onclick="moveTaskDown(this)"><i class="fas fa-arrow-down"></i></button> <!-- Down Arrow Button -->
        </div>
    `;

    if (isCompleted) {
        taskItem.classList.add('meeting-completed');
    }

    listElement.appendChild(taskItem);
}

function moveTaskUp(button) {
    const taskItem = button.parentElement.parentElement;
    const previousSibling = taskItem.previousElementSibling;

    if (previousSibling) {
        taskItem.parentElement.insertBefore(taskItem, previousSibling);
        saveMeetingTaskOrder(taskItem.parentElement);  // Save the new order to the database
    }
}

// Attach the function to the window object
window.moveTaskUp = moveTaskUp;
window.moveTaskDown = moveTaskDown;


function moveTaskDown(button) {
    const taskItem = button.parentElement.parentElement;
    const nextSibling = taskItem.nextElementSibling;

    if (nextSibling) {
        taskItem.parentElement.insertBefore(nextSibling, taskItem);
        saveMeetingTaskOrder(taskItem.parentElement);  // Save the new order to the database
    }
}

// Attach the function to the window object
window.moveTaskDown = moveTaskDown;




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

                    await updateDoc(meetingDocRef, {
                        [newTaskId]: newTask
                    });

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

    const linkColor = task.url ? 'green' : 'lightgrey';

    taskItem.innerHTML = `
        <span>${task.name}</span>
        <div class="meeting-task-actions">
            <button class="hyperlink-btn" onclick="toggleHyperlinkMenu(this)">
                <i class="fas fa-link" style="color: ${linkColor};"></i>
            </button>
            <div class="hyperlink-dropdown" style="display: none;">
                <button onclick="navigateToUrl('${taskId}')">Navigate to URL</button>
                <button onclick="addUrl('${taskId}')">Add URL</button>
            </div>
            <select class="discussion-type" onchange="updateTaskBackground(this, ${taskId})">
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
            await updateDoc(meetingDocRef, {
                [`${taskId}`]: deleteField(),
            });

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

    countdown = 600;
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

async function saveMeetingTaskOrder(listElement) {
    const taskItems = listElement.children;
    const newOrder = {};

    for (let i = 0; i < taskItems.length; i++) {
        const taskId = taskItems[i].id.replace('meeting-task-', '');
        newOrder[taskId] = i; // Save the order index
    }

    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const meetingDocRef = querySnapshot.docs[0].ref;

            // Update the order in Firestore
            await updateDoc(meetingDocRef, {
                order: newOrder
            });

            console.log("Meeting task order updated in Firestore:", newOrder);
        } else {
            console.log("No meeting document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error saving meeting task order:", error);
    }
}


function dropMeeting(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(data);
    const targetElement = event.target.closest('.meeting-task-item');
    const listElement = event.target.closest('ul');

    if (targetElement && listElement) {
        listElement.insertBefore(draggedElement, targetElement.nextSibling);
    } else if (listElement) {
        listElement.appendChild(draggedElement);
    }

    // Save the new order
    saveMeetingTaskOrder(listElement);
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
    countdown += 300;
}

async function updateTaskBackground(selectElement, taskId) {
    console.log(selectElement.value, taskId);
    const taskItem = selectElement.parentElement.parentElement;
    const newStatus = selectElement.value;

    switch (newStatus) {
        case 'inform':
            taskItem.style.backgroundColor = '#e7f3ff';
            break;
        case 'discuss':
            taskItem.style.backgroundColor = '#fff4e7';
            break;
        case 'solve':
            taskItem.style.backgroundColor = '#e7ffe7';
            break;
    }

    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const meetingDocRef = querySnapshot.docs[0].ref;

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

// Hyperlink management functions
function toggleHyperlinkMenu(button) {
    const dropdown = button.nextElementSibling;
    const isVisible = dropdown.style.display === 'block';

    // Close all dropdowns first
    document.querySelectorAll('.hyperlink-dropdown').forEach(menu => {
        menu.style.display = 'none';
    });

    // Toggle the clicked dropdown visibility
    if (!isVisible) {
        dropdown.style.display = 'block';

        // Add event listener to close dropdown when clicking outside
        const closeDropdown = (event) => {
            if (!dropdown.contains(event.target) && event.target !== button) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        };

        // Attach the event listener with a slight delay to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 100);
    }
}


async function navigateToUrl(taskId) {
    const brandRef = doc(db, "brands", selectedId);
    const quarterlyGoalsRef = collection(db, "meeting");
    const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        querySnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            const url = data[taskId]?.url;
            if (url) {
                window.open(url, '_blank');
            } else {
                alert('No URL found for this task.');
            }
        });
    }
}

async function addUrl(taskId) {
    const url = prompt("Please enter the URL:");
    if (url) {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "meeting");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach(async (docSnapshot) => {
                const meetingDocRef = doc(db, "meeting", docSnapshot.id);
                await updateDoc(meetingDocRef, {
                    [`${taskId}.url`]: url
                });
                document.querySelector(`#meeting-task-${taskId} .hyperlink-btn i`).style.color = 'green';
            });
        }
    }
}

window.updateTaskBackground = updateTaskBackground;
window.addFiveMinutes = addFiveMinutes;
window.completeDiscussion = completeDiscussion;
window.resumeTimer = resumeTimer;
window.pauseTimer = pauseTimer;
window.showAddMeetingTaskModal = showAddMeetingTaskModal;
window.hideAddMeetingTaskModal = hideAddMeetingTaskModal;
window.startDiscussion = startDiscussion;
window.handleAddMeetingTask = handleAddMeetingTask;
window.deleteMeetingTask = deleteMeetingTask;
window.markAsMeetingCompleted = markAsMeetingCompleted;
window.stopTimer = stopTimer;
window.populateMeetingTasks = populateMeetingTasks;
window.toggleHyperlinkMenu = toggleHyperlinkMenu;
window.navigateToUrl = navigateToUrl;
window.addUrl = addUrl;
