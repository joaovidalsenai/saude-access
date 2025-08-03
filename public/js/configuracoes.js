// Script para atualizar o valor do range
const rangeSlider = document.getElementById('raio-range');
const rangeValue = document.querySelector('.range-value');

rangeSlider.addEventListener('input', function () {
    rangeValue.textContent = this.value + ' km';
});

// Script para verificar o tema atual e ajustar o toggle
document.addEventListener('DOMContentLoaded', function () {
    const temaToggle = document.getElementById('tema-toggle');
    const tema = document.documentElement.getAttribute('data-theme');

    if (tema === 'dark') {
        temaToggle.checked = true;
    }

    temaToggle.addEventListener('change', function () {
        mudarTema();
    });
});

function mudarTema() {
    const html = document.documentElement;
    const temaToggle = document.getElementById('tema-toggle');

    if (temaToggle.checked) {
        html.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        html.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
}
