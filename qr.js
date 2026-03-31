function isMobileOnly() {
  return /Android|iPhone/i.test(navigator.userAgent);
}
if (isMobileOnly()) {
  location.href="index.html"
} 



