/*********************************
 * FIREBASE INIT
 *********************************/
const firebaseConfig = {
  apiKey: "AIzaSyD7pS-SlL_tqA_wBIK5JvVdwgd422495rU",
  authDomain: "schedule-1a6d6.firebaseapp.com",
  projectId: "schedule-1a6d6",
  storageBucket: "schedule-1a6d6.firebasestorage.app",
  messagingSenderId: "814395645954",
  appId: "1:814395645954:web:cf4803875640637b17c71b"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();

/*********************************
 * ELEMENTS
 *********************************/
const list       = document.getElementById("list");
const adminPanel = document.getElementById("adminPanel");
const loginBtn   = document.getElementById("loginBtn");
const overlay    = document.getElementById("overlay");

const user     = document.getElementById("user");
const pass     = document.getElementById("pass");
const activity = document.getElementById("activity");
const keywords = document.getElementById("keywords");
const hashtags = document.getElementById("hashtags");
const member   = document.getElementById("member");
const time     = document.getElementById("time");
const search   = document.getElementById("search");

/*********************************
 * ADMIN EMAIL LIST
 *********************************/
const ADMIN_EMAILS = [
  "dn.thn164@gmail.com",
];

/*********************************
 * STATE
 *********************************/
let isAdmin = false;
let editId  = null;
let cache   = {};
let memberFilter = "ALL";

/*********************************
 * LOGIN UI
 *********************************/
function openLogin(){ overlay.classList.remove("hidden"); }
function closeLogin(){ overlay.classList.add("hidden"); }

function login(){
  auth.signInWithEmailAndPassword(user.value.trim(), pass.value)
    .catch(err => alert(err.message));
}

function logout(){
  auth.signOut();
}

/*********************************
 * AUTH STATE
 *********************************/
auth.onAuthStateChanged(u=>{
  isAdmin = !!u && ADMIN_EMAILS.includes(u.email);

  adminPanel.classList.toggle("hidden", !isAdmin);
  loginBtn.classList.toggle("hidden", isAdmin);

  renderList();
});

/*********************************
 * FILTER
 *********************************/
function setMemberFilter(val){
  memberFilter = val;
  renderList();
}

/*********************************
 * BADGE TIME
 *********************************/
function getTimeBadge(timeStr){
  const now = new Date();
  const d   = new Date(timeStr);

  const n0 = new Date(now.setHours(0,0,0,0));
  const d0 = new Date(d.setHours(0,0,0,0));
  const diff = (d0 - n0) / 86400000;

  if(diff === 0) return { text:"NOW", cls:"badge-now" };
  if(diff === 1) return { text:"TOMORROW", cls:"badge-tomorrow" };
  if(diff > 1)   return { text:"COMING SOON", cls:"badge-soon" };
  return null;
}

function isExpired24h(timeStr){
  return Date.now() - new Date(timeStr).getTime() > 86400000;
}

/*********************************
 * CRUD
 *********************************/
async function addSchedule(){
  if(!activity.value || !time.value){
    alert("Thiếu thông tin");
    return;
  }

  const data = {
    activity : activity.value.trim(),
    keywords : keywords.value.trim(),
    hashtags : hashtags.value.trim(),
    member   : member.value,
    time     : time.value
  };

  try{
    if(editId){
      await db.collection("schedule").doc(editId).set(data);
      editId = null;
    }else{
      await db.collection("schedule").add(data);
    }

    activity.value = keywords.value = hashtags.value = time.value = "";
  }catch(err){
    alert(err.message);
  }
}

function editSchedule(id){
  const s = cache[id];
  if(!s) return;

  activity.value = s.activity;
  keywords.value = s.keywords;
  hashtags.value = s.hashtags;
  member.value   = s.member;
  time.value     = s.time;
  editId = id;
}

function deleteSchedule(id){
  if(confirm("Xóa lịch này?")){
    db.collection("schedule").doc(id).delete();
  }
}

/*********************************
 * REALTIME
 *********************************/
db.collection("schedule")
  .orderBy("time")
  .onSnapshot(snap=>{
    cache = {};
    snap.forEach(doc=>{
      cache[doc.id] = { ...doc.data(), id:doc.id };
    });
    renderList();
  });

/*********************************
 * RENDER
 *********************************/
function renderList(){
  list.innerHTML = "";

  Object.values(cache).forEach(s=>{
    if(memberFilter !== "ALL" && s.member !== memberFilter) return;
    if(search.value && !s.activity.toLowerCase().includes(search.value.toLowerCase())) return;
    if(!isAdmin && isExpired24h(s.time)) return;

    const badge = getTimeBadge(s.time);

    const div = document.createElement("div");
    div.className = `schedule member-${s.member}`;

    div.innerHTML = `
      <div class="schedule-left">
        <strong>
          ${s.activity}
          ${badge ? `<span class="badge ${badge.cls}">${badge.text}</span>` : ""}
        </strong>

        <div class="time">🕒 ${new Date(s.time).toLocaleString("vi-VN")}</div>
        <div>🔑 ${s.keywords || ""}</div>
        <div class="hashtags">#️⃣ ${s.hashtags || ""}</div>
      </div>

      <div class="schedule-right">
        ${isAdmin ? `
          <div class="action-btns">
            <button class="edit-btn" onclick="editSchedule('${s.id}')">Sửa</button>
            <button class="danger" onclick="deleteSchedule('${s.id}')">Xóa</button>
          </div>
        ` : ""}
        <div class="member-tag">${s.member}</div>
      </div>
    `;

    list.appendChild(div);
  });
}
