// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Elementos do DOM
const loadDataBtn = document.getElementById('loadData');
const dataContainer = document.getElementById('dataContainer');
const contribuinteForm = document.getElementById('FormContribuinte');
const submitBtn = document.getElementById('submitBtn');

// Função para carregar dados dos contribuintes
async function loadContribuintes() {
    try {
        showLoading('Carregando dados...');
        
        const response = await fetch(`${API_BASE_URL}/contribuintes`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contribuintes = await response.json();
        displayContribuintes(contribuintes);
        
    } catch (error) {
        console.error('Erro ao carregar contribuintes:', error);
        showError('Erro ao carregar dados. Verifique se o servidor está rodando.');
    }
}

// Função para exibir contribuintes na tela
function displayContribuintes(contribuintes) {
    if (contribuintes.length === 0) {
        dataContainer.innerHTML = '<p>Nenhum contribuinte encontrado.</p>';
        return;
    }
    
    const html = `
        <h2>Contribuintes Cadastrados (${contribuintes.length})</h2>
        <div class="contribuintes-grid">
            ${contribuintes.map(contribuinte => `
                <div class="contribuinte-card">
                    <div class="contribuinte-header">
                        <h3>${contribuinte.nome}</h3>
                        <span class="contribuinte-id">#${contribuinte.id}</span>
                    </div>
                    <div class="contribuinte-info">
                        <p><strong>Email:</strong> ${contribuinte.email}</p>
                        <p><strong>Telefone:</strong> ${contribuinte.telefone || 'Não informado'}</p>
                        <p><strong>Função:</strong> ${formatarFuncao(contribuinte.funcao)}</p>
                        <p><strong>Data de Nascimento:</strong> ${formatarData(contribuinte.data_nascimento)}</p>
                        ${contribuinte.condicao_trabalhista ? `<p><strong>Condição:</strong> ${formatarCondicao(contribuinte.condicao_trabalhista)}</p>` : ''}
                        <p><strong>Cadastrado em:</strong> ${formatarDataHora(contribuinte.created_at)}</p>
                    </div>
                    <div class="contribuinte-actions">
                        <button onclick="editarContribuinte(${contribuinte.id})" class="btn-edit">✏️ Editar</button>
                        <button onclick="deletarContribuinte(${contribuinte.id})" class="btn-delete">🗑️ Deletar</button>
                        ${contribuinte.foto_path ? `<button onclick="verFoto('${contribuinte.foto_path}')" class="btn-photo">📷 Ver Foto</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    dataContainer.innerHTML = html;
}

// Função para enviar formulário de contribuinte
async function submitContribuinte(event) {
    event.preventDefault();
    
    const formData = new FormData(contribuinteForm);
    
    try {
        showLoading('Enviando dados...');
        
        const response = await fetch(`${API_BASE_URL}/contribuintes`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Contribuinte cadastrado com sucesso!');
            contribuinteForm.reset();
            loadContribuintes(); // Recarregar lista
        } else {
            throw new Error(result.error || 'Erro ao cadastrar contribuinte');
        }
        
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        showError(error.message);
    }
}

// Função para deletar contribuinte
async function deletarContribuinte(id) {
    if (!confirm('Tem certeza que deseja deletar este contribuinte?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/contribuintes/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Contribuinte deletado com sucesso!');
            loadContribuintes(); // Recarregar lista
        } else {
            throw new Error(result.error || 'Erro ao deletar contribuinte');
        }
        
    } catch (error) {
        console.error('Erro ao deletar contribuinte:', error);
        showError(error.message);
    }
}

// Função para editar contribuinte (exemplo básico)
function editarContribuinte(id) {
    showInfo(`Função de edição para contribuinte ID: ${id} ainda não implementada.`);
}

// Função para ver foto
function verFoto(fotoPath) {
    if (fotoPath) {
        window.open(`http://localhost:3000/${fotoPath}`, '_blank');
    }
}

// Funções de formatação
function formatarFuncao(funcao) {
    const funcoes = {
        'cardiologista': 'Cardiologista',
        'enfermeiro': 'Enfermeiro',
        'neurologista': 'Neurologista',
        'pediatra': 'Pediatra',
        // Adicionar mais conforme necessário
    };
    return funcoes[funcao] || funcao;
}

function formatarCondicao(condicao) {
    const condicoes = {
        'stress_ocupacional': 'Estresse Ocupacional',
        'lesao_por_esforco_repetitivo': 'Lesão por Esforço Repetitivo (LER)',
        'burnout': 'Síndrome de Burnout',
        // Adicionar mais conforme necessário
    };
    return condicoes[condicao] || condicao;
}

function formatarData(data) {
    if (!data) return 'Não informado';
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarDataHora(dataHora) {
    if (!dataHora) return 'Não informado';
    return new Date(dataHora).toLocaleString('pt-BR');
}

// Funções de feedback visual
function showLoading(message) {
    dataContainer.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(message) {
    dataContainer.innerHTML = `<div class="error">❌ ${message}</div>`;
}

function showSuccess(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `✅ ${message}`;
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showInfo(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification info';
    notification.innerHTML = `ℹ️ ${message}`;
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Função para validar formulário
function validateForm() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const foto = document.getElementById('foto').files[0];
    
    const isValid = nome && email && foto;
    submitBtn.disabled = !isValid;
    
    return isValid;
}

// Função para formatação de telefone (mantida do código original)
function formatarTelefone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value.substring(0, 15); 
}

// Função para atualizar crachá
function atualizarCracha() {
    const nome = document.getElementById('cracha-input-nome').value;
    const cargo = document.getElementById('cracha-input-cargo').value;
    
    document.getElementById('cracha-nome').textContent = nome || 'Nome do Funcionário';
    document.getElementById('cracha-cargo').textContent = cargo || 'Cargo';
}

// Função para gerar QR Code
function gerarQRCode() {
    const nome = document.getElementById('cracha-input-nome').value;
    const cargo = document.getElementById('cracha-input-cargo').value;
    
    if (!nome || !cargo) {
        showError('Por favor, preencha nome e cargo para gerar o QR Code.');
        return;
    }
    
    const qrData = `Nome: ${nome}\nCargo: ${cargo}\nData: ${new Date().toLocaleDateString('pt-BR')}`;
    
    // Limpar QR Code anterior
    document.getElementById('qrcode-display').innerHTML = '';
    
    // Gerar novo QR Code
    new QRCode(document.getElementById('qrcode-display'), {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff'
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados ao clicar no botão
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', loadContribuintes);
    }
    
    // Enviar formulário
    if (contribuinteForm) {
        contribuinteForm.addEventListener('submit', submitContribuinte);
        
        // Validação em tempo real
        const requiredFields = ['nome', 'email', 'foto'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', validateForm);
                field.addEventListener('change', validateForm);
            }
        });
    }
    
    // QR Code button
    const qrButton = document.getElementById('qr-code-buttum');
    if (qrButton) {
        qrButton.addEventListener('click', gerarQRCode);
    }
    
    // Validação inicial
    validateForm();
});

// Função para toggle do formulário de feedback
function toggleFeedbackForm() {
    const feedbackSection = document.getElementById('feedback-section');
    if (feedbackSection) {
        feedbackSection.style.display = feedbackSection.style.display === 'none' ? 'block' : 'none';
    }
}

// Função para enviar feedback
async function enviarFeedback(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const feedbackData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        mensagem: formData.get('mensagem')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: