document.addEventListener('DOMContentLoaded', function() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCHQcAa3Z-ADIDeTI88LXgP4gmVPFuM9Hc",
        authDomain: "coretrex-dashboard.firebaseapp.com",
        projectId: "coretrex-dashboard",
        storageBucket: "coretrex-dashboard.appspot.com",
        messagingSenderId: "964784655965",
        appId: "1:964784655965:web:c25a95fd4e4af26be407b4",
        measurementId: "G-NLRD798V18"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Check if the user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            if (window.location.pathname === '/login.html') {
                window.location.href = '/';
            } else {
                loadUserData(user);
            }
        } else {
            if (window.location.pathname !== '/login.html') {
                window.location.href = '/login.html';
            }
        }
    });

    // If on the login page, handle login functionality
    if (window.location.pathname === '/login.html') {
        document.getElementById('login-btn').addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    window.location.href = '/';
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    alert('Login failed: ' + error.message);
                });
        });
    }
});

function initializePage() {
    initializeFileUploads();
    initializeFlatpickr();
    initializeDropdownMenus();
    initializeCountdownTimer();
    initializeGrowthCalculator();
    clearSampleTextOnFocus();

    document.getElementById('login-btn').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Logged in:', user);
                loadUserData(user);
            })
            .catch((error) => {
                console.error('Login error:', error);
                alert('Login failed: ' + error.message);
            });
    });
}

function loadUserData(user) {
    const userDoc = firebase.firestore().collection('users').doc(user.uid);
    userDoc.get().then((docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.role === 'Client') {
                loadClientData(user.uid);
            } else if (userData.role === 'BGM') {
                loadBGMData(user.uid);
            } else if (userData.role === 'Admin') {
                loadAdminData();
            }
        } else {
            console.log('No such user!');
        }
    }).catch((error) => {
        console.log('Error getting user data:', error);
    });
}

function loadClientData(clientId) {
    const clientDoc = firebase.firestore().collection('clients').doc(clientId);
    clientDoc.get().then((docSnap) => {
        if (docSnap.exists()) {
            const clientData = docSnap.data();
            document.getElementById('main-content').innerHTML = renderClientData(clientData);
        } else {
            console.log('No such client!');
        }
    }).catch((error) => {
        console.log('Error getting client data:', error);
    });
}

function loadBGMData(bgmId) {
    const clientsQuery = firebase.firestore().collection('clients').where('bgmId', '==', bgmId);
    clientsQuery.get().then((querySnapshot) => {
        let bgmContent = '';
        querySnapshot.forEach((docSnap) => {
            const clientData = docSnap.data();
            bgmContent += renderClientData(clientData);
        });
        document.getElementById('main-content').innerHTML = bgmContent;
    }).catch((error) => {
        console.log('Error getting BGM data:', error);
    });
}

function loadAdminData() {
    const clientsQuery = firebase.firestore().collection('clients');
    clientsQuery.get().then((querySnapshot) => {
        let adminContent = '';
        querySnapshot.forEach((docSnap) => {
            const clientData = docSnap.data();
            adminContent += renderClientData(clientData);
        });
        document.getElementById('main-content').innerHTML = adminContent;
    }).catch((error) => {
        console.log('Error getting admin data:', error);
    });
}

function saveClientData(clientId, data) {
    const clientDoc = firebase.firestore().collection('clients').doc(clientId);
    clientDoc.set(data).then(() => {
        console.log('Client data saved successfully!');
    }).catch((error) => {
        console.error('Error saving client data:', error);
    });
}

function saveBGMData(bgmId, data) {
    const bgmDoc = firebase.firestore().collection('bgms').doc(bgmId);
    bgmDoc.set(data).then(() => {
        console.log('BGM data saved successfully!');
    }).catch((error) => {
        console.error('Error saving BGM data:', error);
    });
}

function saveAdminData(adminId, data) {
    const adminDoc = firebase.firestore().collection('admins').doc(adminId);
    adminDoc.set(data).then(() => {
        console.log('Admin data saved successfully!');
    }).catch((error) => {
        console.error('Error saving admin data:', error);
    });
}

function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('#file-input, #file-input-annual, #file-input-consumer');
    const imageDisplays = document.querySelectorAll('#image-display, #image-display-annual, #image-display-consumer');
    const uploadedImages = document.querySelectorAll('#uploaded-image, #uploaded-image-annual, #uploaded-image-consumer');
    const lightboxes = document.querySelectorAll('#lightbox, #lightbox-annual, #lightbox-consumer');
    const lightboxImgs = document.querySelectorAll('#lightbox-img, #lightbox-img-annual, #lightbox-img-consumer');
    const deleteButtons = document.querySelectorAll('.delete-button');
    const fileLabels = document.querySelectorAll('.file-label');

    fileInputs.forEach((fileInput, index) => {
        const imageDisplay = imageDisplays[index];
        const uploadedImage = uploadedImages[index];
        const lightbox = lightboxes[index];
        const lightboxImg = lightboxImgs[index];
        const deleteButton = deleteButtons[index];
        const fileLabel = fileLabels[index];

        if (fileInput && imageDisplay && uploadedImage && lightbox && lightboxImg && deleteButton && fileLabel) {
            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        uploadedImage.src = e.target.result;
                        imageDisplay.style.display = 'flex';
                        fileLabel.style.display = 'none';
                        deleteButton.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                }
            });

            uploadedImage.addEventListener('click', function() {
                lightboxImg.src = uploadedImage.src;
                lightbox.style.display = 'flex';
            });

            lightbox.addEventListener('click', function(e) {
                if (e.target !== lightboxImg) {
                    lightbox.style.display = 'none';
                }
            });

            deleteButton.addEventListener('click', function() {
                uploadedImage.src = '#';
                imageDisplay.style.display = 'none';
                fileLabel.style.display = 'flex';
                deleteButton.style.display = 'none';
                fileInput.value = ''; // Reset the file input
            });
        }
    });
}

function clearSampleTextOnFocus() {
    document.querySelectorAll('.editable-list span[contenteditable="true"]').forEach(span => {
        const defaultText = span.textContent;
        span.addEventListener('focus', function() {
            if (span.textContent === defaultText) {
                span.textContent = '';
            }
        });
        span.addEventListener('blur', function() {
            if (span.textContent.trim() === '') {
                span.textContent = defaultText;
            }
        });
    });
}

function initializeDropdownMenus() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', function(event) {
            event.stopPropagation();
            dropdown.querySelector('.dropdown-content').classList.toggle('show');
        });
    });

    window.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-content').forEach(content => {
            content.classList.remove('show');
        });
    });
}

function editField(element) {
    const span = element.closest('li').querySelector('span[contenteditable]');
    span.contentEditable = true;
    span.focus();
    span.onblur = function() {
        span.contentEditable = false;
    };
}

function deleteField(element) {
    const listItem = element.closest('li');
    listItem.remove();
}

function initializeGrowthCalculator() {
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value;
            if (this.id === 'rangeInput') {
                updateRangeValue(value);
            } else if (this.id === 'organicInput') {
                updateOrganicValue(value);
            } else if (this.id === 'adsConversionInput') {
                updateAdsConversionValue(value);
            }
        });
    });

    document.getElementById('calculatePageViewsBtn').addEventListener('click', calculatePageViews);
}

function updateRangeValue(value) {
    document.getElementById('rangeValue').innerText = parseFloat(value).toFixed(2) + '%';
}

function updateOrganicValue(value) {
    document.getElementById('organicValue').innerText = value + '%';
}

function updateAdsConversionValue(value) {
    document.getElementById('adsConversionValue').innerText = parseFloat(value).toFixed(2) + '%';
}

function toggleMetrics() {
    const metrics = document.getElementById('marketingMetrics');
    const subtext = document.getElementById('metricsSubtext');
    const icon = document.querySelector('.toggle-icon');
    if (metrics.style.display === 'none' || metrics.style.display === '') {
        metrics.style.display = 'flex';
        subtext.style.display = 'block';
        icon.textContent = '-';
    } else {
        metrics.style.display = 'none';
        subtext.style.display = 'none';
        icon.textContent = '+';
    }
}

function calculatePageViews() {
    let revenueGoal = parseFloat(document.getElementById('revenueGoal').value.replace(/[^\d.-]/g, ''));
    let aov = parseFloat(document.getElementById('aov').value.replace(/[^\d.-]/g, ''));
    const conversionRate = parseFloat(document.getElementById('conversionRate').value) / 100;
    const organicRate = parseFloat(document.getElementById('organicRate').value) / 100;
    const adsConversionRate = parseFloat(document.getElementById('adsConversionRate').value) / 100;
    let cpc = parseFloat(document.getElementById('cpc').value);

    if (isNaN(revenueGoal)) {
        revenueGoal = 1000000; 
    }
    if (isNaN(aov)) {
        aov = 50; 
    }
    if (isNaN(cpc)) {
        cpc = 1.00; 
    }

    const requiredPageViewsAnnually = revenueGoal / (aov * conversionRate);
    const requiredPageViewsDaily = requiredPageViewsAnnually / 365;
    const requiredPageViewsWeekly = requiredPageViewsAnnually / 52;
    const requiredPageViewsMonthly = requiredPageViewsAnnually / 12;

    const nonOrganicRate = 1 - organicRate;
    const requiredNonOrganicPageViewsAnnually = revenueGoal / (aov * adsConversionRate) * nonOrganicRate;
    const requiredNonOrganicPageViewsDaily = requiredNonOrganicPageViewsAnnually / 365;
    const requiredNonOrganicPageViewsWeekly = requiredNonOrganicPageViewsAnnually / 52;
    const requiredNonOrganicPageViewsMonthly = requiredNonOrganicPageViewsAnnually / 12;

    const adSpendAnnually = requiredNonOrganicPageViewsAnnually * cpc;
    const adSpendDaily = adSpendAnnually / 365;
    const adSpendWeekly = adSpendAnnually / 52;
    const adSpendMonthly = adSpendAnnually / 12;

    const resultsElement = document.getElementById('results');
    resultsElement.style.display = 'block';
    resultsElement.innerHTML = `
        <p>To achieve an annual revenue goal of <strong>$${revenueGoal.toLocaleString()}</strong>, with an average order value of <strong>$${aov.toLocaleString()}</strong> and a conversion rate of <strong>${parseFloat(conversionRate * 100).toFixed(2)}%</strong>, you need approximately:</p>
        <ul>
            <li><strong>${Math.round(requiredPageViewsDaily).toLocaleString()}</strong> page views daily</li>
            <li><strong>${Math.round(requiredPageViewsWeekly).toLocaleString()}</strong> page views weekly</li>
            <li><strong>${Math.round(requiredPageViewsMonthly).toLocaleString()}</strong> page views monthly</li>
            <li><strong>${Math.round(requiredPageViewsAnnually).toLocaleString()}</strong> page views annually</li>
        </ul>
        <p>Based on <strong>${(organicRate * 100).toFixed(2)}%</strong> organic page views, an estimated CPC of <strong>$${cpc.toFixed(2)}</strong>, and an ads conversion rate of <strong>${(adsConversionRate * 100).toFixed(2)}%</strong>, to hit your revenue goal of <strong>$${revenueGoal.toLocaleString()}</strong>, your ad spend will be approximately:</p>
        <ul>
            <li><strong>$${adSpendDaily.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> daily to generate <strong>${Math.round(requiredNonOrganicPageViewsDaily).toLocaleString()}</strong> paid page visits</li>
            <li><strong>$${adSpendWeekly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> weekly to generate <strong>${Math.round(requiredNonOrganicPageViewsWeekly).toLocaleString()}</strong> paid page visits</li>
            <li><strong>$${adSpendMonthly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> monthly to generate <strong>${Math.round(requiredNonOrganicPageViewsMonthly).toLocaleString()}</strong> paid page visits</li>
            <li><strong>$${adSpendAnnually.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> annually to generate <strong>${Math.round(requiredNonOrganicPageViewsAnnually).toLocaleString()}</strong> paid page visits</li>
        </ul>`;
}

function formatCurrency(input) {
    let value = input.value.replace(/[^\d.-]/g, '');

    if (!isNaN(value) && value !== '') {
        input.value = '$' + parseFloat(value).toLocaleString();
    } else {
        input.value = '';
    }
}

// Ensure loadContent is globally accessible
window.loadContent = function(event, url) {
    event.preventDefault();
    console.log(`Loading content from ${url}...`);
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = html;
            console.log(`Content from ${url} loaded.`);

            // Manually trigger script execution
            const scripts = mainContent.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                if (scripts[i].src) {
                    script.src = scripts[i].src;
                } else {
                    script.text = scripts[i].text;
                }
                document.head.appendChild(script).parentNode.removeChild(script);
            }

            // Delay initialization to ensure content is loaded
            setTimeout(() => {
                if (url.includes('quarterly-goals.html')) {
                    initializeGoalInput();
                    initializeQuarterlyCountdownTimer();
                } else {
                    initializePage();
                }
            }, 100);
        })
        .catch(error => {
            console.error('Error loading content:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('focusin', function(event) {
        if (event.target.classList.contains('editable-field')) {
            if (event.target.textContent === event.target.getAttribute('data-default')) {
                event.target.textContent = '';
            }
        }
    });

    document.body.addEventListener('focusout', function(event) {
        if (event.target.classList.contains('editable-field')) {
            if (event.target.textContent.trim() === '') {
                event.target.textContent = event.target.getAttribute('data-default');
            }
        }
    });
});

function showPageContent() {
    document.querySelectorAll('body > div').forEach(div => {
        div.style.display = 'block';
    });
}

function clearSampleText(event) {
    const span = event.target;
    if (span.textContent === 'Enter Age' || span.textContent === 'Enter Sex' || span.textContent === 'Enter Household Income' || span.textContent === 'Enter Location' || span.textContent === 'Enter Education') {
        span.textContent = '';
    }
    span.removeEventListener('focus', clearSampleText);
}

function renderClientData(clientData) {
    return `
        <div>
            <h2>${clientData.name}</h2>
            <p>${clientData.description}</p>
            <!-- Add more fields as needed -->
        </div>
    `;
}
