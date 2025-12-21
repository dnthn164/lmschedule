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
    console.error(err);
    alert(err.code);
  });
}

function logout(){
  auth.signOut();
}

auth.onAuthStateChanged(u=>{
  const isAdmin = !!u;

  adminPanel.classList.toggle("hidden", !isAdmin);
  loginBtn.classList.toggle("hidden", isAdmin);

  if(isAdmin) closeLogin();

  renderSchedules();
});

/* ===== TIME UTILS ===== */
function sameDay(d1, d2){
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function expired24h(timestamp){
  return Date.now() - timestamp.toDate().getTime() > 86400000;
}

/* ===== BADGE ===== */
function getBadge(timestamp){
  const now = new Date();
  const d = timestamp.toDate();
  const diff = Math.floor((d - now) / 86400000);

  if(diff === 0) return {t:"NOW",c:"today"};
  if(diff === 1) return {t:"TOMORROW",c:"tomorrow"};
  if(diff > 1) return {t:"COMING SOON",c:"upcoming"};
  return {t:"PAST",c:"future"};
}

/* ===== CRUD ===== */
let editId = null;

async function saveSchedule(){
  if(!activity.value || !time.value){
    alert("Thiếu thông tin");
    return;
  }

  const activityName = activity.value.trim();
  const inputDate = new Date(time.value);

  /* ===== CHECK TRÙNG ===== */
  const snap = await db.collection("schedule").get();

  for(const doc of snap.docs){
    if(editId && doc.id === editId) continue;

    const s = doc.data();
    const existDate = s.time.toDate();

    if(
      s.activity.trim().toLowerCase() === activityName.toLowerCase() &&
      sameDay(existDate, inputDate)
    ){
      alert("⚠️ Trùng hoạt động trong cùng ngày");
      return;
    }
  }

  const data = {
    activity: activityName,
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

function editSchedule(id, data){
  editId = id;
  activity.value = data.activity;
  keywords.value = data.keywords;
  hashtags.value = data.hashtags;
  member.value = data.member;

  const d = data.time.toDate();
  time.value = d.toISOString().slice(0,16);
}

function deleteSchedule(id){
  if(confirm("Xóa lịch này?")){
    db.collection("schedule").doc(id).delete();
  }
}

/* ===== RENDER ===== */
let unsub = null;

function renderSchedules(){
  if(unsub) unsub();

  console.log("🔥 renderSchedules called");

  list.innerHTML = "";
  const q = search.value.toLowerCase();

  unsub = db.collection("schedule")
    .orderBy("time")
    .onSnapshot(
      snap => {
        console.log("📦 SNAP SIZE:", snap.size);

        list.innerHTML = "";

        snap.forEach(doc=>{
          console.log("📄 DOC:", doc.id, doc.data());

          const s = doc.data();

          if(!s.activity.toLowerCase().includes(q)) return;
          if(!auth.currentUser && expired24h(s.time)) return;

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
              <div>🔑 ${s.keywords || ""}</div>
              <div class="hashtags">${s.hashtags || ""}</div>
            </div>

            <div class="schedule-right">
              ${auth.currentUser ? `
                <div class="action-btns">
                  <button class="edit-btn"
                    onclick='editSchedule("${doc.id}", ${JSON.stringify(s)})'>
                    Sửa
                  </button>
                  <button class="danger"
                    onclick='deleteSchedule("${doc.id}")'>
                    Xóa
                  </button>
                </div>
              ` : ""}
              <div class="member-name member-${s.member.replace(" ","")}">
                ${s.member}
              </div>
            </div>
          `;

          list.appendChild(div);
        });
      },
      err => {
        console.error("❌ SNAPSHOT ERROR:", err);
        alert(err.message);
      }
    );
}

renderSchedules();
