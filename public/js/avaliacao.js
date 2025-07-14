document.querySelectorAll('.slider').forEach(slider => {
    const valueDisplay = slider.parentElement.querySelector('.slider-value');
    
    slider.addEventListener('input', function() {
        const displayValue = getDisplayValue(this);
        valueDisplay.textContent = displayValue;
        updateSliderBackground(this);
    });
    
    // Initialize display
    const displayValue = getDisplayValue(slider);
    valueDisplay.textContent = displayValue;
    updateSliderBackground(slider);
});

function getDisplayValue(slider) {
    const value = parseInt(slider.value);
    const sliderId = slider.id;
    
    // Para o slider de tempo, mostrar em formato "Xh Ym" se for maior que 60
    if (sliderId === 'tempoSlider') {
        if (value >= 60) {
            const hours = Math.floor(value / 60);
            const minutes = value % 60;
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        } else {
            return `${value}m`;
        }
    }
    
    // Para o slider de lotação, mostrar como porcentagem
    if (sliderId === 'lotacaoSlider') {
        return `${value}%`;
    }
    
    // Para outros sliders, apenas o valor
    return value.toString();
}

function updateSliderBackground(slider) {
    const value = parseInt(slider.value);
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Determinar cor baseada no tipo de slider e valor
    let color = getSliderColor(slider, value);
    
    const gradient = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, var(--cinza-generico) ${percentage}%, var(--cinza-generico) 100%)`;
    slider.style.background = gradient;
}

function getSliderColor(slider, value) {
    const sliderId = slider.id;
    
    if (sliderId === 'lotacaoSlider') {
        // Lotação: Verde (0-30%), Amarelo (31-70%), Vermelho (71-100%)
        if (value <= 30) {
            return '#22c55e'; // Verde
        } else if (value <= 70) {
            return '#eab308'; // Amarelo
        } else {
            return '#ef4444'; // Vermelho
        }
    }
    
    if (sliderId === 'tempoSlider') {
        // Tempo: Verde (0-60min), Amarelo (61-120min), Vermelho (121+min)
        if (value <= 60) {
            return '#22c55e'; // Verde
        } else if (value <= 120) {
            return '#eab308'; // Amarelo
        } else {
            return '#ef4444'; // Vermelho
        }
    }
    
    // Para outros sliders, usar a lógica original baseada em escala 0-10
    const max = parseInt(slider.max);
    const normalizedValue = (value / max) * 10;
    
    if (normalizedValue <= 3) {
        return '#22c55e'; // Verde
    } else if (normalizedValue <= 6) {
        return '#eab308'; // Amarelo
    } else {
        return '#ef4444'; // Vermelho
    }
}
