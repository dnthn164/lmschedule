/* ===== FIREBASE ===== */
const firebaseConfig = {
  apiKey: "AIzaSyD7pS-SlL_tqA_wBIK5JvVdwgd422495rU",
  authDomain: "schedule-1a6d6.firebaseapp.com",
  projectId: "schedule-1a6d6",
  storageBucket: "schedule-1a6d6.firebasestorage.app",
  messagingSenderId: "814395645954",
  appId: "1:814395645954:web:cf4803875640637b17c71b"
};

firebase.initializeApp(firebaseConfig);

/* ===== FIREBASE ===== */
const auth = firebase.auth();
const db = firebase.firestore();

/* ===== DOM ===== */
const overlay = document.getElementById("overlay");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const list = document.getElementById("list");

const user = document.getElementById("user");
const pass = document.getElementById("pass");
const activity = document.getElementById("activity");
const keywords = document.getElementById("keywords");
const hashtags = document.getElementById("hashtags");
const member = document.getElementById("member");
const time = document.getElementById("time");
const search = document.getElementById("search");

let editId = null;
let memberFilter = "ALL";
let cache = {};

/* ===== LOGIN UI ===== */
loginBtn.onclick = () => overlay.classList.remove("hidden");
document.getElementById("loginCancel").onclick = () => overlay.classList.add("hidden");

document.getElementById("loginSubmit").onclick = () => {
  auth.signInWithEmailAndPassword(user.value, pass.value)
    .catch(e => alert(e.message));
};

document.getElementById("logoutBtn").onclick = () => auth.signOut();

/* ===== AUTH STATE ===== */
auth.onAuthStateChanged(u => {
  adminPanel.classList.toggle("hidden", !u);
  loginBtn.classList.toggle("hidden", !!u);
  if (u) overlay.classList.add("hidden");
});

/* ===== SAVE ===== */
document.getElementById("saveBtn").onclick = async () => {
  if (!activity.value || !time.value) {
    alert("Thiếu thông tin");
    return;
  }

  const data = {
    activity: activity.value.trim(),
    keywords: keywords.value,
    hashtags: hashtags.value,
    member: member.value,
    time: firebase.firestore.Timestamp.fromDate(new Date(time.value))
  };

  if (editId) {
    await db.collection("schedule").doc(editId).set(data);
    editId = null;
  } else {
    await db.collection("schedule").add(data);
  }

  activity.value = keywords.value = hashtags.value = time.value = "";
};

/* ===== FILTER ===== */
document.querySelectorAll(".filters button").forEach(btn => {
  btn.onclick = () => {
    memberFilter = btn.dataset.filter;
    render();
  };
});

search.oninput = render;

/* ===== RENDER ===== */
function render() {
  list.innerHTML = "";
  const q = search.value.toLowerCase();

  Object.entries(cache).forEach(([id, s]) => {
    if (!s.activity.toLowerCase().includes(q)) return;
    if (memberFilter !== "ALL" && s.member !== memberFilter) return;
    if (!auth.currentUser && s.time.toDate() < new Date()) return;

    const div = document.createElement("div");
    div.className = "schedule";
    div.innerHTML = `
      <div>
        <strong>${s.activity}</strong>
        <div>🕒 ${s.time.toDate().toLocaleString("en-GB",{timeZone:"Asia/Bangkok"})}</div>
        <div>${s.keywords}</div>
        <div>${s.hashtags}</div>
      </div>
      <div class="member-name member-${s.member}">${s.member}</div>
    `;
    list.appendChild(div);
  });
}

/* ===== FIRESTORE ===== */
db.collection("schedule").orderBy("time")
  .onSnapshot(snap => {
    cache = {};
    snap.forEach(doc => cache[doc.id] = doc.data());
    render();
  });
