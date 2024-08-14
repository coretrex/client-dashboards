import {updateDoc,db,doc,collection,query,where,getDocs} from "./script.js";
import { globalSelectedValue as selectedId,initializePage } from "./script.js";
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    initializeQuarterlyCountdownTimer();
    initializeGoalInput();
});
export async function fetchQuarterlyGoalsData() {
    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "quarterly-goals");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);
        const goalList = document.getElementById('goal-list');
        goalList.innerHTML = '';
        if (!querySnapshot.empty) {
            querySnapshot.forEach(docSnapshot => {
                const data = docSnapshot.data();
                if (data && typeof data === 'object') {
                    for (const key in data) {
                        if (data.hasOwnProperty(key) && key !== 'brandId') {
                            const goal = data[key];
                            if (goal && goal.name && goal.status !== undefined) {
                                const goalItem = document.createElement('li');
                                goalItem.className = `goal-item ${goal.status} ${goal.completed?'completed':''}`; 
                                goalItem.style.order = goal.completed?'1':'';
                                goalItem.innerHTML = `
                                    <span class="goal-text">${goal.name}</span>
                                    <div class="goal-status">
                                        <select class="status-dropdown ${goal.status} " onchange="setGoalStatusDropdown(this,${key})">
                                            <option value="on-track" ${goal.status === 'on-track' ? 'selected' : ''}>On-Track</option>
                                            <option value="on-hold" ${goal.status === 'on-hold' ? 'selected' : ''}>On-Hold</option>
                                            <option value="off-track" ${goal.status === 'off-track' ? 'selected' : ''}>Off-Track</option>
                                        </select>
                                        <button class="status-button complete-button" onclick="completeGoal(this,${key})"><i class="fas fa-check"></i></button>
                                    </div>
                                `;
                                goalList.appendChild(goalItem);
                                updateDropdownColor(goalItem.querySelector('.status-dropdown'), goal.status);
                            } else {
                                console.error('Goal data format is incorrect:', goal);
                            }
                        }
                    }
                } else {
                    console.error('Data format is incorrect:', data);
                }
            });
        } else {
            console.log("No matching quarterly goals found.");
        }
    } catch (error) {
        console.error("Error fetching quarterly goals data:", error);
    }
}
async function addGoal(name) {
    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "quarterly-goals");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);
        const newGoalId = `${new Date().getTime()}`; // Unique ID based on timestamp
        const newGoal = {
            name: name,
            status: 'on-track', // Default status, adjust as needed
            completed: false
        };

        if (!querySnapshot.empty) {
            querySnapshot.forEach(async (docSnapshot) => {
                const data = docSnapshot.data();

                // if (data && typeof data === 'object') {
                    const updatedData = { ...data, [newGoalId]: newGoal };

                    await updateDoc(docSnapshot.ref, updatedData);
                    // fetchQuarterlyGoalsData(); // Fetch and update goals list after adding new goal
                    const goalList = document.getElementById('goal-list');
                    const goalItem = document.createElement('li');
                    goalItem.className = 'goal-item on-track'; // Default status
                    goalItem.innerHTML = `
                        <span class="goal-text">${name}</span>
                        <div class="goal-status">
                            <select class="status-dropdown on-track" onchange="setGoalStatusDropdown(this,${newGoalId})">
                                <option value="on-track" selected>On-Track</option>
                                <option value="on-hold">On-Hold</option>
                                <option value="off-track">Off-Track</option>
                            </select>
                            <button class="status-button complete-button" onclick="completeGoal(this,${newGoalId})"><i class="fas fa-check"></i></button>
                        </div>
                    `;
                    goalList.appendChild(goalItem);
                    updateDropdownColor(goalItem.querySelector('.status-dropdown'), 'on-track');
                // }
            });
        } else {
            console.log("No matching quarterly goals found to update.");
        }
    } catch (error) {
        console.error("Error adding new goal:", error);
    }
}

export function initializeGoalInput() {
    console.log('Initializing goal input');
    const goalInput = document.getElementById('new-goal-input');
    if (!goalInput) {
        console.error('Element with id "new-goal-input" not found');
        return;
    }

    goalInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const value = event.target.value.trim();
            if (value) {
                addGoal(value);
                event.target.value = ''; // Clear the input field after adding the goal
            }
        }
    });

    goalInput.addEventListener('focus', function() {
        goalInput.placeholder = '';
    });

    goalInput.addEventListener('blur', function() {
        if (goalInput.value.trim() === '') {
            goalInput.placeholder = 'Deploy A+ across all SKUs...';
        }
    });

    new Sortable(document.getElementById('goal-list'), {
        animation: 150,
        ghostClass: 'sortable-ghost'
    });
}

export function initializeQuarterlyCountdownTimer() {
    console.log('Initializing quarterly countdown timer');
    startQuarterlyCountdown();
}

function startQuarterlyCountdown() {
    console.log('Starting quarterly countdown...');
    const countdownTimer = document.getElementById('quarterly-countdown-timer');
    const countdownText = document.getElementById('quarterly-countdown-text');

    if (!countdownTimer || !countdownText) {
        console.error('Elements with id "quarterly-countdown-timer" or "quarterly-countdown-text" not found');
        return;
    }

    console.log('Quarterly countdown elements found, starting countdown...');

    function updateCountdown() {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
        const nextQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        if (nextQuarterStart <= now) {
            nextQuarterStart.setFullYear(nextQuarterStart.getFullYear() + 1);
        }

        const diff = nextQuarterStart - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownTimer.innerHTML = `
            <span class="number">${days}</span><span class="unit">d</span>
            <span class="number">${hours}</span><span class="unit">h</span>
            <span class="number">${minutes}</span><span class="unit">m</span>
            <span class="number">${seconds}</span><span class="unit">s</span>
        `;
        countdownText.textContent = `Until the end of Q${currentQuarter}`;

        setTimeout(updateCountdown, 1000);
    }

    updateCountdown();
}

// function addGoal(goalText) {
//     if (goalText.trim() !== '') {
//         const goalList = document.getElementById('goal-list');
//         const goalItem = document.createElement('li');
//         goalItem.className = 'goal-item on-track'; // Default status
//         goalItem.innerHTML = `
//             <span class="goal-text">${goalText}</span>
//             <div class="goal-status">
//                 <select class="status-dropdown on-track" onchange="setGoalStatusDropdown(this)">
//                     <option value="on-track" selected>On-Track</option>
//                     <option value="on-hold">On-Hold</option>
//                     <option value="off-track">Off-Track</option>
//                 </select>
//                 <button class="status-button complete-button" onclick="completeGoal(this)"><i class="fas fa-check"></i></button>
//             </div>
//         `;
//         goalList.appendChild(goalItem);
//         updateDropdownColor(goalItem.querySelector('.status-dropdown'), 'on-track');
//     }
// }

async function setGoalStatusDropdown(select,newGoalId) {
    console.log(select.value,newGoalId);
    const goalItem = select.closest('.goal-item');
    goalItem.className = `goal-item ${select.value}`;
    updateDropdownColor(select, select.value);
    try {
        const brandRef = doc(db, "brands", selectedId);
        const quarterlyGoalsRef = collection(db, "quarterly-goals");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            querySnapshot.forEach(async (docSnapshot) => {
                const data = docSnapshot.data();                
                if (data && typeof data === 'object') {
                    // Update the status of the specific goal
                    const updatedData = {
                        ...data,
                        [newGoalId]: {
                            ...data[newGoalId],
                            status: select.value,
                            completed:false,
                        }
                    };
                    await updateDoc(docSnapshot.ref, updatedData);
                    console.log('Goal status updated successfully.');
                }
            });
        } else {
            console.log("No matching quarterly goals found to update.");
        }
    } catch (error) {
        console.error("Error updating goal status:", error);
    }
}
function updateDropdownColor(select, status) {
    const colorMap = {
        'on-track': 'darkgreen',
        'on-hold': 'darkorange',
        'off-track': 'darkred'
    };
    select.style.backgroundColor = colorMap[status];
}

async function completeGoal(button, newGoalId) {
    console.log(button, newGoalId);
    
    const goalItem = button.closest('.goal-item');
    
    // Update the UI to show the goal as completed
    goalItem.className = 'goal-item completed';
    goalItem.style.order = '1'; // Move completed items to the bottom

    try {
        // Reference to the brand document
        const brandRef = doc(db, "brands", selectedId);

        // Reference to the quarterly-goals collection
        const quarterlyGoalsRef = collection(db, "quarterly-goals");
        const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach(async (docSnapshot) => {
                const data = docSnapshot.data();
                
                if (data && typeof data === 'object') {
                    // Update the completed status of the specific goal
                    const updatedData = {
                        ...data,
                        [newGoalId]: {
                            ...data[newGoalId],
                            completed: true
                        }
                    };

                    await updateDoc(docSnapshot.ref, updatedData);
                    console.log('Goal marked as complete in Firestore.');
                }
            });
        } else {
            console.log("No matching quarterly goals found to update.");
        }
    } catch (error) {
        console.error("Error updating goal completion status:", error);
    }
}

window.completeGoal=completeGoal;
window.setGoalStatusDropdown=setGoalStatusDropdown;
window.initializeGoalInput=initializeGoalInput;
window.initializeQuarterlyCountdownTimer=initializeQuarterlyCountdownTimer;
window.addGoal=addGoal;
window.startQuarterlyCountdown=startQuarterlyCountdown;
window.updateDropdownColor=updateDropdownColor;