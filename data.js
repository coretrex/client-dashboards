import { deleteField, updateDoc, db, doc, collection, query, where, getDocs, addDoc } from "./script.js";
import { globalSelectedValue as selectedId } from "./script.js";

document.addEventListener('DOMContentLoaded', function() {
    initializeDataPage();
});

export async function initializeDataPage() {
    document.getElementById("loader1").style.display = "flex";

    const embedButton = document.getElementById("embed-btn");
    const sheetUrlInput = document.getElementById("sheet-url");
    const iframeContainer = document.getElementById("iframe-container");
    const brandRef = doc(db, "brands", selectedId); // Reference to the selected brand document
    const quarterlyGoalsRef = collection(db, "googleSheetLink"); // Reference to the googleSheetLink collection

    // Query to find the document with the matching brandId
    const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);

    // Check if a document with the matching brandId exists and display the link
    if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const url = docData.link;
        
        if (url) {
            // Create iframe element with the retrieved URL
            const iframe = document.createElement("iframe");
    // Create iframe element with the retrieved URLconst iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.width = "125%"; // Adjust to account for the scale
    iframe.height = "950px"; // Adjust height to account for the scale
    iframe.style.border = "none";
    iframe.style.transform = "scale(0.8)";
    iframe.style.transformOrigin = "0 0";
    
            // Insert the iframe into the container
            iframeContainer.innerHTML = "";
            iframeContainer.appendChild(iframe);
        } else {
            iframeContainer.innerHTML = "<p>No link available</p>";
        }
    } else {
        iframeContainer.innerHTML = "<p>No link available</p>";
    }
    document.getElementById("loader1").style.display = "none";


    embedButton.addEventListener("click", async function () {
        document.getElementById("loader1").style.display = "flex";
        const url = sheetUrlInput.value.trim();
    
        if (url) {
            const brandRef = doc(db, "brands", selectedId); // Reference to the selected brand document
            const quarterlyGoalsRef = collection(db, "googleSheetLink"); // Reference to the googleSheetLink collection
    
            // Query to find the document with the matching brandId
            const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                // Update the existing document with the new link
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, { link: url });
            } else {
                // Create a new document with the brandId and link
                await addDoc(quarterlyGoalsRef, {
                    brandId: brandRef,
                    link: url
                });
            }
            const iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.width = "95%";
            iframe.height = "800px"; // Adjust height as needed
            iframe.style.border = "none";
            iframeContainer.innerHTML = "";
            iframeContainer.appendChild(iframe);
        } else {
            alert("Please enter a valid Google Sheet URL.");
        }
        document.getElementById("loader1").style.display = "none";

    });
}

window.initializeDataPage = initializeDataPage;
