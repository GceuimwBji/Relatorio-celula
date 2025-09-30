// Estado da Aplicação (armazenado em memória durante a sessão)
let STATE = {
  pessoas: [],
  presencas: {}
};

// Utilitários
function getCurrentWeek() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

function getUltimasSemanas() {
  const semanas = [getCurrentWeek()];
  const hoje = new Date();
  
  for (let i = 1; i <= 3; i++) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - (i * 7));
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    semanas.push(`${ano}-${mes}-${dia}`);
  }
  return semanas;
}

function formatarData(semana) {
  const [ano, mes, dia] = semana.split('-');
  return `${dia}/${mes}`;
}

function salvarEstado() {
  // Aqui você pode adicionar integração com backend futuramente
  console.log('Estado salvo:', STATE);
}

function carregarEstado() {
  // Aqui você pode adicionar integração com backend futuramente
  // Por enquanto, dados ficam em memória durante a sessão
}

// Funções de Negócio
function adicionarPessoa() {
  const nome = document.getElementById('inputNome').value.trim();
  const tipo = document.getElementById('selectTipo').value;
  
  if (!nome) {
    alert('Por favor, digite um nome');
    return;
  }
  
  const novaPessoa = {
    id: Date.now(),
    nome: nome,
    tipo: tipo
  };
  
  STATE.pessoas.push(novaPessoa);
  
  document.getElementById('inputNome').value = '';
  fecharModal();
  salvarEstado();
  renderizar();
}

function removerPessoa(id) {
  if (!confirm('Tem certeza que deseja remover esta pessoa?')) return;
  
  STATE.pessoas = STATE.pessoas.filter(p => p.id !== id);
  
  // Remover presenças dessa pessoa
  Object.keys(STATE.presencas).forEach(key => {
    if (key.startsWith(id + '-')) {
      delete STATE.presencas[key];
    }
  });
  
  salvarEstado();
  renderizar();
}

function marcarPresenca(pessoaId, semana, presente) {
  const key = `${pessoaId}-${semana}`;
  STATE.presencas[key] = presente;
  salvarEstado();
  renderizar();
}

function obterPresenca(pessoaId, semana) {
  const key = `${pessoaId}-${semana}`;
  return STATE.presencas[key];
}

function calcularEstatisticas() {
  const stats = {
    membros: STATE.pessoas.filter(p => p.tipo === 'membro').length,
    visitantes: STATE.pessoas.filter(p => p.tipo === 'visitante').length,
    criancas: STATE.pessoas.filter(p => p.tipo === 'crianca').length,
    presencaMedia: 0
  };

  const semanas = getUltimasSemanas();
  let totalPresencas = 0;
  let totalPossivel = 0;

  STATE.pessoas.forEach(pessoa => {
    semanas.forEach(semana => {
      const presenca = obterPresenca(pessoa.id, semana);
      if (presenca !== undefined) {
        totalPresencas += presenca ? 1 : 0;
        totalPossivel++;
      }
    });
  });

  stats.presencaMedia = totalPossivel > 0 
    ? Math.round((totalPresencas / totalPossivel) * 100) 
    : 0;

  return stats;
}

// Funções de UI
function abrirModal() {
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('inputNome').focus();
}

function fecharModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('inputNome').value = '';
  document.getElementById('selectTipo').value = 'membro';
}

function renderizar() {
  const stats = calcularEstatisticas();
  const semanas = getUltimasSemanas();
  
  // Atualizar estatísticas
  document.getElementById('statMembros').textContent = stats.membros;
  document.getElementById('statVisitantes').textContent = stats.visitantes;
  document.getElementById('statCriancas').textContent = stats.criancas;
  document.getElementById('statPresenca').textContent = stats.presencaMedia + '%';
  
  // Atualizar headers das semanas
  semanas.forEach((semana, idx) => {
    const header = document.getElementById(`semana${idx + 1}Header`);
    if (header) {
      header.innerHTML = `
        <svg class="w-4 h-4 inline mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <div class="text-sm">${formatarData(semana)}</div>
      `;
    }
  });
  
  // Renderizar tabela
  const tbody = document.getElementById('tabelaBody');
  
  if (STATE.pessoas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          Nenhuma pessoa cadastrada. Clique em "Adicionar Pessoa" para começar.
        </td>
      </tr>
    `;
    return;
  }
  
  const tipoLabels = {
    membro: { label: 'Membro', color: 'bg-blue-100 text-blue-800' },
    visitante: { label: 'Visitante', color: 'bg-green-100 text-green-800' },
    crianca: { label: 'Criança', color: 'bg-purple-100 text-purple-800' }
  };
  
  tbody.innerHTML = STATE.pessoas.map((pessoa, idx) => {
    const bgColor = idx % 2 === 0 ? 'bg-gray-50' : 'bg-white';
    
    return `
      <tr class="${bgColor}">
        <td class="px-6 py-4 font-medium text-gray-800">${pessoa.nome}</td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${tipoLabels[pessoa.tipo].color}">
            ${tipoLabels[pessoa.tipo].label}
          </span>
        </td>
        ${semanas.map(semana => {
          const presenca = obterPresenca(pessoa.id, semana);
          return `
            <td class="px-4 py-4 text-center">
              <div class="flex justify-center gap-2">
                <button 
                  onclick="marcarPresenca(${pessoa.id}, '${semana}', true)"
                  class="p-2 rounded-lg transition-all ${
                    presenca === true
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                  }">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button 
                  onclick="marcarPresenca(${pessoa.id}, '${semana}', false)"
                  class="p-2 rounded-lg transition-all ${
                    presenca === false
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                  }">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </td>
          `;
        }).join('')}
        <td class="px-4 py-4 text-center">
          <button 
            onclick="removerPessoa(${pessoa.id})"
            class="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  carregarEstado();
  renderizar();
  
  // Enter no input do nome
  document.getElementById('inputNome').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      adicionarPessoa();
    }
  });
  
  // Fechar modal ao clicar fora
  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
      fecharModal();
    }
  });
});

// Exportar funções globais
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.adicionarPessoa = adicionarPessoa;
window.removerPessoa = removerPessoa;
window.marcarPresenca = marcarPresenca;
