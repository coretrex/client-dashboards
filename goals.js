import { updateDoc, db, doc, collection, query, where, getDocs } from "./script.js";
import { globalSelectedValue as selectedId, initializePage } from "./script.js";

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    console.log("hello");
});

async function editField2(element) {
    const span = element.closest('li').querySelector('span[contenteditable]');
    span.contentEditable = true;
    span.focus();
}

async function deleteField2(element) {
    const listItem = element.closest('li');
    listItem.remove();
    await storeData();
}

export async function fetchPlanData() {
    console.log(selectedId);
    const brandRef = doc(db, "brands", selectedId);
    const plansRef = collection(db, "plans");
    const q = query(plansRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log("Fetched Plans data:", data);
        populateTables(data);
    });
}

function populateTables(data) {
    populateYearTable('one-year-list', data.year1);
    populateYearTable('three-year-list', data.year3);
    populateYearTable('five-year-list', data.year5);
}

function populateYearTable(listId, yearData) {
    const list = document.getElementById(listId);

    list.innerHTML = '';

    const sequence = [
        'Future Date',
        'Revenue',
        'Page Views',  // Changed from 'Profit' to 'Page Views'
        'CVR (%)',
        'AOV',
        'TaCoS'
    ];

    if (yearData) {
        sequence.forEach(key => {
            if (key in yearData || key === 'Page Views') {  // Add condition for 'Page Views'
                const listItem = document.createElement('li');
                
                const labelSpan = document.createElement('span');
                labelSpan.innerHTML = `<b>${key}:</b>`;
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'editable-field';
                valueSpan.contentEditable = true;
                valueSpan.textContent = key === 'Page Views' ? (yearData[key] || 'Enter Page Views') : yearData[key];
                
                // Attach input event listener to save changes
                valueSpan.addEventListener('input', async function() {
                    await storeData();
                });

                listItem.appendChild(labelSpan);
                listItem.appendChild(valueSpan);

                const dropdown = document.createElement('div');
                dropdown.className = 'dropdown';

                const dropdownButton = document.createElement('button');
                dropdownButton.className = 'dropdown-icon';
                dropdownButton.innerHTML = '<i class="fas fa-ellipsis-h"></i>';

                const dropdownContent = document.createElement('div');
                dropdownContent.className = 'dropdown-content';
                dropdownContent.innerHTML = `
                    <a href="#" onclick="editField2(this)"><i class="fas fa-edit"></i> Edit</a>
                    <a href="#" onclick="deleteField2(this)"><i class="fas fa-trash"></i> Delete</a>
                `;

                dropdown.appendChild(dropdownButton);
                dropdown.appendChild(dropdownContent);
                listItem.appendChild(dropdown);

                list.appendChild(listItem);
            }
        });
    }
}

async function storeData() {
    const year1Data = getTableData('one-year-list');
    const year3Data = getTableData('three-year-list');
    const year5Data = getTableData('five-year-list');

    // Ensure 'Page Views' is included in the data
    ['year1', 'year3', 'year5'].forEach(year => {
        if (!eval(`${year}Data['Page Views']`)) {
            eval(`${year}Data['Page Views'] = 'Enter Page Views'`);
        }
    });

    const updatedData = {
        year1: year1Data,
        year3: year3Data,
        year5: year5Data
    };

    const plansRef = collection(db, "plans");
    const brandRef = doc(db, "brands", selectedId);
    const q = query(plansRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const planDocRef = querySnapshot.docs[0].ref;
        await updateDoc(planDocRef, updatedData);
        console.log("Data successfully saved to Firestore.");
    } else {
        console.error("No matching documents found.");
    }
}

function getTableData(listId) {
    const list = document.getElementById(listId);
    const items = list.getElementsByTagName('li');
    const data = {};
    for (let item of items) {
        const spans = item.getElementsByTagName('span');
        if (spans.length >= 2) {
            const label = spans[0].innerText.replace(':', '').trim();
            const value = spans[1].innerText.trim();
            data[label] = value;
        }
    }
    return data;
}

window.editField2 = editField2;
window.deleteField2 = deleteField2;
window.fetchPlanData = fetchPlanData;
window.populateYearTable = populateYearTable;
window.populateTables = populateTables;
window.storeData = storeData;
window.getTableData = getTableData;
