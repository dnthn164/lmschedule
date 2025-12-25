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
const address  = document.getElementById("address");
const note     = document.getElementById("note");

/*********************************
 * ADMIN EMAIL LIST
 *********************************/
const ADMIN_EMAILS = [
  "dn.thn164@gmail.com",
  "admintest@gmail.com",
];
const SUPER_ADMIN = "dn.thn164@gmail.com";

let canAdd  = false;
let canEdit = false;

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
auth.onAuthStateChanged(u => {

  if (!u) {
    canAdd = false;
    canEdit = false;
    isAdmin = false;

    adminPanel.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    closeLogin();
    renderList();
    return;
  }

  const email = u.email;

  canAdd  = ADMIN_EMAILS.includes(email) || email === SUPER_ADMIN;
  canEdit = email === SUPER_ADMIN;
  isAdmin = canAdd;

  adminPanel.classList.toggle("hidden", !canAdd);
  loginBtn.classList.add("hidden");

  closeLogin();
  renderList();
});

/*********************************
 * FORM HELPERS
 *********************************/
function lockFields(){
  activity.disabled = true;
  address.disabled  = true;
  note.disabled     = true;
  member.disabled   = true;
  time.disabled     = true;
}

function unlockFields(){
  activity.disabled =
  address.disabled  =
  note.disabled     =
  member.disabled   =
  time.disabled     = false;
}

function resetForm(){
  activity.value =
  keywords.value =
  hashtags.value =
  address.value =
  note.value =
  time.value = "";

  member.value = "ALL";
  editId = null;
  unlockFields();
}

/*********************************
 * CRUD
 *********************************/
async function addSchedule(){

  if (!canAdd) {
    alert("❌ Bạn không có quyền");
    return;
  }

  if (!activity.value || !time.value) {
    alert("⚠️ Thiếu thông tin");
    return;
  }

  try {

    /************ EDIT ************/
    if (editId) {

      // SUPER ADMIN → sửa tất cả
      if (canEdit) {
        await db.collection("schedule").doc(editId).update({
          activity : activity.value.trim(),
          keywords : keywords.value.trim(),
          hashtags : hashtags.value.trim(),
          address  : address.value.trim(),
          note     : note.value.trim(),
          member   : member.value,
          time     : time.value
        });
      }
      // ADMIN → chỉ keywords & hashtags
      else {
        await db.collection("schedule").doc(editId).update({
          keywords : keywords.value.trim(),
          hashtags : hashtags.value.trim()
        });
      }

      resetForm();
      alert("✅ Đã cập nhật");
      return;
    }

    /************ ADD ************/
    await db.collection("schedule").add({
      activity : activity.value.trim(),
      keywords : keywords.value.trim(),
      hashtags : hashtags.value.trim(),
      address  : address.value.trim(),
      note     : note.value.trim(),
      member   : member.value,
      time     : time.value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    resetForm();
    alert("✅ Đã thêm lịch");

  } catch (err) {
    alert("❌ Lỗi: " + err.message);
  }
  document.getElementById("cancelBtn").style.display = "none";

}

/*********************************
 * EDIT
 *********************************/
function editSchedule(id){
  const s = cache[id];
  if(!s) return;

  activity.value = s.activity || "";
  keywords.value = s.keywords || "";
  hashtags.value = s.hashtags || "";
  address.value  = s.address || "";
  note.value     = s.note || "";
  member.value   = s.member || "ALL";
  time.value     = s.time || "";

  editId = id;

  // 🔥 HIỆN NÚT BỎ QUA
  document.getElementById("cancelBtn").style.display = "inline-block";

  if (canEdit) {
    activity.disabled =
    address.disabled  =
    note.disabled     =
    member.disabled   =
    time.disabled     = false;
  } else {
    activity.disabled = true;
    address.disabled  = true;
    note.disabled     = true;
    member.disabled   = true;
    time.disabled     = true;
  }
}


/*********************************
 * DELETE (SUPER ADMIN ONLY)
 *********************************/
async function deleteSchedule(id){
  if (!canEdit) {
    alert("❌ Chỉ SUPER ADMIN mới được xóa");
    return;
  }

  if (!confirm("Xóa lịch này?")) return;
  await db.collection("schedule").doc(id).delete();
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
/*function getTimeBadge(timeStr){ 
 const now = new Date(); 
 const d = new Date(timeStr); 
 const n0 = new Date(now.setHours(0,0,0,0)); 
 const d0 = new Date(d.setHours(0,0,0,0)); 
 const diff = (d0 - n0) / 86400000; 
  

 // 🔥 TRENDING trong 24h kể từ giờ nhập
  if(isTrending24hFromStart(timeStr)){
    return { text:"TRENDING NOW", cls:"badge-trending" };
  }

 if(diff === 0) return { text:"TODAY", cls:"badge-now" }; 
 if(diff === 1) return { text:"TOMORROW", cls:"badge-tomorrow" }; 
 if(diff > 1) return { text:"COMING SOON", cls:"badge-soon" }; 
 
 return null; } */
 function getTimeBadge(timeStr){ 
  const now   = Date.now();
  const start = new Date(timeStr).getTime();
  const end   = start + 86400000; // +24h

  // ⏳ ĐÃ QUA (sau khi hết TRENDING)
  if (now > end) {
    return { text:"PAST", cls:"badge-past" };
  }

  // 🔥 TRENDING trong 24h kể từ giờ nhập
  if (now >= start && now <= end) {
    return { text:"TRENDING NOW", cls:"badge-trending" };
  }

  const today0 = new Date().setHours(0,0,0,0);
  const d0     = new Date(timeStr).setHours(0,0,0,0);
  const diff   = (d0 - today0) / 86400000;

  if (diff === 0) return { text:"TODAY", cls:"badge-now" };
  if (diff === 1) return { text:"TOMORROW", cls:"badge-tomorrow" };
  if (diff > 1)  return { text:"COMING SOON", cls:"badge-soon" };

  return null;
}

 function isExpired24h(timeStr){ 
 return Date.now() - new Date(timeStr).getTime() > 86400000; } 
/*********************************
 * RENDER
 *********************************/
function renderList(){
  list.innerHTML = "";

  const items = Object.values(cache);

// sort: chưa qua trước, đã qua sau
items.sort((a, b) => {
  const aPast = isPast(a.time);
  const bPast = isPast(b.time);

  if (aPast !== bPast) return aPast ? 1 : -1;

  // cùng trạng thái → sort theo time
  return new Date(a.time) - new Date(b.time);
});

items.forEach(s => {

    if (memberFilter !== "ALL" && s.member !== memberFilter) return;
    if (search.value && !s.activity.toLowerCase().includes(search.value.toLowerCase())) return;

    const badge = getTimeBadge(s.time); // ✅ ĐÚNG CHỖ

    const div = document.createElement("div");
    div.className = `schedule member-${s.member}`;

    div.innerHTML = `
      <div class="schedule-left">
        <strong>
          ${s.activity}
          ${badge ? `<span class="badge ${badge.cls}">${badge.text}</span>` : ""}
        </strong>

        <div class="time">🕒 ${new Date(s.time).toLocaleString("vi-VN")}</div>
        <div class="keywords">🔑 ${s.keywords || ""}</div>
        <div class="hashtags">#️⃣ ${s.hashtags || ""}</div>
        <div class="address">📍 ${s.address || ""}</div>
        <div class="note">📝 ${s.note || ""}</div>
      </div>

      <div class="schedule-right">
        ${isAdmin ? `
          <button onclick="editSchedule('${s.id}')">Sửa</button>
          ${canEdit ? `<button class="danger" onclick="deleteSchedule('${s.id}')">Xóa</button>` : ``}
        ` : ``}
        <div class="member-tag">${s.member}</div>
      </div>
    `;
if (isPast(s.time)) div.classList.add("past");

    list.appendChild(div);
    
  });
}

function cancelEdit(){
  if (!editId) return;

  // reset form + thoát chế độ sửa
  activity.value =
  keywords.value =
  hashtags.value =
  address.value =
  note.value =
  time.value = "";

  member.value = "ALL";
  editId = null;

  // mở lại toàn bộ input
  activity.disabled =
  address.disabled  =
  note.disabled     =
  member.disabled   =
  time.disabled     = false;

  // ẩn nút bỏ qua
  document.getElementById("cancelBtn").style.display = "none";
}
document.addEventListener("click", function (e) {

  if (!e.target.classList.contains("hashtags")) return;

  const schedule = e.target.closest(".schedule");
  if (!schedule) return;

  const keywordsEl = schedule.querySelector(".keywords");
  const hashtagsEl = schedule.querySelector(".hashtags");

  const cleanText = (el, icon) => {
    if (!el) return "";
    let text = el.textContent.trim();
    return text.startsWith(icon) ? text.slice(icon.length).trim() : text;
  };

  const keywordsText = cleanText(keywordsEl, "🔑");

  let hashtagsText = cleanText(hashtagsEl, "#️⃣");
  hashtagsText = hashtagsText
    .split(/\s+/)
    .filter(Boolean)
    .map(t => t.startsWith("#") ? t : `#${t}`)
    .join(" ");

  const textToCopy = `${keywordsText}\n${hashtagsText}`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    showCopySuccess();
  });
});
function showCopySuccess(){
  const toast = document.createElement("div");
  toast.textContent = "✅ Đã copy Keywords & Hashtags";
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    padding: 10px 16px;
    border-radius: 999px;
    font-size: 13px;
    z-index: 9999;
    opacity: 0;
    transition: 0.3s;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.style.opacity = 1);

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}
/*********************************
 * MEMBER FILTER
 *********************************/
function setMemberFilter(val){
  memberFilter = val;
  renderList();

  // active tab UI (nếu có)
  document.querySelectorAll(".member-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.member === val);
  });
}
function isTrending24hFromStart(timeStr){
  const now   = Date.now();
  const start = new Date(timeStr).getTime();
  const end   = start + 86400000; // +24h

  return now >= start && now <= end;
}
function isPast(timeStr){
  const start = new Date(timeStr).getTime();
  const end   = start + 86400000; // +24h
  return Date.now() > end;
}

///////////////Sticky///////////////////
const filterBar = document.getElementById("filterBar");
const anchor    = document.getElementById("stickyAnchor");

const observer = new IntersectionObserver(
  ([entry]) => {
    // khi anchor KHÔNG còn nhìn thấy → sticky
    filterBar.classList.toggle("is-sticky", !entry.isIntersecting);
  },
  {
    threshold: 0
  }
);

observer.observe(anchor);

document.querySelectorAll('.filter-bar button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.scrollIntoView({ behavior:'smooth', inline:'center' });
  });
});
