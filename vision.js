import { deleteField ,updateDoc, db, doc, collection, query, where, getDocs } from "./script.js";
import { globalSelectedValue as selectedId, initializePage } from "./script.js";

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    fetchVisionData();
});

function handleAddItem(event, listId, inputId) {
    if (event.key === 'Enter') {
        addItem(listId, inputId);
    }
}

export async function fetchVisionData() {
    console.log("fetching vision", selectedId);
    try {
        const brandRef = doc(db, "brands", selectedId);
        const visionRef = collection(db, "visions");
        const q = query(visionRef, where("brandId", "==", brandRef));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach(docSnapshot => {
                const data = docSnapshot.data();
                console.log("Fetched Vision data:", data);

                // Populate HTML elements with the fetched data
                populateList("core-values-list", data.coreValues, docSnapshot.id, "coreValues");
                populateList("purpose-cause-passion-list", data.purpose, docSnapshot.id, "purpose");
                populateList("niche-list", data.niche, docSnapshot.id, "niche");
                populateMarketData(data.market, docSnapshot.id);
                populateTextSection("unique-value-proposition-list", data.market.Unique_Value_Proposition, docSnapshot.id, "Unique_Value_Proposition");
                populateTextSection("guarantee-list", data.market.Guarantee, docSnapshot.id, "Guarantee");
            });
        } else {
            console.log("No vision data found for the selected brand.");
        }
    } catch (error) {
        console.error("Error fetching vision data:", error);
    }
}
function populateTextSection(sectionId, text, docId, field) {
    const sectionElement = document.getElementById(sectionId);
    sectionElement.innerHTML = ''; // Clear existing items
    if (text) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="italic-preview" contenteditable="true">${text}</span>
            <div class="dropdown">
                <button class="dropdown-icon"><i class="fas fa-ellipsis-h"></i></button>
                <div class="dropdown-content">
                    <a href="#" onclick="editField(this, '${docId}', 'market', '${field}')"><i class="fas fa-edit"></i> Edit</a>
                    <a href="#" onclick="deleteField(this, '${docId}', 'market', '${field}')"><i class="fas fa-trash"></i> Delete</a>
                </div>
            </div>`;
        sectionElement.appendChild(listItem);

        // Add event listener for direct text edits
        listItem.querySelector('span[contenteditable]').addEventListener('blur', function() {
            updateField(docId, 'market', this.textContent.trim(), field);
        });
    } else {
        console.error('Text is not available for:', sectionId);
        deleteField1(sectionElement);
    }
}

function populateList(listId, items, docId, field) {
    const listElement = document.getElementById(listId);
    listElement.innerHTML = ''; // Clear existing items

    if (items && typeof items === 'object') {
        Object.entries(items).forEach(([key, value]) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span contenteditable="true">${value}</span>
                <div class="dropdown">
                    <button class="dropdown-icon"><i class="fas fa-ellipsis-h"></i></button>
                    <div class="dropdown-content">
                        <a href="#" onclick="editField(this, '${docId}', '${field}', '${key}')"><i class="fas fa-edit"></i> Edit</a>
                        <a href="#" onclick="deleteField(this, '${docId}', '${field}', '${key}')"><i class="fas fa-trash"></i> Delete</a>
                    </div>
                </div>`;
            listElement.appendChild(listItem);

            // Add event listener for direct text edits
            listItem.querySelector('span[contenteditable]').addEventListener('blur', function() {
                updateField(docId, field, this.textContent.trim(), key);
            });
        });
    } else {
        console.error('Items are not iterable:', items);
    }
}

function populateMarketData(marketData, docId) {
    const targetMarketList = document.querySelector('#target-market-list');
    targetMarketList.innerHTML = ''; // Clear existing items
    const sequence = [
        'Age',
        'Sex',
        'Household_Income',
        'Location',
        'Education'
    ];

    if (marketData) {
        sequence.forEach(key => {
            if (key in marketData) {
                const value = marketData[key];
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span><b>${key==="Household_Income"?"Household Income":key}:</b></span><span contenteditable="true">${value}</span>
                    <div class="dropdown">
                        <button class="dropdown-icon"><i class="fas fa-ellipsis-h"></i></button>
                        <div class="dropdown-content">
                            <a href="#" onclick="editField(this, '${docId}', 'market', '${key}')"><i class="fas fa-edit"></i> Edit</a>
                            <a href="#" onclick="deleteField(this, '${docId}', 'market', '${key}')"><i class="fas fa-trash"></i> Delete</a>
                        </div>
                    </div>`;
                targetMarketList.appendChild(listItem);

                // Add event listener for direct text edits
                listItem.querySelector('span[contenteditable]').addEventListener('blur', function() {
                    updateField(docId, 'market', this.textContent.trim(), key);
                });
            }
        });
    } else {
        console.error('Market data is not available:', marketData);
    }
}
async function updateField(docId, field, newValue, key) {
    const visionDocRef = doc(db, "visions", docId);

    try {
        if (field === 'market') {
            await updateDoc(visionDocRef, {
                [`market.${key}`]: newValue
            });
            console.log('Market data updated:', key, newValue);
        } else if (field === 'coreValues' || field === 'purpose' || field === 'niche') {
            await updateDoc(visionDocRef, {
                [`${field}.${key}`]: newValue
            });
            console.log(`List ${field} updated:`, key, newValue);
        }
    } catch (error) {
        console.error('Error updating field:', error);
    }
}

async function addItem(listId, inputId) {
    const list = document.getElementById(listId);
    const input = document.getElementById(inputId);
    const value = input.value.trim();

    if (value !== '') {
        try {
            const brandRef = doc(db, "brands", selectedId);
            const visionRef = collection(db, "visions");
            const q = query(visionRef, where("brandId", "==", brandRef));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const visionDocRef = doc(db, "visions", querySnapshot.docs[0].id);
                const fieldToUpdate = listId === 'core-values-list' ? 'coreValues' :
                                      listId === 'purpose-cause-passion-list' ? 'purpose' :
                                      listId === 'niche-list' ? 'niche' : null;

                if (fieldToUpdate) {
                    // Use a unique key (timestamp) to avoid collisions
                    const uniqueKey = Date.now().toString();
                    await updateDoc(visionDocRef, {
                        [`${fieldToUpdate}.${uniqueKey}`]: value
                    });
                    console.log('Item added to Firestore:', value);

                    // Create and display the new list item
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <span contenteditable="true">${value}</span>
                        <div class="dropdown">
                            <button class="dropdown-icon"><i class="fas fa-ellipsis-h"></i></button>
                            <div class="dropdown-content">
                                <a href="#" onclick="editField(this)"><i class="fas fa-edit"></i> Edit</a>
                                <a href="#" onclick="deleteField(this, '${querySnapshot.docs[0].id}', '${fieldToUpdate}', '${uniqueKey}')"><i class="fas fa-trash"></i> Delete</a>
                            </div>
                        </div>`;
                    list.appendChild(listItem);
                    input.value = '';  // Clear the input field
                } else {
                    console.error('Invalid listId for adding item:', listId);
                }
            } else {
                console.error('No vision document found for the selected brand.');
            }
        } catch (error) {
            console.error('Error adding item to Firestore:', error);
        }
    }
}


async function editField(element, docId, field, key) {
    const span = element.closest('li').querySelector('span[contenteditable]');
    span.contentEditable = true;
    span.focus();
    
    span.onblur = async function() {
        span.contentEditable = false;
        const newValue = span.textContent.trim();

        // Handle update logic based on field type
        const visionDocRef = doc(db, "visions", docId);

        try {
            console.log('Field:', field, 'Key:', key, 'Value:', newValue); 
            if (field === 'market') {
                // Update market data
                await updateDoc(visionDocRef, {
                    [`market.${key}`]: newValue
                });
                console.log('Market data updated:', key, newValue);
            } else if (field === 'coreValues' || field === 'purpose' || field === 'niche') {
                // Update lists
                const fieldToUpdate = field; // 'coreValues', 'purpose', or 'niche'
                await updateDoc(visionDocRef, {
                    [`${fieldToUpdate}.${key}`]: newValue
                });
                console.log(`List ${fieldToUpdate} updated:`, key, newValue);
            }
        } catch (error) {
            console.error('Error updating field:', error);
        }
    };
}

async function deleteField1(element, docId, field, key) {
    const listItem = element.closest('li');
    listItem.remove();
    console.log(field);
    if (field === 'market') {
        // Delete market data
        const visionDocRef = doc(db, "visions", docId);
        await updateDoc(visionDocRef, {
            [`market.${key}`]: deleteField()
        });
    } else if (field === 'coreValues' || field === 'purpose' || field === 'niche') {
        // Delete from lists
        const visionDocRef = doc(db, "visions", docId);
        const fieldToUpdate = field === 'coreValues' ? 'coreValues' : field === 'purpose' ? 'purpose' : 'niche';
        await updateDoc(visionDocRef, {
            [`${fieldToUpdate}.${key}`]: deleteField()
        });
    } else {
        // Delete from text sections
        const visionDocRef = doc(db, "visions", docId);
        await updateDoc(visionDocRef, {
            [field]: deleteField()
        });
    }
}

window.deleteField = deleteField1;
window.editField = editField;
window.addItem = addItem;
window.handleAddItem = handleAddItem;
