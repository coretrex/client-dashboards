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
    const zoomSlider = document.getElementById("zoom-slider");

    let iframe;

    const brandRef = doc(db, "brands", selectedId);
    const quarterlyGoalsRef = collection(db, "googleSheetLink");
    const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const url = docData.link;

        if (url) {
            iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.width = "95%";
            iframe.height = "850px";
            iframe.style.border = "none";
            iframe.style.transformOrigin = "0 0";

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
            const brandRef = doc(db, "brands", selectedId);
            const quarterlyGoalsRef = collection(db, "googleSheetLink");
            const q = query(quarterlyGoalsRef, where("brandId", "==", brandRef));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, { link: url });
            } else {
                await addDoc(quarterlyGoalsRef, {
                    brandId: brandRef,
                    link: url
                });
            }
            iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.width = "125%";
            iframe.height = "750px";
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

    zoomSlider.addEventListener("input", function () {
        if (iframe) {
            const scale = zoomSlider.value / 100;
            iframe.style.transform = `scale(${scale})`;
        }
    });
}

window.initializeDataPage = initializeDataPage;
