// manager-8f3a9d2b7c.js (Full Version with Total Members Limit + Auto Family Allowed Members + Manager Phone + Family URLs + Timestamps)

// ===============================
// Firebase Config
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, get, remove } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAYh7_eqCr-RA00s8hiv6Fi4gZ9TSgfunY",
  authDomain: "wedding---rsvp.firebaseapp.com",
  projectId: "wedding---rsvp",
  storageBucket: "wedding---rsvp.appspot.com",
  messagingSenderId: "935089116365",
  appId: "1:935089116365:web:c7a2b4de76b77bba8dc584"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------------------------------------------------------------------------

function formatDateTime(date) {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}

// ===============================
// DOM Elements
// ===============================
const familiesContainer = document.getElementById("familiesContainer");
const addFamilyBtn = document.getElementById("addFamilyBtn");

// ===============================
// Manager Phone Field
// ===============================
const managerPhoneWrapper = document.createElement("div");
managerPhoneWrapper.innerHTML = `
  <label>Manager's Phone Number:</label>
  <input type="tel" id="managerPhone" placeholder="96176134251">
  <button id="saveManagerPhoneBtn">💾 Save Phone</button>
  <p id="managerPhoneMsg" style="color:green;"></p>
`;
familiesContainer.parentNode.insertBefore(managerPhoneWrapper, familiesContainer);

document.getElementById("saveManagerPhoneBtn").addEventListener("click", () => {
  const phoneVal = document.getElementById("managerPhone").value || "";
  // set(ref(db, "managerPhone"), { phone: phoneVal });
  set(ref(db, "settings/managerPhone"), phoneVal);
  document.getElementById("managerPhoneMsg").textContent = `✅ Saved: ${phoneVal}`;
});

// ===============================
// Global Total Allowed Members
// ===============================
const totalMembersWrapper = document.createElement("div");
totalMembersWrapper.innerHTML = `
  <label>Total Allowed Members (All Families):</label>
  <input type="number" id="totalAllowedMembers" min="1" placeholder="e.g. 150">
  <button id="saveTotalBtn">💾 Save Total</button>
  <p id="totalSavedMsg" style="color:green;"></p>
`;
familiesContainer.parentNode.insertBefore(totalMembersWrapper, familiesContainer);

const deadlineWrapper = document.createElement("div");
deadlineWrapper.innerHTML = `
  <label>RSVP Deadline:</label>
  <input type="datetime-local" id="deadlineInput">
  <button id="saveDeadlineBtn">💾 Save Deadline</button>
  <p id="deadlineMsg" style="color:green;"></p>
`;
familiesContainer.parentNode.insertBefore(deadlineWrapper, familiesContainer);

document.getElementById("saveTotalBtn").addEventListener("click", () => {
  const totalVal = parseInt(document.getElementById("totalAllowedMembers").value || 0);
  // set(ref(db, "totalAllowedMembers"), { total: totalVal });
  set(ref(db, "settings/totalAllowedMembers"), totalVal);
  document.getElementById("totalSavedMsg").textContent = `✅ Saved: ${totalVal} members total`;
});

document.getElementById("saveDeadlineBtn").addEventListener("click", () => {
  const val = document.getElementById("deadlineInput").value;

  if (!val) return;

  const formatted = formatDateTime(new Date(val));

  set(ref(db, "settings/deadline"), formatted);

  document.getElementById("deadlineMsg").textContent = `✅ Saved: ${formatted}`;
});

async function loadSettings() {
  const snapshot = await get(ref(db, "settings"));
  if (!snapshot.exists()) return;

  const s = snapshot.val();

  if (s.managerPhone) {
    document.getElementById("managerPhone").value = s.managerPhone;
    // to display manager's phone number
    document.getElementById("managerPhoneMsg").textContent = `✅ Saved: ${s.managerPhone} (Manager's Phone Number)`;
  }

  if (s.totalAllowedMembers) {
    document.getElementById("totalAllowedMembers").value = s.totalAllowedMembers;
    // to display total allowed members
    document.getElementById("totalSavedMsg").textContent = `✅ Saved: Total ${s.totalAllowedMembers} Allowed Members (All Families)`;
  }

  if (s.deadline) {
    document.getElementById("deadlineInput").value = s.deadline;
    // to display deadline
    document.getElementById("deadlineMsg").textContent = `✅ Saved: ${s.deadline} (Deadline Date/Time)`;
  }
}

loadSettings();

// ===============================
// Helper → Slugify family name
// ===============================
function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ===============================
// Get total members count across all families
// ===============================
function getTotalMembersCount() {
  let total = 0;
  familiesContainer.querySelectorAll(".family-block").forEach(familyDiv => {
    total += familyDiv.querySelectorAll(".member-entry").length;
  });
  return total;
}

// ===============================
// Helper Function
// ===============================
async function getSavedMembersCount() {
  const snap = await get(ref(db, "families"));
  const families = snap.val() || {};

  let total = 0;

  Object.values(families).forEach(f => {
    total += (f.members || []).length;
  });

  return total;
}

// ===============================
// Add New Family
// ===============================
let familyCount = 0;
addFamilyBtn.addEventListener("click", () => {
  familyCount++;
  const familyId = `family-${familyCount}`;

  const familyDiv = document.createElement("div");
  familyDiv.classList.add("family-block");
  familyDiv.setAttribute("data-id", familyId);

  familyDiv.innerHTML = `
    <div class="family-header">
      <input type="text" placeholder="Family Name" class="family-name">
      <button class="toggle-btn">▶</button>
      <button class="delete-btn">❌</button>
    </div>
    <div class="family-body" style="display:none;">
      <label>Allowed Members:</label>
      <input type="number" class="allowed-members" readonly>

      <div class="members-container"></div>
      <button class="add-member-btn">➕ Add Member</button>

      <label>Phone Number:</label>
      <input type="tel" class="family-phone" placeholder="96176134251">

      <button class="save-family-btn">Save Family ✅</button>
      <p class="family-url" style="color:green;"></p>
    </div>
  `;
  familiesContainer.appendChild(familyDiv);

  const toggleBtn = familyDiv.querySelector(".toggle-btn");
  const body = familyDiv.querySelector(".family-body");
  const allowedInput = familyDiv.querySelector(".allowed-members");
  const membersContainer = familyDiv.querySelector(".members-container");

  // Expand/Collapse
  toggleBtn.addEventListener("click", () => {
    body.style.display = body.style.display === "none" ? "block" : "none";
    toggleBtn.textContent = body.style.display === "none" ? "▶" : "▼";
  });

  // Delete Family
  familyDiv.querySelector(".delete-btn").addEventListener("click", () => {
    familyDiv.remove();
  });

  // Add Member
  const addMemberBtn = familyDiv.querySelector(".add-member-btn");
  // addMemberBtn.addEventListener("click", () => {
  //   // const totalAllowed = parseInt(document.getElementById("totalAllowedMembers").value || 0);
  //   // const currentTotal = getTotalMembersCount();

  //   // if (currentTotal >= totalAllowed) {
  //   //   alert(`❌ Total members exceeded! Maximum allowed: ${totalAllowed}`);
  //   //   return;
  //   // }

  //   const totalAllowed = parseInt(document.getElementById("totalAllowedMembers").value || 0);

  //   const savedTotal = await getSavedMembersCount();
  //   const currentUI = getTotalMembersCount();

  //   // total real usage = saved + current editing
  //   const effectiveTotal = savedTotal + currentUI;

  //   if (effectiveTotal >= totalAllowed) {
  //     alert(`❌ Total members exceeded! Maximum allowed: ${totalAllowed}`);
  //     return;
  //   }

  //   const memberDiv = document.createElement("div");
  //   memberDiv.classList.add("member-entry");
  //   const radioName = `guest-${familyId}-${Date.now()}`;
  //   memberDiv.innerHTML = `
  //     <input type="text" placeholder="Member Name">
  //     <label><input type="radio" name="${radioName}" value="special"> Special</label>
  //     <label><input type="radio" name="${radioName}" value="optional" checked> Optional</label>
  //     <button class="remove-member">❌</button>
  //   `;
  //   membersContainer.appendChild(memberDiv);

  //   // Update allowed members for this family
  //   allowedInput.value = membersContainer.querySelectorAll(".member-entry").length;

  //   // Remove member
  //   memberDiv.querySelector(".remove-member").addEventListener("click", () => {
  //     memberDiv.remove();
  //     allowedInput.value = membersContainer.querySelectorAll(".member-entry").length;
  //   });
  // });

  addMemberBtn.addEventListener("click", async () => {

    const totalAllowed = parseInt(document.getElementById("totalAllowedMembers").value || 0);
  
    const savedTotal = await getSavedMembersCount();
    const currentUI = getTotalMembersCount();
  
    const effectiveTotal = savedTotal + currentUI;
  
    if (effectiveTotal >= totalAllowed) {
      alert(`❌ Total members exceeded! Maximum allowed: ${totalAllowed}`);
      return;
    }
  
    const memberDiv = document.createElement("div");
    memberDiv.classList.add("member-entry");
  
    const radioName = `guest-${familyId}-${Date.now()}`;
  
    memberDiv.innerHTML = `
      <input type="text" placeholder="Member Name">
      <label><input type="radio" name="${radioName}" value="special"> Special</label>
      <label><input type="radio" name="${radioName}" value="optional" checked> Optional</label>
      <button class="remove-member">❌</button>
    `;
  
    membersContainer.appendChild(memberDiv);
  
    allowedInput.value = membersContainer.querySelectorAll(".member-entry").length;
  
    memberDiv.querySelector(".remove-member").addEventListener("click", () => {
      memberDiv.remove();
      allowedInput.value = membersContainer.querySelectorAll(".member-entry").length;
    });
  });

  // Save Family → Firebase
  familyDiv.querySelector(".save-family-btn").addEventListener("click", () => {
    const famName = familyDiv.querySelector(".family-name").value || "Unnamed";
    const allowed = allowedInput.value || 0;
    const phone = familyDiv.querySelector(".family-phone").value || "-";

    // const members = [];
    // membersContainer.querySelectorAll(".member-entry").forEach(m => {
    //   const name = m.querySelector("input[type=text]").value || "a member";
    //   const type = m.querySelector("input[type=radio]:checked").value;
    //   members.push({ name, type });
    // });

    const members = [];

    membersContainer.querySelectorAll(".member-entry").forEach(m => {
      const input = m.querySelector("input[type=text]");
      const name = input.value.trim();
      const type = m.querySelector("input[type=radio]:checked")?.value;

      // Validation
      if (type === "special" && !name) {
        alert("Please enter a name for special members.");
        input.focus();
        throw new Error("Validation stopped"); // stops execution
      }

      members.push({
        name: name || "a member",
        type
      });
    });

    // const timeAdded = new Date().toISOString();
    const timeAdded = formatDateTime(new Date());

    const familiesRef = ref(db, "families");
    const newFamRef = push(familiesRef);

    set(newFamRef, {
      name: famName, // IMPORTANT FIX
      allowedMembers: parseInt(allowed),
      phone: phone,
      members: members,
      replacements: {}, // NEW (for later use)
      status: "Pending...",
      timeAdded: timeAdded,
      timeSubmitted: null
    });

    const uniqueKey = newFamRef.key;
    const famSlug = slugify(famName);
    // const famUrl = `https://yourdomain.com/index.html?family=${famSlug}${uniqueKey}`;
    const famUrl = `https://wedding---rsvp.web.app/index.html?family=${famSlug}__${uniqueKey}`;
    familyDiv.querySelector(".family-url").textContent = `Family Link: ${famUrl}`;
  });
});

// ===============================
// Auto-Sync: RSVP Statuses (Date/Time Added & Submitted)
// ===============================
const familiesRef = ref(db, "families");

let globalDeadline = "";

async function loadDeadline() {
  const snap = await get(ref(db, "settings"));
  if (!snap.exists()) return;

  const s = snap.val();
  globalDeadline = s.deadline || "";
}

loadDeadline();

  onValue(familiesRef, async (snapshot) => {
    const data = snapshot.val();
  
    const rsvpSnapshot = await get(ref(db, "rsvps"));
    const rsvps = rsvpSnapshot.val() || {};
  
    let html = ``;
  
    if (!data) {
      document.getElementById("statusPanel").innerHTML = "<p>No families found.</p>";
      return;
    }
  
    Object.entries(data).forEach(([key, f], index) => {
      const rsvp = rsvps[key]; // 🔥 THIS IS THE LINK BETWEEN FAMILY & RSVP
    const famSlug = slugify(f.name || "family");
    const famUrl = `https://wedding---rsvp.web.app/index.html?family=${famSlug}__${key}`;
    
    // const message = encodeURIComponent(
    //   `${f.name} Family, you're invited to our wedding 🎉\n\nPlease confirm here:\n${url}\n\nWe hope to see you around us in OUR SPECIAL DAY!`
    // );
    const phone = (f.phone || "").replace(/\D/g, ""); // clean phone number
    const message = encodeURIComponent(
      `\nDear "${f.name}" Family, \n\nYou're warmly invited to our wedding 🎉\n\nKindly confirm your attendance here: \n${famUrl}\n\n\nWe would be honored to celebrate our SPECIAL DAY with you 💍\n\n🕒 Kindly reply before: ${globalDeadline} (RSVP Deadline)\n\nAs we're hoping to see you around us.. \nAdam & Eve ❤️\n
      \n\n\nعائلة "${f.name}" الكريمة، \n\nيسعدنا دعوتكم لحضور حفل زفافنا 🎉\n\nيرجى تأكيد حضوركم من خلال الرابط التالي: \n${famUrl}\n\n\nسيكون شرفًا كبيرًا لنا مشاركتكم فرحتنا في هذا اليوم المميز 💍\n\n🕒 يُرجى الرد قبل: ${globalDeadline} (آخر موعد لتأكيد الحضور)\n\nونأمل أن تكونوا معنا في هذه المناسبة الجميلة.. \nآدم و حواء ❤️\n`
    );

    const membersHtml = (f.members || []).map((m, i) => {
      return `
        <tr>
          <td>Member ${i + 1}</td>
          <td contenteditable="false" class="member-cell" 
    data-key="${key}" 
    data-index="${i}">
  ${m.name} / ${m.type}
</td>
        </tr>
      `;
    }).join("");

    // Replacement logic (if exists)
    let replacementsHtml = "";
    if (f.replacements) {
      Object.entries(f.replacements).forEach(([original, replacement], i) => {
        replacementsHtml += `
          <tr>
            <td>Member ${i + 1} Replacement</td>
            <td>${replacement} (instead of "${original}")</td>
          </tr>
        `;
      });
    }

    html += `
  <div class="family-table-block">
    <div class="family-header" style="cursor:pointer;">
      <strong>Family ${index + 1}</strong> ▶
    </div>

    <div class="family-body" style="display:none;">
      <table border="1" cellpadding="6" cellspacing="0" style="margin-top:10px; width:100%;">
        
        <tbody>
        <tr>
  <td><strong>Family Name</strong></td>
  <td>
    ${f.name || "-"}
    <button class="delete-family-btn" data-key="${key}" style="margin-left:10px; color:red; cursor:pointer;">✖</button>
  </td>
</tr>
      
      
      
      <tr data-key="${key}" data-field="timeAdded">
        <td><strong>Date/Time (Added)</strong></td>
        <td>${f.timeAdded || "-"}</td>
      </tr>
      
      <tr data-key="${key}" data-field="phone">
        <td><strong>Phone</strong></td>
        <td>${f.phone || "- N/A Phone Number *"}</td>
      </tr>
      
      <tr data-key="${key}" data-field="allowedMembers">
        <td><strong>Allowed Members</strong></td>
        <td>${f.allowedMembers || 0}</td>
      </tr>

      ${membersHtml}

      ${replacementsHtml}

      <tr>
        <td><strong>Family Link</strong></td>
        <td>${famUrl}</td>
      </tr>

<tr>
<td><strong>RSVP</strong></td>
<td>
  ${
    rsvp
      ? `<button class="rsvp-view-btn" data-key="${key}">➜ View Submission</button>`
      : "Pending.. (No RSVP yet)"
  }
</td>
</tr>

<tr>
<td><strong title="Send Family Invite Link via WhatsApp">Invite Link via WA</strong></td>
<td>
  ${
    phone
      ? `<a href="https://wa.me/${phone}?text=${message}" target="_blank">
           <button class="invite-link-btn">➜ Send Link</button>
         </a>`
      : "No phone number available"
  }
</td>
</tr>

        </tbody>

      </table>
    </div>
    <br><hr><br>
  </div>
`;
  });

  document.getElementById("statusPanel").innerHTML = html;

  // =========================
  // Expand / Collapse Logic
  // =========================
  document.querySelectorAll(".family-header").forEach(header => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;

      const isOpen = body.style.display === "block";
      body.style.display = isOpen ? "none" : "block";

      header.innerHTML = header.innerHTML.includes("▼")
        ? header.innerHTML.replace("▼", "▶")
        : header.innerHTML.replace("▶", "▼");
    });
  });

});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-family-btn")) return;

  const key = e.target.dataset.key;
  if (!key) return;

  const confirmDelete = confirm("Delete this family permanently?");
  if (!confirmDelete) return;

  try {
    await remove(ref(db, `families/${key}`));
    console.log("✅ Family deleted");

    // Remove from UI instantly (optional, onValue will also refresh)
    const block = e.target.closest(".family-table-block");
    if (block) block.remove();

  } catch (err) {
    console.error("❌ Delete failed:", err);
  }
});

// ===============================
// Save All Families + Share Button
// ===============================
// const saveAllWrapper = document.createElement("div");
// saveAllWrapper.style.marginTop = "20px";
// saveAllWrapper.innerHTML = `
//   <button id="saveAllBtn">💾 Save All Families</button>
//   <button id="shareBtn" style="display:none;">📲 Share</button>
// `;
// familiesContainer.parentNode.appendChild(saveAllWrapper);

// const shareBtn = saveAllWrapper.querySelector("#shareBtn");

// document.getElementById("saveAllBtn").addEventListener("click", () => {
//   shareBtn.style.display = "inline-block";
// });

// shareBtn.addEventListener("click", async () => {
//   const snapshot = await get(ref(db, "families"));
//   const familiesData = snapshot.val();

//   if (!familiesData) return;

//   const families = Object.entries(familiesData);

//   for (let i = 0; i < families.length; i++) {
//     const [key, f] = families[i];

//     const famSlug = slugify(f.name);
//     const url = `https://yourdomain.com/index.html?family=${famSlug}__${key}`;

//     // const message = encodeURIComponent(
//     //   `${f.name} Family, you're invited to our wedding 🎉\n\nPlease confirm here:\n${url}\n\nWe hope to see you around us in OUR SPECIAL DAY!`
//     // );
//     // const message = encodeURIComponent(
//     //   `\nDear "${f.name}" Family, \n\nYou're warmly invited to our wedding 🎉\n\nKindly confirm your attendance here: \n${url}\n\n\nWe would be honored to celebrate our SPECIAL DAY with you 💍\n\nAs we're hoping to see you around us.. \nAdam & Eve ❤️\n`
//     // );
//     const message = encodeURIComponent(
//       `\nDear "${f.name}" Family, \n\nYou're warmly invited to our wedding 🎉\n\nKindly confirm your attendance here: \n${famUrl}\n\n\nWe would be honored to celebrate our SPECIAL DAY with you 💍\n\nAs we're hoping to see you around us.. \nAdam & Eve ❤️\n
//       \n\n\nعائلة "${f.name}" الكريمة، \n\nيسعدنا دعوتكم لحضور حفل زفافنا 🎉\n\nيرجى تأكيد حضوركم من خلال الرابط التالي: \n${famUrl}\n\n\nسيكون شرفًا كبيرًا لنا مشاركتكم فرحتنا في هذا اليوم المميز 💍\n\nونأمل أن تكونوا معنا في هذه المناسبة الجميلة.. \nآدم و حواء ❤️\n`
//     );

//     const phone = (f.phone || "").replace(/\D/g, "");

//     if (!phone) continue;

//     window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

//     // delay so browser doesn't block popups
//     await new Promise(r => setTimeout(r, 1200));
//   }
// });

function buildGlobalSummary(families, rsvps) {
  let totalFamilies = 0;

  let totalMembers = 0;
  let special = 0;
  let optional = 0;

  let attending = 0;
  let notAttending = 0;
  let pendingRSVP = 0;

  Object.entries(families).forEach(([key, f]) => {
    totalFamilies++;

    const members = f.members || [];
    totalMembers += members.length;

    const rsvp = rsvps[key];

    if (!rsvp) pendingRSVP++;

    members.forEach(m => {
      if (m.type === "special") special++;
      else optional++;

      if (rsvp && rsvp.attendance) {
        const match = rsvp.attendance.find(a => a.originalName === m.name);

        if (match) {
          if (match.attending === "yes") attending++;
          else notAttending++;
        } else {
          notAttending++;
        }
      } else {
        notAttending++;
      }
    });
  });

  return {
    totalFamilies,
    totalMembers,
    special,
    optional,
    attending,
    notAttending,
    pendingRSVP
  };
}

const settingsSnap = await get(ref(db, "settings"));
const settings = settingsSnap.val() || {};

document.getElementById("exportTxtBtn").addEventListener("click", async () => {
  const famSnap = await get(ref(db, "families"));
  const rsvpSnap = await get(ref(db, "rsvps"));

  const families = famSnap.val() || {};
  const rsvps = rsvpSnap.val() || {};

  let text = "\n===== RSVP MASTER REPORT =====\n\n\n";

  text += `Manager's Phone Number: ${settings.managerPhone || "- N/A *"}\n\n`;
  text += `Total Allowed Members (All Families): ${settings.totalAllowedMembers || "- N/A *"}\n\n`;
  text += `Deadline: ${settings.deadline || "- N/A *"}\n\n\n`;

  const summary = buildGlobalSummary(families, rsvps);

  text += "===== GLOBAL SUMMARY =====\n\n";
  text += `Total Families: ${summary.totalFamilies}\n`;
  text += `Total Members: ${summary.totalMembers}\n`;
  text += `Special Guests: ${summary.special}\n`;
  text += `Optional Guests: ${summary.optional}\n`;
  text += `Attending: ${summary.attending}\n`;
  text += `Not Attending / Declined: ${summary.notAttending}\n`;
  text += `Pending RSVP Families: ${summary.pendingRSVP}\n\n\n`;

  Object.entries(families).forEach(([key, f], index) => {
    const rsvp = rsvps[key];

    text += `==============================\n`;
    text += `Family ${index + 1}\n`;
    text += `==============================\n`;
    text += `Name: ${f.name}\n`;
    text += `Phone: ${f.phone || "- N/A *"}\n`;
    text += `Date/Time Added: ${f.timeAdded}\n`;
    text += `Family Link: ${f.url}\n`;
    text += `Allowed Members: ${f.allowedMembers}\n\n`;

    text += `--- Members ---\n`;
    (f.members || []).forEach((m, i) => {
      text += `#${i + 1}: ${m.name} (${m.type})\n`;
    });

    if (f.replacements) {
      text += `\n--- Replacements ---\n`;
      Object.entries(f.replacements).forEach(([orig, rep]) => {
        text += `${rep} (instead of ${orig})\n`;
      });
    }

    if (rsvp) {
      text += `\n--- RSVP ---\n`;
      text += `Date/Time Submitted: ${rsvp.timestamp}\n`;
      text += `Comment: ${rsvp.comment || "-"}\n\n`;

      text += `Attendance:\n`;
      rsvp.attendance.forEach(m => {
        text += `• ${m.originalName} → ${m.finalName} | ${m.type} | Attending: ${m.attending}\n`;
      });
    } else {
      text += `\nRSVP: Pending\n`;
    }

    text += `\n\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rsvp_report.txt";
  a.click();
});

document.getElementById("exportCsvBtn").addEventListener("click", async () => {
  const famSnap = await get(ref(db, "families"));
  const rsvpSnap = await get(ref(db, "rsvps"));

  const families = famSnap.val() || {};
  const rsvps = rsvpSnap.val() || {};

  let csv = `\nManager's Phone Number: ${settings.managerPhone || "- N/A *"}\n\n`;
  csv += `Total Allowed Members (All Families): ${settings.totalAllowedMembers || "- N/A *"}\n\n`;
  csv += `Deadline: ${settings.deadline || "- N/A *"}\n\n\n`;

  const summary = buildGlobalSummary(families, rsvps);

  csv += `GLOBAL SUMMARY\n`;
  csv += `Total Families,${summary.totalFamilies}\n`;
  csv += `Total Members,${summary.totalMembers}\n`;
  csv += `Special Guests,${summary.special}\n`;
  csv += `Optional Guests,${summary.optional}\n`;
  csv += `Attending,${summary.attending}\n`;
  csv += `Not Attending,${summary.notAttending}\n`;
  csv += `Pending RSVP Families,${summary.pendingRSVP}\n\n\n`;

  csv += "Family,Phone,Added,Allowed,Member Original,Member Final,Type,Attending,Comment\n\n";

  Object.entries(families).forEach(([key, f]) => {
    const rsvp = rsvps[key];

    if (rsvp) {
      rsvp.attendance.forEach(m => {
        csv += `"${f.name}","${f.phone}","${f.timeAdded}","${f.allowedMembers}","${m.originalName}","${m.finalName}","${m.type}","${m.attending}","${rsvp.comment || ""}"\n`;
      });
    } else {
      (f.members || []).forEach(m => {
        csv += `"${f.name}","${f.phone}","${f.timeAdded}","${f.allowedMembers}","${m.name}","","${m.type}","Pending..",""\n`;
      });
    }
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rsvp_report.csv";
  a.click();
});

document.getElementById("exportPdfBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const famSnap = await get(ref(db, "families"));
  const rsvpSnap = await get(ref(db, "rsvps"));

  const families = famSnap.val() || {};
  const rsvps = rsvpSnap.val() || {};

  const pageHeight = doc.internal.pageSize.height;
  const margin = 10;
  const lineHeight = 5;
  const maxWidth = 180;

  let y = margin;

  // 🔹 Wrap + measure text
  function getLines(text) {
    return doc.splitTextToSize(String(text), maxWidth);
  }

  // 🔹 Calculate height of a block WITHOUT rendering
  function calculateFamilyHeight(f, rsvp) {
    let totalLines = 0;

    const add = (text) => totalLines += getLines(text).length;

    add(`Manager's Phone Number: ${f.managerPhone}`);
    add(`Total Allowed Members: ${f.totalAllowedMembers}`);
    add(`Deadline: ${f.deadline}`);

    add(`Family: ${f.name}`);
    add(`Phone: ${f.phone || "- N/A *"}`);
    add(`Added: ${f.timeAdded}`);
    add(`Allowed: ${f.allowedMembers}`);

    add("Members:");
    (f.members || []).forEach(m => {
      add(`${m.name} (${m.type})`);
    });

    if (f.replacements) {
      add("Replacements:");
      Object.entries(f.replacements).forEach(([orig, rep]) => {
        add(`${rep} instead of ${orig}`);
      });
    }

    if (rsvp) {
      add("RSVP:");
      add(`Submitted: ${rsvp.timestamp}`);
      add(`Comment: ${rsvp.comment || "-"}`);

      add("Attendance:");
      rsvp.attendance.forEach(m => {
        add(`-  ${m.originalName}  —>  ${m.finalName}  |  ${m.type}  |  ${m.attending}`);
      });
    } else {
      add("RSVP: Pending..");
    }

    return totalLines * lineHeight + 10;
  }

  // 🔹 Render text safely
  function renderText(text, indent = 10) {
    const lines = getLines(text);

    lines.forEach(line => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, indent, y);
      y += lineHeight;
    });
  }

  // 🔹 Draw divider
  function drawDivider() {
    if (y + 5 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.line(10, y, 200, y);
    y += 10;
  }

  doc.setFontSize(16);
  renderText(`Manager's Phone Number: ${settings.managerPhone || "- N/A *"}`);
  drawDivider();
  renderText(`Total Allowed Members (All Families): ${settings.totalAllowedMembers || "- N/A *"}`);
  drawDivider();
  renderText(`Deadline: ${settings.deadline || "- N/A *"}`);
  drawDivider();

  const summary = buildGlobalSummary(families, rsvps);

  doc.setFontSize(14);
  renderText("===== GLOBAL SUMMARY =====");

  doc.setFontSize(10);
  renderText(`Total Families: ${summary.totalFamilies}`);
  renderText(`Total Members: ${summary.totalMembers}`);
  renderText(`Special Guests: ${summary.special}`);
  renderText(`Optional Guests: ${summary.optional}`);
  renderText(`Attending: ${summary.attending}`);
  renderText(`Not Attending / Declined: ${summary.notAttending}`);
  renderText(`Pending RSVP Families: ${summary.pendingRSVP}`);

  Object.entries(families).forEach(([key, f], index) => {
    const rsvp = rsvps[key];

    // 🔥 PREVENT SPLITTING
    const neededHeight = calculateFamilyHeight(f, rsvp);

    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    drawDivider();
    y += 10;
    
    // 🔹 Title
    doc.setFontSize(14);
    renderText(`Family ${index + 1}: ${f.name}`);

    doc.setFontSize(10);

    renderText(`Phone: ${f.phone || "- N/A *"}`);
    renderText(`Added: ${f.timeAdded}`);
    renderText(`Allowed Members: ${f.allowedMembers}`);

    drawDivider();

    // 🔹 Members
    renderText("Members:");
    (f.members || []).forEach(m => {
      renderText(`- ${m.name} (${m.type})`, 12);
    });

    // 🔹 Replacements
    if (f.replacements) {
      drawDivider();
      renderText("Replacements:");
      Object.entries(f.replacements).forEach(([orig, rep]) => {
        renderText(`- ${rep} (instead of ${orig})`, 12);
      });
    }

    // 🔹 RSVP
    drawDivider();

    if (rsvp) {
      renderText("RSVP:");
      renderText(`Submitted: ${rsvp.timestamp}`, 12);
      renderText(`Comment: ${rsvp.comment || "- N/A *"}`, 12);

      drawDivider();

      renderText("Attendance:");
      rsvp.attendance.forEach(m => {
        renderText(
          `-  ${m.originalName}  —>  ${m.finalName}  |  ${m.type}  |  ${m.attending}`,
          12
        );
      });
    } else {
      renderText("RSVP: Pending..");
    }

    y += 5;
  });

  doc.save("rsvp_report.pdf");
});

const modal = document.createElement("div");
modal.id = "rsvpModal";
modal.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

modal.innerHTML = `
  <div style="background:#fff;padding:20px;max-width:700px;width:90%;border-radius:10px;">
    <button id="closeRsvpModal">Close</button>
    <div id="rsvpContent"></div>
  </div>
`;

document.body.appendChild(modal);

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("rsvp-view-btn")) return;

  const key = e.target.dataset.key;

  const rsvpSnap = await get(ref(db, "rsvps/" + key));
  const rsvp = rsvpSnap.val();

  if (!rsvp) return;

  let html = `
    <h2>RSVP Details</h2>
    <p><strong>Family:</strong> ${rsvp.familyName}</p>
    <p><strong>Date/Time (Submitted):</strong> ${rsvp.timestamp}</p>
    <p><strong>Comment:</strong> ${rsvp.comment || "-"}</p>

    <hr>

    <h3>Members</h3>
    <table border="1" width="100%" cellpadding="6">
      <tr>
        <th>Original Name</th>
        <th>Type</th>
        <th>Final Name<br>(Replacement)</th>
        <th>Attending</th>
      </tr>
  `;

  rsvp.attendance.forEach(m => {
    html += `
      <tr>
        <td>${m.originalName}</td>
        <td>${m.type}</td>
        <td>${m.finalName}</td>
        <td>${m.attending}</td>
      </tr>
    `;
  });

  html += `</table>`;

  document.getElementById("rsvpContent").innerHTML = html;
  modal.style.display = "flex";
});

document.addEventListener("click", (e) => {
  if (e.target.id === "closeRsvpModal") {
    modal.style.display = "none";
  }
});