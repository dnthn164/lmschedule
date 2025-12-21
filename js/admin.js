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

/* ===== ELEMENTS ===== */

/* ===== ELEMENTS ===== */
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

/* ===== LOGIN ===== */
function openLogin(){ overlay.classList.remove("hidden"); }
function closeLogin(){ overlay.classList.add("hidden"); }

function login(){
  auth.signInWithEmailAndPassword(
    user.value.trim(),
    pass.value
  ).catch(err => alert(err.message));
}

function logout(){
  auth.signOut();
}

auth.onAuthStateChanged(u=>{
  adminPanel.classList.toggle("hidden", !u);
  loginBtn.classList.toggle("hidden", !!u);
  if(u) closeLogin();
});

/* ===== UTIL ===== */
function sameDay(d1, d2){
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function getBadge(ts){
  const now = new Date();
  const d = ts.toDate();
  const diff = Math.floor((d - now) / 86400000);

  if(diff === 0) return {t:"NOW",c:"today"};
  if(diff === 1) return {t:"TOMORROW",c:"tomorrow"};
  if(diff > 1) return {t:"COMING SOON",c:"upcoming"};
  return {t:"PAST",c:"future"};
}

/* ===== CRUD ===== */
let editId = null;
let cache = {};

async function saveSchedule(){
  if(!activity.value || !time.value){
    alert("Thiếu thông tin");
    return;
  }

  const inputDate = new Date(time.value);

  const data = {
    activity: activity.value.trim(),
    keywords: keywords.value || "",
    hashtags: hashtags.value || "",
    member: member.value,
    time: firebase.firestore.Timestamp.fromDate(inputDate)
  };

  if(editId){
    await db.collection("schedule").doc(editId).set(data);
    editId = null;
  }else{
    await db.collection("schedule").add(data);
  }

  activity.value = keywords.value = hashtags.value = time.value = "";
}

function editSchedule(id){
  const s = cache[id];
  editId = id;

  activity.value = s.activity;
  keywords.value = s.keywords;
  hashtags.value = s.hashtags;
  member.value = s.member;
  time.value = s.time.toDate().toISOString().slice(0,16);
}

function deleteSchedule(id){
  if(confirm("Xóa lịch này?")){
    db.collection("schedule").doc(id).delete();
  }
}

/* ===== FILTER ===== */
let memberFilter = "ALL";
function setMemberFilter(m){
  memberFilter = m;
  renderSchedules();
}

/* ===== RENDER ===== */
let unsub = null;

function renderSchedules(){
  if(unsub) unsub();

  const q = search.value.toLowerCase();

  unsub = db.collection("schedule")
    .orderBy("time")
    .onSnapshot(snap=>{
      list.innerHTML = "";
      cache = {};

      snap.forEach(doc=>{
        const s = doc.data();
        cache[doc.id] = s;

        if(!s.activity.toLowerCase().includes(q)) return;
        if(memberFilter !== "ALL" && s.member !== memberFilter) return;

        // Ẩn lịch đã qua với user thường
        if(!auth.currentUser && s.time.toDate() < new Date()) return;

        const b = getBadge(s.time);
        const timeBK = s.time.toDate().toLocaleString("en-GB", {
          timeZone: "Asia/Bangkok"
        });

        const div = document.createElement("div");
        div.className = "schedule";

        div.innerHTML = `
          <div class="schedule-left">
            <strong>${s.activity}
              <span class="badge ${b.c}">${b.t}</span>
            </strong>
            <div class="time">🕒 ${timeBK}</div>
            <div>🔑 ${s.keywords}</div>
            <div class="hashtags">${s.hashtags}</div>
          </div>

          <div class="schedule-right">
            ${auth.currentUser ? `
              <div class="action-btns">
                <button class="edit-btn" onclick="editSchedule('${doc.id}')">Sửa</button>
                <button class="danger" onclick="deleteSchedule('${doc.id}')">Xóa</button>
              </div>
            ` : ""}
            <div class="member-name member-${s.member}">
              ${s.member}
            </div>
          </div>
        `;

        list.appendChild(div);
      });
    });
}

renderSchedules();
