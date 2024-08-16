import { db } from "./script.js";
import {deleteColumn,deleteRow} from "./script.js";
import { flatpickrInstances,headerFieldToIndex } from "./script.js";
console.log("kpis.js is loading");
window.addWeekColumn = addWeekColumn;
window.addKpiRow = addKpiRow;
window.saveKpiTable = saveKpiTable;
window.loadKpiTable = loadKpiTable;

document.addEventListener("DOMContentLoaded", function () {
    console.log("kpi.js loaded and DOMContentLoaded");
    initializeFlatpickr();
    loadKpiTable();
    attachDeleteButtons(); // Attach delete buttons to all rows after loading
    formatTable(); // Apply initial formatting
});

function initializeFlatpickr() {
    const datePickerElements = document.querySelectorAll(
        ".future-date, .date-cell"
    );
    console.log(
        "Initializing flatpickr for",
        datePickerElements.length,
        "elements."
    );

    datePickerElements.forEach((input) => {
        flatpickr(input, {
            enableTime: false,
            dateFormat: "m/d/Y",
            onChange: function (selectedDates, dateStr, instance) {
                console.log(`Date selected: ${dateStr}`);
                instance.element.innerHTML = dateStr;
            },
        });
    });
}

function addWeekColumn() {
    const table = document.getElementById("kpi-table");
    const headerRow = table.querySelector("thead tr");
    const columnIndex = headerRow.children.length; // This will give the new column index
    const fieldName = `date-${Date.now()}`; // Generate a unique field name

    // Create a new header cell
    const newHeaderCell = document.createElement("th");
    newHeaderCell.className = "header-cell-container date-cell";
    newHeaderCell.setAttribute("data-column-index", columnIndex); // Store the index
    newHeaderCell.contentEditable = true;

    // Create a container for the header text and the trash icon
    const headerContent = document.createElement("div");
    headerContent.style.display = "flex";
    headerContent.style.alignItems = "center";
    headerContent.style.justifyContent = "space-between";
    headerContent.style.width = "100%";

    const headerText = document.createElement("span");
    headerText.textContent = "MM/DD/YY"; // Default text for the new column header

    // Create a trash icon for deleting the column
    const trashIcon = document.createElement("i");
    trashIcon.className = "fas fa-trash trash-icon";
    trashIcon.addEventListener("click", () => deleteColumn(fieldName)); // Use the field name for deletion

    headerContent.appendChild(headerText);
    headerContent.appendChild(trashIcon);
    newHeaderCell.appendChild(headerContent);
    headerRow.appendChild(newHeaderCell);

    // Update the headerFieldToIndex map with the new column
    headerFieldToIndex.set(fieldName, columnIndex);

    // Initialize Flatpickr on the new header cell
    const flatpickrInstance = flatpickr(newHeaderCell, {
        enableTime: false,
        dateFormat: "m/d/Y",
        onChange: function (selectedDates, dateStr, instance) {
            console.log(`Date selected: ${dateStr}`);
            headerText.textContent = dateStr; // Update header text with selected date
        },
    });
    flatpickrInstances.set(fieldName, flatpickrInstance);

    // Add a new cell in each row of the body
    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((row) => {
        const newCell = document.createElement("td");
        newCell.contentEditable = true;
        row.appendChild(newCell);
    });

    formatTable(); // Reapply formatting after adding a column
}

function addKpiRow() {
    console.log("addKpiRow called");
    const table = document.getElementById("kpi-table");
    const numOfWeeks = table.querySelector("thead tr").children.length - 1; // Subtract KPI and Goal columns
    const newRow = document.createElement("tr");

    // Add KPI cell with trash icon
    const kpiCell = document.createElement("td");
    kpiCell.contentEditable = true;
    kpiCell.textContent = "New KPI";
    kpiCell.classList.add("cell-trash-parent");

    // Create and add the trash icon for the KPI cell
    const trashIcon = document.createElement("i");
    trashIcon.className = "fas fa-trash cell-trash-icon ";
    trashIcon.style.cursor = "pointer"; // Make the trash icon clickable
    trashIcon.addEventListener("click", function(event) {
        handleDeleteRow(event);
        deleteRow();
    });
    kpiCell.appendChild(trashIcon);
    newRow.appendChild(kpiCell);

    // Add cells for each week
    for (let i = 0; i < numOfWeeks; i++) {
        const newCell = document.createElement("td");
        newCell.contentEditable = true;
        newRow.appendChild(newCell);
    }

    // Append the new row to the table body
    table.querySelector("tbody").appendChild(newRow);
    
    formatTable(); // Reapply formatting after adding a row
}

function formatTable() {
    const table = document.getElementById('kpi-table');
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const kpiName = row.children[0].textContent.trim();

        row.querySelectorAll('td').forEach((cell, index) => {
            if (index === 0) return; // Skip the KPI name column

            if (kpiName === 'Revenue') {
                cell.textContent = formatCurrency(cell.textContent);
            } else if (kpiName === 'Buy Box %') {
                cell.textContent = formatPercentage(cell.textContent);
            }
        });
    });
}

function formatCurrency(value) {
    const number = parseFloat(value.replace(/[^0-9.-]+/g,""));
    return isNaN(number) ? value : `$${number.toFixed(2)}`;
}

function formatPercentage(value) {
    const number = parseFloat(value.replace(/[^0-9.-]+/g,""));
    return isNaN(number) ? value : `${number.toFixed(2)}%`;
}

function attachDeleteButtons() {
    document.querySelectorAll('.delete-row').forEach(button => {
        button.removeEventListener('click', handleDeleteRow); // Remove any existing listeners to avoid duplication
        button.addEventListener('click', handleDeleteRow); // Attach the delete row functionality
    });
}

function handleDeleteRow(event) {
    const rowToDelete = event.currentTarget.closest('tr');
    if (rowToDelete) {
        rowToDelete.remove();
    }
}

function saveKpiTable() {
    const table = document.getElementById('kpi-table');
    const tableHTML = table.innerHTML;
}

// Ensure this function runs after DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('save-button').addEventListener('click', saveKpiTable);
    formatTable(); // Initial formatting on load
});
