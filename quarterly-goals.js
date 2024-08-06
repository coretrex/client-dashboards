document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    initializeQuarterlyCountdownTimer();
    initializeGoalInput();
});

function initializeGoalInput() {
    console.log('Initializing goal input');
    const goalInput = document.getElementById('new-goal-input');
    if (!goalInput) {
        console.error('Element with id "new-goal-input" not found');
        return;
    }

    goalInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addGoal(event.target.value);
            event.target.value = '';
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

function initializeQuarterlyCountdownTimer() {
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

function addGoal(goalText) {
    if (goalText.trim() !== '') {
        const goalList = document.getElementById('goal-list');
        const goalItem = document.createElement('li');
        goalItem.className = 'goal-item on-track'; // Default status
        goalItem.innerHTML = `
            <span class="goal-text">${goalText}</span>
            <div class="goal-status">
                <select class="status-dropdown on-track" onchange="setGoalStatusDropdown(this)">
                    <option value="on-track" selected>On-Track</option>
                    <option value="on-hold">On-Hold</option>
                    <option value="off-track">Off-Track</option>
                </select>
                <button class="status-button complete-button" onclick="completeGoal(this)"><i class="fas fa-check"></i></button>
            </div>
        `;
        goalList.appendChild(goalItem);
        updateDropdownColor(goalItem.querySelector('.status-dropdown'), 'on-track');
    }
}

function setGoalStatusDropdown(select) {
    const goalItem = select.closest('.goal-item');
    goalItem.className = `goal-item ${select.value}`;
    updateDropdownColor(select, select.value);
}

function updateDropdownColor(select, status) {
    const colorMap = {
        'on-track': 'darkgreen',
        'on-hold': 'darkorange',
        'off-track': 'darkred'
    };
    select.style.backgroundColor = colorMap[status];
}

function completeGoal(button) {
    const goalItem = button.closest('.goal-item');
    goalItem.className = 'goal-item completed';
    goalItem.style.order = '1'; // Move completed items to the bottom
}
