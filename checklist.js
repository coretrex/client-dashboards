import { deleteField, updateDoc, db, doc, getDocs, collection, query, where } from "./script.js";
import { globalSelectedValue as selectedId, generateBrands } from "./script.js";

let globalTasksObject = {}; // Global variable to store tasks

document.addEventListener("DOMContentLoaded", function () {
  initializeChecklistPage();
});

function initializeChecklistPage() {
  document.querySelectorAll(".task-list").forEach(list => {
    list.innerHTML = "";
  });
  const addTaskBtn = document.querySelector(".add-task-btn");
  const closeBtn = document.querySelector(".close-btn");
  const newTaskInput = document.getElementById("new-task-input");

  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", showAddTaskModal);
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", hideAddTaskModal);
  }
  if (newTaskInput) {
    newTaskInput.addEventListener("keypress", handleAddTask);
  }

  document.querySelectorAll(".on-hold-btn").forEach((button) => {
    button.addEventListener("click", moveToOnHold);
  });

  document.querySelectorAll(".done-btn").forEach((button) => {
    button.addEventListener("click", markAsCompleted);
  });

  document.querySelectorAll(".delete-task-btn").forEach((button) => {
    button.addEventListener("click", deleteTask);
  });
}

function handleAddTask(event) {
  if (event.key === "Enter") {
    const taskText = event.target.value.trim();
    if (taskText !== "") {
      addTask(taskText, "active-task-list");
      event.target.value = "";
      hideAddTaskModal();
    }
  }
}

async function addTask(taskText, listId) {
    const taskList = document.getElementById(listId);
    const taskItem = document.createElement("li");
    const taskId = `${new Date().getTime()}`; // Unique id

    taskItem.className = "task-item";
    taskItem.id = `task-${taskId}`;
    taskItem.innerHTML = `
        <span class="task-title" ondblclick="editTaskTitle('${taskId}')">${taskText}</span>
        <div class="task-actions">
            <button class="note-task-btn"><i class="fas fa-sticky-note"></i></button>
            <button class="on-hold-btn"><i class="fas fa-hand-paper"></i></button>
            <button class="done-btn"><i class="fas fa-check"></i></button>
            <button class="delete-task-btn"><i class="fas fa-times"></i></button>
        </div>
    `;

    // Add event listeners for the new task's action buttons
    taskItem.querySelector(".note-task-btn").addEventListener("click", () => openNoteModal(taskId));
    taskItem.querySelector(".on-hold-btn").addEventListener("click", () => moveToOnHold(taskItem));
    taskItem.querySelector(".done-btn").addEventListener("click", () => markAsCompleted(taskItem));
    taskItem.querySelector(".delete-task-btn").addEventListener("click", () => deleteTask(taskItem));

    taskList.appendChild(taskItem);

    // Store the new task in Firestore and update the globalTasksObject
    try {
        const taskData = {
            id: taskId,
            name: taskText,
            status: "active",  // Default status; can be updated based on user action
            note: ""  // Initialize note as an empty string
        };

        globalTasksObject[taskId] = taskData;
        const checklistsRef = collection(db, "checklists");
        const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const checklistDoc = querySnapshot.docs[0].ref;
            await updateDoc(checklistDoc, {
                [`tasks.${taskId}`]: taskData  // Update or add the new task
            });
            console.log("Task added and saved to Firestore successfully.");
        } else {
            console.error("No checklist document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error adding task to Firestore:", error);
    }
}

async function deleteTask(taskItem) {
  const taskId = taskItem.id.replace(/^task-/, '');
  taskItem.remove();

  try {
    const checklistsRef = collection(db, "checklists");
    const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const checklistDocRef = querySnapshot.docs[0].ref;

      if (globalTasksObject[taskId]) {
        delete globalTasksObject[taskId];
      }

      await updateDoc(checklistDocRef, {
        [`tasks.${taskId}`]: deleteField()
      });

      console.log("Task deleted successfully from Firestore.");
    } else {
      console.error("No checklist document found for the selected brand.");
    }
  } catch (error) {
    console.error("Error deleting task from Firestore:", error);
  }
}

async function moveToOnHold(taskItem) {
  const taskId = taskItem.id.replace(/^task-/, '');
  if (taskItem.status === "onhold") return;

  document.getElementById("onhold-task-list").appendChild(taskItem);

  const taskText = taskItem.querySelector("span").textContent;

  const taskData = {
    id: `${taskId}`, // Ensure the correct format
    name: taskText,
    status: "onhold"
  };

  if (globalTasksObject[`${taskId}`]) {
    globalTasksObject[`${taskId}`].status = "onhold";
  }

  await updateTaskStatusInFirestore(taskId, taskData);
}

async function markAsCompleted(taskItem) {
  if (taskItem.status === "completed") return;

  taskItem.classList.add("completed");
  document.getElementById("completed-task-list").appendChild(taskItem);
  launchConfetti();

  const taskId = taskItem.id.replace(/^task-/, '');
  const taskText = taskItem.querySelector("span").textContent;

  const taskData = {
    id: `${taskId}`, // Ensure the correct format
    name: taskText,
    status: "completed"
  };

  if (globalTasksObject[`${taskId}`]) {
    globalTasksObject[`${taskId}`].status = "completed";
  }

  await updateTaskStatusInFirestore(taskId, taskData);
}

async function updateTaskStatusInFirestore(taskId, taskData) {
  try {
    const checklistsRef = collection(db, "checklists");
    const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const checklistDocRef = querySnapshot.docs[0].ref;
      await updateDoc(checklistDocRef, {
        [`tasks.${taskId}`]: taskData
      });

      console.log(`Task status updated to ${taskData.status} and saved to Firestore successfully.`);
    } else {
      console.error("No checklist document found for the selected brand.");
    }
  } catch (error) {
    console.error("Error updating task status in Firestore:", error);
  }
}

function launchConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

function showAddTaskModal() {
  const modal = document.getElementById("add-task-modal");
  if (modal) {
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
  }
}

function hideAddTaskModal() {
  const modal = document.getElementById("add-task-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
}

function openNoteModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'note-modal';
    modal.innerHTML = `
        <div class="note-modal-content">
            <span class="close-btn" onclick="closeNoteModal(this)">&times;</span>
            <textarea id="note-textarea-${taskId}" placeholder="Type your notes here..."></textarea>
            <button onclick="saveNote('${taskId}')">Save Note</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Load existing note if it exists
    const existingNote = globalTasksObject[taskId]?.note || '';
    document.getElementById(`note-textarea-${taskId}`).value = existingNote;
}

function closeNoteModal(closeButton) {
    const modal = closeButton.closest('.note-modal');
    document.body.removeChild(modal);
}

async function saveNote(taskId) {
    const noteText = document.getElementById(`note-textarea-${taskId}`).value.trim();
    globalTasksObject[taskId].note = noteText;

    // Update Firestore with the note
    try {
        const checklistsRef = collection(db, "checklists");
        const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const checklistDocRef = querySnapshot.docs[0].ref;
            await updateDoc(checklistDocRef, {
                [`tasks.${taskId}.note`]: noteText
            });
            console.log("Note saved successfully.");
        } else {
            console.error("No checklist document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error saving note:", error);
    }

    // Change note icon color based on note presence
    const noteButton = document.querySelector(`#task-${taskId} .note-task-btn i`);
    if (noteText) {
        noteButton.style.color = "green";
    } else {
        noteButton.style.color = "";
    }

    closeNoteModal(document.getElementById(`note-textarea-${taskId}`));
}

function editTaskTitle(taskId) {
    const taskItem = document.getElementById(`task-${taskId}`);
    const taskTitleSpan = taskItem.querySelector(".task-title");
    const currentTitle = taskTitleSpan.textContent;

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = currentTitle;
    inputField.className = "edit-title-input";

    taskTitleSpan.replaceWith(inputField);
    inputField.focus();

    // Save the new title when Enter is pressed or when input loses focus
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            saveTaskTitle(taskId, inputField.value);
        }
    });

    inputField.addEventListener("blur", function () {
        saveTaskTitle(taskId, inputField.value);
    });
}

async function saveTaskTitle(taskId, newTitle) {
    const taskItem = document.getElementById(`task-${taskId}`);
    const inputField = taskItem.querySelector(".edit-title-input");

    if (newTitle.trim() === "") {
        newTitle = "Untitled Task"; // Default name if the title is empty
    }

    const taskTitleSpan = document.createElement("span");
    taskTitleSpan.className = "task-title";
    taskTitleSpan.textContent = newTitle;
    taskTitleSpan.ondblclick = () => editTaskTitle(taskId);

    inputField.replaceWith(taskTitleSpan);

    // Update globalTasksObject and Firestore
    globalTasksObject[taskId].name = newTitle;

    try {
        const checklistsRef = collection(db, "checklists");
        const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const checklistDocRef = querySnapshot.docs[0].ref;
            await updateDoc(checklistDocRef, {
                [`tasks.${taskId}.name`]: newTitle
            });
            console.log("Task title updated successfully.");
        } else {
            console.error("No checklist document found for the selected brand.");
        }
    } catch (error) {
        console.error("Error updating task title in Firestore:", error);
    }
}

function updateTaskBuckets(tasksObject) {
  document.querySelectorAll(".task-list").forEach(list => {
    list.innerHTML = "";
  });

  const tasks = Object.values(tasksObject);

  tasks.forEach(task => {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";
    taskItem.id = `task-${task.id}`;
    taskItem.innerHTML = `
        <span class="task-title" ondblclick="editTaskTitle('${task.id}')">${task.name}</span>
        <div class="task-actions">
            <button class="note-task-btn"><i class="fas fa-sticky-note"></i></button>
            <button class="on-hold-btn"><i class="fas fa-hand-paper"></i></button>
            <button class="done-btn"><i class="fas fa-check"></i></button>
            <button class="delete-task-btn"><i class="fas fa-times"></i></button>
        </div>
    `;
    if (task.status === "completed") {
      taskItem.classList.add("completed");
    }

    // Update note icon color based on note presence
    const noteButton = taskItem.querySelector(".note-task-btn i");
    if (task.note) {
        noteButton.style.color = "green";
    }

    taskItem.querySelector(".note-task-btn").addEventListener("click", () => openNoteModal(task.id));
    taskItem.querySelector(".on-hold-btn").addEventListener("click", () => moveToOnHold(taskItem, task.status));
    taskItem.querySelector(".done-btn").addEventListener("click", () => markAsCompleted(taskItem, task.status));
    taskItem.querySelector(".delete-task-btn").addEventListener("click", () => deleteTask(taskItem));

    const bucketId = `${task.status}-task-list`;
    document.getElementById(bucketId).appendChild(taskItem);
  });
}

// Attach functions to the window object for global access
window.openNoteModal = openNoteModal;
window.closeNoteModal = closeNoteModal;
window.saveNote = saveNote;
window.editTaskTitle = editTaskTitle;
window.saveTaskTitle = saveTaskTitle;

export async function fetchChecklistData(selectedId) {
  try {
    const brandRef = doc(db, "brands", selectedId);
    const checklistsRef = collection(db, "checklists");
    const q = query(checklistsRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const tasksObject = data.tasks;
      globalTasksObject = tasksObject;
      updateTaskBuckets(tasksObject);
    });
    console.log("Checklist data fetched successfully.");
  } catch (error) {
    console.error("Error fetching checklist data:", error);
  }
}

window.showAddTaskModal = showAddTaskModal;
window.hideAddTaskModal = hideAddTaskModal;
window.handleAddTask = handleAddTask;
window.fetchChecklistData = fetchChecklistData;
