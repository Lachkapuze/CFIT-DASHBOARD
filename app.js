// ===================================
// CFIT - Sistema de Gestão de Marmitas
// Lógica Principal da Aplicação
// ===================================

// Estado da aplicação
const app = {
  currentPage: 'dashboard',
  user: null,
  data: {
    clientes: [],
    ingredientes: [],
    receitas: [],
    pedidos: [],
    kits: [],
    cardapio: [],
    financeiro: [] // <- NOVO: transações financeiras
  }
};

// ===== Inicialização =====
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  renderApp();
});

function initializeApp() {
  const savedData = localStorage.getItem('cfit-data');

  if (savedData) {
    try {
      app.data = JSON.parse(savedData);
    } catch (e) {
      console.error('Erro ao ler dados salvos, iniciando com dados de exemplo:', e);
      initializeSampleData();
    }
  } else {
    initializeSampleData();
  }

  // Garante campos novos em dados antigos
  if (!app.data.financeiro) app.data.financeiro = [];
  if (!app.data.despesas) app.data.despesas = [];
  if (!Array.isArray(app.data.ingredientes)) app.data.ingredientes = [];

  app.data.ingredientes.forEach(i => {
    if (typeof i.quantidadeMinima !== 'number') {
      i.quantidadeMinima = 0;
    }
  });

  setupEventListeners();
}



function initializeSampleData() {
  // Ingredientes de exemplo (Estoque)
  app.data.ingredientes = [
    { id: 1, nome: 'Arroz', unidade: 'kg', quantidade: 5, quantidadeMinima: 2, precoUnitario: 5.50 },
    { id: 2, nome: 'Frango', unidade: 'kg', quantidade: 3, quantidadeMinima: 1, precoUnitario: 15.00 },
    { id: 3, nome: 'Brócolis', unidade: 'kg', quantidade: 2, quantidadeMinima: 1, precoUnitario: 4.50 },
  ];

  // Receitas de exemplo
  app.data.receitas = [
    { id: 1, nome: 'Frango com Arroz', preco: 25.00, ingredientes: [1, 2] },
    { id: 2, nome: 'Brócolis Refogado', preco: 15.00, ingredientes: [3] },
  ];

  // Clientes de exemplo
  app.data.clientes = [
    { id: 1, nome: 'João Silva', telefone: '11999999999', endereco: 'Rua A, 123' },
  ];

  // Despesas / Financeiro começam vazios (se você já tiver, mantém)
  if (!app.data.despesas) app.data.despesas = [];
  if (!app.data.financeiro) app.data.financeiro = [];

  saveData();
}


function setupEventListeners() {
  // Navegar entre páginas
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-item')) {
      const page = e.target.dataset.page;
      if (page) {
        app.currentPage = page;
        renderApp();
      }
    }
  });
}

// ===== Renderização =====
function renderApp() {
  const root = document.getElementById('root');

  let html = `
    <div class="sidebar">
      <div class="logo" style="padding: 0 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.75rem;">
        <img src="logo.png" alt="CFIT Logo" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;">
        <div>
          <div style="font-weight: 700;">CFIT</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Marmitas</div>
        </div>
      </div>
      <ul class="nav-menu">
        <li class="nav-item ${app.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
          <span>📊</span> Dashboard
        </li>
        <li class="nav-item ${app.currentPage === 'estoque' ? 'active' : ''}" data-page="estoque">
          <span>📦</span> Estoque
        </li>
        <li class="nav-item ${app.currentPage === 'receitas' ? 'active' : ''}" data-page="receitas">
          <span>🍽️</span> Receitas
        </li>
        <li class="nav-item ${app.currentPage === 'kits' ? 'active' : ''}" data-page="kits">
          <span>📅</span> Kits
        </li>
        <li class="nav-item ${app.currentPage === 'clientes' ? 'active' : ''}" data-page="clientes">
          <span>👥</span> Clientes
        </li>
        <li class="nav-item ${app.currentPage === 'pedidos' ? 'active' : ''}" data-page="pedidos">
          <span>🛒</span> Pedidos
        </li>
        <li class="nav-item ${app.currentPage === 'financeiro' ? 'active' : ''}" data-page="financeiro">
          <span>💰</span> Financeiro
        </li>
        <li class="nav-item ${app.currentPage === 'despesas' ? 'active' : ''}" data-page="despesas">
  <span>📉</span> Despesas
</li>
      </ul>
    </div>

    <div class="main-content">
      <div class="header">
        <h1>CFIT - Sistema de Gestão de Marmitas</h1>
        <div style="text-align: right;">
          <p style="margin: 0; color: var(--text-secondary);">Bem-vindo!</p>
        </div>
      </div>

      <div class="container" style="margin-top: 2rem;">
  `;

  // Renderizar página atual
  switch (app.currentPage) {
    case 'dashboard':
      html += renderDashboard();
      break;
    case 'estoque':
      html += renderEstoque();
      break;
    case 'receitas':
      html += renderReceitas();
      break;
    case 'kits':
      html += renderKits();
      break;
    case 'clientes':
      html += renderClientes();
      break;
    case 'pedidos':
      html += renderPedidos();
      break;
    case 'financeiro':
      html += renderFinanceiro();
      break;
      case 'despesas':
  html += renderDespesas();
  break;
    default:
      html += renderDashboard();
  }

  html += `
      </div>
    </div>
  `;

  root.innerHTML = html;
  setupEventListeners();
    // Inicializa comportamentos específicos da página atual
  if (app.currentPage === 'estoque') {
    setupEstoquePage();
  }
  if (app.currentPage === 'despesas') {
  setupDespesasPage();
}
  if (app.currentPage === 'financeiro') {
   setupFinanceiroPage();
}
  if (app.currentPage === 'pedidos') {
    setupPedidosPage();
  }
  if (app.currentPage === 'clientes') {
  setupClientesPage();
}
  if (app.currentPage === 'dashboard') {
    setupDashboardPage();
  }

  function setupPedidosPage() {
  const form = document.getElementById('pedido-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idInput = document.getElementById('pedido-id');
    const clienteSelect = document.getElementById('pedido-cliente');
    const valorInput = document.getElementById('pedido-valor');
    const dataInput = document.getElementById('pedido-data');
    const statusInput = document.getElementById('pedido-status');

    const clienteId = Number(clienteSelect.value);
    const cliente = app.data.clientes.find(c => c.id === clienteId);

    if (!cliente) {
      alert("Selecione um cliente.");
      return;
    }

    const valor = parseFloat(valorInput.value);
    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const data = dataInput.value ? new Date(dataInput.value + "T00:00:00") : new Date();
    const status = statusInput.value;

    const idExistente = idInput.value.trim() ? Number(idInput.value) : null;

    if (idExistente) {
      // edição
      const ped = app.data.pedidos.find(p => p.id === idExistente);
      ped.clienteId = clienteId;
      ped.clienteNome = cliente.nome;
      ped.valor = valor;
      ped.status = status;
      ped.data = data.toISOString();
    } else {
      // novo
      app.data.pedidos.push({
        id: Date.now(),
        clienteId,
        clienteNome: cliente.nome,
        valor,
        status,
        data: data.toISOString()
      });
    }

    saveData();
    renderApp();
  });
}

function resetPedidoForm() {
  document.getElementById('pedido-id').value = "";
  document.getElementById('pedido-cliente').value = "";
  document.getElementById('pedido-valor').value = "";
  document.getElementById('pedido-data').value = "";
  document.getElementById('pedido-status').value = "Recebido";

  document.getElementById('pedido-form-title').textContent = "Novo Pedido";
  document.getElementById('pedido-submit-btn').textContent = "Salvar";
}



}

// ===== Páginas =====
function renderDashboard() {
  const resumo = calcularResumoFinanceiro();

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  const hojeStr = `${yyyy}-${mm}-${dd}`;
  const inicioMesStr = `${yyyy}-${mm}-01`;

  // Pedidos do dia
  const pedidosHoje = Array.isArray(app.data.pedidos)
    ? app.data.pedidos
        .filter(p => {
          if (!p.data) return false;
          const d = new Date(p.data);
          return (
            d.getFullYear() === hoje.getFullYear() &&
            d.getMonth() === hoje.getMonth() &&
            d.getDate() === hoje.getDate()
          );
        })
        .reverse()
    : [];

  return `
    <h2>Dashboard</h2>

    <!-- FILTRO POR PERÍODO DO DASHBOARD -->
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h3 class="card-title">Período do Dashboard</h3>
      </div>

      <div class="card-content">
        <form id="filtro-dashboard">
          <div class="grid grid-3">
            <div class="form-group">
              <label class="form-label">Data inicial</label>
              <input type="date" class="form-input" id="dashboard-data-inicial" value="${inicioMesStr}">
            </div>

            <div class="form-group">
              <label class="form-label">Data final</label>
              <input type="date" class="form-input" id="dashboard-data-final" value="${hojeStr}">
            </div>

            <div class="form-group" style="margin-top: 1.8rem;">
              <button class="btn btn-primary btn-block" type="submit">Aplicar</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- RESUMO DO PERÍODO -->
    <div id="dashboard-resumo" style="margin-top: 2rem;">
      ${renderDashboardResumo(resumo)}
    </div>

    <div class="grid grid-2" style="margin-top: 2rem;">
      <!-- Pedidos do dia -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Pedidos do dia</h3>
        </div>
        <div class="card-content">
          ${
            pedidosHoje.length === 0
              ? '<p style="color: var(--text-secondary);">Nenhum pedido hoje.</p>'
              : pedidosHoje
                  .map(p => `
                    <p>${p.clienteNome} - ${formatCurrency(p.valor)} (${new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</p>
                  `)
                  .join('')
          }
        </div>
      </div>

      <!-- Estoque baixo -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Estoque Baixo</h3>
        </div>
        <div class="card-content">
          ${
            app.data.ingredientes.filter(i => {
              const minimo = i.quantidadeMinima || 0;
              return minimo > 0 && i.quantidade <= minimo;
            }).length === 0
              ? '<p style="color: var(--text-secondary);">Estoque OK</p>'
              : app.data.ingredientes
                  .filter(i => {
                    const minimo = i.quantidadeMinima || 0;
                    return minimo > 0 && i.quantidade <= minimo;
                  })
                  .map(i => `<p>${i.nome}: ${i.quantidade} ${i.unidade}</p>`)
                  .join('')
          }
        </div>
      </div>
    </div>
  `;
}

function renderDashboardResumo(resumo) {
  return `
    <div class="grid grid-3">
      <div class="stat-card stat-faturamento">
        <div class="stat-label">Faturamento</div>
        <div class="stat-value">${formatCurrency(resumo.faturamento)}</div>
      </div>
      <div class="stat-card stat-despesas">
        <div class="stat-label">Despesas</div>
        <div class="stat-value">${formatCurrency(resumo.despesas)}</div>
      </div>
      <div class="stat-card stat-lucro">
        <div class="stat-label">Lucro</div>
        <div class="stat-value">${formatCurrency(resumo.lucro)}</div>
      </div>
    </div>
  `;
}

function setupDashboardPage() {
  const form = document.getElementById('filtro-dashboard');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ini = document.getElementById('dashboard-data-inicial')?.value;
    const fim = document.getElementById('dashboard-data-final')?.value;
    const resumo = calcularResumoPeriodo(ini, fim);
    const container = document.getElementById('dashboard-resumo');
    if (container) {
      container.innerHTML = renderDashboardResumo(resumo);
    }
  });
}


function renderEstoque() {
  return `
    <h2>Estoque</h2>

    <div class="grid grid-2" style="margin-top: 2rem;">
      <!-- Formulário de cadastro/edição -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="estoque-form-title">Novo item de estoque</h3>
        </div>
        <div class="card-content">
          <form id="estoque-form">
            <input type="hidden" id="estoque-id" />

            <div class="form-group">
              <label class="form-label" for="estoque-nome">Nome do produto</label>
              <input class="form-input" type="text" id="estoque-nome" placeholder="Ex: Arroz, Frango, Brócolis">
            </div>

            <div class="form-group">
              <label class="form-label" for="estoque-unidade">Unidade</label>
              <input class="form-input" type="text" id="estoque-unidade" placeholder="Ex: kg, pacote, litro">
            </div>

            <div class="form-group">
              <label class="form-label" for="estoque-quantidade">Quantidade em estoque</label>
              <input class="form-input" type="number" step="0.01" id="estoque-quantidade" placeholder="Ex: 5">
            </div>

            <div class="form-group">
              <label class="form-label" for="estoque-minimo">Quantidade mínima (alerta)</label>
              <input class="form-input" type="number" step="0.01" id="estoque-minimo" placeholder="Ex: 2">
              <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.25rem;">
                Quando a quantidade ficar abaixo ou igual ao mínimo, o item aparece como <strong>Estoque baixo</strong>.
              </p>
            </div>

            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary btn-block" id="estoque-submit-btn">Salvar</button>
              <button type="button" class="btn btn-secondary btn-block" onclick="resetEstoqueForm()">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabela de itens de estoque -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Itens em estoque</h3>
        </div>
        <div class="card-content">
          ${
            app.data.ingredientes.length === 0
              ? '<p style="color: var(--text-secondary);">Nenhum item cadastrado.</p>'
              : `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Unidade</th>
                      <th>Qtd.</th>
                      <th>Mínimo</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      app.data.ingredientes
                        .map(ing => {
                          const minimo = ing.quantidadeMinima || 0;
                          const baixo = ing.quantidade <= minimo && minimo > 0;

                          return `
                            <tr>
                              <td>${ing.nome}</td>
                              <td>${ing.unidade}</td>
                              <td>${ing.quantidade}</td>
                              <td>${minimo}</td>
                              <td>
                                ${
                                  baixo
                                    ? '<span class="badge badge-warning">Estoque baixo</span>'
                                    : '<span class="badge badge-success">OK</span>'
                                }
                              </td>
                              <td>
                                <button class="btn btn-small btn-secondary" onclick="editIngrediente(${ing.id})">Editar</button>
                                <button class="btn btn-small btn-danger" onclick="deleteIngrediente(${ing.id})">Excluir</button>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')
                    }
                  </tbody>
                </table>
              `
          }
        </div>
      </div>
    </div>
  `;
}

// ===== Funções da página de Estoque =====

function setupEstoquePage() {
  const form = document.getElementById('estoque-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idInput = document.getElementById('estoque-id');
    const nomeInput = document.getElementById('estoque-nome');
    const unidadeInput = document.getElementById('estoque-unidade');
    const qtdInput = document.getElementById('estoque-quantidade');
    const minimoInput = document.getElementById('estoque-minimo');

    const nome = nomeInput.value.trim();
    const unidade = unidadeInput.value.trim();
    const quantidade = parseFloat(qtdInput.value);
    const minimo = parseFloat(minimoInput.value);

    if (!nome) return alert("Informe o nome.");
    if (!unidade) return alert("Informe a unidade.");
    if (isNaN(quantidade)) return alert("Quantidade inválida.");
    if (isNaN(minimo)) return alert("Quantidade mínima inválida.");

    const idExistente = idInput.value ? Number(idInput.value) : null;

    if (idExistente) {
      const ing = app.data.ingredientes.find(i => i.id === idExistente);
      ing.nome = nome;
      ing.unidade = unidade;
      ing.quantidade = quantidade;
      ing.quantidadeMinima = minimo;

    } else {
      app.data.ingredientes.push({
        id: Date.now(),
        nome,
        unidade,
        quantidade,
        quantidadeMinima: minimo,
        precoUnitario: 0
      });
    }

    saveData();
    renderApp();
  });
}

function resetEstoqueForm() {
  document.getElementById('estoque-id').value = "";
  document.getElementById('estoque-nome').value = "";
  document.getElementById('estoque-unidade').value = "";
  document.getElementById('estoque-quantidade').value = "";
  document.getElementById('estoque-minimo').value = "";

  document.getElementById('estoque-form-title').textContent = "Novo item de estoque";
  document.getElementById('estoque-submit-btn').textContent = "Salvar";
}


function renderReceitas() {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Receitas</h2>
      <button class="btn btn-primary" onclick="addReceita()">+ Nova Receita</button>
    </div>

    <div class="grid grid-3">
      ${app.data.receitas
        .map(
          (rec) => `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${rec.nome}</h3>
          </div>
          <div class="card-content">
            <p><strong>Preço:</strong> ${formatCurrency(rec.preco)}</p>
            <button class="btn btn-small btn-secondary btn-block" onclick="editReceita(${rec.id})">Editar</button>
            <button class="btn btn-small btn-danger btn-block" onclick="deleteReceita(${rec.id})">Deletar</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderKits() {
  return `
    <h2>Kits de Cardápio</h2>
    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Configure seus 6 kits de cardápio (segunda a domingo)</p>

    <div class="grid grid-2">
      ${[1, 2, 3, 4, 5, 6]
        .map(
          (num) => `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Kit ${num}</h3>
          </div>
          <div class="card-content">
            <button class="btn btn-primary btn-block" onclick="editKit(${num})">Configurar</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderClientes() {
  return `
    <h2>Clientes</h2>

    <div class="grid grid-2" style="margin-top: 2rem;">

      <!-- FORMULÁRIO DE CLIENTES -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="cliente-form-title">Novo Cliente</h3>
        </div>

        <div class="card-content">
          <form id="cliente-form">
            <input type="hidden" id="cliente-id">

            <div class="form-group">
              <label class="form-label">Nome Completo</label>
              <input class="form-input" type="text" id="cliente-nome" placeholder="Ex: João da Silva">
            </div>

            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input class="form-input" type="text" id="cliente-telefone" placeholder="11999999999">
            </div>

            <div class="form-group">
              <label class="form-label">Endereço</label>
              <input class="form-input" type="text" id="cliente-endereco" placeholder="Rua, número e bairro">
            </div>

            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary btn-block" id="cliente-submit-btn">Salvar</button>
              <button type="button" class="btn btn-secondary btn-block" onclick="resetClienteForm()">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- TABELA DE CLIENTES -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Clientes</h3>
        </div>

        <div class="card-content">
          ${
            app.data.clientes.length === 0
              ? `<p style="color: var(--text-secondary);">Nenhum cliente cadastrado.</p>`
              : `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Telefone</th>
                      <th>Endereço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${app.data.clientes.slice().reverse().map(c => `
                      <tr>
                        <td>${c.nome}</td>
                        <td>${c.telefone}</td>
                        <td>${c.endereco}</td>
                        <td>
                          <button class="btn btn-small btn-secondary" onclick="editCliente(${c.id})">Editar</button>
                          <button class="btn btn-small btn-danger" onclick="deleteCliente(${c.id})">Excluir</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
          }
        </div>

      </div>
    </div>
  `;
}


function renderPedidos() {
  return `
    <h2>Pedidos</h2>

    <div class="grid grid-2" style="margin-top: 2rem;">

      <!-- FORMULÁRIO -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="pedido-form-title">Novo Pedido</h3>
        </div>

        <div class="card-content">
          <form id="pedido-form">
            <input type="hidden" id="pedido-id">

            <!-- Cliente -->
            <div class="form-group">
              <label class="form-label">Cliente</label>
              <select class="form-input" id="pedido-cliente">
                <option value="">Selecione</option>
                ${app.data.clientes.map(c => `
                  <option value="${c.id}">${c.nome}</option>
                `).join('')}
              </select>
            </div>

            <!-- Valor -->
            <div class="form-group">
              <label class="form-label">Valor do pedido (R$)</label>
              <input class="form-input" type="number" step="0.01" id="pedido-valor" placeholder="Ex: 39.90">
            </div>

            <!-- Data -->
            <div class="form-group">
              <label class="form-label">Data</label>
              <input class="form-input" type="date" id="pedido-data">
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" id="pedido-status">
                <option value="Recebido">Recebido</option>
                <option value="Preparando">Preparando</option>
                <option value="Pronto">Pronto</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <!-- Botões -->
            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary btn-block" id="pedido-submit-btn">Salvar</button>
              <button type="button" class="btn btn-secondary btn-block" onclick="resetPedidoForm()">Limpar</button>
            </div>

          </form>
        </div>
      </div>

      <!-- TABELA -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Pedidos</h3>
        </div>

        <div class="card-content">
          ${
            app.data.pedidos.length === 0
              ? `<p style="color: var(--text-secondary);">Nenhum pedido cadastrado.</p>`
              : `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${app.data.pedidos.slice().reverse().map(p => `
                      <tr>
                        <td>${new Date(p.data).toLocaleDateString('pt-BR')}</td>
                        <td>${p.clienteNome}</td>
                        <td>${formatCurrency(p.valor)}</td>
                        <td><span class="badge badge-primary">${p.status}</span></td>
                        <td>
                          <button class="btn btn-small btn-secondary" onclick="editPedido(${p.id})">Editar</button>
                          <button class="btn btn-small btn-danger" onclick="deletePedido(${p.id})">Excluir</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
          }
        </div>

      </div>

    </div>
  `;
}


function renderFinanceiro() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  const hojeStr = `${yyyy}-${mm}-${dd}`;

  return `
    <h2>Financeiro</h2>

    <!-- FILTRO POR PERÍODO -->
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h3 class="card-title">Período</h3>
      </div>

      <div class="card-content">
        <form id="filtro-financeiro">
          <div class="grid grid-3">
            <div class="form-group">
              <label class="form-label">Data inicial</label>
              <input type="date" class="form-input" id="data-inicial" value="${yyyy}-${mm}-01">
            </div>

            <div class="form-group">
              <label class="form-label">Data final</label>
              <input type="date" class="form-input" id="data-final" value="${hojeStr}">
            </div>

            <div class="form-group" style="margin-top: 1.8rem;">
              <button class="btn btn-primary btn-block" type="submit">Aplicar</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- RESULTADOS -->
    <div id="financeiro-resultado" style="margin-top: 2rem;">
      ${renderFinanceiroResultado()}
    </div>
  `;
}
function renderFinanceiroResultado() {
  const { faturamento, despesas, lucro } = calcularFinanceiroFiltrado();

  return `
    <div class="grid grid-3">
      <div class="stat-card stat-faturamento">
        <div class="stat-label">Faturamento</div>
        <div class="stat-value">${formatCurrency(faturamento)}</div>
      </div>
      <div class="stat-card stat-despesas">
        <div class="stat-label">Despesas</div>
        <div class="stat-value">${formatCurrency(despesas)}</div>
      </div>
      <div class="stat-card stat-lucro">
        <div class="stat-label">Lucro</div>
        <div class="stat-value">${formatCurrency(lucro)}</div>
      </div>
    </div>
  `;
}

function calcularFinanceiroFiltrado() {
  const ini = document.getElementById('data-inicial')?.value;
  const fim = document.getElementById('data-final')?.value;
  return calcularResumoPeriodo(ini, fim);
}



function renderDespesas() {
  return `
    <h2>Despesas</h2>

    <div class="grid grid-2" style="margin-top: 2rem;">

      <!-- Formulário -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="despesa-form-title">Nova Despesa</h3>
        </div>

        <div class="card-content">
          <form id="despesa-form">
            <input type="hidden" id="despesa-id">

            <div class="form-group">
              <label class="form-label">Descrição</label>
              <input class="form-input" id="despesa-descricao" placeholder="Ex: Compra no atacado, pagamento funcionário...">
            </div>

            <div class="form-group">
              <label class="form-label">Valor total</label>
              <input class="form-input" type="number" step="0.01" id="despesa-valor" placeholder="Ex: 250.00">
            </div>

            <div class="form-group">
              <label class="form-label">Data</label>
              <input class="form-input" type="date" id="despesa-data">
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="despesa-submit-btn">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" onclick="resetDespesaForm()">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Despesas</h3>
        </div>

        <div class="card-content">
          ${
            app.data.despesas.length === 0
              ? `<p style="color: var(--text-secondary);">Nenhuma despesa cadastrada.</p>`
              : `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${app.data.despesas.slice().reverse().map(d => `
                      <tr>
                        <td>${new Date(d.data).toLocaleDateString('pt-BR')}</td>
                        <td>${d.descricao}</td>
                        <td>${formatCurrency(d.valor)}</td>
                        <td>
                          <button class="btn btn-small btn-secondary" onclick="editDespesa(${d.id})">Editar</button>
                          <button class="btn btn-small btn-danger" onclick="deleteDespesa(${d.id})">Excluir</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
          }
        </div>
      </div>

    </div>
  `;
}
// ===== Funções da página de Despesas =====

function setupDespesasPage() {
  const form = document.getElementById('despesa-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idInput = document.getElementById('despesa-id');
    const descInput = document.getElementById('despesa-descricao');
    const valorInput = document.getElementById('despesa-valor');
    const dataInput = document.getElementById('despesa-data');

    const descricao = (descInput.value || '').trim();
    const valorRaw = (valorInput.value || '').trim();
    const dataRaw = (dataInput.value || '').trim();

    if (!descricao) {
      alert('Informe a descrição da despesa.');
      return;
    }

    const valor = parseFloat(valorRaw.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    let data;
    if (dataRaw) {
      // data do input date (YYYY-MM-DD) -> ISO
      data = new Date(dataRaw + 'T00:00:00');
    } else {
      // Se não informar, usa hoje
      data = new Date();
    }

    const idExistente = idInput.value ? Number(idInput.value) : null;

    if (idExistente) {
      // Edição
      const desp = app.data.despesas.find(d => d.id === idExistente);
      if (!desp) {
        alert('Despesa não encontrada.');
        return;
      }
      desp.descricao = descricao;
      desp.valor = valor;
      desp.data = data.toISOString();
    } else {
      // Nova
      const nova = {
        id: Date.now(),
        descricao,
        valor,
        data: data.toISOString()
      };
      app.data.despesas.push(nova);
    }

    saveData();
    renderApp();
  });
}

function resetDespesaForm() {
  const idInput = document.getElementById('despesa-id');
  const descInput = document.getElementById('despesa-descricao');
  const valorInput = document.getElementById('despesa-valor');
  const dataInput = document.getElementById('despesa-data');
  const title = document.getElementById('despesa-form-title');
  const submitBtn = document.getElementById('despesa-submit-btn');

  if (idInput) idInput.value = '';
  if (descInput) descInput.value = '';
  if (valorInput) valorInput.value = '';
  if (dataInput) dataInput.value = '';

  if (title) title.textContent = 'Nova Despesa';
  if (submitBtn) submitBtn.textContent = 'Salvar';
}

function editDespesa(id) {
  const desp = app.data.despesas.find(d => d.id === id);
  if (!desp) {
    alert('Despesa não encontrada.');
    return;
  }

  // Garante que estamos na aba Despesas
  if (app.currentPage !== 'despesas') {
    app.currentPage = 'despesas';
    renderApp();
  }

  const idInput = document.getElementById('despesa-id');
  const descInput = document.getElementById('despesa-descricao');
  const valorInput = document.getElementById('despesa-valor');
  const dataInput = document.getElementById('despesa-data');
  const title = document.getElementById('despesa-form-title');
  const submitBtn = document.getElementById('despesa-submit-btn');

  if (idInput) idInput.value = desp.id;
  if (descInput) descInput.value = desp.descricao;
  if (valorInput) valorInput.value = desp.valor;

  if (dataInput) {
    // Converte ISO -> yyyy-mm-dd pro input date
    const data = new Date(desp.data);
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    dataInput.value = `${yyyy}-${mm}-${dd}`;
  }

  if (title) title.textContent = 'Editar Despesa';
  if (submitBtn) submitBtn.textContent = 'Atualizar';
}

function deleteDespesa(id) {
  if (!confirm('Deseja apagar esta despesa?')) return;

  app.data.despesas = app.data.despesas.filter(d => d.id !== id);
  saveData();
  renderApp();
}
function setupFinanceiroPage() {
  const form = document.getElementById('filtro-financeiro');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const container = document.getElementById('financeiro-resultado');
    if (container) {
      container.innerHTML = renderFinanceiroResultado();
    }
  });
}

function editPedido(id) {
  const ped = app.data.pedidos.find(p => p.id === id);
  if (!ped) return;

  app.currentPage = "pedidos";
  renderApp();

  document.getElementById('pedido-id').value = ped.id;
  document.getElementById('pedido-cliente').value = ped.clienteId;
  document.getElementById('pedido-valor').value = ped.valor;

  const d = new Date(ped.data);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  document.getElementById('pedido-data').value = `${yyyy}-${mm}-${dd}`;

  document.getElementById('pedido-status').value = ped.status;

  document.getElementById('pedido-form-title').textContent = "Editar Pedido";
  document.getElementById('pedido-submit-btn').textContent = "Atualizar";
}

function deletePedido(id) {
  if (!confirm("Excluir pedido?")) return;

  app.data.pedidos = app.data.pedidos.filter(p => p.id !== id);
  saveData();
  renderApp();
}

function setupClientesPage() {
  const form = document.getElementById('cliente-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idInput = document.getElementById('cliente-id');
    const nomeInput = document.getElementById('cliente-nome');
    const telInput = document.getElementById('cliente-telefone');
    const endInput = document.getElementById('cliente-endereco');

    const nome = nomeInput.value.trim();
    const telefone = telInput.value.trim();
    const endereco = endInput.value.trim();

    if (!nome) return alert("Informe o nome.");
    if (!telefone) return alert("Informe o telefone.");
    if (!endereco) return alert("Informe o endereço.");

    const idExistente = idInput.value ? Number(idInput.value) : null;

    if (idExistente) {
      const cli = app.data.clientes.find(c => c.id === idExistente);
      cli.nome = nome;
      cli.telefone = telefone;
      cli.endereco = endereco;

    } else {
      app.data.clientes.push({
        id: Date.now(),
        nome,
        telefone,
        endereco
      });
    }

    saveData();
    renderApp();
  });
}
function resetClienteForm() {
  document.getElementById('cliente-id').value = "";
  document.getElementById('cliente-nome').value = "";
  document.getElementById('cliente-telefone').value = "";
  document.getElementById('cliente-endereco').value = "";

  document.getElementById('cliente-form-title').textContent = "Novo Cliente";
  document.getElementById('cliente-submit-btn').textContent = "Salvar";
}

function editCliente(id) {
  const cli = app.data.clientes.find(c => c.id === id);
  if (!cli) return;

  app.currentPage = "clientes";
  renderApp();

  document.getElementById('cliente-id').value = cli.id;
  document.getElementById('cliente-nome').value = cli.nome;
  document.getElementById('cliente-telefone').value = cli.telefone;
  document.getElementById('cliente-endereco').value = cli.endereco;

  document.getElementById('cliente-form-title').textContent = "Editar Cliente";
  document.getElementById('cliente-submit-btn').textContent = "Atualizar";
}

function deleteCliente(id) {
  if (!confirm("Excluir cliente?")) return;

  app.data.clientes = app.data.clientes.filter(c => c.id !== id);
  saveData();
  renderApp();
}



// ===== Funções de Ação =====
function addIngrediente() {
  const nome = prompt('Nome do item de estoque:');
  if (!nome) return;

  const unidade = prompt('Unidade (ex: kg, pacote, litro):', 'kg');
  if (!unidade) return;

  const qtdRaw = prompt('Quantidade em estoque:', '1');
  if (!qtdRaw) return;
  const quantidade = parseFloat(qtdRaw.replace(',', '.'));
  if (isNaN(quantidade) || quantidade < 0) {
    alert('Quantidade inválida.');
    return;
  }

  const precoRaw = prompt('Preço unitário (use ponto ou vírgula):', '0');
  if (!precoRaw && precoRaw !== '0') return;
  const precoUnitario = parseFloat(precoRaw.replace(',', '.'));
  if (isNaN(precoUnitario) || precoUnitario < 0) {
    alert('Preço inválido.');
    return;
  }

  const novoItem = {
    id: Date.now(),
    nome,
    unidade,
    quantidade,
    precoUnitario
  };

  app.data.ingredientes.push(novoItem);
  saveData();
  renderApp();
}

function editIngrediente(id) {
  const ing = app.data.ingredientes.find(i => i.id === id);
  if (!ing) {
    alert('Item não encontrado.');
    return;
  }

  // Garante que estamos na página de estoque
  if (app.currentPage !== 'estoque') {
    app.currentPage = 'estoque';
    renderApp();
  }

  // Depois do renderApp, os elementos do formulário existem de novo
  const idInput = document.getElementById('estoque-id');
  const nomeInput = document.getElementById('estoque-nome');
  const unidadeInput = document.getElementById('estoque-unidade');
  const qtdInput = document.getElementById('estoque-quantidade');
  const minimoInput = document.getElementById('estoque-minimo');
  const title = document.getElementById('estoque-form-title');
  const submitBtn = document.getElementById('estoque-submit-btn');

  if (idInput) idInput.value = ing.id;
  if (nomeInput) nomeInput.value = ing.nome;
  if (unidadeInput) unidadeInput.value = ing.unidade;
  if (qtdInput) qtdInput.value = ing.quantidade;
  if (minimoInput) minimoInput.value = ing.quantidadeMinima || 0;

  if (title) title.textContent = 'Editar item de estoque';
  if (submitBtn) submitBtn.textContent = 'Atualizar';
}


function deleteIngrediente(id) {
  if (confirm('Deletar este item de estoque?')) {
    app.data.ingredientes = app.data.ingredientes.filter(i => i.id !== id);
    saveData();
    renderApp();
  }
}

function addReceita() {
  alert('Adicionar nova receita');
}

function editReceita(id) {
  alert('Editar receita ' + id);
}

function deleteReceita(id) {
  if (confirm('Deletar esta receita?')) {
    app.data.receitas = app.data.receitas.filter((r) => r.id !== id);
    saveData();
    renderApp();
  }
}

function editKit(num) {
  alert('Configurar kit ' + num);
}



function addPedido() {
  alert('Adicionar novo pedido');
}



// ===== Financeiro: ações =====
function addTransacao() {
  const tipoRaw = prompt('Tipo de transação: digite R para Receita ou D para Despesa');
  if (!tipoRaw) return;

  const tipo =
    tipoRaw.trim().toLowerCase() === 'r'
      ? 'receita'
      : tipoRaw.trim().toLowerCase() === 'd'
      ? 'despesa'
      : null;

  if (!tipo) {
    alert('Tipo inválido. Use R para Receita ou D para Despesa.');
    return;
  }

  const valorRaw = prompt('Valor (use ponto para centavos, ex: 150.50):');
  if (!valorRaw) return;

  const valor = parseFloat(valorRaw.replace(',', '.'));
  if (isNaN(valor) || valor <= 0) {
    alert('Valor inválido.');
    return;
  }

  const descricao = prompt('Descrição (ex: Compra de frango, Venda de kits, etc):') || '';

  const hoje = new Date();
  const transacao = {
    id: Date.now(),
    tipo,
    valor,
    descricao,
    data: hoje.toISOString()
  };

  app.data.financeiro.push(transacao);
  saveData();
  renderApp();
}

function deleteTransacao(id) {
  if (confirm('Deseja deletar esta transação?')) {
    app.data.financeiro = app.data.financeiro.filter((t) => t.id !== id);
    saveData();
    renderApp();
  }
}

// ===== Utilitários =====
function saveData() {
  localStorage.setItem('cfit-data', JSON.stringify(app.data));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function calcularResumoPeriodo(ini, fim) {
  if (!ini || !fim) {
    return { faturamento: 0, despesas: 0, lucro: 0 };
  }

  const dataIni = new Date(ini + 'T00:00:00');
  const dataFim = new Date(fim + 'T23:59:59');

  // FATURAMENTO = soma dos pedidos no período
  let faturamento = 0;
  if (Array.isArray(app.data.pedidos)) {
    faturamento = app.data.pedidos
      .filter(p => {
        if (!p.data) return false;
        const d = new Date(p.data);
        return d >= dataIni && d <= dataFim;
      })
      .reduce((t, p) => t + (p.valor || 0), 0);
  }

  // DESPESAS = soma das despesas no período
  let despesas = 0;
  if (Array.isArray(app.data.despesas)) {
    despesas = app.data.despesas
      .filter(d => {
        if (!d.data) return false;
        const data = new Date(d.data);
        return data >= dataIni && data <= dataFim;
      })
      .reduce((t, d) => t + (d.valor || 0), 0);
  }

  const lucro = faturamento - despesas;
  return { faturamento, despesas, lucro };
}


function calcularResumoFinanceiro() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');

  const inicioMes = `${yyyy}-${mm}-01`;
  const hojeStr = `${yyyy}-${mm}-${dd}`;

  return calcularResumoPeriodo(inicioMes, hojeStr);
}

