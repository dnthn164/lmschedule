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
 * MEMBER FILTER
 *********************************/
let memberFilter = "ALL";
function setMemberFilter(val){
  memberFilter = val;
  renderList();
}

/*********************************
 * LOGIN UI
 *********************************/
function openLogin(){ overlay.classList.remove("hidden"); }
function closeLogin(){ overlay.classList.add("hidden"); }

/*********************************
 * AUTH
 *********************************/
function login(){
  auth.signInWithEmailAndPassword(user.value.trim(), pass.value)
    .then(closeLogin)
    .catch(err => alert("❌ " + err.message));
}

function logout(){
  auth.signOut().then(()=>{
    renderList();
  });
}


/*********************************
 * ADMIN STATE
 *********************************/
let isAdmin = false;
auth.onAuthStateChanged(u=>{
  isAdmin = !!u;
  adminPanel.classList.toggle("hidden", !isAdmin);
  loginBtn.classList.toggle("hidden", isAdmin);
});

/*********************************
 * TIME / BADGE
 *********************************/
function getBadge(timeStr){
  const now = new Date();
  const d   = new Date(timeStr);

  const n0 = new Date(now.setHours(0,0,0,0));
  const d0 = new Date(d.setHours(0,0,0,0));
  const diff = (d0 - n0) / 86400000;

  if(diff === 0) return { text:"NOW", cls:"today" };
  if(diff === 1) return { text:"TOMORROW", cls:"tomorrow" };
  if(diff > 1)   return { text:"COMING SOON", cls:"upcoming" };
  return          { text:"PAST", cls:"future" };
}

function isExpired24h(timeStr){
  return Date.now() - new Date(timeStr).getTime() > 86400000;
}

/*********************************
 * CRUD
 *********************************/
let editId = null;
let cache  = {};

async function addSchedule(){
  if(!activity.value || !time.value){
    alert("⚠️ Thiếu thông tin");
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
    alert("❌ Không lưu được");
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

async function deleteSchedule(id){
  if(confirm("Xóa lịch này?")){
    await db.collection("schedule").doc(id).delete();
  }
}

/*********************************
 * REALTIME DATA
 *********************************/
db.collection("schedule")
  .orderBy("time")
  .onSnapshot(snapshot=>{
    cache = {};
    snapshot.forEach(doc=>{
      const s = doc.data();
      s.id = doc.id;
      cache[s.id] = s;
    });
    renderList();
  });

/*********************************
 * RENDER
 *********************************/
function renderList(){
  list.innerHTML = "";
  const q = search.value.toLowerCase().trim();

  Object.values(cache).forEach(s=>{
    if(memberFilter !== "ALL" && s.member !== memberFilter) return;
    if(!isAdmin && isExpired24h(s.time)) return;
    if(q && !s.activity.toLowerCase().includes(q)) return;

    renderItem(s);
  });
}

function renderItem(s){
  const badge  = getBadge(s.time);
  const timeBK = new Date(s.time).toLocaleString("en-GB", {
    timeZone:"Asia/Bangkok"
  });

  const div = document.createElement("div");
  div.className = "schedule";

  div.innerHTML = `
    <div class="schedule-left">
      <strong>
        ${s.activity}
        <span class="badge ${badge.cls}">${badge.text}</span>
      </strong>
      <div class="time">🕒 ${timeBK}</div>
      <div>🔑 ${s.keywords || ""}</div>
      <div class="hashtags">${s.hashtags || ""}</div>
    </div>

    <div class="schedule-right">
      ${isAdmin ? `
        <div class="action-btns">
          <button class="edit-btn" onclick="editSchedule('${s.id}')">Sửa</button>
          <button class="danger" onclick="deleteSchedule('${s.id}')">Xóa</button>
        </div>
      ` : ""}
      <div class="member-name member-${s.member}">${s.member}</div>
    </div>
  `;

  list.appendChild(div);
}

/*********************************
 * SEARCH EVENT
 *********************************/
search.addEventListener("input", renderList);
