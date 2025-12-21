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

/* ================= ELEMENTS ================= */
const overlay = document.getElementById("overlay");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const list = document.getElementById("list");
const searchInput = document.getElementById("search");

/* ================= LOGIN ================= */
function openLogin(){ overlay.classList.remove("hidden"); }
function closeLogin(){ overlay.classList.add("hidden"); }

function login(){
  auth.signInWithEmailAndPassword(
    user.value.trim(),
    pass.value
  ).catch(err => alert(err.code));
}

function logout(){ auth.signOut(); }

auth.onAuthStateChanged(u=>{
  adminPanel.classList.toggle("hidden", !u);
  loginBtn.classList.toggle("hidden", !!u);
  if(u) closeLogin();
  drawSchedules(); // chỉ vẽ lại, KHÔNG đụng firestore
});

/* ================= STATE ================= */
let schedulesCache = [];   // 🔥 CACHE DUY NHẤT
let memberFilter = "ALL";
let editId = null;

/* ================= TIME UTILS ================= */
function sameDay(a,b){
  return a.getFullYear()===b.getFullYear() &&
         a.getMonth()===b.getMonth() &&
         a.getDate()===b.getDate();
}

function getBadge(ts){
  const d = ts.toDate();
  const diff = Math.floor((d - new Date()) / 86400000);
  if(diff===0) return {t:"NOW",c:"today"};
  if(diff===1) return {t:"TOMORROW",c:"tomorrow"};
  if(diff>1) return {t:"COMING SOON",c:"upcoming"};
  return {t:"PAST",c:"future"};
}

/* ================= REALTIME LISTENER (1 LẦN DUY NHẤT) ================= */
db.collection("schedule")
  .orderBy("time")
  .onSnapshot(
    snap=>{
      schedulesCache = snap.docs.map(d=>({
        id: d.id,
        ...d.data()
      }));
      drawSchedules();
    },
    err=>{
      console.error("SNAPSHOT ERROR:", err);
      alert(err.message);
    }
  );

/* ================= DRAW UI ================= */
function drawSchedules(){
  list.innerHTML = "";
  const q = searchInput.value.toLowerCase();

  schedulesCache.forEach(s=>{
    if(memberFilter!=="ALL" && s.member!==memberFilter) return;
    if(!s.activity.toLowerCase().includes(q)) return;

    const b = getBadge(s.time);
    const timeBK = s.time.toDate().toLocaleString("en-GB", {
      timeZone:"Asia/Bangkok"
    });

    const div = document.createElement("div");
    div.className = "schedule";

    div.innerHTML = `
      <div class="schedule-left">
        <strong>
          ${s.activity}
          <span class="badge ${b.c}">${b.t}</span>
        </strong>
        <div>🕒 ${timeBK}</div>
        <div>🔑 ${s.keywords || ""}</div>
        <div class="hashtags">${s.hashtags || ""}</div>
      </div>

      <div class="schedule-right">
        ${auth.currentUser ? `
          <button onclick='editSchedule("${s.id}")'>Sửa</button>
          <button onclick='deleteSchedule("${s.id}")'>Xóa</button>
        ` : ""}
        <div class="member-name">${s.member}</div>
      </div>
    `;

    list.appendChild(div);
  });
}

/* ================= FILTER ================= */
function setMemberFilter(m){
  memberFilter = m;
  drawSchedules(); // ✅ CHỈ VẼ
}

searchInput.addEventListener("input", drawSchedules);

/* ================= CRUD ================= */
async function saveSchedule(){
  if(!activity.value || !time.value){
    alert("Thiếu thông tin");
    return;
  }

  const name = activity.value.trim();
  const inputDate = new Date(time.value);

  // check trùng
  for(const s of schedulesCache){
    if(editId && s.id===editId) continue;
    if(
      s.activity.toLowerCase()===name.toLowerCase() &&
      sameDay(s.time.toDate(), inputDate)
    ){
      alert("⚠️ Trùng hoạt động trong cùng ngày");
      return;
    }
  }

  const data = {
    activity: name,
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
  const s = schedulesCache.find(x=>x.id===id);
  if(!s) return;

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