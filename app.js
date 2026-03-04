import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBg-od6dL3TIu_haoo4Qlu3eNwuGLfdjlI",
  authDomain: "vex-inventory-bbeb4.firebaseapp.com",
  projectId: "vex-inventory-bbeb4",
  storageBucket: "vex-inventory-bbeb4.firebasestorage.app",
  messagingSenderId: "617237424016",
  appId: "1:617237424016:web:6c51819bb3487b7d90f515"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

document.addEventListener("DOMContentLoaded", () => {
  const appDiv = document.getElementById("app");
  const loginDiv = document.getElementById("login");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  const partName = document.getElementById("partName");
  const sku = document.getElementById("sku");
  const category = document.getElementById("category");
  const subcategory = document.getElementById("subcategory");
  const quantity = document.getElementById("quantity");
  const condition = document.getElementById("condition");
  const addPartBtn = document.getElementById("addPartBtn");

  const cutPartId = document.getElementById("cutPartId");
  const originalLength = document.getElementById("originalLength");
  const cutStart = document.getElementById("cutStart");
  const cutEnd = document.getElementById("cutEnd");
  const logCutBtn = document.getElementById("logCutBtn");

  const partsList = document.getElementById("partsList");
  const totalParts = document.getElementById("totalParts");
  const totalQuantity = document.getElementById("totalQuantity");
  const damagedCount = document.getElementById("damagedCount");

  const partsCol = collection(db, "parts");
  const cutsCol = collection(db, "cuts");

  let editingId = null;

  // LOGIN
  loginBtn.onclick = async () => {
    try { await signInWithEmailAndPassword(auth, email.value, password.value); }
    catch(e){ alert("Login failed: "+e.message); }
  };

  // LOGOUT
  logoutBtn.onclick = async () => await signOut(auth);

  // AUTH STATE
  onAuthStateChanged(auth, user => {
    loginDiv.style.display = user ? "none" : "block";
    appDiv.style.display = user ? "block" : "none";
  });

  // ADD / EDIT PART
  addPartBtn.onclick = async () => {
    const data = {
      name: partName.value,
      sku: sku.value,
      category: category.value,
      subcategory: subcategory.value,
      quantity: Number(quantity.value),
      condition: condition.value,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await updateDoc(doc(db, "parts", editingId), data);
      editingId = null;
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(partsCol, data);
    }

    clearForm();
  };

  // LOG C-CHANNEL CUT
  logCutBtn.onclick = async () => {
    const original = Number(originalLength.value);
    const start = Number(cutStart.value);
    const end = Number(cutEnd.value);
    const remaining = original - (end - start);

    await addDoc(cutsCol, {
      partId: cutPartId.value,
      originalLength: original,
      cutStart: start,
      cutEnd: end,
      remainingLength: remaining,
      createdAt: serverTimestamp()
    });

    cutPartId.value = "";
    originalLength.value = "";
    cutStart.value = "";
    cutEnd.value = "";
  };

  // REAL-TIME PARTS LIST
  onSnapshot(partsCol, snapshot => {
    partsList.innerHTML = "";
    let totalQty = 0, damaged = 0;

    snapshot.forEach(docSnap => {
      const part = docSnap.data();
      const id = docSnap.id;

      totalQty += part.quantity;
      if (part.condition === "Damaged") damaged++;

      const div = document.createElement("div");
      div.className = "card" + (part.condition === "Damaged" ? " damaged" : "");
      div.innerHTML = `
        <strong>${part.name}</strong><br>
        SKU: ${part.sku}<br>
        Category: ${part.category}<br>
        Quantity: ${part.quantity}<br>
        Condition: ${part.condition}<br>
        ID: ${id}<br>
        <button onclick="editPart('${id}')">Edit</button>
        <button onclick="deletePart('${id}')">Delete</button>
      `;
      partsList.appendChild(div);
    });

    totalParts.textContent = snapshot.size;
    totalQuantity.textContent = totalQty;
    damagedCount.textContent = damaged;
  });

  // DELETE
  window.deletePart = async (id) => {
    if (confirm("Delete this part?")) await deleteDoc(doc(db, "parts", id));
  };

  // EDIT
  window.editPart = (id) => {
    editingId = id;
    alert("Edit the fields above and click Save Part");
  };

  // CLEAR FORM
  function clearForm() {
    partName.value = "";
    sku.value = "";
    category.value = "";
    subcategory.value = "";
    quantity.value = "";
    condition.value = "New";
  }
});
