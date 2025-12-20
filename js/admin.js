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

const auth = firebase.auth();
const db = firebase.firestore();

/* ===== ELEMENTS ===== */
const overlay = document.getElementById("overlay");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const list = document.getElementById("list");

/* ===== LOGIN ===== */
function openLogin(){ overlay.classList.remove("hidden"); }
function closeLogin(){ overlay.classList.add("hidden"); }

function login(){
  auth.signInWithEmailAndPassword(
    user.value.trim(),
    pass.value
  ).catch(err => {
    console.log("AUTH ERROR:", err.code, err.message);
    alert(err.code);
  });
}




function logout(){ auth.signOut(); }

auth.onAuthStateChanged(u=>{
  const isAdmin = !!u;

  adminPanel.classList.toggle("hidden", !isAdmin);
  loginBtn.classList.toggle("hidden", isAdmin);

  if(isAdmin){
    closeLogin();   // ✅ ĐÓNG POPUP Ở ĐÂY
  }

  renderSchedules();
});


/* ===== BADGE ===== */
function getBadge(time){
  const now = new Date();
  const d = new Date(time);
  const diff = Math.floor((d - now) / 86400000);

  if(diff === 0) return {t:"NOW",c:"today"};
  if(diff === 1) return {t:"TOMORROW",c:"tomorrow"};
  if(diff > 1) return {t:"COMING SOON",c:"upcoming"};
  return {t:"PAST",c:"future"};
}

function expired24h(time){
  return Date.now() - new Date(time).getTime() > 86400000;
}

/* ===== CRUD ===== */
let editId = null;

function saveSchedule(){
  if(!activity.value || !time.value) return alert("Thiếu thông tin");

  const data = {
    activity: activity.value,
    keywords: keywords.value,
    hashtags: hashtags.value,
    member: member.value,
    time: time.value
  };

  if(editId){
    db.collection("schedules").doc(editId).set(data);
    editId = null;
  }else{
    db.collection("schedules").add(data);
  }

  activity.value = keywords.value = hashtags.value = time.value = "";
}

function editSchedule(id,data){
  editId = id;
  activity.value = data.activity;
  keywords.value = data.keywords;
  hashtags.value = data.hashtags;
  member.value = data.member;
  time.value = data.time;
}

function deleteSchedule(id){
  if(confirm("Xóa lịch này?")){
    db.collection("schedules").doc(id).delete();
  }
}

/* ===== RENDER ===== */
function renderSchedules(){
  list.innerHTML="";
  const q = search.value.toLowerCase();

  db.collection("schedules").orderBy("time").onSnapshot(snap=>{
    list.innerHTML="";
    snap.forEach(doc=>{
      const s = doc.data();
      if(!s.activity.toLowerCase().includes(q)) return;

      if(!auth.currentUser && expired24h(s.time)) return;

      const b = getBadge(s.time);
      const timeBK = new Date(s.time).toLocaleString("en-GB",{timeZone:"Asia/Bangkok"});

      const div = document.createElement("div");
      div.className="schedule";

      div.innerHTML=`
        <div class="schedule-left">
          <strong>${s.activity}
            <span class="badge ${b.c}">${b.t}</span>
          </strong>
          <div class="time">🕒 ${timeBK}</div>
          <div>🔑 ${s.keywords||""}</div>
          <div class="hashtags">${s.hashtags||""}</div>
        </div>

        <div class="schedule-right">
          ${auth.currentUser ? `
            <div class="action-btns">
              <button class="edit-btn" onclick='editSchedule("${doc.id}",${JSON.stringify(s)})'>Sửa</button>
              <button class="danger" onclick='deleteSchedule("${doc.id}")'>Xóa</button>
            </div>
          `:""}
          <div class="member-name member-${s.member.replace(" ","")}">${s.member}</div>
        </div>
      `;
      list.appendChild(div);
    });
  });
}

renderSchedules();
