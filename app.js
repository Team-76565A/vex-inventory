import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔐 YOUR CONFIG
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const partsCol = collection(db, "parts");
const cutsCol = collection(db, "cuts");

// LOGIN
loginBtn.onclick = async () => {
  await signInWithEmailAndPassword(auth, email.value, password.value);
};

// LOGOUT
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// AUTH STATE
onAuthStateChanged(auth, user => {
  login.style.display = user ? "none" : "block";
  app.style.display = user ? "block" : "none";
});

// ADD OR UPDATE PART
let editingId = null;

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

// LOG CUT
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
};

// REALTIME PARTS
onSnapshot(partsCol, snapshot => {
  partsList.innerHTML = "";

  let totalQty = 0;
  let damaged = 0;

  snapshot.forEach(docSnap => {
    const part = docSnap.data();
    const id = docSnap.id;

    totalQty += part.quantity;
    if (part.condition === "Damaged") damaged++;

    const div = document.createElement("div");
    div.className = "card";
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
  await deleteDoc(doc(db, "parts", id));
};

// EDIT
window.editPart = async (id) => {
  const partDoc = doc(db, "parts", id);
  editingId = id;
  // data auto-filled via snapshot logic on next update
  alert("Edit the fields above and press Save Part");
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
