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
  const taskBuckets = document.querySelectorAll(".task-bucket");

  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", showAddTaskModal);
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", hideAddTaskModal);
  }
  if (newTaskInput) {
    newTaskInput.addEventListener("keypress", handleAddTask);
  }
  taskBuckets.forEach((bucket) => {
    bucket.addEventListener("drop", drop);
    bucket.addEventListener("dragover", allowDrop);
  });

  document.querySelectorAll(".on-hold-btn").forEach((button) => {
    button.addEventListener("click", moveToOnHold);
  });

  document.querySelectorAll(".done-btn").forEach((button) => {
    button.addEventListener("click", markAsCompleted);
  });

  document.querySelectorAll(".delete-task-btn").forEach((button) => {
    button.addEventListener("click", deleteTask);
  });

  // Attach event listeners for the new buttons
  document.getElementById("onboarding-tasks-btn").addEventListener("click", function () {
    createOnboardingTasks();
  });
  document.getElementById("cro-increase-btn").addEventListener("click", function () {
    // Define the tasks to be created for CRO Increase here
  });
  document.getElementById("campaign-scaffolding-btn").addEventListener("click", function () {
    // Define the tasks to be created for Campaign Scaffolding here
  });
}

function handleAddTask(event) {
  if (event.key === "Enter") {
    const taskText = event.target.value.trim();
    console.log(selectedId);
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
  taskItem.draggable = true;
  taskItem.id = taskId;
  taskItem.addEventListener("dragstart", drag);
  taskItem.innerHTML = `
      <span>${taskText}</span>
      <div class="task-actions">
          <button class="on-hold-btn"><i class="fas fa-hand-paper"></i></button>
          <button class="done-btn"><i class="fas fa-check"></i></button>
          <button class="delete-task-btn"><i class="fas fa-times"></i></button>
      </div>
  `;

  // Add event listeners for the new task's action buttons
  taskItem.querySelector(".on-hold-btn").addEventListener("click", () => moveToOnHold(taskItem));
  taskItem.querySelector(".done-btn").addEventListener("click", () => markAsCompleted(taskItem));
  taskItem.querySelector(".delete-task-btn").addEventListener("click", () => deleteTask(taskItem));

  taskList.appendChild(taskItem);
  console.log(taskId);

  // Store the new task in Firestore and update the globalTasksObject
  try {
    const taskData = {
      id: taskId,
      name: taskText,
      status: "active"  // Default status; can be updated based on user action
    };
    console.log(taskData);

    // Query to find the correct checklist document
    globalTasksObject[taskId] = taskData;
    const checklistsRef = collection(db, "checklists");
    const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Assuming there's only one document that matches the query
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
  console.log("Deleting task with ID:", taskId);

  taskItem.remove();
  console.log("Task removed from UI");

  try {
    const checklistsRef = collection(db, "checklists");
    const q = query(checklistsRef, where("brandId", "==", doc(db, "brands", selectedId)));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const checklistDocRef = querySnapshot.docs[0].ref;
      console.log("Document Reference:", checklistDocRef.path);

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

async function moveToOnHold(taskItem, status) {
  console.log(status);
  const taskId = taskItem.id.replace(/^task-/, ''); // Remove "task-" prefix if it exists
  if (status === "completed") {
    taskItem.classList.remove("completed");
    globalTasksObject[`${taskId}`].status = "completed";
  }
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

async function markAsCompleted(taskItem, status) {
  console.log(status);

  if (taskItem.status === "completed") return;

  taskItem.classList.add("completed");
  document.getElementById("completed-task-list").appendChild(taskItem);
  launchConfetti();

  const taskId = taskItem.id.replace(/^task-/, ''); // Remove "task-" prefix if it exists
  const taskText = taskItem.querySelector("span").textContent;

  const taskData = {
    id: `${taskId}`, // Ensure the correct format
    name: taskText,
    status: "completed"
  };

  // Update the globalTasksObject
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
        [`tasks.${taskId}`]: taskData // Use the consistent "task-" prefix
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
  if (event.target.tagName === "UL") {
    event.target.appendChild(taskItem);
  } else if (event.target.closest(".task-bucket")) {
    event.target
      .closest(".task-bucket")
      .querySelector(".task-list")
      .appendChild(taskItem);
  }
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

function createOnboardingTasks() {
  console.log("Onboarding Tasks button clicked");
  const onboardingTasks = [
      "Dashboard Walkthrough",
      "VTO Submission",
      "1, 3, 5 Year Plan Review",
      "Quarterly Rocks Created"
  ];

  onboardingTasks.forEach(task => {
      addTask(task, "active-task-list");
  });
}


export async function fetchChecklistData(selectedId) {
  try {
    const brandRef = doc(db, "brands", selectedId);
    const checklistsRef = collection(db, "checklists");
    const q = query(checklistsRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log("Fetched checklist data:", data);
      const tasksObject = data.tasks;
      console.log("Fetched checklist data:", tasksObject);
      globalTasksObject = tasksObject || {};
      updateTaskBuckets(tasksObject);
    });
    console.log("Checklist data fetched successfully.");

  } catch (error) {
    console.error("Error fetching checklist data:", error);
  }
}

function updateTaskBuckets(tasksObject) {
  document.querySelectorAll(".task-list").forEach(list => {
    list.innerHTML = "";
  });

  const tasks = Object.values(tasksObject || {});

  tasks.forEach(task => {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";
    taskItem.draggable = true;
    taskItem.id = `task-${task.id}`;
    taskItem.addEventListener("dragstart", drag);
    taskItem.innerHTML = `
          <span>${task.name}</span>
          <div class="task-actions">
              <button class="on-hold-btn"><i class="fas fa-hand-paper"></i></button>
              <button class="done-btn"><i class="fas fa-check"></i></button>
              <button class="delete-task-btn"><i class="fas fa-times"></i></button>
          </div>
      `;
    if (task.status === "completed") {
      taskItem.classList.add("completed");
    }
    taskItem.querySelector(".on-hold-btn").addEventListener("click", () => moveToOnHold(taskItem, task.status));
    taskItem.querySelector(".done-btn").addEventListener("click", () => markAsCompleted(taskItem, task.status));
    taskItem.querySelector(".delete-task-btn").addEventListener("click", () => deleteTask(taskItem));

    const bucketId = `${task.status}-task-list`;
    document.getElementById(bucketId).appendChild(taskItem);
  });
}

// Attach functions to the window object for global access
window.showAddTaskModal = showAddTaskModal;
window.hideAddTaskModal = hideAddTaskModal;
window.handleAddTask = handleAddTask;
window.drop = drop;
window.allowDrop = allowDrop;
window.fetchChecklistData = fetchChecklistData;
