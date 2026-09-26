//  js loading - loads the whole code

window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    const content = document.getElementById("content");

    const sources = new Set();

    // 1. All <img> tags
    document.querySelectorAll("img").forEach(img => {
        if (img.src) sources.add(img.src);
    });

    // 2. All elements with inline background-image
    document.querySelectorAll("*").forEach(el => {
        const style = getComputedStyle(el);
        const bg = style.backgroundImage;
        if (bg && bg !== "none") {
            const matches = bg.match(/url\((['"])?(.*?)\1\)/g);
            if (matches) {
                matches.forEach(m => {
                    const url = m.replace(/^url\((['"])?(.*?)\1\)$/, "$2");
                    sources.add(url);
                });
            }
        }
    });

    // 3. All data-bg attributes (like in your sidenav)
    document.querySelectorAll("[data-bg]").forEach(el => {
        const bg = el.getAttribute("data-bg");
        if (bg) {
            const url = bg.replace(/^url\((['"])?(.*?)\1\)$/, "$2");
            sources.add(url);
        }
    });

    // Turn into array
    const images = Array.from(sources);
    let loaded = 0;

    if (images.length === 0) {
        // no images? just hide loader immediately
        preloader.style.opacity = "0";
        setTimeout(() => {
            preloader.style.display = "none";
            content.style.display = "block";
            content.style.opacity = "1";
        }, 600);
        return;
    }

    // Preload them all
    images.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loaded++;
            if (loaded === images.length) {
                preloader.style.opacity = "0";
                setTimeout(() => {
                    preloader.style.display = "none";
                    content.style.display = "block";
                    content.style.opacity = "1";
                }, 600);
            }
        };
        img.src = src;
    });
});

//  js - only remove hash after nav clicks

document.querySelectorAll('a[data-target]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const target = document.getElementById(targetId);

        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

//  js - nav active state
// Select all links that have data-target

const allLinks = document.querySelectorAll("a[data-target]");

allLinks.forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();

        const target = link.getAttribute("data-target");

        // Remove active class from all links
        allLinks.forEach(l => l.classList.remove("active"));

        // Add active class to all links that match the clicked target
        allLinks.forEach(l => {
            if (l.getAttribute("data-target") === target) {
                l.classList.add("active");
            }
        });
    });
});

//  js resp nav

function openNav() {
    document.getElementById("mySidenav").style.width = "100%";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

// Auto open/close
const card = document.querySelector('.card');

let toggleCount = 0;
const interval = setInterval(() => {
    card.classList.toggle('open');
    toggleCount++;

    // if (toggleCount >= 6) { // 3 opens + 3 closes
    if (toggleCount >= 2) { // 1 opens + 1 closes
        clearInterval(interval);

        // Enable manual click toggle after auto phase
        card.addEventListener("click", () => {
            card.classList.toggle('open');
        });
    }
}, 2000);


// ------------------- MUSIC -------------------
const music = document.getElementById("bg-music");
const btn = document.getElementById("music-btn");

btn.addEventListener("click", () => {
    if (music.muted) {
        music.muted = false;
        btn.textContent = "🔊 Mute";
    } else {
        music.muted = true;
        btn.textContent = "🔇 Unmute";
    }
});

window.addEventListener("load", () => {
    music.play().catch(err => {
        console.log("Autoplay blocked, waiting for user interaction...", err);
    });
});

// first interaction = start music
window.addEventListener("click", () => {
    music.play();
}, { once: true });

window.addEventListener("load", () => {
    if (music.muted) {
        music.play().catch(() => { }); // safe: muted autoplay always allowed
    }
});

const params = new URLSearchParams(window.location.search);
const familyParam = params.get("family");

document.getElementById("openInviteBtn").addEventListener("click", () => {
  if (!familyParam) {
    alert("Missing family link");
    return;
  }

  window.location.href = `rsvp.html?family=${familyParam}`;
});

document.querySelectorAll(".clickable-img").forEach(img => {
    img.addEventListener("click", () => {
      window.open(img.src, "_blank");
    });
});

const warning = document.getElementById("mobileWarning");
const closeBtn = document.getElementById("closeWarning");

if (window.innerWidth <= 432) {
  warning.style.display = "flex";
}

closeBtn.addEventListener("click", () => {
  warning.style.display = "none";
});

// function checkScreenSize() {
//     if (window.innerWidth <= 432) {
//       alert("Open on Desktop for better experience view!");
//     }
// }
  
// // Run on load
// checkScreenSize();

// // Run on resize
// window.addEventListener("resize", checkScreenSize);

// let shown = false;

// function checkScreenSize() {
//   if (window.innerWidth <= 432 && !shown) {
//     alert("Open on Desktop for better experience view!");
//     shown = true;
//   }
// }

// checkScreenSize();
// window.addEventListener("resize", checkScreenSize);