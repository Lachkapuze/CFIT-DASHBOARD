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
  // Carregar dados do localStorage
  const savedData = localStorage.getItem('cfit-data');

  if (savedData) {
    try {
      app.data = JSON.parse(savedData);
    } catch (e) {
      console.error('Erro ao ler dados salvos, iniciando com dados de exemplo:', e);
      initializeSampleData();
    }
  } else {
    // Se não tiver nada salvo ainda, cria os dados de exemplo
    initializeSampleData();
  }

  // Garante que o campo financeiro exista mesmo em dados antigos
  if (!app.data.financeiro) {
    app.data.financeiro = [];
  }

  // Configurar event listeners
  setupEventListeners();
}


function initializeSampleData() {
  // Ingredientes de exemplo
  app.data.ingredientes = [
    { id: 1, nome: 'Arroz', unidade: 'kg', quantidade: 5, precoUnitario: 5.50 },
    { id: 2, nome: 'Frango', unidade: 'kg', quantidade: 3, precoUnitario: 15.00 },
    { id: 3, nome: 'Brócolis', unidade: 'kg', quantidade: 2, precoUnitario: 4.50 },
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

  // Financeiro começa vazio
  app.data.financeiro = [];

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
    default:
      html += renderDashboard();
  }

  html += `
      </div>
    </div>
  `;

  root.innerHTML = html;
  setupEventListeners();
}

// ===== Páginas =====
function renderDashboard() {
  const resumo = calcularResumoFinanceiro();

  return `
    <h2>Dashboard</h2>
    <div class="grid grid-4" style="margin-top: 2rem;">
      <div class="stat-card">
        <div class="stat-label">Faturamento (Mês)</div>
        <div class="stat-value">${formatCurrency(resumo.faturamento)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Despesas (Mês)</div>
        <div class="stat-value">${formatCurrency(resumo.despesas)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lucro (Mês)</div>
        <div class="stat-value">${formatCurrency(resumo.lucro)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Clientes</div>
        <div class="stat-value">${app.data.clientes.length}</div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top: 2rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Pedidos Recentes</h3>
        </div>
        <div class="card-content">
          ${
            app.data.pedidos.length === 0
              ? '<p style="color: var(--text-secondary);">Nenhum pedido registrado</p>'
              : app.data.pedidos
                  .slice(-5)
                  .reverse()
                  .map(
                    (p) =>
                      `<p>${p.cliente} - ${formatCurrency(p.valor)} (${new Date(
                        p.data
                      ).toLocaleDateString('pt-BR')})</p>`
                  )
                  .join('')
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Estoque Baixo</h3>
        </div>
        <div class="card-content">
          ${
            app.data.ingredientes.filter((i) => i.quantidade < 2).length === 0
              ? '<p style="color: var(--text-secondary);">Estoque OK</p>'
              : app.data.ingredientes
                  .filter((i) => i.quantidade < 2)
                  .map(
                    (i) =>
                      `<p>${i.nome}: ${i.quantidade} ${i.unidade}</p>`
                  )
                  .join('')
          }
        </div>
      </div>
    </div>
  `;
}

function renderEstoque() {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Estoque</h2>
      <button class="btn btn-primary" onclick="addIngrediente()">+ Novo Item</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Unidade</th>
            <th>Quantidade</th>
            <th>Preço Unit.</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${app.data.ingredientes
            .map(
              (ing) => `
            <tr>
              <td>${ing.nome}</td>
              <td>${ing.unidade}</td>
              <td>${ing.quantidade}</td>
              <td>${formatCurrency(ing.precoUnitario)}</td>
              <td>
                <button class="btn btn-small btn-secondary" onclick="editIngrediente(${ing.id})">Editar</button>
                <button class="btn btn-small btn-danger" onclick="deleteIngrediente(${ing.id})">Deletar</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
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
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Clientes</h2>
      <button class="btn btn-primary" onclick="addCliente()">+ Novo Cliente</button>
    </div>

    <div class="card">
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
          ${app.data.clientes
            .map(
              (cli) => `
            <tr>
              <td>${cli.nome}</td>
              <td>${cli.telefone}</td>
              <td>${cli.endereco}</td>
              <td>
                <button class="btn btn-small btn-secondary" onclick="editCliente(${cli.id})">Editar</button>
                <button class="btn btn-small btn-danger" onclick="deleteCliente(${cli.id})">Deletar</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPedidos() {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Pedidos</h2>
      <button class="btn btn-primary" onclick="addPedido()">+ Novo Pedido</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Data</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${
            app.data.pedidos.length === 0
              ? '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum pedido registrado</td></tr>'
              : app.data.pedidos
                  .map(
                    (ped) => `
              <tr>
                <td>${ped.cliente}</td>
                <td>${new Date(ped.data).toLocaleDateString('pt-BR')}</td>
                <td>${formatCurrency(ped.valor)}</td>
                <td><span class="badge badge-primary">${ped.status}</span></td>
                <td>
                  <button class="btn btn-small btn-secondary" onclick="editPedido(${ped.id})">Editar</button>
                  <button class="btn btn-small btn-danger" onclick="deletePedido(${ped.id})">Deletar</button>
                </td>
              </tr>
            `
                  )
                  .join('')
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderFinanceiro() {
  const resumo = calcularResumoFinanceiro();

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Financeiro</h2>
      <button class="btn btn-primary" onclick="addTransacao()">+ Nova Transação</button>
    </div>
    
    <div class="grid grid-3" style="margin-bottom: 2rem;">
      <div class="stat-card">
        <div class="stat-label">Faturamento (Mês)</div>
        <div class="stat-value">${formatCurrency(resumo.faturamento)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Despesas (Mês)</div>
        <div class="stat-value">${formatCurrency(resumo.despesas)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lucro (Mês)</div>
        <div class="stat-value">${formatCurrency(resumo.lucro)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Transações</h3>
      </div>
      ${
        app.data.financeiro.length === 0
          ? '<p style="color: var(--text-secondary); padding: 1rem;">Nenhuma transação registrada</p>'
          : `
            <table class="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${app.data.financeiro
                  .slice()
                  .sort((a, b) => new Date(b.data) - new Date(a.data))
                  .map(
                    (t) => `
                  <tr>
                    <td>${new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span class="badge ${
                        t.tipo === 'receita'
                          ? 'badge-success'
                          : 'badge-danger'
                      }">
                        ${t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td>${t.descricao || '-'}</td>
                    <td>${formatCurrency(t.valor)}</td>
                    <td>
                      <button class="btn btn-small btn-danger" onclick="deleteTransacao(${t.id})">Deletar</button>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
      }
    </div>
  `;
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

  const nome = prompt('Nome do item de estoque:', ing.nome);
  if (!nome) return;

  const unidade = prompt('Unidade (ex: kg, pacote, litro):', ing.unidade);
  if (!unidade) return;

  const qtdRaw = prompt('Quantidade em estoque:', String(ing.quantidade));
  if (!qtdRaw) return;
  const quantidade = parseFloat(qtdRaw.replace(',', '.'));
  if (isNaN(quantidade) || quantidade < 0) {
    alert('Quantidade inválida.');
    return;
  }

  const precoRaw = prompt('Preço unitário:', String(ing.precoUnitario));
  if (!precoRaw && precoRaw !== '0') return;
  const precoUnitario = parseFloat(precoRaw.replace(',', '.'));
  if (isNaN(precoUnitario) || precoUnitario < 0) {
    alert('Preço inválido.');
    return;
  }

  ing.nome = nome;
  ing.unidade = unidade;
  ing.quantidade = quantidade;
  ing.precoUnitario = precoUnitario;

  saveData();
  renderApp();
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

function addCliente() {
  alert('Adicionar novo cliente');
}

function editCliente(id) {
  alert('Editar cliente ' + id);
}

function deleteCliente(id) {
  if (confirm('Deletar este cliente?')) {
    app.data.clientes = app.data.clientes.filter((c) => c.id !== id);
    saveData();
    renderApp();
  }
}

function addPedido() {
  alert('Adicionar novo pedido');
}

function editPedido(id) {
  alert('Editar pedido ' + id);
}

function deletePedido(id) {
  if (confirm('Deletar este pedido?')) {
    app.data.pedidos = app.data.pedidos.filter((p) => p.id !== id);
    saveData();
    renderApp();
  }
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

function calcularResumoFinanceiro() {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  let faturamento = 0;
  let despesas = 0;

  app.data.financeiro.forEach((t) => {
    const d = new Date(t.data);
    if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
      if (t.tipo === 'receita') {
        faturamento += t.valor;
      } else if (t.tipo === 'despesa') {
        despesas += t.valor;
      }
    }
  });

  const lucro = faturamento - despesas;

  return { faturamento, despesas, lucro };
}
