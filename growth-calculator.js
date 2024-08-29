import { doc, setDoc, getDoc, db } from "./script.js";
import { globalSelectedValue as selectedId, initializePage} from "./script.js";

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    console.log("Selected ID before fetching:", selectedId);
    fetchGrowthData();  // Fetch data on page load
    document.getElementById('saveButton').addEventListener('click', saveInputs);
});

// Export the saveInputs function
export async function saveInputs() {
    if (!selectedId) {
        console.error("No brand selected. Please select a brand first.");
        showSaveMessage("Please select a brand before saving inputs.", "error");
        return;
    }

    const revenueGoal = parseCurrency(document.getElementById("revenueGoal").value);
    const aov = parseFloat(document.getElementById("aov").value.replace(/[^\d.-]/g, "")) || 50;
    const conversionRate = parseFloat(document.getElementById("conversionRate").value) || 1;
    const organicRate = parseFloat(document.getElementById("organicRate").value) || 70;
    const adsConversionRate = parseFloat(document.getElementById("adsConversionRate").value) || 2;
    const cpc = parseCurrency(document.getElementById("cpc").value);

    try {
        const brandId = selectedId;  // Use the globally imported selectedId
        const calcRef = doc(db, "growthCalculators", brandId);
        console.log("Saving data to path:", calcRef.path);

        await setDoc(calcRef, {
            revenueGoal,
            aov,
            conversionRate,
            organicRate,
            adsConversionRate,
            cpc,
            timestamp: new Date()  // Optional: to keep track of when the data was saved
        });

        showSaveMessage("Inputs have been saved successfully!", "success");
    } catch (error) {
        console.error("Error saving inputs to Firestore:", error);
        showSaveMessage("There was an error saving your inputs. Please try again.", "error");
    }
}

export async function fetchGrowthData() {
    console.log("Fetching growth calculator data for:", selectedId);
    try {
        const calcRef = doc(db, "growthCalculators", selectedId);
        const calcSnapshot = await getDoc(calcRef);

        if (calcSnapshot.exists()) {
            const data = calcSnapshot.data();
            console.log("Fetched Growth Calculator data:", data);

            // Populate HTML elements with the fetched data
            document.getElementById("revenueGoal").value = formatCurrency(data.revenueGoal ?? 1000000, 2);
            document.getElementById("aov").value = formatCurrency(data.aov, 2);
            document.getElementById("conversionRate").value = data.conversionRate ?? 1;
            document.getElementById("organicRate").value = data.organicRate ?? 70;
            document.getElementById("adsConversionRate").value = data.adsConversionRate ?? 2;
            document.getElementById("cpc").value = formatCurrency(data.cpc ?? 1.0, 2);

            // Trigger oninput event for sliders to update their associated display elements
            document.getElementById("conversionRate").dispatchEvent(new Event('input'));
            document.getElementById("organicRate").dispatchEvent(new Event('input'));
            document.getElementById("adsConversionRate").dispatchEvent(new Event('input'));

        } else {
            console.log("No data found for the selected growth calculator.");
            setDefaultValues();
        }
    } catch (error) {
        console.error("Error fetching growth calculator data:", error);
        setDefaultValues();
    }
}



function formatCurrency(value, decimals) {
    return '$' + parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function parseCurrency(value) {
    return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
}

function setDefaultValues() {
    document.getElementById("revenueGoal").value = '$1,000,000';
    document.getElementById("aov").value = '$50.00';
    document.getElementById("conversionRate").value = 1;
    document.getElementById("organicRate").value = 70;
    document.getElementById("adsConversionRate").value = 2;
    document.getElementById("cpc").value = formatCurrency(1.0, 2);

    updateRangeValue("conversionRate");
    updateRangeValue("organicRate");
    updateRangeValue("adsConversionRate");
}

function updateRangeValue(id) {
    const input = document.getElementById(id);
    const display = document.getElementById(`${id}Value`);
    if (input && display) {
        display.textContent = input.value;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await initializePage();  // Ensure this is fully complete
    console.log("Initialization complete. Selected ID:", selectedId);
    
    try {
        await fetchGrowthData();  // Ensure data is fetched before attaching event listeners
        console.log("Data fetched successfully.");
        
        // Now attach event listeners
        document.getElementById('saveButton').addEventListener('click', saveInputs);
        console.log("Save button event listener attached.");
    } catch (error) {
        console.error("Error during initialization or data fetch:", error);
    }
});


window.saveInputs = saveInputs;


function showSaveMessage(message, type) {
    const saveMessage = document.getElementById('saveMessage');
    if (!saveMessage) {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'saveMessage';
        messageDiv.className = 'save-message';
        document.querySelector('.container').appendChild(messageDiv);
    }
    
    const saveMessageElement = document.getElementById('saveMessage');
    saveMessageElement.textContent = message;
    saveMessageElement.className = `save-message ${type}`;
    saveMessageElement.style.display = 'block';
    saveMessageElement.style.opacity = '1';
    
    setTimeout(() => {
        saveMessageElement.style.opacity = '0';
        setTimeout(() => {
            saveMessageElement.style.display = 'none';
        }, 500); // Wait for fade out animation to complete
    }, 500);
}

