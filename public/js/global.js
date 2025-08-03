let html = document.querySelector("html")

document.addEventListener("DOMContentLoaded", () => {
    let temaSalvo = localStorage.getItem("theme");
    if (temaSalvo) {
        html.setAttribute("data-theme", temaSalvo);
    }
});