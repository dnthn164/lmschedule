/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

/* ================= ELEMENTS ================= */
const overlay = document.getElementById("overlay");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const list = document.getElementById("list");

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
  renderSchedules();
});

/* ================= UTILS ================= */
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

/* ================= CRUD ================= */
let editId = null;

async function saveSchedule(){
  if(!activity.value || !time.value) return alert("Thiếu thông tin");

  const name = activity.value.trim();
  const inputDate = new Date(time.value);

  const snap = await db.collection("schedule").get();
  for(const d of snap.docs){
    if(editId && d.id===editId) continue;
    const s = d.data();
    if(
      s.activity.toLowerCase()===name.toLowerCase() &&
      sameDay(s.time.toDate(), inputDate)
    ){
      alert("⚠️ Trùng hoạt động trong ngày");
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

  editId
    ? await db.collection("schedule").doc(editId).set(data)
    : await db.collection("schedule").add(data);

  editId=null;
  activity.value=keywords.value=hashtags.value=time.value="";
}

function editSchedule(id,s){
  editId=id;
  activity.value=s.activity;
  keywords.value=s.keywords;
  hashtags.value=s.hashtags;
  member.value=s.member;
  time.value=s.time.toDate().toISOString().slice(0,16);
}

function deleteSchedule(id){
  if(confirm("Xóa lịch này?"))
    db.collection("schedule").doc(id).delete();
}

/* ================= FILTER ================= */
let memberFilter="ALL";
function setMemberFilter(m){
  memberFilter=m;
  renderSchedules();
}

/* ================= RENDER ================= */
let unsub=null;

function renderSchedules(){
  if(unsub) unsub();

  const q = search.value.toLowerCase();
  list.innerHTML="";

  unsub = db.collection("schedule")
    .orderBy("time")
    .onSnapshot(snap=>{
      list.innerHTML="";

      snap.forEach(doc=>{
        const s = doc.data();

        if(memberFilter!=="ALL" && s.member!==memberFilter) return;
        if(!s.activity.toLowerCase().includes(q)) return;

        const b=getBadge(s.time);
        const timeBK=s.time.toDate().toLocaleString("en-GB",{timeZone:"Asia/Bangkok"});

        const div=document.createElement("div");
        div.className="schedule";
        div.innerHTML=`
          <strong>${s.activity} <span class="${b.c}">${b.t}</span></strong>
          <div>🕒 ${timeBK}</div>
          <div>${s.keywords}</div>
          <div>${s.hashtags}</div>
          <div>${s.member}</div>
          ${auth.currentUser?`
            <button onclick='editSchedule("${doc.id}",${JSON.stringify(s)})'>Sửa</button>
            <button onclick='deleteSchedule("${doc.id}")'>Xóa</button>`:""}
        `;
        list.appendChild(div);
      });
    });
}

renderSchedules();
