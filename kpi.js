document.addEventListener('DOMContentLoaded', function() {
    console.log('kpi.js loaded and DOMContentLoaded');
    initializeFlatpickr();
    window.addWeekColumn = addWeekColumn;
    window.addKpiRow = addKpiRow;
    console.log('Functions attached to window:', {
        addWeekColumn: window.addWeekColumn,
        addKpiRow: window.addKpiRow
    });
});

function initializeFlatpickr() {
    const datePickerElements = document.querySelectorAll(".future-date, .date-cell");
    console.log('Initializing flatpickr for', datePickerElements.length, 'elements.');

    datePickerElements.forEach(input => {
        flatpickr(input, {
            enableTime: false,
            dateFormat: "m/d/Y",
            onChange: function(selectedDates, dateStr, instance) {
                console.log(`Date selected: ${dateStr}`);
                instance.element.innerHTML = dateStr;
            }
        });
    });
}

function addWeekColumn() {
    console.log('addWeekColumn called');
    const table = document.getElementById('kpi-table');
    const headerRow = table.querySelector('thead tr');
    const newHeaderCell = document.createElement('th');
    newHeaderCell.className = 'date-cell';
    newHeaderCell.contentEditable = true;
    newHeaderCell.innerHTML = 'MM/DD/YY';
    headerRow.appendChild(newHeaderCell);

    // Initialize Flatpickr on the new header cell
    flatpickr(newHeaderCell, {
        enableTime: false,
        dateFormat: "m/d/Y",
        onChange: function(selectedDates, dateStr, instance) {
            console.log(`Date selected: ${dateStr}`);
            instance.element.innerHTML = dateStr;
        }
    });

    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
        const newCell = document.createElement('td');
        newCell.contentEditable = true;
        row.appendChild(newCell);
    });
}

function addKpiRow() {
    console.log('addKpiRow called');
    const table = document.getElementById('kpi-table');
    const numOfWeeks = table.querySelector('thead tr').children.length - 2; // Subtract KPI and Goal columns
    const newRow = document.createElement('tr');
    
    // Add KPI and Goal cells
    newRow.innerHTML = `
        <td contenteditable="true">New KPI</td>
        <td contenteditable="true">New Goal</td>
    `;
    
    // Add cells for each week
    for (let i = 0; i < numOfWeeks; i++) {
        const newCell = document.createElement('td');
        newCell.contentEditable = true;
        newRow.appendChild(newCell);
    }
    
    table.querySelector('tbody').appendChild(newRow);
}
