// rsvp.js (unified strategy with required + optional guests and deadline)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYh7_eqCr-RA00s8hiv6Fi4gZ9TSgfunY",
  authDomain: "wedding---rsvp.firebaseapp.com",
  projectId: "wedding---rsvp",
  storageBucket: "wedding---rsvp.appspot.com",
  messagingSenderId: "935089116365",
  appId: "1:935089116365:web:c7a2b4de76b77bba8dc584",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

function downloadICS({ title, description, location, start, end }) {
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RSVP System//Wedding Invite//EN

BEGIN:VEVENT
UID:wedding-beirut-2026@rsvp-system
DTSTAMP:${formatDate(new Date())}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
STATUS:CONFIRMED
URL:https://wedding---rsvp.web.app

DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}

BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Wedding Is Tomorrow!
END:VALARM

BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Wedding Starts In 2 Hours!!
END:VALARM

END:VEVENT
END:VCALENDAR
`;

  const blob = new Blob([icsContent], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "event.ics";
  a.click();

  URL.revokeObjectURL(url);
}

window.addEventListener("DOMContentLoaded", () => {
  const rsvpForm = document.getElementById("rsvpForm");
  const familyTitle = document.getElementById("familyTitle");
  const membersContainer = document.getElementById("membersContainer");
  const commentInput = document.getElementById("comment");
  const deadlineNotice = document.getElementById("deadlineNotice");

  let currentFamilyId = null;
  let currentFamilyData = null;

  if (!rsvpForm) {
    console.error("❌ rsvpForm not found in HTML");
    return;
  }

  console.log("✅ RSVP JS loaded");

  // -----------------------------
  // DEADLINE DISPLAY
  // -----------------------------
  get(ref(db, "settings/deadline"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        deadlineNotice.textContent = `🕒 Kindly reply before: ${snapshot.val()} (RSVP Deadline)`;
      } else {
        deadlineNotice.textContent = "";
      }
    })
    .catch((err) => {
      console.error("Deadline error:", err);
    });

  // -----------------------------
  // PARSE URL
  // -----------------------------
  function parseFamilyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const familyParam = urlParams.get("family");

    if (!familyParam) return null;

    const separator = "__";
    const i = familyParam.indexOf(separator);
    if (i === -1) return null;

    const name = decodeURIComponent(
      familyParam.slice(0, i).replace(/_/g, " ")
    );

    const id = familyParam.slice(i + separator.length);

    return { familyName: name, familyId: id };
  }

  // -----------------------------
  // RENDER FORM
  // -----------------------------
  function showRSVPForm(family) {
    membersContainer.innerHTML = "";
    commentInput.value = "";
    rsvpForm.style.display = "block";
  
    const totalAllowed = family.allowedMembers || 0;
  
    familyTitle.textContent = `Dear "${family.name}" Family, you are invited! (${totalAllowed} attending)`;
  
    const members = family.members || [];
  
    for (let i = 0; i < totalAllowed; i++) {
      const member = members[i] || { name: "", type: "optional" };
      const isSpecial = member.type === "special";
  
      const memberDiv = document.createElement("div");
      memberDiv.className = "member-row";
  
      let nameInput = null;
  
      if (isSpecial) {
        const nameLabel = document.createElement("p");
        nameLabel.textContent = 'is ' + member.name + ' attending?';
        memberDiv.appendChild(nameLabel);
        nameLabel.style.paddingTop = '15px';
        memberDiv.style.borderBottom = '1px solid grey';
        memberDiv.style.paddingBottom = '20px';
      } else {
        const nameLabel = document.createElement("p");
        // nameLabel.textContent = member.name;
        // nameLabel.textContent = 'is ' + member.name + ' attending?';
        nameLabel.textContent = 'is ' + (member.name || 'a member') + ' attending?';
        memberDiv.appendChild(nameLabel);
        nameLabel.style.paddingTop = '15px';
        memberDiv.style.borderBottom = '1px solid grey';
        memberDiv.style.paddingBottom = '20px';
        nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "Optional Guest Name";
        nameInput.name = `guestName_${i}`;
        memberDiv.appendChild(nameInput);
      }
  
      // YES
      const yesLabel = document.createElement("label");
      const yesRadio = document.createElement("input");
      yesRadio.type = "radio";
      yesRadio.name = `attending_${i}`;
      yesRadio.value = "yes";
      yesRadio.required = true;
      yesLabel.appendChild(yesRadio);
      yesLabel.append(" Yes");
      memberDiv.appendChild(yesLabel);
  
      // NO
      const noLabel = document.createElement("label");
      const noRadio = document.createElement("input");
      noRadio.type = "radio";
      noRadio.name = `attending_${i}`;
      noRadio.value = "no";
      noLabel.appendChild(noRadio);
      noLabel.append(" No");
      memberDiv.appendChild(noLabel);
  
      // Optional validation
      if (!isSpecial && nameInput) {
        yesRadio.addEventListener("change", () => {
          nameInput.required = true;
        });
  
        noRadio.addEventListener("change", () => {
          nameInput.required = false;
          nameInput.value = "";
        });
      }
  
      membersContainer.appendChild(memberDiv);
    }
  }

  // -----------------------------
  // LOAD FAMILY
  // -----------------------------
  async function loadFamilyById(familyId) {
    try {
      const snapshot = await get(ref(db, `families/${familyId}`));

      if (!snapshot.exists()) {
        familyTitle.textContent = "Invalid family link";
        rsvpForm.style.display = "none";
        return false;
      }

      currentFamilyId = familyId;
      currentFamilyData = snapshot.val();

      showRSVPForm(currentFamilyData);
      return true;
    } catch (err) {
      console.error(err);
      familyTitle.textContent = "Error loading family";
      rsvpForm.style.display = "none";
      return false;
    }
  }

  // -----------------------------
  // INIT PAGE
  // -----------------------------
  (async () => {
    const parsed = parseFamilyFromUrl();

    if (!parsed) {
      familyTitle.textContent = "Invalid RSVP link";
      rsvpForm.style.display = "none";
      return;
    }

    familyTitle.textContent = `Loading "${parsed.familyName}" Family..`;

    await loadFamilyById(parsed.familyId);

    // DEADLINE CHECK
    const snap = await get(ref(db, "settings/deadline"));

    if (snap.exists()) {
      const deadlineStr = snap.val();
      const [datePart, timePart] = deadlineStr.split(" - ");
      const [d, m, y] = datePart.split("/");
      const [h, min, s] = timePart.split(":");

      const deadline = new Date(y, m - 1, d, h, min, s);

      if (new Date() > deadline) {
        rsvpForm.style.display = "none";
        familyTitle.textContent = "RSVP closed";
        return;
      }
    }
  })();

  // -----------------------------
  // SUBMIT
  // -----------------------------
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    console.log("🔥 SUBMIT CLICKED");
  
    if (!currentFamilyId || !currentFamilyData) {
      alert("Family not loaded");
      return;
    }
  
    const members = currentFamilyData.members || [];
    const totalAllowed = currentFamilyData.allowedMembers || 0;
  
    const attendance = [];
    const replacements = {};
  
    for (let i = 0; i < totalAllowed; i++) {
      const radios = document.getElementsByName(`attending_${i}`);
  
      let attending = null;
      radios.forEach((r) => {
        if (r.checked) attending = r.value;
      });
  
      if (!attending) {
        alert("Please answer all guests");
        return;
      }
  
      const member = members[i] || { name: "", type: "optional" };
  
      const input = document.querySelector(`input[name="guestName_${i}"]`);
      let guestName = member.name;
  
      if (input && input.value.trim()) {
        guestName = input.value.trim();
      }
  
      if (attending === "yes" && !guestName) {
        alert("Missing guest name");
        return;
      }
  
      if (member.type !== "special" && attending === "yes") {
        replacements[member.name || `guest_${i}`] = guestName;
      }
  
      attendance.push({
        originalName: member.name,
        finalName: guestName,
        type: member.type,
        attending,
      });
    }
  
    const comment = commentInput.value.trim();
    // const now = new Date().toISOString();
    const now = formatDateTime(new Date());
  
    try {
      // STEP 1: SAVE RSVP
      await set(ref(db, "rsvps/" + currentFamilyId), {
        familyName: currentFamilyData.name,
        attendance,
        comment,
        timestamp: now,
      });
  
      console.log("✅ RSVP saved");
  
      // STEP 2: UPDATE FAMILY (isolated safety)
      try {
        await update(ref(db, "families/" + currentFamilyId), {
          status: "submitted",
          timeSubmitted: now,
          replacements,
        });
  
        console.log("✅ Family updated");
      } catch (updateErr) {
        console.warn("⚠️ Family update failed (non-critical):", updateErr);
      }
  
      alert("RSVP submitted successfully!");
  
      // rsvpForm.reset();
      // rsvpForm.style.display = "none";
      // familyTitle.textContent = "Thank you!";

      // window.location.href = `index.html`;

      // Hide form
rsvpForm.reset();
rsvpForm.style.display = "none";

// Build confirmation UI
const confirmBox = document.createElement("div");
confirmBox.style.textAlign = "center";
confirmBox.style.padding = "40px 20px";
confirmBox.style.opacity = "0";
confirmBox.style.transition = "opacity 0.4s ease";

// Buttons container
const actions = document.createElement("div");
actions.style.marginTop = "25px";
actions.style.display = "flex";
actions.style.justifyContent = "center";
actions.style.gap = "15px";

// Calendar button
const calendarBtn = document.createElement("button");
calendarBtn.textContent = "📅 Save the Date";
calendarBtn.style.padding = "10px 20px";
calendarBtn.style.cursor = "pointer";

// Back home button
const backBtn = document.createElement("button");
backBtn.textContent = "← Back Home";
backBtn.style.padding = "10px 20px";
backBtn.style.cursor = "pointer";

// Append buttons
actions.appendChild(calendarBtn);
actions.appendChild(backBtn);

// Message
const titleEl = document.createElement("h2");
titleEl.textContent = "✅ Your RSVP is confirmed";

const subEl = document.createElement("p");
subEl.textContent = "We’re excited to celebrate with you.";

// Assemble
confirmBox.appendChild(titleEl);
confirmBox.appendChild(subEl);
confirmBox.appendChild(actions);

// Inject into DOM
rsvpForm.parentNode.appendChild(confirmBox);
familyTitle.textContent = "Confirmed";

// Fade-in effect
setTimeout(() => {
  confirmBox.style.opacity = "1";
}, 100);

// ---- BUTTON LOGIC ----

// Prevent multiple downloads
let downloaded = false;

calendarBtn.onclick = () => {
  if (downloaded) return;
  downloaded = true;

  const familyName = currentFamilyData?.name || "Guest";

  downloadICS({
    title: `${familyName} Family Invitation`,
    description: `You are invited to celebrate with us.`,
    location: "Beirut, Lebanon",
    start: new Date("2026-07-15T18:00:00"),
    end: new Date("2026-07-15T23:00:00"),
  });

  calendarBtn.textContent = "Saved ✓";
};

// Redirect
backBtn.onclick = () => {
  window.location.href = "index.html";
};
  
    } catch (err) {
      console.error("❌ RSVP submit failed:", err);
      alert("Failed to submit RSVP");
    }
  });
});