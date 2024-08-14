import { db } from "./script.js";

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
    console.log("addWeekColumn called");
    const table = document.getElementById("kpi-table");
    const headerRow = table.querySelector("thead tr");

    const newHeaderCell = document.createElement("th");
    newHeaderCell.className = "date-cell";
    newHeaderCell.contentEditable = true;
    newHeaderCell.innerHTML = "MM/DD/YY";

    const kpiGoalCellsCount = 2; // Assuming KPI and Goal are the first two columns
    headerRow.insertBefore(newHeaderCell, headerRow.children[kpiGoalCellsCount]);

    flatpickr(newHeaderCell, {
        enableTime: false,
        dateFormat: "m/d/Y",
        onChange: function (selectedDates, dateStr, instance) {
            console.log(`Date selected: ${dateStr}`);
            instance.element.innerHTML = dateStr;
        },
    });

    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((row) => {
        if (row.children.length === headerRow.children.length - 1) {
            const newCell = document.createElement("td");
            newCell.contentEditable = true;
            row.insertBefore(newCell, row.children[kpiGoalCellsCount]);
        }
    });
}

function addKpiRow() {
  console.log("addKpiRow called");
  const table = document.getElementById("kpi-table");
  const numOfWeeks = table.querySelector("thead tr").children.length - 2; // Subtract KPI and Goal columns
  const newRow = document.createElement("tr");

  // Add KPI and Goal cells
  newRow.innerHTML = `
      <td contenteditable="true">New KPI</td>
      <td contenteditable="true">New Goal</td>
  `;

  // Add cells for each week
  for (let i = 0; i < numOfWeeks; i++) {
      const newCell = document.createElement("td");
      newCell.contentEditable = true;
      newRow.appendChild(newCell);
  }

  // Add delete button cell
  const deleteCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.className = "delete-button";
  deleteButton.onclick = function() {
      table.querySelector("tbody").removeChild(newRow);
  };
  deleteCell.appendChild(deleteButton);
  newRow.appendChild(deleteCell);

  table.querySelector("tbody").appendChild(newRow);
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

    localStorage.setItem('kpiTable', tableHTML);
    console.log("KPI table saved to localStorage.");
}

function loadKpiTable() {
    const savedTableHTML = localStorage.getItem('kpiTable');
    if (savedTableHTML) {
        document.getElementById('kpi-table').innerHTML = savedTableHTML;
        attachDeleteButtons(); // Attach delete buttons to all loaded rows
        console.log("KPI table loaded from localStorage.");
    } else {
        console.log("No saved KPI table found in localStorage.");
    }
}

// Ensure this function runs after DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('save-button').addEventListener('click', saveKpiTable);
});
