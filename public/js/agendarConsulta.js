// Sistema de Agendamento de Consulta
class AgendamentoConsulta {
    constructor() {
        this.agendamento = {
            especialidade: null,
            data: null,
            horario: null,
            observacoes: ''
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setMinDate();
        this.updateResumo();
    }

    setupEventListeners() {
        // Especialidades
        const especialidades = document.querySelectorAll('.especialidade-option');
        especialidades.forEach(option => {
            option.addEventListener('click', (e) => this.selecionarEspecialidade(e));
        });

        // Horários
        const horarios = document.querySelectorAll('.horario-option:not(.indisponivel)');
        horarios.forEach(option => {
            option.addEventListener('click', (e) => this.selecionarHorario(e));
        });

        // Data
        const inputData = document.getElementById('data');
        inputData.addEventListener('change', (e) => this.selecionarData(e));

        // Observações
        const observacoes = document.getElementById('observacoes');
        observacoes.addEventListener('input', (e) => this.atualizarObservacoes(e));

        // Botão confirmar
        const btnConfirmar = document.getElementById('btn-confirmar');
        btnConfirmar.addEventListener('click', () => this.confirmarAgendamento());

        // Atualizar horários disponíveis quando mudar a data
        inputData.addEventListener('change', () => this.atualizarHorariosDisponiveis());
    }

    setMinDate() {
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        const dataFormatada = amanha.toISOString().split('T')[0];
        document.getElementById('data').min = dataFormatada;
    }

    selecionarEspecialidade(event) {
        // Remove seleção anterior
        document.querySelectorAll('.especialidade-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Adiciona seleção atual
        event.currentTarget.classList.add('selected');
        
        const especialidade = event.currentTarget.dataset.especialidade;
        this.agendamento.especialidade = this.formatarEspecialidade(especialidade);
        
        this.updateResumo();
        this.verificarFormularioCompleto();

        // Animação de feedback
        this.adicionarFeedbackVisual(event.currentTarget);
    }

    selecionarHorario(event) {
        if (event.currentTarget.classList.contains('indisponivel')) {
            return;
        }

        // Remove seleção anterior
        document.querySelectorAll('.horario-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Adiciona seleção atual
        event.currentTarget.classList.add('selected');
        
        this.agendamento.horario = event.currentTarget.dataset.horario;
        
        this.updateResumo();
        this.verificarFormularioCompleto();

        // Animação de feedback
        this.adicionarFeedbackVisual(event.currentTarget);
    }

    selecionarData(event) {
        const dataSelecionada = event.target.value;
        if (!dataSelecionada) return;

        this.agendamento.data = this.formatarData(dataSelecionada);
        
        this.updateResumo();
        this.verificarFormularioCompleto();
        
        // Resetar horário selecionado quando mudar data
        document.querySelectorAll('.horario-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.agendamento.horario = null;
    }

    atualizarObservacoes(event) {
        this.agendamento.observacoes = event.target.value;
    }

    atualizarHorariosDisponiveis() {
        const dataSelecionada = document.getElementById('data').value;
        if (!dataSelecionada) return;

        const data = new Date(dataSelecionada + 'T00:00:00');
        const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, etc.
        
        // Simular horários indisponíveis baseado no dia da semana
        const horariosIndisponiveis = this.getHorariosIndisponiveis(diaSemana);
        
        document.querySelectorAll('.horario-option').forEach(horario => {
            const horarioTexto = horario.dataset.horario;
            
            // Remove classes existentes
            horario.classList.remove('indisponivel', 'selected');
            
            // Adiciona indisponível se necessário
            if (horariosIndisponiveis.includes(horarioTexto)) {
                horario.classList.add('indisponivel');
            }
        });

        // Reset horário selecionado
        this.agendamento.horario = null;
        this.updateResumo();
        this.verificarFormularioCompleto();
    }

    getHorariosIndisponiveis(diaSemana) {
        // Simular diferentes disponibilidades por dia da semana
        const indisponiveis = {
            0: ['09:30', '11:30', '14:00', '16:30'], // Domingo
            1: ['09:30', '11:30', '16:30'], // Segunda
            2: ['08:00', '14:30', '17:30'], // Terça
            3: ['10:30', '15:30'], // Quarta
            4: ['09:30', '11:30', '16:30'], // Quinta
            5: ['08:30', '14:00', '17:00'], // Sexta
            6: ['09:30', '11:30', '14:00', '15:00', '16:30'] // Sábado
        };

        return indisponiveis[diaSemana] || ['09:30', '11:30', '16:30'];
    }

    formatarEspecialidade(especialidade) {
        const especialidades = {
            'cardiologia': 'Cardiologia',
            'ortopedia': 'Ortopedia',
            'neurologia': 'Neurologia',
            'pediatria': 'Pediatria'
        };
        return especialidades[especialidade] || especialidade;
    }

    formatarData(dataISO) {
        const data = new Date(dataISO + 'T00:00:00');
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateResumo() {
        document.getElementById('resumo-especialidade').textContent = 
            this.agendamento.especialidade || 'Selecione uma especialidade';
        
        document.getElementById('resumo-data').textContent = 
            this.agendamento.data || 'Selecione uma data';
        
        document.getElementById('resumo-horario').textContent = 
            this.agendamento.horario || 'Selecione um horário';
    }

    verificarFormularioCompleto() {
        const btnConfirmar = document.getElementById('btn-confirmar');
        const completo = this.agendamento.especialidade && 
                        this.agendamento.data && 
                        this.agendamento.horario;
        
        btnConfirmar.disabled = !completo;
        
        if (completo) {
            btnConfirmar.style.opacity = '1';
            btnConfirmar.style.cursor = 'pointer';
        } else {
            btnConfirmar.style.opacity = '0.5';
            btnConfirmar.style.cursor = 'not-allowed';
        }
    }

    adicionarFeedbackVisual(elemento) {
        // Adiciona efeito de "pulse" para feedback visual
        elemento.style.transform = 'scale(0.98)';
        setTimeout(() => {
            elemento.style.transform = 'scale(1)';
        }, 150);
    }

    confirmarAgendamento() {
        if (!this.agendamento.especialidade || !this.agendamento.data || !this.agendamento.horario) {
            this.mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        this.mostrarConfirmacao();
    }

    mostrarConfirmacao() {
        const modal = this.criarModal();
        document.body.appendChild(modal);
        
        // Animar entrada do modal
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0) scale(1)';
        }, 10);
    }

    criarModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            padding: 1rem;
            box-sizing: border-box;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: var(--color-bg);
            border-radius: 15px;
            padding: 2rem;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: translateY(50px) scale(0.9);
            transition: transform 0.3s ease;
            text-align: center;
        `;

        modalContent.innerHTML = `
            <div style="color: #10B981; font-size: 4rem; margin-bottom: 1rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 256 256" style="display: block; margin: 0 auto;">
                    <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
            </div>
            <h2 style="color: var(--azul-header); margin-bottom: 1rem; font-size: 1.5rem;">Consulta Agendada!</h2>
            <div style="background: var(--cinza-generico); padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; text-align: left;">
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: var(--color-fg);">Hospital:</strong>
                    <span style="color: var(--azul-generico); margin-left: 0.5rem;">Hospital São Rafael</span>
                </div>
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: var(--color-fg);">Especialidade:</strong>
                    <span style="color: var(--azul-generico); margin-left: 0.5rem;">${this.agendamento.especialidade}</span>
                </div>
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: var(--color-fg);">Data:</strong>
                    <span style="color: var(--azul-generico); margin-left: 0.5rem;">${this.agendamento.data}</span>
                </div>
                <div style="margin-bottom: 0.8rem;">
                    <strong style="color: var(--color-fg);">Horário:</strong>
                    <span style="color: var(--azul-generico); margin-left: 0.5rem;">${this.agendamento.horario}</span>
                </div>
                ${this.agendamento.observacoes ? `
                <div>
                    <strong style="color: var(--color-fg);">Observações:</strong>
                    <p style="color: var(--color-fg); margin-top: 0.5rem; opacity: 0.8;">${this.agendamento.observacoes}</p>
                </div>
                ` : ''}
            </div>
            <div style="background: rgba(234, 179, 8, 0.15); padding: 1rem; border-radius: 8px; margin: 1.5rem 0;">
                <p style="color: var(--warning-color); font-size: 0.9rem; margin: 0;">
                    <strong>Lembre-se:</strong> Chegue 15 minutos antes do horário e traga um documento com foto.
                </p>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button id="btn-fechar-modal" style="
                    flex: 1;
                    padding: 0.8rem;
                    background: var(--cinza-generico);
                    color: var(--color-fg);
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                ">Fechar</button>
                <button id="btn-ver-historico" style="
                    flex: 1;
                    padding: 0.8rem;
                    background: var(--azul-generico);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: transform 0.2s ease;
                ">Ver Histórico</button>
            </div>
        `;

        modal.appendChild(modalContent);

        // Event listeners para os botões
        modal.querySelector('#btn-fechar-modal').addEventListener('click', () => {
            this.fecharModal(modal);
        });

        modal.querySelector('#btn-ver-historico').addEventListener('click', () => {
            this.salvarAgendamento();
            window.location.href = 'historico.html';
        });

        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.fecharModal(modal);
            }
        });

        return modal;
    }

    fecharModal(modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(50px) scale(0.9)';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    salvarAgendamento() {
        // Simular salvamento do agendamento
        const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
        
        const novoAgendamento = {
            id: Date.now(),
            hospital: 'Hospital São Rafael',
            especialidade: this.agendamento.especialidade,
            data: this.agendamento.data,
            horario: this.agendamento.horario,
            observacoes: this.agendamento.observacoes,
            status: 'Agendado',
            dataAgendamento: new Date().toISOString()
        };

        agendamentos.unshift(novoAgendamento);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    }

    mostrarAlerta(mensagem, tipo = 'info') {
        const alerta = document.createElement('div');
        alerta.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${tipo === 'warning' ? '#f59e0b' : '#10b981'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        
        alerta.textContent = mensagem;
        document.body.appendChild(alerta);

        // Animar entrada
        setTimeout(() => {
            alerta.style.transform = 'translateX(0)';
        }, 10);

        // Remover após 3 segundos
        setTimeout(() => {
            alerta.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (alerta.parentNode) {
                    alerta.parentNode.removeChild(alerta);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new AgendamentoConsulta();
});

// Adicionar estilos CSS adicionais
const estilosAdicionais = document.createElement('style');
estilosAdicionais.textContent = `
    .especialidade-option, .horario-option {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .especialidade-option:active, .horario-option:active {
        transform: scale(0.98);
    }
    
    .btn-agendar:active {
        transform: translateY(-1px) scale(0.98);
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .pulse {
        animation: pulse 0.3s ease-in-out;
    }
`;

document.head.appendChild(estilosAdicionais);