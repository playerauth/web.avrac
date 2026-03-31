function isAndroidOnly() {
  return /Android/i.test(navigator.userAgent);
}
const main = document.getElementById("main");
const desktop = document.getElementById("desktop");
if (isAndroidOnly()) {
  main.style.display = "block";
  desktop.style.display = "none";
} else {
  main.style.display = "none";
  desktop.style.display = "block";
}