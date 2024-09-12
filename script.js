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
  deleteDoc,

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
import { initializeDataPage } from './data.js';
import { saveInputs, fetchGrowthData } from './growth-calculator.js';
import { loadSprints } from './growth-checklist.js';
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

// const firebaseConfig = {
//   apiKey: "AIzaSyCxJLN7vB9MfAMmmI9g6k25w7sNyqVuBnM",
//   authDomain: "coretrex-d2fd5.firebaseapp.com",
//   projectId: "coretrex-d2fd5",
//   storageBucket: "coretrex-d2fd5.appspot.com",
//   messagingSenderId: "271576667402",
//   appId: "1:271576667402:web:374f672e7d2ad46d3016f3",
//   measurementId: "G-RJRLTC8MHN"
// };


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { deleteField, db, doc, setDoc, getDocs, getDoc, collection, query, where, addDoc, updateDoc };

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
        console.error("Error creating account:", error.message);
        alert("Error creating account: " + error.message);
        if (error.message === "Firebase: Error (auth/email-already-in-use).") {
          console.log("This email is suspended by admin. Please use another email.");
        }
      }
    });
  }



  document.getElementById("add-team-button").addEventListener("click", async () => {
    try {
      console.log("Add team button clicked");
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
      console.log("here");
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
  document.getElementById("sidebar-logo").addEventListener("click", () => {
    console.log("Sidebar logo clicked");
    document.getElementById("main-content").innerHTML = '';
  })


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
        const customEvent = new Event('click');
        loadContent(customEvent, 'admin.html');
        document.getElementById('admin-dashboard').style.display = 'block';
        console.log("Admin data loaded successfully!");
      }
      localStorage.setItem("userData", JSON.stringify(userData));
      if (userData.role === "Client" || userData.role === "Team") {
        loadTeamData(userData);
        const customEvent = new Event('click');
        loadContent(customEvent, 'kpis.html');
      } else if (userData.role === "Admin") {
        loadAdminData();
      }
    } else {
      console.log("No such user!");
      window.location.href = "/error.html";

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
      <div id="${brand.brandId}" class="brand-item">
        <div class="brand-logo-container">
          <i class="brand-delete-icon fas fa-trash" data-brand-id="${brand.brandId}"></i>
          <img src="${brand.brandlogoURL}" alt="${brand.name} Logo" width="50">
        </div>
        <div>${brand.name}</div>
      </div>
    `;
  });
  brandsList.innerHTML = brandsHTML;


  const addBrandForm = document.getElementById("add-brand-form");
  if (!addBrandForm.dataset.listenerAdded) {
    addBrandForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const brandName = document.getElementById("brand-name").value;
      const brandLogo = document.getElementById("brand-logo").files[0];
      console.log(brandName, brandLogo);
      if (brandName && brandLogo) {
        const uniqueFileName = `${Date.now()}_${brandLogo.name}`;
        await addNewBrand(brandName, brandLogo, uniqueFileName);
        await loadAdminData();
        return;
      } else {
        console.error("Brand name or logo is missing.");
      }
    });
    // Mark that the event listener has been added
    addBrandForm.dataset.listenerAdded = true;
  }


  document.querySelectorAll('.brand-delete-icon').forEach(icon => {
    icon.addEventListener('click', async (e) => {
      document.getElementById('loader1').style.display = 'flex';
      // console.log(e.target.getAttribute('data-brand-id'));
      const brandId = e.target.getAttribute('data-brand-id');


      try {
        // Array of collection names to delete documents from
        const collections = ['kpiTracking', 'checklists', 'meeting', 'quarterly-goals', 'plans', 'visions'];

        // Delete documents from each collection that match the brandId
        for (const collectionName of collections) {
          const querySnapshot = await getDocs(query(collection(db, collectionName), where('brandId', '==', doc(db, 'brands', brandId))));
          const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        }

        // Update users collection to remove the brandId from the array field
        const usersQuerySnapshot = await getDocs(query(collection(db, 'users'), where('brandId', 'array-contains', doc(db, 'brands', brandId))));
        const updatePromises = usersQuerySnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const updatedBrandIds = userData.brandId.filter(id => id.id !== brandId);
          return updateDoc(userDoc.ref, { brandId: updatedBrandIds });
        });
        await Promise.all(updatePromises);

        // Finally, delete the brand document from the 'brands' collection
        const brandDocRef = doc(db, 'brands', brandId);
        await deleteDoc(brandDocRef);

        // Remove the brand from localStorage
        const updatedBrandsArray = brandsArray.filter(brand => brand.brandId !== brandId);
        localStorage.setItem('brandsData', JSON.stringify(updatedBrandsArray));
        // Re-render the brands
        // renderBrands();
        loadAdminData();

        console.log(`Brand with ID ${brandId} and its associated documents have been deleted successfully.`);
      } catch (error) {
        console.error("Error deleting brand:", error);
        document.getElementById('loader1').style.display = 'none';
      }
    });
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
          "Enter Goal",
          "Enter Goal",
          "Enter Goal",
          "Enter Goal",
          "Enter Goal",
          "Enter Goal",
          "Enter Goal",
          "Enter Goal",
        ],
        kpi: [
          "Revenue",
          "Buy Box %",
          "Optimization Score",
          "Page Views",
          "Conversion Rate",
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

    const calcRef = doc(collection(db, "growthCalculators"));
await setDoc(calcRef, {
  brandId: brandDocRef,
  revenueGoal: 1000000,
  aov: 50,
  conversionRate: 1,
  organicRate: 70,
  adsConversionRate: 2,
  cpc: 1.0,
  timestamp: new Date(),  // Optional: to keep track of when the data was saved
});

const checklistRef = doc(collection(db, "growthChecklists"));
await setDoc(checklistRef, {
  brandId: brandDocRef,
  sprints: [],  // Initialize with an empty array of sprints
  completedModules: [],  // Track completed modules
  timestamp: new Date(),  // To keep track of when the checklist was created
});


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

  // Return user data along with a comma-separated list of brand names and the document ID
  return {
    brandIds,
    id: docSnap.id,          // Include the document ID
    ...userData,             // Include the user data
    brands: brandNames.join(", "),  // Include the brand names as a comma-separated string
  };
}

async function loadAdminData() {
  try {
    const data = localStorage.getItem("brandsData");

    // Check if data is null or an empty array
    if (data === null || data === '[]') {
      localStorage.removeItem("selectedBrandId");
    }
    console.log("here")
    const clientsQuery = query(
      collection(db, "users"),
      where("role", "==", "Client")
    );
    const teamQuery = query(
      collection(db, "users"),
      where("role", "==", "Team")
    );
    console.log("here1")

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
    console.log("here2")

    // Render the data into the HTML
    renderClientTable(clientsData);
    renderTeamTable(teamData);


    // Store the data in localStorage
    localStorage.setItem("clientsData", JSON.stringify(clientsData));
    localStorage.setItem("teamData", JSON.stringify(teamData));
    console.log("here3")

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
    document.getElementById("loader1").style.display = "none";
  }

  if (!document.getElementById("add-team-button").dataset.listenerAdded) {
    document.getElementById("add-team-button").addEventListener("click", async () => {
      try {
        console.log("Add team button clicked");
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
          document.getElementById('alert-box1').classList.remove('failed');
          document.getElementById('alert-box1').classList.add('success');
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

    // Mark the listener as added
    document.getElementById("add-team-button").dataset.listenerAdded = true;
  }
  if (!document.getElementById("add-client-button").dataset.listenerAdded) {
    document.getElementById("add-client-button").addEventListener("click", async () => {
      try {
        console.log("Add client button clicked");
        document.getElementById("loader1").style.display = "flex";
        const selectedClientId = document.getElementById("client-info").value;
        const selectedBrandId = document.getElementById("brand-info-1").value;
        const brandReference = doc(db, "brands", selectedBrandId);
        const userDocRef = doc(db, "users", selectedClientId);
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
          document.getElementById('alert-box1').classList.remove('failed');
          document.getElementById('alert-box1').classList.add('success');
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

    // Mark the listener as added
    document.getElementById("add-client-button").dataset.listenerAdded = true;
  }
  if (!document.getElementById("clients-tbody").dataset.listenerAdded) {
    document.getElementById("clients-tbody").addEventListener("click", async (event) => {
      if (event.target && event.target.id === "delete-client") {
        document.getElementById("loader1").style.display = "flex";
        const clientId = event.target.dataset.clientId;
        console.log(`Deleting client with ID ${clientId}`);
        if (confirm(`Are you sure you want to delete client ${clientId}?`)) {
          await deleteClient(clientId);
          await loadAdminData();
        }
      }
      else if (event.target && event.target.id === 'delete-brands') {
        const teamId = event.target.dataset.clientId;
        showDeleteBrandModal(event, teamId);
      }
      document.getElementById("loader1").style.display = "none";

    });

    document.getElementById("clients-tbody").dataset.listenerAdded = true;

  }
  if (!document.getElementById("team-tbody").dataset.listenerAdded) {
    document.getElementById("team-tbody").addEventListener("click", async (event) => {
      if (event.target && event.target.id === "delete-team") {
        document.getElementById("loader1").style.display = "flex";
        const teamId = event.target.dataset.teamId;
        console.log(`Deleting team with ID ${teamId}`);
        if (confirm(`Are you sure you want to delete team ${teamId}?`)) {
          await deleteTeam(teamId);
          await loadAdminData();
        }
      }
      else if (event.target && event.target.id === 'delete-brands') {
        const teamId = event.target.dataset.teamId;
        console.log(`Deleting brands for team ${teamId}`);
        showDeleteBrandModal(event, teamId);
        // showDeleteBrandModal(event);
        console.log('delete-brands clicked');
      }
    });
    document.getElementById("team-tbody").dataset.listenerAdded = true;

  }
  document.getElementById('delete-brand-confirm').addEventListener('click', async () => {
    document.getElementById('loader1').style.display = 'flex';
    const selectedBrandId = document.getElementById('brand-select1').value;
    console.log(document.getElementById('delete-brands').dataset.clientId);
    const clientId = document.getElementById('delete-brands').dataset.clientId; // Ensure to store clientId somewhere
    console.log(selectedBrandId, clientId);

    try {
      // Get user document reference
      const userDocRef = doc(db, 'users', clientId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        let brandIdArray = userDoc.data().brandId || [];
        // Remove the selected brand ID from the array
        brandIdArray = brandIdArray.filter(ref => ref.id !== selectedBrandId);
        // Update user document
        await updateDoc(userDocRef, { brandId: brandIdArray });
        // Reload the admin data
        await loadAdminData();
        document.getElementById('brand-delete-modal').style.display = 'none';
      } else {
        console.log("User document does not exist.");
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
      document.getElementById('loader1').style.display = 'none';

    }
  });

  document.getElementById('cancel-brand-delete').addEventListener('click', () => {
    document.getElementById('brand-delete-modal').style.display = 'none';
  });
}
async function showDeleteBrandModal(event, teamId) {
  document.getElementById('delete-brands').dataset.clientId = teamId;
  console.log('Button clicked:', event.target.dataset.brandId); // Debug
  const brandIds = JSON.parse(event.target.dataset.brandId);
  const modal = document.getElementById('brand-delete-modal');
  const brandSelect = document.getElementById('brand-select1');
  brandSelect.innerHTML = '';
  const brandsData = JSON.parse(localStorage.getItem('brandsData')) || [];
  brandsData.forEach(brand => {
    if (brandIds.includes(brand.brandId)) {
      const option = document.createElement('option');
      console.log('Adding option:', brand); // Debug
      option.value = brand.brandId;
      option.textContent = brand.name;
      brandSelect.appendChild(option);
      console.log(option);
    }
  });
  console.log('Modal display:', modal.style.display); // Debug
  modal.style.display = 'flex';
}

function renderClientTable(clientsData) {
  const tbody = document.getElementById("clients-tbody");
  console.log("clientsData", clientsData);

  if (tbody) {
    tbody.innerHTML = clientsData?.map((client) => {
      // Extract brand IDs from the array
      const brandIds = client.brandId?.map(brand => {
        return brand._key.path.segments[brand._key.path.segments.length - 1];
      }) || [];

      return ` 
        <tr>
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td class="brands-box" style="background-color:white">
                ${client.brands}
                <div class="more-options">
                    <button class="more-options-button"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    <div class="more-options-menu">
                         ${brandIds.length > 0
          ? `<button id="delete-brands" data-brand-id='${JSON.stringify(brandIds)}' data-client-id="${client.id}">Delete Brands</button>`
          : ''
        }
                        <button id="delete-client" data-client-id="${(client.id)}">Delete ${client.name}</button>
                    </div>
                </div>
            </td>
        </tr>
      `;
    }).join("");
  }
}

async function deleteClient(clientId) {
  try {
    console.log(`Deleting client with ID ${clientId}`);
    const clientDocRef = doc(db, 'users', clientId);
    await deleteDoc(clientDocRef);
    const clientsData = JSON.parse(localStorage.getItem('clientsData')) || [];
    const updatedClientsArray = clientsData.filter(client => client.id !== clientId);
    localStorage.setItem('clientsData', JSON.stringify(updatedClientsArray));
    renderClientTable(updatedClientsArray);
    console.log(`Client with ID ${clientId} has been deleted successfully.`);
  } catch (error) {
    console.error("Error deleting client:", error);
  }
}


function renderTeamTable(teamData) {
  const tbody = document.getElementById("team-tbody");
  console.log("teamData", teamData);
  if (tbody) {
    tbody.innerHTML = teamData?.map((team) => {
      // Extract brand IDs from the array
      const brandIds = team.brandId?.map(brand => {
        return brand._key.path.segments[brand._key.path.segments.length - 1];
      }) || [];

      // Create a dropdown for brands
      const brandsDropdown = `
        <select class="brands-dropdown">
          <option value="">Select Brand</option>
          ${team.brands.split(', ').map(brand => `<option value="${brand}">${brand}</option>`).join('')}
        </select>
      `;

      return `
        <tr>
          <td>${team.name}</td>
          <td>${team.email}</td>
          <td class="brands-box" style="background-color:white">
            ${brandsDropdown}
            <div class="more-options">
              <button class="more-options-button"><i class="fa-solid fa-ellipsis-vertical"></i></button>
              <div class="more-options-menu">
                ${brandIds.length > 0 ? `<button id="delete-brands" data-brand-id='${JSON.stringify(brandIds)}' data-team-id="${team.id}">Delete Brands</button>` : ''}
                <button id="delete-team" data-team-id="${team.id}">Delete ${team.name}</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Add event listener for brand selection
  const brandDropdowns = document.querySelectorAll('.brands-dropdown');
  brandDropdowns.forEach(dropdown => {
    dropdown.addEventListener('change', function() {
      const selectedBrand = this.value;
      console.log(`Selected brand: ${selectedBrand}`);
      // Add any additional logic you want to perform when a brand is selected
    });
  });
}


async function deleteTeam(teamId) {
  try {
    console.log(`Deleting team with ID ${teamId}`);

    // Delete the team document from Firestore
    const teamDocRef = doc(db, 'users', teamId);
    await deleteDoc(teamDocRef);

    // Remove team from localStorage
    const teamData = JSON.parse(localStorage.getItem('teamData')) || [];
    const updatedTeamArray = teamData.filter(team => team.id !== teamId);
    localStorage.setItem('teamData', JSON.stringify(updatedTeamArray));

    // Re-render the team table
    renderTeamTable(updatedTeamArray);

    console.log(`Team with ID ${teamId} has been deleted successfully.`);
  } catch (error) {
    console.error("Error deleting team:", error);
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
export const flatpickrInstances = new Map();
export const headerFieldToIndex = new Map();


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
    const includesGoal = Object.keys(firstEntry).includes("goal");

    // Build the sorted fields array based on the presence of "goal"
    const sortedFields = ["kpi", ...(includesGoal ? ["goal"] : []), ...dateFields];
    tableHead.innerHTML = ""; // Clear existing headers

    // Add headers for each dynamic field
    sortedFields.forEach((field, index) => {
      headerFieldToIndex.set(field, index);
      const header = document.createElement("th");
      header.classList.add("header-cell-container");

      // Create a container for the header text and the trash icon
      const headerContent = document.createElement("div");
      headerContent.style.display = "flex";
      headerContent.style.alignItems = "center";
      headerContent.style.justifyContent = "space-between";
      headerContent.style.width = "100%";

      const headerText = document.createElement("span");
      headerText.textContent = field === "kpi" ? field.toUpperCase() : field === "goal" ? "Goal" : field === "MM/DD/YY" ? "MM/DD/YY" : formatDateString(field);

      // Create a trash icon for deleting the column (skip for "kpi")
      if (field !== "kpi" && field !== "goal") {
        const trashIcon = document.createElement("i");
        trashIcon.className = "fas fa-trash trash-icon";
        trashIcon.addEventListener("click", () => deleteColumn(field)); // Delete column using field name
        headerContent.appendChild(trashIcon);
      }

      headerContent.appendChild(headerText);
      header.appendChild(headerContent);
      tableHead.appendChild(header);

      // Initialize Flatpickr only for non-KPI and non-Goal headers
      if (field !== "kpi" && field !== "goal") {
        const flatpickrInstance = flatpickr(headerContent, {
          enableTime: false,
          dateFormat: "m/d/Y",
          defaultDate: field, // Set the initial date if available
          onChange: function (selectedDates, dateStr, instance) {
            console.log(`Date selected: ${dateStr}`);
            headerText.textContent = dateStr; // Update header text with selected date
          },
        });
        flatpickrInstances.set(field, flatpickrInstance);
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
          cell.classList.add("cell-trash-parent");
          if (Array.isArray(data.table[field])) {
            cell.textContent = data.table[field][rowIndex] || "";
          } else {
            cell.textContent = data.table[field] || "";
          }

          // Add trash icon to the first cell of each row (except KPI)
          if (field === "kpi") {
            const trashIcon = document.createElement("i");
            trashIcon.className = "fas fa-trash cell-trash-icon ";
            trashIcon.addEventListener("click", () => deleteRow(row)); // Pass the row element directly
            cell.appendChild(trashIcon);
          }

          cell.contentEditable = true; // Make cell editable
          row.appendChild(cell);
        });

        tableBody.appendChild(row);
      }
    });

    document.getElementById("save-button").addEventListener("click", async function () {
      document.getElementById("loader1").style.display = "flex";
      const status = await storeData(true);
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
  } else {
    console.log("No KPI data available.");
  }
}

// Function to delete a column with confirmation
export function deleteColumn(field) {
  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'custom-modal';
  modal.innerHTML = `
      <div class="modal-content">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete this column?</p>
          <div class="modal-buttons">
              <button id="confirm-delete" class="btn btn-danger">Delete</button>
              <button id="cancel-delete" class="btn btn-secondary">Cancel</button>
          </div>
      </div>
  `;

  // Add modal to the document
  document.body.appendChild(modal);

  // Show modal
  modal.style.display = 'flex';

  // Handle button clicks
  document.getElementById('confirm-delete').onclick = function() {
      // Existing deletion logic
      const index = headerFieldToIndex.get(field);
      const flatpickrInstance = flatpickrInstances.get(field);
      if (flatpickrInstance) {
          flatpickrInstance.destroy();
          flatpickrInstances.delete(field);
      }
      const tableHead = document.querySelector("#kpi-table thead tr");
      const tableBody = document.querySelector("#kpi-table tbody");

      // Remove the header
      tableHead.querySelectorAll("th")[index].remove();

      // Remove each cell in the column
      tableBody.querySelectorAll("tr").forEach(row => {
          row.querySelectorAll("td")[index].remove();
      });

      // Update column indexes
      headerFieldToIndex.delete(field);
      headerFieldToIndex.forEach((value, key) => {
          if (value > index) {
              headerFieldToIndex.set(key, value - 1);
          }
      });

      storeData(false);

      // Close and remove modal
      modal.style.display = 'none';
      document.body.removeChild(modal);
  };

  document.getElementById('cancel-delete').onclick = function() {
      // Close and remove modal
      modal.style.display = 'none';
      document.body.removeChild(modal);
  };
}

// Function to delete a row
export function deleteRow(row) {
  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'custom-modal';
  modal.innerHTML = `
      <div class="modal-content">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete this row?</p>
          <div class="modal-buttons">
              <button id="confirm-delete-row" class="btn btn-danger">Delete</button>
              <button id="cancel-delete-row" class="btn btn-secondary">Cancel</button>
          </div>
      </div>
  `;

  // Add modal to the document
  document.body.appendChild(modal);

  // Show modal
  modal.style.display = 'flex';

  // Handle button clicks
  document.getElementById('confirm-delete-row').onclick = function() {
      // Existing deletion logic
      const tableBody = document.querySelector("#kpi-table tbody");
      tableBody.removeChild(row);
      storeData(false);

      // Close and remove modal
      modal.style.display = 'none';
      document.body.removeChild(modal);
  };

  document.getElementById('cancel-delete-row').onclick = function() {
      // Close and remove modal
      modal.style.display = 'none';
      document.body.removeChild(modal);
  };
}


// Helper function to format date strings if needed
function formatDateString(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return date.toLocaleDateString(undefined, options);
}


async function storeData(param) {
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

  if (param == true) {
    if (status == false) {
      return false;
    }
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
    if (!selectedBrandId) {
      const x = localStorage.getItem("brandsData");
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
    case "data":
      await initializeDataPage();
      if (JSON.parse(localStorage.getItem("userData")).role == "Admin" || JSON.parse(localStorage.getItem("userData")).role == "Team") {
        document.getElementById('google-sheet').style.display = 'block';

      }
      break;
      case "calculator":
        await fetchGrowthData(brandId); // Add the growth calculator fetch function here
        break;
        case "growthchecklist":
          await loadSprints(brandId); // Add the growth calculator fetch function here
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
function loadDataPage() {
  generateBrands("data");

}
function calculatorLoad() {
  generateBrands("calculator");

}
function growthchecklistLoad() {
  generateBrands("growthchecklist");

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
  initializeGrowthChecklist()

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
        initializeChecklist(); 
      } else if (url === "goals.html") {
        goalsLoad(); 
      } else if (url === "quarterly-goals.html") {
        quarterlyGoalsLoad();
      } else if (url === "meeting.html") {
        meetingLoad();
      } else if (url === "vision.html") {
        visionLoad();
      } else if (url === "admin.html") {
        loadAdminData();
      } else if (url === "data.html") {
        loadDataPage();
      } else if (url === "growth-calculator.html") {
        calculatorLoad();
      } else if (url === "growth-checklist.html") {
        growthchecklistLoad();

        // Ensure filters are re-initialized for the Growth Checklist page
        setTimeout(() => {
          console.log('Reattaching filter listeners...');
          if (typeof attachFilterListeners === "function") {
            attachFilterListeners();  // Reattach listeners to the filters
            console.log('Filter listeners attached.');
          } else {
            console.error('attachFilterListeners function not found.');
          }
          
          console.log('Reapplying filters...');
          if (typeof filterModules === "function") {
            filterModules();  // Reapply filters based on current selections
            console.log('Filters reapplied.');
          } else {
            console.error('filterModules function not found.');
          }
        }, 100);
      }

      // General initialization
      setTimeout(() => {
        if (url.includes("quarterly-goals.html")) {
          initializeGoalInput();
          initializeQuarterlyCountdownTimer();
        } else {
          initializePage(); 
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


// Growth Checklist To Do Test
document.addEventListener("DOMContentLoaded", function() {
  const addToChecklistButtons = document.querySelectorAll('.in-progress');
  const addToRocksButtons = document.querySelectorAll('.add-to-rocks');

  addToRocksButtons.forEach(button => {
      button.addEventListener('click', function() {
          alert("Added to Rocks!");
          // Add additional functionality as needed
      });
  });

  addToChecklistButtons.forEach(button => {
      button.addEventListener('click', function() {
          // Functionality for "Add to Checklist" button click
      });
  });

  document.querySelectorAll('.volume-meter .volume-level').forEach(level => {
      const width = parseInt(level.style.width);
      if (width >= 90) {
          level.classList.add('high-volume');
      }
  });
});


// Add this function if it doesn't exist, or modify it if it does
function addModuleToChecklist(buttonElement) {
  const moduleElement = buttonElement.closest('.checklist-module');
  const moduleTitle = moduleElement.querySelector('.module-title-container h2').textContent.trim();

  // Store the module title in sessionStorage (instead of localStorage)
  sessionStorage.setItem('newChecklistTask', moduleTitle);

  // Navigate to checklist.html
  window.location.href = "checklist.html";
}


// Add this function to communicate with the checklist.js
function addTaskToActiveList(taskName) {
  // Use localStorage to pass the task name between pages
  localStorage.setItem('newTask', taskName);
  
  // If the checklist page is open in another tab, we can use postMessage
  // This part is optional and depends on your setup
  if (window.opener) {
      window.opener.postMessage({ type: 'newTask', task: taskName }, '*');
  }
}


//Checklist To Do Test

window.addModuleToChecklist = function(buttonElement) {
  const moduleElement = buttonElement.closest('.checklist-module');
  const moduleName = moduleElement.querySelector('h2').textContent.trim();

  // Store the new task in localStorage
  localStorage.setItem('newChecklistTask', moduleName);

  // Update UI
  buttonElement.disabled = true;
  buttonElement.textContent = 'Added to Checklist';
  moduleElement.style.backgroundColor = 'lightgrey';
  moduleElement.style.color = 'grey';

  // Dispatch a custom event
  const event = new CustomEvent('newChecklistTask', { detail: moduleName });
  window.dispatchEvent(event);

  console.log(`Task "${moduleName}" added to checklist`);
};


function initializeGrowthChecklist() {
  // Other initialization code...
  loadSprints();
}

