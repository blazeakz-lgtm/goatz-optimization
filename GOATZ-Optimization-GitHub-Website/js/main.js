// Smoothly highlight the navigation link while scrolling.
const sections = document.querySelectorAll("section[id]");
const links = document.querySelectorAll(".navbar nav a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 150) current = section.id;
  });
  links.forEach(link => {
    link.style.color = link.getAttribute("href") === "#" + current ? "#c56aff" : "";
  });
});
