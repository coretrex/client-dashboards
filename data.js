import { deleteField, updateDoc, db, doc, collection, query, where, getDocs, addDoc } from"./script.js";
import { globalSelectedValue as selectedId } from"./script.js";

document.addEventListener('DOMContentLoaded', function() {
    initializeDataPage();
});

exportasyncfunctioninitializeDataPage() {
    document.getElementById("loader1").style.display = "flex";

    const embedButton = document.getElementById("embed-btn");
    const sheetUrlInput = document.getElementById("sheet-url");
    const iframeContainer = document.getElementById("iframe-container");
    const zoomSlider = document.getElementById("zoom-slider");

    let iframe;

    const brandRef = doc(db, "brands", selectedId); // Reference to the selected brand documentconst quarterlyGoalsRef = collection(db, "googleSheetLink"); // Reference to the googleSheetLink collection// Query to find the document with the matching brandIdconst q = query(quarterlyGoalsRef, where("brandId", "==", selectedId));
    const querySnapshot = awaitgetDocs(q);

    // Check if a document with the matching brandId exists and display the linkif (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const url = docData.link;

        if (url) {
            // Create iframe element with the retrieved URL
            iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.width = "125%"; // Adjust to account for the scale
            iframe.height = "750px"; // Adjust height to account for the scale
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

    embedButton.addEventListener("click", asyncfunction () {
        document.getElementById("loader1").style.display = "flex";
        const url = sheetUrlInput.value.trim();

        if (url) {
            // Query to find the document with the matching brandIdconst q = query(quarterlyGoalsRef, where("brandId", "==", selectedId));
            const querySnapshot = awaitgetDocs(q);

            if (!querySnapshot.empty) {
                // Update the existing document with the new linkconst docRef = querySnapshot.docs[0].ref;
                awaitupdateDoc(docRef, { link: url });
            } else {
                // Create a new document with the brandId and linkawaitaddDoc(quarterlyGoalsRef, {
                    brandId: selectedId,
                    link: url
                });
            }
            iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.width = "125%";
            iframe.height = "750px"; // Adjust height as needed
            iframe.style.border = "none";
            iframe.style.transform = `scale(${zoomSlider.value / 100})`;
            iframe.style.transformOrigin = "0 0";

            iframeContainer.innerHTML = "";
            iframeContainer.appendChild(iframe);
        } else {
            alert("Please enter a valid Google Sheet URL.");
        }
        document.getElementById("loader1").style.display = "none";
    });

    // Event listener for the zoom slider
    zoomSlider.addEventListener("input", function () {
        if (iframe) {
            const scale = zoomSlider.value / 100;
            iframe.style.transform = `scale(${scale})`;
        }
    });
}

window.initializeDataPage = initializeDataPage;
