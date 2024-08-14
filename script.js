import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteField,
  setDoc,
  getDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { fetchChecklistData } from "./checklist.js";
import { initializeGoalInput, initializeQuarterlyCountdownTimer, fetchQuarterlyGoalsData } from './quarterly-goals.js'
import { fetchPlanData } from "./goals.js";
import { initializeMeetingPage as fetchMeetingData } from './meeting.js';
import { fetchVisionData } from "./vision.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
var globalSelectedValue;
var globalOptionselected;
export { globalSelectedValue };
const firebaseConfig = {
  apiKey: "AIzaSyCHQcAa3Z-ADIDeTI88LXgP4gmVPFuM9Hc",
  authDomain: "coretrex-dashboard.firebaseapp.com",
  projectId: "coretrex-dashboard",
  storageBucket: "coretrex-dashboard.appspot.com",
  messagingSenderId: "964784655965",
  appId: "1:964784655965:web:c25a95fd4e4af26be407b4",
  measurementId: "G-NLRD798V18"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { deleteField, db, doc, setDoc, getDocs, collection, query, where, addDoc, updateDoc };

document.addEventListener("DOMContentLoaded", function () {

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (window.location.pathname === "/login.html") {
        window.location.href = "/";
      } else {
        // if (user.metadata.createdAt === user.metadata.lastLoginAt) {
        //   console.log("imposter detected")
        // }
        const realuser = {
          uid: user.uid,
        }
        loadUserData(realuser);
      }
    } else {
      if (window.location.pathname !== "/login.html" && window.location.pathname !== "/signup.html") {
        window.location.href = "/login.html";
      }
    }
  });
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent the default link behavior
      logout();
    });
  }
  if (window.location.pathname === "/login.html") {
    document.getElementById("login-btn").addEventListener("click", () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          loadUserData(user);
        })
        .catch((error) => {
          console.error("Login error:", error);
          alert("Login failed: " + error.message);
        });
    });
  }
  if (window.location.pathname === "/signup.html") {
    document.getElementById('signup-btn').addEventListener('click', async () => {
      console.log("Sign up button clicked");
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const role = document.querySelector('input[name="role"]:checked')?.value;

      if (!role) {
        alert("Please select a role.");
        return;
      }

      try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: email,
          role: role,
        });

        alert("Account created successfully!");
        window.location.href = "/";
        // const userid = user.uid;
        // const realuser = { userid, name, email, role }
        // window.location.href = "/"; // Redirect to home or another page
      } catch (error) {
        console.error("Error creating account:", error);
        alert("Error creating account: " + error.message);
      }
    });
  }

  document.getElementById("add-team-button").addEventListener("click", async () => {
    try {
      document.getElementById("loader1").style.display = "flex";
      const selectedTeamMemberId = document.getElementById("team-info").value;
      const selectedBrandId = document.getElementById("brand-info").value;
      const brandReference = doc(db, "brands", selectedBrandId);
      const userDocRef = doc(db, "users", selectedTeamMemberId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        let brandIdArray = userDoc.data().brandId || [];
        if (!brandIdArray.some(ref => ref.id === brandReference.id)) {
          brandIdArray.push(brandReference);
        }
        await updateDoc(userDocRef, {
          brandId: brandIdArray
        });
        await loadAdminData();
        document.getElementById('alert-box1').classList.remove('failed'); // Remove the success class
        document.getElementById('alert-box1').classList.add('success'); // Add the failed class
        document.getElementById('alert-box1').innerHTML = 'Data saved successfully!';
        document.getElementById("loader1").style.display = "none";
        document.getElementById('alert-box1').style.display = 'flex';
        setTimeout(() => {
          document.getElementById('alert-box1').style.display = 'none';
        }, 3000);
        console.log("User document updated with new brand reference:", brandReference);
      } else {
        console.log("User document does not exist.");
      }
    } catch (error) {
      console.error("Error updating user document:", error);
    }
    document.getElementById("loader1").style.display = "none";
  });
  document.getElementById("add-client-button").addEventListener("click", async () => {
    try {
      document.getElementById("loader1").style.display = "flex";
      const selectedTeamMemberId = document.getElementById("client-info").value;
      const selectedBrandId = document.getElementById("brand-info-1").value;
      const brandReference = doc(db, "brands", selectedBrandId);
      const userDocRef = doc(db, "users", selectedTeamMemberId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        let brandIdArray = userDoc.data().brandId || [];
        if (!brandIdArray.some(ref => ref.id === brandReference.id)) {
          brandIdArray.push(brandReference);
        }
        await updateDoc(userDocRef, {
          brandId: brandIdArray
        });
        await loadAdminData();
        document.getElementById('alert-box1').classList.remove('failed'); // Remove the success class
        document.getElementById('alert-box1').classList.add('success'); // Add the failed class
        document.getElementById('alert-box1').innerHTML = 'Data saved successfully!';
        document.getElementById("loader1").style.display = "none";
        document.getElementById('alert-box1').style.display = 'flex';
        setTimeout(() => {
          document.getElementById('alert-box1').style.display = 'none';
        }, 3000);
        console.log("User document updated with new brand reference:", brandReference);
      } else {
        console.log("User document does not exist.");
      }
    } catch (error) {
      console.error("Error updating user document:", error);
    }
    document.getElementById("loader1").style.display = "none";
  });
});

function logout() {
  // Make sure auth is properly initialized before calling signOut
  auth.signOut().then(() => {
    localStorage.clear();
    window.location.href = "/login.html";
  }).catch((error) => {
    console.error('Logout Error:', error);
  });
}
async function loadUserData(user) {
  document.getElementById('loader1').style.display = 'flex';
  console.log("User UID:", user.uid); // Log UID for debugging
  const userDocRef = doc(db, "users", user.uid); // Reference to the user document
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log("User Data:", userData);
      if (userData.role === "Admin") {
        document.getElementById("clients-content").style.display = "block";
        document.getElementById("team-content").style.display = "block";
        document.getElementById("brands-container").style.display = "block";
      }
      localStorage.setItem("userData", JSON.stringify(userData));
      if (userData.role === "Client") {
        loadTeamData(userData);
      } else if (userData.role === "Team") {
        loadTeamData(userData);
      } else if (userData.role === "Admin") {
        loadAdminData();
      }
    } else {
      console.log("No such user!");
    }
  } catch (error) {
    console.log("Error getting user data:", error);
  }
  document.getElementById('loader1').style.display = 'none';
}

function loadClientData(clientId) {
  const clientDocRef = doc(db, "clients", clientId);
  getDoc(clientDocRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const clientData = docSnap.data();
        document.getElementById("main-content").innerHTML =
          renderClientData(clientData);
      } else {
        console.log("No such client!");
      }
    })
    .catch((error) => {
      console.log("Error getting client data:", error);
    });
}

async function loadTeamData(user) {
  const brandIds = user.brandId;
  const brandIdArray = [];
  if (!brandIds) return;
  brandIds.forEach((brand) => {
    const brandId =
      brand._key.path.segments[brand._key.path.segments.length - 1];
    brandIdArray.push(brandId);
  });
  try {
    const brandNames = [];
    const brandsCollection = collection(db, "brands");
    for (const id of brandIdArray) {
      const brandDoc = await getDoc(doc(brandsCollection, id));
      console.log(brandDoc.data().logoURL);
      if (brandDoc.exists()) {
        brandNames.push({
          id: id,
          name: brandDoc.data().name,
          logoUrl: brandDoc.data().logoURL,
        });
      } else {
        console.error("No such brand with ID:", id);
      }
    }
    localStorage.setItem("brandsData", JSON.stringify(brandNames));
    console.log("Brand names saved to localStorage:", brandNames);
    kpisLoad();
  } catch (error) {
    console.error("Error fetching brand names:", error);
  }
}

function renderBrands() {
  const brandsList = document.getElementById("brands-list");
  if (!brandsList) {
    console.error("Brands list element not found.");
    return;
  }

  const brandsArray = JSON.parse(localStorage.getItem("brandsData")) || [];
  // Render existing brands
  let brandsHTML = '';
  brandsArray.forEach((brand) => {
    brandsHTML += `
      <div class="brand-item">
        <img src="${brand.brandlogoURL}" alt="${brand.name} Logo" width="50">
        <div>${brand.name}</div>
      </div>`;
  });
  brandsList.innerHTML = brandsHTML;

  // Handle form submission
  document
    .getElementById("add-brand-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const brandName = document.getElementById("brand-name").value;
      const brandLogo = document.getElementById("brand-logo").files[0];

      if (brandName && brandLogo) {
        const uniqueFileName = `${Date.now()}_${brandLogo.name}`;
        await addNewBrand(brandName, brandLogo, uniqueFileName);
        // Re-fetch and render brands after adding a new one
        await loadAdminData();
      } else {
        console.error("Brand name or logo is missing.");
      }
    });
}

async function addNewBrand(brandName, brandLogo, uniqueFileName) {
  try {
    document.getElementById("loader1").style.display = "flex";
    // Upload the brand logo to Firebase Storage in the 'brand-logos' folder
    const storageRef = ref(storage, `brand-logos/${uniqueFileName}`);
    await uploadBytes(storageRef, brandLogo);
    const logoURL = await getDownloadURL(storageRef);

    // Store the brand details in Firestore
    const brandDocRef = doc(collection(db, "brands")); // Create a new document with an auto-generated ID
    const newbrand = await setDoc(brandDocRef, {
      name: brandName,
      logoURL: logoURL,
    });

    console.log("New brand added successfully.");
    const kpiTrackingDocRef = doc(collection(db, "kpiTracking"));
    await setDoc(kpiTrackingDocRef, {
      brandId: brandDocRef,
      table: {
        goal: [
          "Goal 1",
          "Goal 2",
          "Goal 3",
          "Goal 4",
          "Goal 5",
          "Goal 6",
          "Goal 7",
          "Goal 8",
        ],
        kpi: [
          "Revenue",
          "Buy Box%",
          "Optimization Score",
          "Page Views",
          "Conversation Rate",
          "Ad Revenue",
          "ACoS",
          "TACoS",
        ],
        "MM/DD/YY": ["", "", "", "", "", "", "", ""],
        "MM/DD/YY": ["", "", "", "", "", "", "", ""],
      },
    });

    const checklistDocRef = doc(collection(db, "checklists"));
    await setDoc(checklistDocRef, {
      brandId: brandDocRef
    });
    const meetingDocRef = doc(collection(db, "meeting"));
    await setDoc(meetingDocRef, {
      brandId: brandDocRef
    });
    const quarterly_goalsRef = doc(collection(db, "quarterly-goals"));
    await setDoc(quarterly_goalsRef, {
      brandId: brandDocRef
    });
    const plansRef = doc(collection(db, "plans"));
    await setDoc(plansRef, {
      brandId: brandDocRef,
      "year1": {
        "Future Date": "Enter Future Date",
        "Revenue": "Enter Revenue",
        "Profit": "Enter Profit",
        "CVR (%)": "Enter CVR (%)",
        "AOV": "Enter AOV",
        "TaCoS": "Enter TaCoS"
      },
      "year3": {
        "Future Date": "Enter Future Date",
        "Revenue": "Enter Revenue",
        "Profit": "Enter Profit",
        "CVR (%)": "Enter CVR (%)",
        "AOV": "Enter AOV",
        "TaCoS": "Enter TaCoS"
      },
      "year5": {
        "Future Date": "Enter Future Date",
        "Revenue": "Enter Revenue",
        "Profit": "Enter Profit",
        "CVR (%)": "Enter CVR (%)",
        "AOV": "Enter AOV",
        "TaCoS": "Enter TaCoS"
      },
    });
    const visionRef = doc(collection(db, "visions"));
    await setDoc(visionRef, {
      brandId: brandDocRef,
      "coreValues": {},
      "niche": {},
      "purpose": {},
      "market": {
        "Age": "Enter Age",
        "Sex": "Enter Sex",
        "Household_Income": "Enter Household Income",
        "Location": "Enter Location",
        "Education": "Enter Education",
        "Unique_Value_Proposition": "e.g., Wholesome, delicious snacks that fuel your active lifestyle.",
        "Guarantee": "e.g., Enjoy or it's free—your happiness, our priority.",
      }
    })

    const oldBrandsData = localStorage.getItem("brandsData");
    const oldBrandsArray = oldBrandsData ? JSON.parse(oldBrandsData) : [];

    // Create a new brand object with flat structure
    const newBrand = {
      name: brandName,
      brandId: brandDocRef.id, // Use document ID directly
      brandlogoURL: logoURL,
    };

    // Add the new brand object to the existing array
    oldBrandsArray.push(newBrand);

    // Store the updated array in localStorage
    localStorage.setItem("brandsData", JSON.stringify(oldBrandsArray));
    renderBrands();
    document.getElementById('alert-box1').classList.remove('failed'); // Remove the success class
    document.getElementById('alert-box1').classList.add('success'); // Add the failed class
    document.getElementById('alert-box1').innerHTML = 'Data saved successfully!';
    document.getElementById("loader1").style.display = "none";
    document.getElementById('alert-box1').style.display = 'flex';
    setTimeout(() => {
      document.getElementById('alert-box1').style.display = 'none';
    }, 3000);
  } catch (error) {
    console.error("Error adding new brand:", error);
  }
}

// Helper function to get user data along with their associated brand names
async function getUserWithBrandNames(docSnap) {
  const userData = docSnap.data();
  const brandIds = userData.brandId || [];

  // Fetch each brand name based on the brandId references
  const brandNames = await Promise.all(
    brandIds.map(async (brandRef) => {
      const brandDoc = await getDoc(brandRef);
      console.log(brandDoc.data());
      return brandDoc.exists() ? brandDoc.data().name : "Unknown Brand";
    })
  );

  // Return user data along with a comma-separated list of brand names
  return {
    ...userData,
    brands: brandNames.join(", "),
  };
}
async function loadAdminData() {
  try {
    const clientsQuery = query(
      collection(db, "users"),
      where("role", "==", "Client")
    );
    const teamQuery = query(
      collection(db, "users"),
      where("role", "==", "Team")
    );

    // Fetch both client and team data concurrently
    const [clientsSnapshot, teamSnapshot] = await Promise.all([
      getDocs(clientsQuery),
      getDocs(teamQuery),
    ]);

    // Map through each snapshot to get user data along with brand names
    const clientsData = await Promise.all(
      clientsSnapshot.docs.map((doc) => getUserWithBrandNames(doc))
    );
    const teamData = await Promise.all(
      teamSnapshot.docs.map((doc) => getUserWithBrandNames(doc))
    );

    // Render the data into the HTML
    renderClientTable(clientsData);
    renderTeamTable(teamData);

    // Store the data in localStorage
    localStorage.setItem("clientsData", JSON.stringify(clientsData));
    localStorage.setItem("teamData", JSON.stringify(teamData));

    // Fetch and store brand data
    const brandsCollection = collection(db, "brands");
    const brandSnapshot = await getDocs(brandsCollection);
    const brandsArray = [];

    brandSnapshot.forEach((doc) => {
      const brandData = doc.data();
      const brandName = brandData.name;
      const brandId = doc.id;
      const brandlogoURL = brandData.logoURL;

      // Push a flat object to the array
      brandsArray.push({
        name: brandName,
        brandId,
        brandlogoURL,
      });
    });

    // Store the array of flat objects in localStorage
    localStorage.setItem("brandsData", JSON.stringify(brandsArray));
    const teamDropdown = document.getElementById("team-info");
    teamDropdown.innerHTML = ""; // Clear any existing options

    teamSnapshot.forEach((doc) => {
      const teamMember = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = teamMember.name;
      teamDropdown.appendChild(option);
    });

    // Populate the client dropdown
    const clientDropdown = document.getElementById("client-info");
    clientDropdown.innerHTML = ""; // Clear any existing options

    clientsSnapshot.forEach((doc) => {
      const client = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = client.name;
      clientDropdown.appendChild(option);
    });

    // Populate the brands dropdown
    const brandsDropdown = document.getElementById("brand-info");
    brandsDropdown.innerHTML = ""; // Clear any existing options

    brandsArray.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand.brandId;
      option.textContent = brand.name;
      brandsDropdown.appendChild(option);
    });
    const brandsDropdown1 = document.getElementById("brand-info-1");
    brandsDropdown1.innerHTML = ""; // Clear any existing options

    brandsArray.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand.brandId;
      option.textContent = brand.name;
      brandsDropdown1.appendChild(option);
    });

    // Render brands dropdown
    renderBrands(brandsArray);
    document.getElementById('loader1').style.display = 'none';
  } catch (error) {
    console.error("Error getting admin data:", error);
  }
  document.getElementById("loader1").style.display = "none";
}

// Function to render the client table
function renderClientTable(clientsData) {
  const tbody = document.getElementById("clients-tbody");
  if (tbody) {
      tbody.innerHTML = clientsData.map((client) => `
          <tr data-id="${client.id}">
              <td>${client.name}</td>
              <td>${client.email}</td>
              <td>${client.brands}</td>
              <td><button class="delete-client-button">Delete</button></td>
          </tr>
      `).join("");
  }
}

// Function to render the team table
function renderTeamTable(teamData) {
  const tbody = document.getElementById("team-tbody");
  if (tbody) {
      tbody.innerHTML = teamData.map((team) => `
          <tr data-id="${team.id}">
              <td>${team.name}</td>
              <td>${team.email}</td>
              <td>${team.brands}</td>
              <td><button class="delete-team-button">Delete</button></td>
          </tr>
      `).join("");
  }
}

async function fetchKPIData(selectedBrandId) {
  try {
    globalSelectedValue = selectedBrandId;
    console.log("Fetching data for Brand ID:", selectedBrandId);
    const brandRef = doc(db, "brands", selectedBrandId);
    const kpiTrackingRef = collection(db, "kpiTracking");
    const q = query(kpiTrackingRef, where("brandId", "==", brandRef));
    const querySnapshot = await getDocs(q);
    const kpiData = [];
    querySnapshot.forEach((doc) => {
      kpiData.push(doc.data());
    });

    if (kpiData.length === 0) {
      console.log("No data found for the given Brand ID.");
    } else {
      console.log("KPI Data:", kpiData);
      updateTableWithKPIData(kpiData);
    }
  } catch (error) {
    console.error("Error fetching KPI data: ", error.message);
  }
}
function updateTableWithKPIData(kpiData) {
  const tableBody = document.querySelector("#kpi-table tbody");
  const tableHead = document.querySelector("#kpi-table thead tr");
  tableBody.innerHTML = ""; // Clear existing rows
  tableHead.innerHTML = ""; // Clear existing headers
  if (kpiData.length > 0) {
    const firstEntry = kpiData[0].table;
    const fields = Object.keys(firstEntry).filter(
      (field) => field !== "kpi" && field !== "goal"
    );
    // Convert date strings to Date objects and sort them
    const dateFields = fields
      .filter(field => !["kpi", "goal"].includes(field))
      .map(field => ({ field, date: new Date(field) }))
      .sort((a, b) => b.date - a.date)
      .map(item => item.field);
    const sortedFields = ["kpi", "goal", ...dateFields]; // Ensure KPI and Goal are first
    tableHead.innerHTML = ""; // Clear existing headers
    // Add headers for each dynamic field
    sortedFields.forEach((field) => {
      const header = document.createElement("th");
      header.classList.add("header-cell");
      header.textContent = field === "kpi" ? field.toUpperCase() : field === "goal" ? "Goal" : field === "MM/DD/YY" ? "MM/DD/YY" : formatDateString(field);
      tableHead.appendChild(header);

      if (field !== "kpi" && field !== "goal") {
        flatpickr(header, {
          enableTime: false,
          dateFormat: "m/d/Y",
          defaultDate: field, // Set the initial date if available
          onChange: function (selectedDates, dateStr, instance) {
            console.log(`Date selected: ${dateStr}`);
            header.textContent = dateStr; // Update header text with selected date
          },
        });
      }
    });

    // Process each data entry
    kpiData.forEach((data) => {
      const maxRows = Math.max(
        ...sortedFields.map((field) =>
          Array.isArray(data.table[field]) ? data.table[field].length : 1
        )
      );

      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row = document.createElement("tr");

        sortedFields.forEach((field) => {
          const cell = document.createElement("td");

          if (Array.isArray(data.table[field])) {
            cell.textContent = data.table[field][rowIndex] || "";
          } else {
            cell.textContent = data.table[field] || "";
          }

          cell.contentEditable = true; // Make cell editable
          row.appendChild(cell);
        });

        tableBody.appendChild(row);

        document
          .getElementById("save-button")
          .addEventListener("click", async function () {
            document.getElementById("loader1").style.display = "flex";
            const status = await storeData();
            const alertBox = document.getElementById('alert-box1');
            if (status === true) {
              alertBox.innerHTML = 'Data saved successfully!';
              alertBox.classList.remove('failed');
              alertBox.classList.add('success');
            } else {
              alertBox.classList.remove('success');
              alertBox.classList.add('failed');
              alertBox.innerHTML = 'Failed to save data. Please select date in header!';
            }
            document.getElementById("loader1").style.display = "none";
            alertBox.style.display = 'flex';
            setTimeout(() => {
              alertBox.style.display = 'none';
            }, 3000);
          });
      }
    });
  } else {
    console.log("No KPI data available.");
  }
}

// Helper function to format date strings if needed
function formatDateString(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return date.toLocaleDateString(undefined, options);
}

async function storeData() {
  const tableData = {};
  const tableRows = document.querySelectorAll("#kpi-table tbody tr");

  // Get the headers first
  const headers = Array.from(document.querySelectorAll("#kpi-table thead th"));

  // Initialize tableData with headers, excluding "mm/dd/yy"
  let status = true;
  headers.forEach((header, index) => {
    const headerText = header.textContent.trim().toLowerCase();
    if (headerText !== "mm/dd/yy") {
      tableData[headerText] = [];
    }
    if (headerText === "mm/dd/yy") {
      status = false;
    }
  });

  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    cells.forEach((cell, index) => {
      const header = headers[index];
      if (header) {
        let field = header.textContent.trim().toLowerCase();
        if (field !== "mm/dd/yy") {
          if (!tableData[field]) {
            tableData[field] = [];
          }
          let cellValue = cell.textContent.trim();
          tableData[field].push(cellValue);
        }
        if (field === "mm/dd/yy") {
          status = false;
        }
      }
    });
  });

  if (status == false) {
    return false;
  }

  console.log(tableData);

  // Assuming you have the selected brand ID
  const selectedBrandId = globalSelectedValue; // Retrieve from localStorage or wherever you store it
  if (!selectedBrandId) {
    console.error("No brand ID found.");
    return;
  }

  const brandRef = doc(db, "brands", selectedBrandId);
  const kpiTrackingRef = collection(db, "kpiTracking");
  const q = query(kpiTrackingRef, where("brandId", "==", brandRef));

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.error("No KPI Tracking document found for the selected brand ID.");
      return;
    }

    // Update the first document found (assuming there's only one)
    const docId = querySnapshot.docs[0].id;
    const kpiDocRef = doc(db, "kpiTracking", docId);

    try {
      // Remove the `table` field from the document
      await updateDoc(kpiDocRef, {
        table: deleteField(),
      });

      // Now, set the new `table` data, excluding "mm/dd/yy"
      await setDoc(kpiDocRef, { table: tableData }, { merge: true });
      console.log("Table data updated successfully.");
      return true;
    } catch (error) {
      console.error("Error updating table data:", error);
    }
    console.log("Data saved successfully.");
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

let selectElementChangeHandler = null; // Variable to store the current event handler
export async function generateBrands(func) {
  const selectElement = document.getElementById("brand-select");
  const brandsData = localStorage.getItem("brandsData");
  const brandsArray = brandsData ? JSON.parse(brandsData) : [];
  let storedSelectedBrandId = localStorage.getItem("selectedBrandId"); // Retrieve from localStorage

  selectElement.innerHTML = "";

  brandsArray.forEach((brand, index) => {
    const brandName = brand.name;
    const brandId = brand.id || brand.brandId;
    const brandLogo = brand.brandlogoURL;
    const option = document.createElement("option");
    option.value = brandName; // Use brand name as value
    option.textContent = brandName;
    option.setAttribute("data-brandid", brandId); // Store brand ID in data attribute
    option.setAttribute("data-brandlogo", brandLogo); // Store brand logo in data attribute
    option.classList.add("brand-option");
   
    // If this is the stored selected brand, mark it as selected
    if (brandId === storedSelectedBrandId) {
      option.selected = true;
      globalOptionselected = brandId; // Set globalOptionselected to the stored brand
    }

    // If storedSelectedBrandId is null, default to the first option
    if (!storedSelectedBrandId && index === 0) {
      storedSelectedBrandId = brandId;
      option.selected = true;
      globalOptionselected = brandId; // Set globalOptionselected to the first brand
      localStorage.setItem("selectedBrandId", brandId); // Store first brand ID in localStorage
    }

    selectElement.appendChild(option);
  });

  if (brandsArray.length > 0) {
    const selectedBrandId = globalOptionselected || storedSelectedBrandId;
    globalSelectedValue = selectedBrandId;
    if(!selectedBrandId) {
      const x=localStorage.getItem("brandsData");
      selectedBrandId = JSON.parse(x)[0].id || JSON.parse(x)[0].brandId;
    }
    if (selectedBrandId) {
      await fetchDataForFunc(func, selectedBrandId);
    } else {
      console.error("Brand ID not found for the selected brand.");
    }
  }

  if (selectElementChangeHandler) {
    selectElement.removeEventListener("change", selectElementChangeHandler);
  }

  selectElementChangeHandler = async function () {
    const selectedBrandId = this.options[this.selectedIndex].getAttribute("data-brandid");
    globalSelectedValue = selectedBrandId;

    // Store the selected brand ID in localStorage
    localStorage.setItem("selectedBrandId", selectedBrandId);

    if (selectedBrandId) {
      await fetchDataForFunc(func, selectedBrandId);
    } else {
      console.error("Brand ID not found for the selected brand.");
    }
  };

  selectElement.addEventListener("change", selectElementChangeHandler);
}

async function fetchDataForFunc(func, brandId) {
  document.getElementById('loader1').style.display = 'flex';
  switch (func) {
    case "kpi":
      await fetchKPIData(brandId);
      break;
    case "checklist":
      await fetchChecklistData(brandId);
      break;
    case "plans":
      await fetchPlanData(brandId);
      break;
    case "quarterlyGoals":
      await fetchQuarterlyGoalsData(brandId);
      initializeGoalInput();
      initializeQuarterlyCountdownTimer();
      break;
    case "meeting":
      await fetchMeetingData(brandId);
      break;
    case "vision":
      await fetchVisionData(brandId);
      break;
    default:
      console.error("Invalid function type.");
      break;
  }
  document.getElementById('loader1').style.display = 'none';
}

async function kpisLoad() {
  await generateBrands("kpi");
}
function checklistLoad() {
  generateBrands("checklist");
}
function goalsLoad() {
  generateBrands("plans");
}
function quarterlyGoalsLoad() {
  generateBrands("quarterlyGoals");
  initializeGoalInput();
  initializeQuarterlyCountdownTimer();
}
function meetingLoad() {
  generateBrands("meeting");
}
function visionLoad() {
  generateBrands("vision");

}

function saveClientData(clientId, data) {
  const clientDoc = firebase.firestore().collection("clients").doc(clientId);
  clientDoc
    .set(data)
    .then(() => {
      console.log("Client data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving client data:", error);
    });
}

function saveBGMData(bgmId, data) {
  const bgmDoc = firebase.firestore().collection("bgms").doc(bgmId);
  bgmDoc
    .set(data)
    .then(() => {
      console.log("BGM data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving BGM data:", error);
    });
}

function saveAdminData(adminId, data) {
  const adminDoc = firebase.firestore().collection("admins").doc(adminId);
  adminDoc
    .set(data)
    .then(() => {
      console.log("Admin data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving admin data:", error);
    });
}

function initializeFileUploads() {
  const fileInputs = document.querySelectorAll(
    "#file-input, #file-input-annual, #file-input-consumer"
  );
  const imageDisplays = document.querySelectorAll(
    "#image-display, #image-display-annual, #image-display-consumer"
  );
  const uploadedImages = document.querySelectorAll(
    "#uploaded-image, #uploaded-image-annual, #uploaded-image-consumer"
  );
  const lightboxes = document.querySelectorAll(
    "#lightbox, #lightbox-annual, #lightbox-consumer"
  );
  const lightboxImgs = document.querySelectorAll(
    "#lightbox-img, #lightbox-img-annual, #lightbox-img-consumer"
  );
  const deleteButtons = document.querySelectorAll(".delete-button");
  const fileLabels = document.querySelectorAll(".file-label");

  fileInputs.forEach((fileInput, index) => {
    const imageDisplay = imageDisplays[index];
    const uploadedImage = uploadedImages[index];
    const lightbox = lightboxes[index];
    const lightboxImg = lightboxImgs[index];
    const deleteButton = deleteButtons[index];
    const fileLabel = fileLabels[index];

    if (
      fileInput &&
      imageDisplay &&
      uploadedImage &&
      lightbox &&
      lightboxImg &&
      deleteButton &&
      fileLabel
    ) {
      fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            uploadedImage.src = e.target.result;
            imageDisplay.style.display = "flex";
            fileLabel.style.display = "none";
            deleteButton.style.display = "flex";
          };
          reader.readAsDataURL(file);
        }
      });

      uploadedImage.addEventListener("click", function () {
        lightboxImg.src = uploadedImage.src;
        lightbox.style.display = "flex";
      });

      lightbox.addEventListener("click", function (e) {
        if (e.target !== lightboxImg) {
          lightbox.style.display = "none";
        }
      });

      deleteButton.addEventListener("click", function () {
        uploadedImage.src = "#";
        imageDisplay.style.display = "none";
        fileLabel.style.display = "flex";
        deleteButton.style.display = "none";
        fileInput.value = ""; // Reset the file input
      });
    }
  });
}

function clearSampleTextOnFocus() {
  document
    .querySelectorAll('.editable-list span[contenteditable="true"]')
    .forEach((span) => {
      const defaultText = span.textContent;
      span.addEventListener("focus", function () {
        if (span.textContent === defaultText) {
          span.textContent = "";
        }
      });
      span.addEventListener("blur", function () {
        if (span.textContent.trim() === "") {
          span.textContent = defaultText;
        }
      });
    });
}

function initializeDropdownMenus() {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    dropdown.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdown.querySelector(".dropdown-content").classList.toggle("show");
    });
  });

  window.addEventListener("click", function () {
    document.querySelectorAll(".dropdown-content").forEach((content) => {
      content.classList.remove("show");
    });
  });
}

function editField(element) {
  const span = element.closest("li").querySelector("span[contenteditable]");
  span.contentEditable = true;
  span.focus();
  span.onblur = function () {
    span.contentEditable = false;
  };
}

// function deleteField(element) {
//     const listItem = element.closest('li');
//     listItem.remove();
// }

export function initializePage() {
  initializeFileUploads();
  initializeFlatpickr();
  initializeDropdownMenus();
  initializeCountdownTimer();
  initializeGrowthCalculator();
  clearSampleTextOnFocus();

  document.getElementById("login-btn").addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("Logged in:", user);
        loadUserData(user);
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
      });
  });
}

function formatCurrency(input) {
  let value = input.value.replace(/[^\d.-]/g, "");

  if (!isNaN(value) && value !== "") {
    input.value = "$" + parseFloat(value).toLocaleString();
  } else {
    input.value = "";
  }
}

// Ensure loadContent is globally accessible
window.loadContent = function (event, url) {
  event.preventDefault();
  console.log(`Loading content from ${url}...`);
  fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const mainContent = document.getElementById("main-content");
      mainContent.innerHTML = html;
      console.log(`Content from ${url} loaded.`);

      // Manually trigger script execution
      const scripts = mainContent.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        if (scripts[i].src) {
          script.src = scripts[i].src;
        } else {
          script.text = scripts[i].text;
        }
        document.head.appendChild(script).parentNode.removeChild(script);
      }

      // Page-specific initializations
      if (url === "kpis.html") {
        kpisLoad();
      } else if (url === "checklist.html") {
        checklistLoad();
      } else if (url === "goals.html") {
        goalsLoad(); // Ensure this function re-initializes all necessary components
      }
      else if (url === "quarterly-goals.html") {
        quarterlyGoalsLoad();
      }
      else if (url === "meeting.html") {
        meetingLoad();
      }
      else if (url === "vision.html") {
        visionLoad();
      }

      // General initialization
      setTimeout(() => {
        if (url.includes("quarterly-goals.html")) {
          initializeGoalInput();
          initializeQuarterlyCountdownTimer();
        } else {
          initializePage(); // Ensure general initialization happens after specific ones
        }
      }, 100);
    })
    .catch((error) => {
      console.error("Error loading content:", error);
    });
};

document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("focusin", function (event) {
    if (event.target.classList.contains("editable-field")) {
      if (
        event.target.textContent === event.target.getAttribute("data-default")
      ) {
        event.target.textContent = "";
      }
    }
  });

  document.body.addEventListener("focusout", function (event) {
    if (event.target.classList.contains("editable-field")) {
      if (event.target.textContent.trim() === "") {
        event.target.textContent = event.target.getAttribute("data-default");
      }
    }
  });
});

function showPageContent() {
  document.querySelectorAll("body > div").forEach((div) => {
    div.style.display = "block";
  });
}

function clearSampleText(event) {
  const span = event.target;
  if (
    span.textContent === "Enter Age" ||
    span.textContent === "Enter Sex" ||
    span.textContent === "Enter Household Income" ||
    span.textContent === "Enter Location" ||
    span.textContent === "Enter Education"
  ) {
    span.textContent = "";
  }
  span.removeEventListener("focus", clearSampleText);
}

// function renderClientData(clientData) {
//     return `
//         <div>
//             <h2>${clientData.name}</h2>
//             <p>${clientData.description}</p>
//             <!-- Add more fields as needed -->
//         </div>
//     `;
// }

document.addEventListener('click', async function (event) {
  // Handle client deletion
  if (event.target.classList.contains('delete-client-button')) {
      const row = event.target.closest('tr');
      const clientId = row.getAttribute('data-id');
      if (clientId) {
          try {
              await deleteDoc(doc(db, "users", clientId)); // Delete the document from Firestore
              row.remove(); // Remove the row from the table
              alert('Client deleted successfully!');
          } catch (error) {
              console.error("Error deleting client document:", error);
              alert('Failed to delete the client. Please try again.');
          }
      }
  }

  // Handle team member deletion
  if (event.target.classList.contains('delete-team-button')) {
      const row = event.target.closest('tr');
      const teamId = row.getAttribute('data-id');
      if (teamId) {
          try {
              await deleteDoc(doc(db, "users", teamId)); // Delete the document from Firestore
              row.remove(); // Remove the row from the table
              alert('Team member deleted successfully!');
          } catch (error) {
              console.error("Error deleting team member document:", error);
              alert('Failed to delete the team member. Please try again.');
          }
      }
  }
});
