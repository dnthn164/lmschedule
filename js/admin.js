/*********************************
 * FIREBASE
 *********************************/
firebase.initializeApp({
  apiKey: "AIzaSyD7pS-SlL_tqA_wBIK5JvVdwgd422495rU",
  authDomain: "schedule-1a6d6.firebaseapp.com",
  projectId: "schedule-1a6d6",
});

const db = firebase.firestore();
const auth = firebase.auth();

/*********************************
 * ADMIN EMAILS
 *********************************/
const ADMIN_EMAILS = [
  "dn.thn164@gmail.com",
];

/*********************************
 * ELEMENTS
 *********************************/
const list = document.getElementById("list");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const overlay = document.getElementById("overlay");

const user = document.getElementById("user");
const pass = document.getElementById("pass");
const activity = document.getElementById("activity");
const keywords = document.getElementById("keywords");
const hashtags = document.getElementById("hashtags");
const member = document.getElementById("member");
const time = document.getElementById("time");
const search = document.getElementById("search");

/*********************************
 * STATE
 *********************************/
let isAdmin = false;
let editId = null;
let cache = {};
let memberFilter = "ALL";

/*********************************
 * AUTH
 *********************************/
function openLogin(){ overlay.classList.remove("hidden"); }
function closeLogin(){ overlay.classList.add("hidden"); }

function login(){
  auth.signInWithEmailAndPassword(user.value.trim(), pass.value)
    .then(closeLogin)
    .catch(e => alert(e.message));
}

function logout(){
  auth.signOut();
}

auth.onAuthStateChanged(u=>{
  isAdmin = !!(u && ADMIN_EMAILS.includes(u.email));
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
 * CRUD
 *********************************/
async function addSchedule(){
  if(!activity.value || !time.value) return alert("Thiếu thông tin");

  const data = {
    activity: activity.value.trim(),
    keywords: keywords.value.trim(),
    hashtags: hashtags.value.trim(),
    member: member.value,
    time: time.value
  };

  if(editId){
    await db.collection("schedule").doc(editId).set(data);
    editId = null;
  } else {
    await db.collection("schedule").add(data);
  }

  activity.value = keywords.value = hashtags.value = time.value = "";
}

function editSchedule(id){
  const s = cache[id];
  if(!s) return;
  activity.value = s.activity;
  keywords.value = s.keywords;
  hashtags.value = s.hashtags;
  member.value = s.member;
  time.value = s.time;
  editId = id;
}

function deleteSchedule(id){
  if(confirm("Xóa lịch này?")){
    db.collection("schedule").doc(id).delete();
  }
}

/*********************************
 * RENDER
 *********************************/
db.collection("schedule").orderBy("time")
  .onSnapshot(snap=>{
    cache = {};
    snap.forEach(d=>{
      cache[d.id] = {...d.data(), id:d.id};
    });
    renderList();
  });

function renderList(){
  list.innerHTML = "";
  Object.values(cache).forEach(renderItem);
}

function renderItem(s){
  if(memberFilter!=="ALL" && s.member!==memberFilter) return;
  if(search.value && !s.activity.toLowerCase().includes(search.value.toLowerCase())) return;

  const div = document.createElement("div");
  div.className = `schedule member-${s.member}`;

  div.innerHTML = `
    <div>
      <strong>${s.activity}</strong>
      <div>🕒 ${new Date(s.time).toLocaleString("en-GB",{timeZone:"Asia/Bangkok"})}</div>
      <div>${s.keywords||""}</div>
      <div>${s.hashtags||""}</div>
    </div>
    <div>
      ${isAdmin ? `
        <div class="action-btns">
          <button onclick="editSchedule('${s.id}')">Sửa</button>
          <button class="danger" onclick="deleteSchedule('${s.id}')">Xóa</button>
        </div>` : ""}
      <div class="member-tag">${s.member}</div>
    </div>
  `;
  list.appendChild(div);
}
