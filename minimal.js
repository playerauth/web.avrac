function ups() {
  let ab = document.getElementById("voice-box");
  let bc = document.querySelector(".feat");
  ab.style.transform = "translateY(0)";
  bc.style.display =  "none";
}
function cut() {
  let ab = document.getElementById("voice-box");
  let bc = document.querySelector(".feat");
  ab.style.transform = "translateY(100%)";
  bc.style.display =  "block";
}
function dups() {
  let ab = document.getElementById("d-voice-box");
  let bc = document.querySelector(".d-feat");
  ab.style.transform = "translateY(0)";
  bc.style.display =  "none";
}
function dcut() {
  let ab = document.getElementById("d-voice-box");
  let bc = document.querySelector(".d-feat");
  ab.style.transform = "translateY(100%)";
  bc.style.display =  "block";
}

// Mobile search clear button
const mobileInput = document.getElementById("search");
const mobileClearBtn = document.getElementById("mclearBtn");

if (mobileInput && mobileClearBtn) {
  mobileInput.addEventListener("input", () => {
    mobileClearBtn.style.display = mobileInput.value ? "block" : "none";
  });

  mobileClearBtn.addEventListener("click", () => {
    mobileInput.value = "";
    mobileClearBtn.style.display = "none";
    mobileInput.focus();
  });
}

// Desktop search clear button
const desktopInput = document.getElementById("d-search");
const desktopClearBtn = document.getElementById("clearBtn");

if (desktopInput && desktopClearBtn) {
  desktopInput.addEventListener("input", () => {
    desktopClearBtn.style.display = desktopInput.value ? "block" : "none";
  });

  desktopClearBtn.addEventListener("click", () => {
    desktopInput.value = "";
    desktopClearBtn.style.display = "none";
    desktopInput.focus();
  });
}