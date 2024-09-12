import { db, doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc, addDoc } from "./script.js";
import { globalSelectedValue as selectedBrandId } from "./script.js";

let sprintCount = 0;

async function saveSprints() {
    if (!selectedBrandId) {
        console.error("No brand selected. Please select a brand first.");
        return;
    }

    const sprints = [];
    for (let i = 1; i <= 3; i++) {
        const sprintBox = document.getElementById(`sprint-box-${i}`);
        if (sprintBox.innerHTML.trim() !== '') {
            sprints.push(sprintBox.innerHTML);
        }
    }

    const brandRef = doc(db, "brands", selectedBrandId);
    const growthChecklistRef = collection(db, "growthChecklists");
    const q = query(growthChecklistRef, where("brandId", "==", brandRef));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            await updateDoc(doc(db, "growthChecklists", docId), {
                sprints: sprints,
                sprintCount: sprintCount
            });
        } else {
            // If no document exists, create a new one
            await addDoc(growthChecklistRef, {
                brandId: brandRef,
                sprints: sprints,
                sprintCount: sprintCount
            });
        }
        console.log("Sprints saved successfully");
    } catch (error) {
        console.error("Error saving sprints:", error);
    }
}

async function loadSprints() {
    if (!selectedBrandId) {
        console.error("No brand selected. Please select a brand first.");
        return;
    }

    const brandRef = doc(db, "brands", selectedBrandId);
    const growthChecklistRef = collection(db, "growthChecklists");
    const q = query(growthChecklistRef, where("brandId", "==", brandRef));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            const savedSprints = data.sprints || [];
            sprintCount = data.sprintCount || 0;
            const savedGoals = data.goals || {};
            const completions = data.completions || {};

            savedSprints.forEach((sprintHTML, index) => {
                const sprintBox = document.getElementById(`sprint-box-${index + 1}`);
                sprintBox.innerHTML = sprintHTML;
            });

            // Load saved goals
            Object.entries(savedGoals).forEach(([moduleTitle, goalData]) => {
                const module = Array.from(document.querySelectorAll('.checklist-module')).find(
                    m => m.querySelector('h2').textContent.trim() === moduleTitle
                );
                if (module) {
                    const goalButton = module.querySelector('.add-to-rocks');
                    if (goalData.isGoal) {
                        goalButton.innerHTML = '<span>Remove</span>';
                        goalButton.classList.add('in-progress');
                        
                        // Update the UI using the updateGoalUI function
                        updateGoalUI(module, true);
                    }
                }
            });

            // Load completion statuses
            Object.entries(completions).forEach(([moduleTitle, completionData]) => {
                if (completionData.completed) {
                    const module = Array.from(document.querySelectorAll('.checklist-module')).find(
                        m => m.querySelector('h2').textContent.trim() === moduleTitle
                    );
                    if (module) {
                        // Add overlay and replace checkmark button with undo button
                        const overlay = document.createElement('div');
                        overlay.classList.add('module-overlay', 'active');

                        const completedText = document.createElement('div');
                        completedText.classList.add('neon-border');
                        completedText.textContent = 'Completed';

                        overlay.appendChild(completedText);
                        module.appendChild(overlay);

                        const checkmarkButton = module.querySelector('.checkmark-button');
                        if (checkmarkButton) {
                            const undoButton = document.createElement('button');
                            undoButton.classList.add('undo-button');
                            undoButton.innerHTML = '<i class="fas fa-undo"></i>';
                            checkmarkButton.replaceWith(undoButton);
                        }
                    }
                }
            });

            // Disable "Add Sprint" buttons for modules already in sprints
            disableAddedModules();
        } else {
            console.log("No growth checklist document found for the selected brand ID. A new one will be created when sprints are added.");
        }
    } catch (error) {
        console.error("Error loading sprints, goals, and completion statuses:", error);
    }
}

function disableAddedModules() {
    document.querySelectorAll('.checklist-module').forEach(module => {
        const moduleTitle = module.querySelector('h2').textContent.trim();
        const isInSprint = Array.from(document.querySelectorAll('.sprint-box')).some(
            sprintBox => sprintBox.textContent.includes(moduleTitle)
        );
        if (isInSprint) {
            const addButton = module.querySelector('button[data-action="addSprint"]');
            if (addButton) {
                addButton.disabled = true;
                addButton.textContent = 'Added to Sprint';
            }
        }
    });
}

async function addSprint(button) {
    console.log(`Current sprintCount: ${sprintCount}`);
    const module = button.closest('.checklist-module');
    const clone = module.cloneNode(true);
    
    // Remove the original button container
    clone.querySelector('.button-container').remove();

    // Create new button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Add "Mark As Complete" button
    const completeButton = document.createElement('button');
    completeButton.className = 'mark-complete-btn';
    completeButton.textContent = 'Mark As Complete';
    completeButton.dataset.action = 'markComplete';

    // Add "Remove" button
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-btn';
    removeButton.textContent = 'Remove';
    removeButton.dataset.action = 'removeSprint';

    // Append buttons to button container
    buttonContainer.appendChild(completeButton);
    buttonContainer.appendChild(removeButton);

    // Insert the new button container before the tag container
    const tagContainer = clone.querySelector('.tag-container');
    clone.insertBefore(buttonContainer, tagContainer);

    // Find all sprint boxes
    const sprintBoxes = Array.from(document.querySelectorAll('.sprint-box'));
    
    // Find the first empty sprint box
    const emptySprintBox = sprintBoxes.find(box => box.innerHTML.trim() === '');

    if (emptySprintBox) {
        emptySprintBox.innerHTML = ''; // Clear the box before adding the module
        emptySprintBox.appendChild(clone);
        sprintCount = sprintBoxes.filter(box => box.innerHTML.trim() !== '').length;
        console.log(`Sprint added. New sprintCount: ${sprintCount}`);

        // Disable the "Add Sprint" button in the original module
        button.disabled = true;
        button.textContent = 'Added to Sprint';

        // Reattach event listeners and apply filters
        attachFilterListeners();
        filterModules();

        await saveSprints();
        await saveGoals(button);

        console.log(`Checking if rocket should launch. sprintCount: ${sprintCount}, empty boxes: ${document.querySelectorAll('.sprint-box:empty').length}`);
        if (sprintCount === 3 && document.querySelectorAll('.sprint-box:empty').length === 0) {
            console.log('Launching rocket!');
            launchRocket();
        }
    } else {
        console.error("No empty sprint boxes available");
    }

    diagnoseSprints();
}

async function removeSprint(button) {
    const sprintBox = button.closest('.sprint-box');
    const moduleTitle = sprintBox.querySelector('h2').textContent.trim();
    sprintBox.innerHTML = '';
    sprintCount--;

    // Re-enable the "Add Sprint" button in the original module
    const originalModule = Array.from(document.querySelectorAll('.checklist-module')).find(
        module => module.querySelector('h2').textContent.trim() === moduleTitle
    );
    if (originalModule) {
        const addButton = originalModule.querySelector('button[data-action="addSprint"]');
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = 'Add to Sprint';
        }
    }

    await saveSprints();
}

function markComplete(button) {
    button.style.backgroundColor = '#218838';
    button.textContent = 'Completed';
    button.disabled = true;
}

function launchRocket() {
    const rocketHtml = `
        <div id="blur-overlay"></div>
        <div id="rocket-container">
            <div id="rocket">
                <div id="rocket-body"></div>
                <div id="window"></div>
                <div id="fin-left"></div>
                <div id="fin-right"></div>
                <div id="exhaust-flame"></div>
                <div id="exhaust-fumes"></div>
            </div>
        </div>
        <div id="ready-text">Ready, Set, Scale.</div>
    `;

    document.body.insertAdjacentHTML('beforeend', rocketHtml);

    const blurOverlay = document.getElementById('blur-overlay');
    const rocketContainer = document.getElementById('rocket-container');
    const readyText = document.getElementById('ready-text');

    // Add the CSS styles
    const style = document.createElement('style');
    style.textContent = `
#blur-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backdrop-filter: blur(5px);
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }
        #rocket-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 200px;
            z-index: 1001;
        }
        #ready-text {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, 200%);
            font-size: 96px;
            font-weight: bold;
            color: white;
            text-align: center;
            opacity: 0;
            transition: opacity 1s ease-in-out;
            z-index: 1002;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        @keyframes rise {
            0% { transform: translateY(0) scale(1); opacity: 0.8; }
            100% { transform: translateY(-200px) scale(0); opacity: 0; }
        }
        @keyframes launch {
            0% { top: 50%; }
            100% { top: -200px; }
        }
        .shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) infinite;
        }
        #rocket-body {
            width: 60px;
            height: 100px;
            background: linear-gradient(to bottom, #f2f2f2, #cccccc);
            border-radius: 50% 50% 0 0;
            position: relative;
        }
        #window {
            width: 20px;
            height: 20px;
            background-color: #6699cc;
            border-radius: 50%;
            position: absolute;
            top: 30px;
            left: 20px;
        }
        #fin-left, #fin-right {
            width: 0;
            height: 0;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-bottom: 40px solid #cccccc;
            position: absolute;
            bottom: 0;
        }
        #fin-left { left: -20px; }
        #fin-right { right: -20px; }
        #exhaust-flame {
            width: 30px;
            height: 60px;
            background: linear-gradient(to bottom, #ff9933, #ff3300);
            position: absolute;
            bottom: -60px;
            left: 15px;
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            animation: flicker 0.1s infinite;
        }
        #exhaust-fumes {
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
            border-radius: 50%;
            position: absolute;
            bottom: -120px;
            left: -20px;
            opacity: 0;
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        document.body.classList.add('shake');
        rocketContainer.style.animation = 'launch 3s cubic-bezier(0.19, 1, 0.22, 1) forwards';
        readyText.style.opacity = '1';
        
        for (let i = 0; i < 10; i++) {
            const fume = document.createElement('div');
            fume.style.cssText = `
                width: 50px;
                height: 50px;
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                border-radius: 50%;
                position: absolute;
                bottom: ${-120 - i * 20}px;
                left: ${Math.random() * 60 - 30}px;
                opacity: 0.8;
                animation: rise ${1 + Math.random()}s linear infinite;
            `;
            rocketContainer.appendChild(fume);
        }
    }, 500);

    setTimeout(() => {
        document.body.classList.remove('shake');
        blurOverlay.remove();
        rocketContainer.remove();
        readyText.remove();
        style.remove();

        // Remove any leftover elements
        const leftoverElements = document.querySelectorAll('#blur-overlay, #rocket-container, #ready-text');
        leftoverElements.forEach(element => element.remove());

        // Remove the added style
        const addedStyle = document.querySelector('style[data-rocket-style]');
        if (addedStyle) {
            addedStyle.remove();
        }
    }, 3500); // Increased timeout to ensure animation completes

    // Clean up function
    function cleanupRocket() {
        const elements = document.querySelectorAll('#blur-overlay, #rocket-container, #ready-text, style[data-rocket-style]');
        elements.forEach(element => element.remove());
        document.body.classList.remove('shake');
    }

    // Call cleanup after a delay and add it to window unload event
    setTimeout(cleanupRocket, 2000);
    window.addEventListener('unload', cleanupRocket);
}

function attachFilterListeners() {
    document.querySelectorAll('input[name="tag-filter"]').forEach(checkbox => {
        checkbox.removeEventListener('change', filterModules);
        checkbox.addEventListener('change', filterModules);
    });
}

// Add event delegation for button clicks
document.addEventListener('click', async function(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const action = button.dataset.action;
        if (action === 'addSprint') {
            await addSprint(button);
        } else if (action === 'markComplete') {
            markComplete(button);
        } else if (action === 'removeSprint') {
            await removeSprint(button);
        } else if (button.classList.contains('add-to-rocks')) {
            toggleGoal(button);
        }
    }
});

function filterModules() {
    const selectedTag = document.getElementById('tag-filter').value;
    const modules = document.querySelectorAll('.checklist-module');

    modules.forEach(module => {
        const moduleTags = Array.from(module.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase().replace(/\s+/g, '-'));
        
        if (selectedTag === 'all' || moduleTags.includes(selectedTag)) {
            module.style.display = 'block';
        } else {
            module.style.display = 'none';
        }
    });
}

// Remove the old event listeners for checkboxes
document.removeEventListener('DOMContentLoaded', filterModules);
document.querySelectorAll('input[name="tag-filter"]').forEach(checkbox => {
    checkbox.removeEventListener('change', filterModules);
});

// Add event listener for the dropdown
document.addEventListener('DOMContentLoaded', () => {
    const tagFilter = document.getElementById('tag-filter');
    if (tagFilter) {
        tagFilter.addEventListener('change', filterModules);
        filterModules(); // Initial filter
    }
});

function logPriorityLevels() {
    document.querySelectorAll('.volume-level').forEach(volumeLevel => {
        const module = volumeLevel.closest('.checklist-module');
        const title = module.querySelector('h2').textContent;
        const priority = volumeLevel.getAttribute('data-priority');
        const computedWidth = window.getComputedStyle(volumeLevel).width;
        
        console.log(`Module: ${title}`);
        console.log(`Priority: ${priority}`);
        console.log(`Computed Width: ${computedWidth}`);
        console.log('---');
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not authenticated. Please log in first.");
        // Redirect to login page or show login prompt
        return;
    }

    console.log('DOM loaded, logging priority levels');
    logPriorityLevels();
    attachFilterListeners();
    filterModules();
    await loadSprints();
    await loadGoals();
});

// Export the loadSprints function so it can be called from other scripts if needed
export { loadSprints, filterModules, attachFilterListeners };


// Add this new function to save goals
async function saveGoals(button) {
    if (!selectedBrandId) {
        console.error("No brand selected. Please select a brand first.");
        return;
    }

    const module = button.closest('.checklist-module');
    const moduleTitle = module.querySelector('h2').textContent.trim();
    const goalButton = module.querySelector('.add-to-rocks');
    const isGoal = goalButton.textContent === 'Remove';

    const brandRef = doc(db, "brands", selectedBrandId);
    const growthChecklistRef = collection(db, "growthChecklists");
    const q = query(growthChecklistRef, where("brandId", "==", brandRef));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            const docRef = doc(db, "growthChecklists", docId);
            const docSnap = await getDoc(docRef);
            const currentGoals = docSnap.data().goals || {};

            currentGoals[moduleTitle] = {
                isGoal: isGoal,
                dateAdded: isGoal ? new Date().toISOString() : null
            };

            await updateDoc(docRef, { goals: currentGoals });
        } else {
            // If no document exists, create a new one
            await addDoc(growthChecklistRef, {
                brandId: brandRef,
                goals: { 
                    [moduleTitle]: {
                        isGoal: isGoal,
                        dateAdded: isGoal ? new Date().toISOString() : null
                    }
                }
            });
        }
        console.log("Goals saved successfully");

        // Update the UI to show or remove the "Added to Goals on" text
        updateGoalUI(module, isGoal);
    } catch (error) {
        console.error("Error saving goals:", error);
    }
}

// Add this function to handle the "Add Goals" button click
function toggleGoal(button) {
    console.log("toggleGoal called");
    const module = button.closest('.checklist-module');
    const currentText = button.textContent.trim();
    
    console.log("Current button text:", currentText);
    
    if (currentText === 'Add Goal') {
        console.log("Adding goal");
        button.textContent = 'Remove';
        button.classList.add('in-progress');
        updateGoalUI(module, true);
        saveGoals(module, true);
    } else if (currentText === 'Remove') {
        console.log("Removing goal");
        button.textContent = 'Add Goal';
        button.classList.remove('in-progress');
        updateGoalUI(module, false);
        saveGoals(module, false);
    } else {
        console.log("Unexpected button text:", currentText);
    }
}

// Update the updateGoalUI function
function updateGoalUI(module, isGoal) {
    // Remove all existing "Added to Goals on" text
    module.querySelectorAll('.added-to-goals-text').forEach(el => el.remove());

    if (isGoal) {
        const addedToGoalsText = document.createElement('div');
        addedToGoalsText.className = 'added-to-goals-text';
        const formattedDate = new Date().toLocaleDateString();
        addedToGoalsText.textContent = `Added to Goals on ${formattedDate}`;

        // Insert the text at the top of the module, but after any existing elements
        const firstChild = module.firstChild;
        module.insertBefore(addedToGoalsText, firstChild);
    }
}

window.addModuleToRocks = async function(buttonElement) {
    try {
        // Find the module element and its title
        const moduleElement = buttonElement.closest('.checklist-module');
        const moduleName = moduleElement.querySelector('h2').textContent.trim();
  
        // Add the goal
        await addGoal(moduleName); // Wait for the goal to be added
  
        // Get the current date
        const currentDate = new Date().toLocaleDateString();
  
        // Update the module appearance
        moduleElement.style.backgroundColor = 'lightgrey';
        moduleElement.style.color = 'grey';
  
        // Disable the "Add to Rocks" button to prevent further clicks
        buttonElement.disabled = true;
  
  
        // Optionally disable other buttons or elements within the module
        const buttons = moduleElement.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);
  
    } catch (error) {
        console.error("Error adding module to rocks:", error);
    }
  }

  // Growth Checklist To Do Test
document.addEventListener("DOMContentLoaded", function() {
    const addToRocksButtons = document.querySelectorAll('.add-to-rocks');
  
    addToRocksButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert("Added to Rocks!");
            // Add additional functionality as needed
        });
    });
  
    addToChecklistButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Functionality for "Add to Checklist" button click
        });
    });
  
    document.querySelectorAll('.volume-meter .volume-level').forEach(level => {
        const width = parseInt(level.style.width);
        if (width >= 90) {
            level.classList.add('high-volume');
        }
    });
  });
  
  window.addModuleToRocks = async function(buttonElement) {
    try {
        // Find the module element and its title
        const moduleElement = buttonElement.closest('.checklist-module');
        const moduleName = moduleElement.querySelector('h2').textContent.trim();

        // Check if we're adding or removing the goal
        const isAdding = buttonElement.textContent.trim() === 'Add Goal';

        if (isAdding) {
            // Add the goal
            await addGoal(moduleName);

            // Update button text and style
            buttonElement.textContent = 'Remove';
            buttonElement.classList.add('in-progress');

            // Add "Added to Goals" text with current date
            const currentDate = new Date().toLocaleDateString();
            const addedText = document.createElement('div');
            addedText.className = 'added-to-goals-text';
            addedText.textContent = `Added to Goals on ${currentDate}`;
            moduleElement.insertBefore(addedText, moduleElement.firstChild);
        } else {
            // Remove the goal
            await removeGoal(moduleName);

            // Update button text and style
            buttonElement.textContent = 'Add Goal';
            buttonElement.classList.remove('in-progress');

            // Remove "Added to Goals" text
            const addedText = moduleElement.querySelector('.added-to-goals-text');
            if (addedText) {
                addedText.remove();
            }
        }

    } catch (error) {
        console.error("Error updating module in rocks:", error);
    }
}

document.addEventListener('click', async function (event) {
    if (event.target.closest('.checkmark-button')) {
        // Handle the checkmark button click
        const module = event.target.closest('.checklist-module');
        const moduleTitle = module.querySelector('h2').textContent.trim();
        
        // Add the overlay if it doesn't exist
        if (!module.querySelector('.module-overlay')) {
            const overlay = document.createElement('div');
            overlay.classList.add('module-overlay', 'active');

            const completedText = document.createElement('div');
            completedText.classList.add('neon-border');
            completedText.textContent = 'Completed';

            overlay.appendChild(completedText);
            module.appendChild(overlay);
        } else {
            const overlay = module.querySelector('.module-overlay');
            overlay.classList.add('active');
        }

        // Replace the checkmark button with the undo button
        const checkmarkButton = event.target.closest('.checkmark-button');
        const undoButton = document.createElement('button');
        undoButton.classList.add('undo-button');
        undoButton.innerHTML = '<i class="fas fa-undo"></i>';

        checkmarkButton.replaceWith(undoButton);

        // Store completion status in Firebase
        await updateCompletionStatus(moduleTitle, true);

    } else if (event.target.closest('.undo-button')) {
        // Handle the undo button click
        const module = event.target.closest('.checklist-module');
        const moduleTitle = module.querySelector('h2').textContent.trim();
        
        // Remove the overlay
        const overlay = module.querySelector('.module-overlay');
        if (overlay) {
            overlay.remove(); // This removes the overlay and the "Completed" text
        }

        // Replace the undo button with the checkmark button
        const undoButton = event.target.closest('.undo-button');
        const checkmarkButton = document.createElement('button');
        checkmarkButton.classList.add('checkmark-button');
        checkmarkButton.innerHTML = '<i class="fas fa-check"></i>';

        undoButton.replaceWith(checkmarkButton);

        // Remove completion status from Firebase
        await updateCompletionStatus(moduleTitle, false);
    }
});

async function updateCompletionStatus(moduleTitle, isCompleted) {
    if (!selectedBrandId) {
        console.error("No brand selected. Please select a brand first.");
        return;
    }

    const brandRef = doc(db, "brands", selectedBrandId);
    const growthChecklistRef = collection(db, "growthChecklists");
    const q = query(growthChecklistRef, where("brandId", "==", brandRef));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            const docRef = doc(db, "growthChecklists", docId);
            const docSnap = await getDoc(docRef);
            const currentCompletions = docSnap.data().completions || {};

            if (isCompleted) {
                currentCompletions[moduleTitle] = {
                    completed: true,
                    completedAt: new Date().toISOString()
                };
            } else {
                delete currentCompletions[moduleTitle];
            }

            await updateDoc(docRef, { completions: currentCompletions });
            console.log(`Module "${moduleTitle}" completion status updated successfully`);
        } else {
            console.error("No growth checklist document found for the selected brand ID.");
        }
    } catch (error) {
        console.error("Error updating completion status:", error);
    }
}



window.attachFilterListeners = attachFilterListeners;
window.filterModules = filterModules;