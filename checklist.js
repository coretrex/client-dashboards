document.addEventListener('DOMContentLoaded', function() {
    initializeChecklistPage();
});

function initializeChecklistPage() {
    const addTaskBtn = document.querySelector('.add-task-btn');
    const closeBtn = document.querySelector('.close-btn');
    const newTaskInput = document.getElementById('new-task-input');
    const taskBuckets = document.querySelectorAll('.task-bucket');

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', showAddTaskModal);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAddTaskModal);
    }
    if (newTaskInput) {
        newTaskInput.addEventListener('keypress', handleAddTask);
    }
    taskBuckets.forEach(bucket => {
        bucket.ondrop = drop;
        bucket.ondragover = allowDrop;
    });
}

function handleAddTask(event) {
    if (event.key === 'Enter') {
        const taskText = event.target.value.trim();
        if (taskText !== '') {
            addTask(taskText, 'active-task-list');
            event.target.value = '';
            hideAddTaskModal();
        }
    }
}

function addTask(taskText, listId) {
    const taskList = document.getElementById(listId);
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    taskItem.draggable = true;
    taskItem.id = `task-${new Date().getTime()}`; // unique id
    taskItem.ondragstart = drag;
    taskItem.innerHTML = `
        <span>${taskText}</span>
        <div class="task-actions">
            <button class="on-hold-btn" onclick="moveToOnHold(this)"><i class="fas fa-hand-paper"></i></button>
            <button class="done-btn" onclick="markAsCompleted(this)"><i class="fas fa-check"></i></button>
            <button class="delete-task-btn" onclick="deleteTask(this)"><i class="fas fa-times"></i></button>
        </div>
    `;
    taskList.appendChild(taskItem);
}

function deleteTask(button) {
    const taskItem = button.parentElement.parentElement;
    taskItem.remove();
}

function moveToOnHold(button) {
    const taskItem = button.parentElement.parentElement;
    document.getElementById('onhold-task-list').appendChild(taskItem);
}

function markAsCompleted(button) {
    const taskItem = button.parentElement.parentElement;
    taskItem.classList.add('completed');
    document.getElementById('completed-task-list').appendChild(taskItem);
    launchConfetti();
}

function launchConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const taskItem = document.getElementById(data);
    if (event.target.tagName === 'UL') {
        event.target.appendChild(taskItem);
    } else if (event.target.closest('.task-bucket')) {
        event.target.closest('.task-bucket').querySelector('.task-list').appendChild(taskItem);
    }
}

function showAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}

function hideAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}
