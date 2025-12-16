// =====================================================
// CFIT Dashboard - Supabase (Auth + CRUD + Dashboard)
// =====================================================

// ===============================
// 1) SUPABASE CONFIG
// ===============================
const SUPABASE_URL = "https://dsfovsdcatskyfgdhblc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZm92c2RjYXRza3lmZ2RoYmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTU4MzUsImV4cCI6MjA4MDc3MTgzNX0.hmZXAOGZ1Gm9SQqjlKClaLmdsP2udDFgQN25S58qiWw";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================
// 2) ELEMENTOS DO INDEX (IDs obrigatórios)
// ===============================
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const logoutBtn = document.getElementById("logout-btn");
const root = document.getElementById("root");

// Se algum ID sumiu, para aqui com aviso
(function assertIds() {
  const missing = [];
  if (!loginScreen) missing.push("login-screen");
  if (!appScreen) missing.push("app-screen");
  if (!loginForm) missing.push("login-form");
  if (!logoutBtn) missing.push("logout-btn");
  if (!root) missing.push("root");
  if (missing.length) {
    alert(
      "Faltam IDs no index.html: " +
        missing.join(", ") +
        " (login-screen/app-screen/login-form/logout-btn/root)."
    );
    throw new Error("IDs ausentes no index.html: " + missing.join(", "));
  }
})();

// ===============================
// 3) ESTADO DA APLICAÇÃO
// ===============================
const app = {
  currentPage: "dashboard",
  currentCardapioId: null,
  data: {
    clientes: [],
    pedidos: [],
    despesas: [],
    ingredientes: [],
    kits: [],
    cardapios: [],
cardapio_itens: [],
kit_opcoes: [],
    compras_insumos: [], // opcional (se existir no banco)
  },
  filtro: {
    dashboardIni: null,
    dashboardFim: null,
  },
};

// ===============================
// 4) HELPERS
// ===============================
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function toISODateInputValue(dateObj) {
  const d = new Date(dateObj);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonthISO() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return toISODateInputValue(d);
}

function todayISO() {
  return toISODateInputValue(new Date());
}

function parseDateRange(ini, fim) {
  if (!ini || !fim) return null;
  const start = new Date(ini + "T00:00:00");
  const end = new Date(fim + "T23:59:59");
  return { start, end };
}

function withinRange(isoString, range) {
  if (!range || !isoString) return false;
  const d = new Date(isoString);
  return d >= range.start && d <= range.end;
}

function toast(msg) {
  // simples (sem CSS extra)
  console.log(msg);
}

// ===============================
// 5) AUTH UI
// ===============================
function showLogin() {
  appScreen.style.display = "none";
  loginScreen.style.display = "block";
}

function showApp() {
  loginScreen.style.display = "none";
  appScreen.style.display = "block";
}

async function checkSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) {
    console.error(error);
    showLogin();
    return;
  }
  if (!data.session) {
    showLogin();
    return;
  }
  showApp();
  await initAfterLogin();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (loginMsg) loginMsg.textContent = "";

  const email = document.getElementById("login-email")?.value?.trim();
  const password = document.getElementById("login-pass")?.value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    if (loginMsg) loginMsg.textContent = "Erro: " + error.message;
    return;
  }

  showApp();
  await initAfterLogin();
});

logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  showLogin();
});

// Se sessão expirar, reage
sb.auth.onAuthStateChange((_event, session) => {
  if (!session) showLogin();
});

// ===============================
// 6) LOAD (SUPABASE -> app.data)
// ===============================

// util: ordena por created_at desc (se existir), senão por id (string) desc
function sortByCreatedAtOrIdDesc(a, b) {
  const ta = a?.created_at ? Date.parse(a.created_at) : null;
  const tb = b?.created_at ? Date.parse(b.created_at) : null;

  if (tb !== null && ta !== null) return tb - ta;
  if (tb !== null) return -1;
  if (ta !== null) return 1;

  // fallback: UUID/string (ordem estável, não numérica)
  return String(b?.id || "").localeCompare(String(a?.id || ""));
}

async function loadClientes() {
  const { data, error } = await sb.from("clientes").select("*");
  if (error) throw error;

  // Clientes: melhor ordem é por nome
  app.data.clientes = (data || []).sort((a, b) =>
    String(a?.nome || "").localeCompare(String(b?.nome || ""), "pt-BR", { sensitivity: "base" })
  );
}

async function loadPedidos() {
  const { data, error } = await sb.from("pedidos").select("*");
  if (error) throw error;
  app.data.pedidos = (data || []).sort(sortByCreatedAtOrIdDesc);
}

async function loadDespesas() {
  const { data, error } = await sb.from("despesas").select("*");
  if (error) throw error;
  app.data.despesas = (data || []).sort(sortByCreatedAtOrIdDesc);
}

async function loadIngredientes() {
  const { data, error } = await sb.from("ingredientes").select("*");
  if (error) throw error;
  app.data.ingredientes = (data || []).sort(sortByCreatedAtOrIdDesc);
}

// opcional: se existir, soma nas despesas do dashboard
async function loadComprasInsumosIfExists() {
  const { data, error } = await sb.from("compras_insumos").select("*");
  if (error) {
    // se a tabela não existir, ignora
    app.data.compras_insumos = [];
    return;
  }
  app.data.compras_insumos = (data || []).sort(sortByCreatedAtOrIdDesc);
}

async function loadKits() {
  const { data, error } = await sb.from("kits").select("*");
  if (error) throw error;
  app.data.kits = (data || []).sort(sortByCreatedAtOrIdDesc);
}

async function loadKitOpcoes() {
  const { data, error } = await sb.from("kit_opcoes").select("*");
  if (error) throw error;
  app.data.kit_opcoes = (data || []).sort(sortByCreatedAtOrIdDesc);
}

async function loadCardapios() {
  const { data, error } = await sb.from("cardapios").select("*");
  if (error) throw error;
  app.data.cardapios = (data || []).sort(sortByCreatedAtOrIdDesc);
}

async function loadCardapioItens() {
  const { data, error } = await sb.from("cardapio_itens").select("*");
  if (error) throw error;
  app.data.cardapio_itens = (data || []).sort(sortByCreatedAtOrIdDesc);
}


async function loadAllData() {
  await Promise.all([
    loadClientes(),
    loadPedidos(),
    loadDespesas(),
    loadIngredientes(),
    loadKits(),
    loadKitOpcoes(),
    loadCardapios(),
    loadCardapioItens(),
    loadComprasInsumosIfExists(),
  ]);
}


// ===============================
// 7) INIT AFTER LOGIN
// ===============================
async function initAfterLogin() {
  try {
    // filtro padrão
    if (!app.filtro.dashboardIni) app.filtro.dashboardIni = startOfMonthISO();
    if (!app.filtro.dashboardFim) app.filtro.dashboardFim = todayISO();

    await loadAllData();
    renderApp();
  } catch (e) {
    console.error("Erro initAfterLogin:", e);
    alert(
      "Erro ao carregar do Supabase. Provável: RLS/Policies bloqueando ou nome de coluna/tabela diferente.\n\nDetalhe: " +
        (e?.message || e)
    );
  }
}

// ===============================
// 8) RENDER BASE
// ===============================
function renderApp() {
  root.innerHTML = `
    <div class="app-layout">
      ${renderSidebar()}
      <div class="main-content">
        ${renderHeader()}
        <div class="container" style="margin-top: 1.25rem;">
          ${renderCurrentPage()}
        </div>
      </div>
    </div>
  `;

  bindNav();
  bindPageEvents();
}

function renderSidebar() {
 const items = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "clientes", icon: "👥", label: "Clientes" },
  { key: "pedidos", icon: "🛒", label: "Pedidos" },
  { key: "cardapios", icon: "📋", label: "Cardápios" }, // 👈 NOVO
  { key: "despesas", icon: "📉", label: "Despesas" },
  { key: "estoque", icon: "📦", label: "Estoque" },
];



  return `
    <div class="sidebar">
      <div class="logo" style="padding: 16px; display:flex; gap:10px; align-items:center;">
        <img src="logo.png" alt="CFIT" style="width:40px;height:40px;border-radius:8px;object-fit:contain;">
        <div>
          <div style="font-weight:800;">CFIT</div>
          <div style="opacity:.7;font-size:12px;">Dashboard</div>
        </div>
      </div>

      <ul class="nav-menu">
        ${items
          .map(
            (it) => `
              <li class="nav-item ${app.currentPage === it.key ? "active" : ""}" data-page="${it.key}">
                <span style="margin-right:10px;">${it.icon}</span> ${it.label}
              </li>
            `
          )
          .join("")}
      </ul>
    </div>
  `;
}

function renderHeader() {
  return `
    <div class="header">
      <h1>CFIT - Dashboard</h1>
      <div style="text-align:right; opacity:.75;">Bem-vindo!</div>
    </div>
  `;
}

function renderCurrentPage() {
  switch (app.currentPage) {
    case "dashboard":
      return renderDashboard();
    case "clientes":
      return renderClientes();
    case "pedidos":
      return renderPedidos();
    case "cardapios":
      return renderCardapios(); // 👈 NOVO
    case "despesas":
      return renderDespesas();
    case "estoque":
      return renderEstoque();
    default:
      return renderDashboard();
  }
}


// ===============================
// 9) NAV
// ===============================
function bindNav() {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.addEventListener("click", () => {
      const page = el.dataset.page;
      if (!page) return;
      app.currentPage = page;
      renderApp();
    });
  });
}

// ===============================
// 10) DASHBOARD
// ===============================
function calcResumoPeriodo(ini, fim) {
  const range = parseDateRange(ini, fim);
  if (!range) return { faturamento: 0, despesas: 0, lucro: 0 };

  const faturamento = (app.data.pedidos || [])
    .filter(p => withinRange(p.data, range) && String(p.status || "").toLowerCase() !== "cancelado")
    .reduce((t, p) => t + Number(p.valor || 0), 0);

  const despesasA = (app.data.despesas || [])
    .filter(d => withinRange(d.data, range))
    .reduce((t, d) => t + Number(d.valor || 0), 0);

  const despesasB = (app.data.compras_insumos || [])
    .filter(c => withinRange(c.data, range))
    .reduce((t, c) => t + Number(c.valor || c.valor_total || 0), 0);

  const despesas = despesasA + despesasB;
  const lucro = faturamento - despesas;

  return { faturamento, despesas, lucro };
}

function renderDashboard() {
  const ini = app.filtro.dashboardIni || startOfMonthISO();
  const fim = app.filtro.dashboardFim || todayISO();
  const r = calcResumoPeriodo(ini, fim);

  const hojeISO = todayISO();
  const pedidosHoje = (app.data.pedidos || [])
    .filter(p => String(p.data || "").slice(0, 10) === hojeISO);

  return `
    <h2>Dashboard</h2>

    <div class="card" style="margin-top:1.25rem;">
      <div class="card-header">
        <h3 class="card-title">Período</h3>
      </div>
      <div class="card-content">
        <form id="dash-filter">
          <div class="grid grid-3">
            <div class="form-group">
              <label class="form-label">Data inicial</label>
              <input type="date" class="form-input" id="dash-ini" value="${escapeHtml(ini)}">
            </div>
            <div class="form-group">
              <label class="form-label">Data final</label>
              <input type="date" class="form-input" id="dash-fim" value="${escapeHtml(fim)}">
            </div>
            <div class="form-group" style="margin-top:1.8rem;">
              <button class="btn btn-primary btn-block" type="submit">Aplicar</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="grid grid-3" style="margin-top:1.25rem;">
      <div class="stat-card stat-faturamento">
        <div class="stat-label">Faturamento</div>
        <div class="stat-value">${formatCurrency(r.faturamento)}</div>
      </div>
      <div class="stat-card stat-despesas">
        <div class="stat-label">Despesas</div>
        <div class="stat-value">${formatCurrency(r.despesas)}</div>
      </div>
      <div class="stat-card stat-lucro">
        <div class="stat-label">Lucro</div>
        <div class="stat-value">${formatCurrency(r.lucro)}</div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Pedidos do dia</h3>
        </div>
        <div class="card-content">
          ${
            pedidosHoje.length
              ? `<strong>${pedidosHoje.length} pedido(s) hoje</strong>`
              : `<div style="opacity:.7;">Nenhum pedido hoje.</div>`
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Resumo rápido</h3>
        </div>
        <div class="card-content">
          <div>Clientes: <strong>${app.data.clientes.length}</strong></div>
          <div>Pedidos: <strong>${app.data.pedidos.length}</strong></div>
          <div>Despesas: <strong>${app.data.despesas.length}</strong></div>
          <div>Itens estoque: <strong>${app.data.ingredientes.length}</strong></div>
        </div>
      </div>
    </div>
  `;
}


// ===============================
// 11) CLIENTES (CRUD)
// ===============================
function renderClientes() {
  return `
    <h2>Clientes</h2>

    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="cli-title">Novo Cliente</h3>
        </div>
        <div class="card-content">
          <form id="cli-form">
            <input type="hidden" id="cli-id" />

            <div class="form-group">
              <label class="form-label">Nome</label>
              <input class="form-input" id="cli-nome" placeholder="Ex: João da Silva">
            </div>

            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input class="form-input" id="cli-tel" placeholder="11999999999">
            </div>

            <div class="form-group">
              <label class="form-label">Endereço</label>
              <input class="form-input" id="cli-end" placeholder="Rua, número e bairro">
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="cli-submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="cli-reset">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Clientes</h3>
        </div>
        <div class="card-content">
          ${
            app.data.clientes.length
              ? `
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
                        (c) => `
                      <tr>
                        <td>${escapeHtml(c.nome)}</td>
                        <td>${escapeHtml(c.telefone)}</td>
                        <td>${escapeHtml(c.endereco)}</td>
                        <td style="white-space:nowrap;">
                          <button class="btn btn-small btn-secondary" data-act="cli-edit" data-id="${c.id}">Editar</button>
                          <button class="btn btn-small btn-danger" data-act="cli-del" data-id="${c.id}">Excluir</button>
                        </td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              `
              : `<div style="opacity:.7;">Nenhum cliente cadastrado.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

async function upsertCliente(payload) {
  // payload: { id?, nome, telefone, endereco }

  // REGRA:
  // - Novo cliente: NÃO envia id (Supabase gera UUID)
  // - Cliente existente: usa id UUID já vindo do banco

  let dataToSave = {
    nome: payload.nome,
    telefone: payload.telefone,
    endereco: payload.endereco,
  };

  let query = sb.from("clientes");

  if (payload.id) {
    // UPDATE
    const { error } = await query
      .update(dataToSave)
      .eq("id", payload.id);
    if (error) throw error;
  } else {
    // INSERT
    const { error } = await query.insert([dataToSave]);
    if (error) throw error;
  }
}

async function deleteClienteDB(id) {
  const { error } = await sb.from("clientes").delete().eq("id", String(id));
  if (error) throw error;
}

// ===============================
// KITS (DB HELPERS)
// ===============================
async function getKitsDB() {
  const { data, error } = await sb
    .from('kits')
    .select('id,nome,quantidade,quantidade_itens,ativo,created_at')
    .eq('ativo', true)
    .order('quantidade', { ascending: true })
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function getKitOpcoesDB(kit_id) {
  if (!kit_id) return [];
  const { data, error } = await sb
    .from('kit_opcoes')
    .select('id,kit_id,titulo,descricao,created_at')
    .eq('kit_id', kit_id)
    .order('titulo', { ascending: true });

  if (error) throw error;
  return data || [];
}


// ===============================
// 12) PEDIDOS (CRUD)
// ===============================
function renderPedidos() {
  const clientesOptions = (app.data.clientes || [])
    .map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`)
    .join("");

  const cardapiosOptions = (app.data.cardapios || [])
    .filter(c => c.ativo)
    .map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`)
    .join("");

  const cardapioNomeById = (id) => {
    const c = (app.data.cardapios || []).find(x => String(x.id) === String(id));
    return c ? c.nome : "-";
  };

  return `
    <h2>Pedidos</h2>

    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="ped-title">Novo Pedido</h3>
        </div>

        <div class="card-content">
          <form id="ped-form">
            <input type="hidden" id="ped-id" />
            <input type="hidden" id="ped-mult" value="1" />

            <div class="form-group">
              <label class="form-label">Cliente</label>
              <select class="form-input" id="ped-cliente">
                <option value="">Selecione</option>
                ${clientesOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Cardápio (7 marmitas)</label>
              <select class="form-input" id="ped-cardapio">
                <option value="">Selecione o cardápio</option>
                ${cardapiosOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Observações (opcional)</label>
              <textarea class="form-input" id="ped-obs" rows="3" placeholder="Ex: Sem cebola, trocar arroz por batata, etc..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Valor (R$)</label>
              <input class="form-input" id="ped-valor" type="number" step="0.01" placeholder="Ex: 105.00">
            </div>

            <div class="form-group">
              <label class="form-label">Data</label>
              <input class="form-input" id="ped-data" type="date" value="${todayISO()}">
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" id="ped-status">
                <option value="Recebido">Recebido</option>
                <option value="Preparando">Preparando</option>
                <option value="Pronto">Pronto</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <!-- ✅ BOTÕES RÁPIDOS 7/14/28 -->
            <div class="flex gap-2" style="margin-bottom:.75rem;">
              <button class="btn btn-secondary btn-block" type="button" id="ped-mult-1">7 (1 kit)</button>
              <button class="btn btn-secondary btn-block" type="button" id="ped-mult-2">14 (2 kits)</button>
              <button class="btn btn-secondary btn-block" type="button" id="ped-mult-4">28 (4 kits)</button>
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="ped-submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="ped-reset">Limpar</button>
            </div>

            <div style="margin-top:.6rem; opacity:.75; font-size:12px;">
              Dica: 14 e 28 criam automaticamente 2 ou 4 pedidos iguais (cada um = 7 marmitas).
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Pedidos</h3>
        </div>

        <div class="card-content">
          ${
            (app.data.pedidos || []).length
              ? `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Cardápio</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(app.data.pedidos || [])
                      .map((p) => {
                        const dt = p.data ? new Date(p.data) : null;
                        const dataStr = dt ? dt.toLocaleDateString("pt-BR") : "-";
                        const nomeCli = p.cliente_nome || p.clienteNome || "";
                        const nomeCard = cardapioNomeById(p.cardapio_id);
                        return `
                          <tr>
                            <td>${escapeHtml(dataStr)}</td>
                            <td>${escapeHtml(nomeCli)}</td>
                            <td>${escapeHtml(nomeCard)}</td>
                            <td>${formatCurrency(p.valor)}</td>
                            <td>${escapeHtml(p.status)}</td>
                            <td style="white-space:nowrap;">
                              <button class="btn btn-small btn-secondary" data-act="ped-edit" data-id="${p.id}">Editar</button>
                              <button class="btn btn-small btn-danger" data-act="ped-del" data-id="${p.id}">Excluir</button>
                            </td>
                          </tr>
                          ${
                            p.observacoes
                              ? `<tr><td colspan="6" style="opacity:.8; font-size:12px; padding-top:0;">
                                   <strong>Obs:</strong> ${escapeHtml(String(p.observacoes).slice(0, 160))}
                                 </td></tr>`
                              : ""
                          }
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              `
              : `<div style="opacity:.7;">Nenhum pedido cadastrado.</div>`
          }
        </div>
      </div>
    </div>
  `;
}


function renderKits() {
  const kitsOptions = (app.data.kits || [])
    .map(k => {
      const qtd = (k.quantidade_itens ?? k.quantidade ?? 0);
      return `<option value="${k.id}">${escapeHtml(k.nome)} (${escapeHtml(qtd)})</option>`;
    })
    .join("");

  const opcoesRows = (app.data.kit_opcoes || []).map(o => {
    const kit = (app.data.kits || []).find(k => String(k.id) === String(o.kit_id));
    return `
      <tr>
        <td>${escapeHtml(kit ? kit.nome : "-")}</td>
        <td>${escapeHtml(o.titulo || "")}</td>
        <td>${escapeHtml(o.descricao || "")}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-small btn-danger" data-act="kop-del" data-id="${o.id}">Excluir</button>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <h2>Kits</h2>

    <!-- ====== KITS ====== -->
    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="kit-title">Novo Kit</h3>
        </div>
        <div class="card-content">
          <form id="kit-form">
            <input type="hidden" id="kit-id" />

            <div class="form-group">
              <label class="form-label">Nome do Kit</label>
              <input class="form-input" id="kit-nome" placeholder="Ex: Kit 7 Marmitas">
            </div>

            <div class="form-group">
              <label class="form-label">Quantidade</label>
              <input class="form-input" id="kit-quantidade" type="number" step="1">
            </div>

            <div class="form-group">
              <label class="form-label">Ativo</label>
              <input type="checkbox" id="kit-ativo" checked>
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="kit-reset">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Kits Cadastrados</h3>
        </div>
        <div class="card-content">
          ${
            app.data.kits.length
              ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Qtd</th>
                    <th>Ativo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${app.data.kits.map(k => `
                    <tr>
                      <td>${escapeHtml(k.nome)}</td>
                      <td>${k.quantidade}</td>
                      <td>${k.ativo ? "✅" : "❌"}</td>
                      <td>
                        <button class="btn btn-small btn-danger" data-act="kit-del" data-id="${k.id}">Excluir</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              `
              : `<div style="opacity:.7;">Nenhum kit cadastrado.</div>`
          }
        </div>
      </div>
    </div>

    <!-- ====== OPÇÕES DO KIT ====== -->
    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Nova Opção de Kit</h3>
        </div>
        <div class="card-content">
          <form id="kop-form">
            <input type="hidden" id="kop-id" />

            <div class="form-group">
              <label class="form-label">Kit</label>
              <select class="form-input" id="kop-kit">
                <option value="">Selecione</option>
                ${kitsOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Título</label>
              <input class="form-input" id="kop-titulo" placeholder="Ex: Cardápio A">
            </div>

            <div class="form-group">
              <label class="form-label">Descrição</label>
              <input class="form-input" id="kop-desc" placeholder="Ex: Frango + arroz + legumes">
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="kop-reset">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Opções Cadastradas</h3>
        </div>
        <div class="card-content">
          ${
            app.data.kit_opcoes.length
              ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Kit</th>
                    <th>Título</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${opcoesRows}
                </tbody>
              </table>
              `
              : `<div style="opacity:.7;">Nenhuma opção cadastrada.</div>`
          }
        </div>
      </div>
    </div>
  `;
}



// ===============================
// PEDIDOS - UI: KITS + OPÇÕES (ROBUSTO)
// ===============================
function $id(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function escapeHtmlCFIT(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function hydratePedidoKitsUI({ presetKitId = '', presetOpcaoTitulo = '' } = {}) {
  // aceita IDs nos 2 padrões: pedido-* e ped-*
  const kitSelect = $id('pedido-kit', 'ped-kit');
  const opcaoSelect = $id('pedido-kit-opcao', 'ped-kit-opcao', 'pedido-opcao-kit');

  if (!kitSelect || !opcaoSelect) return;

  // Carrega kits
  const kits = await getKitsDB();

  kitSelect.innerHTML = `
    <option value="">Selecione um kit</option>
    ${kits.map(k => `<option value="${k.id}">${escapeHtmlCFIT(`${k.nome} (${k.quantidade})`)}</option>`).join('')}
  `;

  if (presetKitId) kitSelect.value = presetKitId;

  async function loadOpcoes() {
    const kitId = kitSelect.value || '';
    const opcoes = await getKitOpcoesDB(kitId);

    opcaoSelect.innerHTML = `
      <option value="">Selecione a opção</option>
      ${opcoes.map(o =>
        `<option value="${escapeHtmlCFIT(o.titulo)}">${escapeHtmlCFIT(`${o.titulo} — ${o.descricao}`)}</option>`
      ).join('')}
    `;

    if (presetOpcaoTitulo) opcaoSelect.value = presetOpcaoTitulo;
  }

  await loadOpcoes();

  kitSelect.onchange = async () => {
    presetOpcaoTitulo = '';
    await loadOpcoes();
  };
}

async function upsertCardapio(payload) {
  const dataToSave = {
    nome: payload.nome,
    tipo: payload.tipo || "padrao", // 'padrao' | 'personalizado'
    ativo: payload.ativo ?? true,
  };

  if (payload.id) {
    const { error } = await sb.from("cardapios").update(dataToSave).eq("id", String(payload.id));
    if (error) throw error;
  } else {
    const { error } = await sb.from("cardapios").insert([dataToSave]);
    if (error) throw error;
  }
}

async function deleteCardapioDB(id) {
  const { error } = await sb.from("cardapios").delete().eq("id", String(id));
  if (error) throw error;
}

// Itens: 7 dias (1..7). Usa upsert por (cardapio_id,dia_semana) se você criou UNIQUE.
async function upsertCardapioItem(payload) {
  const dataToSave = {
    cardapio_id: payload.cardapio_id,
    dia_semana: Number(payload.dia_semana),
    titulo: payload.titulo,
    descricao: payload.descricao || "",
  };

  if (payload.id) {
    const { error } = await sb.from("cardapio_itens").update(dataToSave).eq("id", String(payload.id));
    if (error) throw error;
  } else {
    const { error } = await sb
      .from("cardapio_itens")
      .upsert([dataToSave], { onConflict: "cardapio_id,dia_semana" }); // exige UNIQUE
    if (error) throw error;
  }
}

async function deleteCardapioItemDB(id) {
  const { error } = await sb.from("cardapio_itens").delete().eq("id", String(id));
  if (error) throw error;
}


async function upsertPedido(payload) {
  const dataToSave = {
    cliente_id: payload.cliente_id,
    valor: payload.valor,
    valor_total: payload.valor, // mantém (se você usa no dashboard)
    data: payload.data,
    status: payload.status,

    // ✅ NOVO
    cardapio_id: payload.cardapio_id || null,
    observacoes: payload.observacoes || null,
  };

  if (payload.id) {
    const { error } = await sb
      .from("pedidos")
      .update(dataToSave)
      .eq("id", String(payload.id));
    if (error) throw error;
  } else {
    const { error } = await sb.from("pedidos").insert([dataToSave]);
    if (error) throw error;
  }
}




  if (payload.id) {
    const { error } = await sb
      .from("pedidos")
      .update(dataToSave)
      .eq("id", String(payload.id));
    if (error) throw error;
  } else {
    const { error } = await sb.from("pedidos").insert([dataToSave]);
    if (error) throw error;
  }
}



async function deletePedidoDB(id) {
  const idStr = String(id || "").trim();
  if (!idStr || idStr === "NaN") {
    throw new Error("ID inválido para excluir pedido.");
  }

  const { error } = await sb.from("pedidos").delete().eq("id", idStr);
  if (error) throw error;
}



// ===============================
// 13) DESPESAS (CRUD)
// ===============================
function renderDespesas() {
  return `
    <h2>Despesas</h2>

    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="desp-title">Nova Despesa</h3>
        </div>
        <div class="card-content">
          <form id="desp-form">
            <input type="hidden" id="desp-id" />

            <div class="form-group">
              <label class="form-label">Descrição</label>
              <input class="form-input" id="desp-desc" placeholder="Ex: gás, funcionário, embalagem...">
            </div>

            <div class="form-group">
              <label class="form-label">Valor</label>
              <input class="form-input" id="desp-valor" type="number" step="0.01" placeholder="Ex: 100.00">
            </div>

            <div class="form-group">
              <label class="form-label">Data</label>
              <input class="form-input" id="desp-data" type="date" value="${todayISO()}">
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="desp-submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="desp-reset">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Despesas</h3>
        </div>
        <div class="card-content">
          ${
            app.data.despesas.length
              ? `
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
                    ${app.data.despesas
                      .map((d) => {
                        const dt = d.data ? new Date(d.data) : null;
                        const dataStr = dt ? dt.toLocaleDateString("pt-BR") : "-";
                        return `
                          <tr>
                            <td>${escapeHtml(dataStr)}</td>
                            <td>${escapeHtml(d.descricao)}</td>
                            <td>${formatCurrency(d.valor)}</td>
                            <td style="white-space:nowrap;">
                              <button class="btn btn-small btn-secondary" data-act="desp-edit" data-id="${d.id}">Editar</button>
                              <button class="btn btn-small btn-danger" data-act="desp-del" data-id="${d.id}">Excluir</button>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              `
              : `<div style="opacity:.7;">Nenhuma despesa cadastrada.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

async function upsertDespesa(payload) {
  if (!payload.id) payload.id = Date.now();
  const { error } = await sb.from("despesas").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

async function deleteDespesaDB(id) {
  const { error } = await sb.from("despesas").delete().eq("id", id);
  if (error) throw error;
}

// Função para inserir ou atualizar KIT
async function upsertKit(payload) {
  const qtd = Number(payload.quantidade || payload.quantidade_itens || 0);

  const dataToSave = {
    nome: payload.nome,
    // compatibilidade: alguns bancos usam "quantidade", outros "quantidade_itens"
    quantidade: qtd,
    quantidade_itens: qtd,
    ativo: payload.ativo ?? true,
  };

  let query = sb.from("kits");

  if (payload.id) {
    const { error } = await query.update(dataToSave).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await query.insert([dataToSave]);
    if (error) throw error;
  }
}


async function deleteKitOpcaoDB(id) {
  const { error } = await sb.from("kit_opcoes").delete().eq("id", String(id));
  if (error) throw error;
}


// Função para inserir ou atualizar OPÇÃO DO KIT
async function upsertKitOpcao(payload) {
  const dataToSave = {
    kit_id: payload.kit_id,
    titulo: payload.titulo,
    descricao: payload.descricao,
  };

  let query = sb.from("kit_opcoes");

  if (payload.id) {
    // UPDATE
    const { error } = await query.update(dataToSave).eq("id", payload.id);
    if (error) throw error;
  } else {
    // INSERT
    const { error } = await query.insert([dataToSave]);
    if (error) throw error;
  }
}


// ===============================
// 14) ESTOQUE (CRUD)
// ===============================
function renderEstoque() {
  return `
    <h2>Estoque</h2>

    <div class="grid grid-2" style="margin-top:1.25rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="est-title">Novo Item</h3>
        </div>
        <div class="card-content">
          <form id="est-form">
            <input type="hidden" id="est-id" />

            <div class="form-group">
              <label class="form-label">Nome</label>
              <input class="form-input" id="est-nome" placeholder="Ex: Frango, Arroz...">
            </div>

            <div class="form-group">
              <label class="form-label">Unidade</label>
              <input class="form-input" id="est-uni" placeholder="Ex: kg, pct, un">
            </div>

            <div class="form-group">
              <label class="form-label">Quantidade</label>
              <input class="form-input" id="est-qtd" type="number" step="0.01" placeholder="Ex: 10">
            </div>

            <div class="form-group">
              <label class="form-label">Quantidade mínima</label>
              <input class="form-input" id="est-min" type="number" step="0.01" placeholder="Ex: 2">
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="est-submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="est-reset">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Itens</h3>
        </div>
        <div class="card-content">
          ${
            app.data.ingredientes.length
              ? `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Un.</th>
                      <th>Qtd</th>
                      <th>Mín</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${app.data.ingredientes
                      .map((i) => {
                        const qtd = Number(i.quantidade || 0);
                        const min = Number(i.quantidade_minima ?? i.quantidadeMinima ?? 0);
                        const baixo = min > 0 && qtd <= min;
                        return `
                          <tr>
                            <td>${escapeHtml(i.nome)}</td>
                            <td>${escapeHtml(i.unidade)}</td>
                            <td>${escapeHtml(qtd)}</td>
                            <td>${escapeHtml(min)}</td>
                            <td>${baixo ? "⚠️ Baixo" : "✅ OK"}</td>
                            <td style="white-space:nowrap;">
                              <button class="btn btn-small btn-secondary" data-act="est-edit" data-id="${i.id}">Editar</button>
                              <button class="btn btn-small btn-danger" data-act="est-del" data-id="${i.id}">Excluir</button>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              `
              : `<div style="opacity:.7;">Nenhum item cadastrado.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderCardapios() {
  const cardapios = app.data.cardapios || [];
  const itens = app.data.cardapio_itens || [];

  // selecionado
  const selectedId =
    app.currentCardapioId ||
    (cardapios.length ? cardapios[0].id : null);

  if (!app.currentCardapioId && selectedId) app.currentCardapioId = selectedId;

  const opts = cardapios
    .map((c) => `<option value="${c.id}" ${String(c.id) === String(selectedId) ? "selected" : ""}>${escapeHtml(c.nome)}</option>`)
    .join("");

  const itensDoCardapio = selectedId
    ? itens.filter((i) => String(i.cardapio_id) === String(selectedId)).sort((a,b)=>Number(a.dia_semana)-Number(b.dia_semana))
    : [];

  const itensRows = itensDoCardapio.length
    ? itensDoCardapio
        .map((i) => `
          <tr>
            <td>${escapeHtml(i.dia_semana)}</td>
            <td>${escapeHtml(i.titulo || "")}</td>
            <td>${escapeHtml(i.descricao || "")}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-small btn-secondary" data-act="citem-edit" data-id="${i.id}">Editar</button>
              <button class="btn btn-small btn-danger" data-act="citem-del" data-id="${i.id}">Excluir</button>
            </td>
          </tr>
        `)
        .join("")
    : "";

  return `
    <h2>Cardápios</h2>

    <div class="grid grid-2" style="margin-top:1.25rem;">
      <!-- CARDÁPIOS -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="car-title">Novo Cardápio</h3>
        </div>
        <div class="card-content">
          <form id="car-form">
            <input type="hidden" id="car-id" />

            <div class="form-group">
              <label class="form-label">Nome</label>
              <input class="form-input" id="car-nome" placeholder="Ex: Cardápio 1">
            </div>

            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-input" id="car-tipo">
                <option value="padrao">Padrão</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Ativo</label>
              <input type="checkbox" id="car-ativo" checked>
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="car-submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="car-reset">Limpar</button>
            </div>
          </form>

          <div style="margin-top:1rem;">
            ${
              cardapios.length
                ? `
                <table class="table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Ativo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cardapios
                      .map(
                        (c) => `
                      <tr>
                        <td>${escapeHtml(c.nome)}</td>
                        <td>${escapeHtml(c.tipo || "padrao")}</td>
                        <td>${c.ativo ? "✅" : "❌"}</td>
                        <td style="white-space:nowrap;">
                          <button class="btn btn-small btn-secondary" data-act="car-edit" data-id="${c.id}">Editar</button>
                          <button class="btn btn-small btn-danger" data-act="car-del" data-id="${c.id}">Excluir</button>
                        </td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                : `<div style="opacity:.7;">Nenhum cardápio cadastrado.</div>`
            }
          </div>
        </div>
      </div>

      <!-- ITENS (1..7) -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Itens do Cardápio (dias 1 a 7)</h3>
        </div>
        <div class="card-content">
          <div class="form-group">
            <label class="form-label">Cardápio selecionado</label>
            <select class="form-input" id="car-select">
              <option value="">Selecione</option>
              ${opts}
            </select>
          </div>

          <form id="citem-form" style="margin-top:1rem;">
            <input type="hidden" id="citem-id" />

            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">Dia (1..7)</label>
                <select class="form-input" id="citem-dia">
                  ${[1,2,3,4,5,6,7].map(d=>`<option value="${d}">${d}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Título</label>
                <input class="form-input" id="citem-titulo" placeholder="Ex: Frango + arroz">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Descrição</label>
              <input class="form-input" id="citem-desc" placeholder="Ex: 120g frango, 100g arroz, legumes...">
            </div>

            <div class="flex gap-2">
              <button class="btn btn-primary btn-block" type="submit" id="citem-submit">Salvar</button>
              <button class="btn btn-secondary btn-block" type="button" id="citem-reset">Limpar</button>
            </div>
          </form>

          <div style="margin-top:1rem;">
            ${
              selectedId
                ? (itensDoCardapio.length
                    ? `
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Dia</th>
                            <th>Título</th>
                            <th>Descrição</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itensRows}
                        </tbody>
                      </table>
                    `
                    : `<div style="opacity:.7;">Nenhum item ainda. Cadastre os dias 1..7.</div>`)
                : `<div style="opacity:.7;">Cadastre um cardápio primeiro.</div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}


async function upsertIngrediente(payload) {
  // payload: { id?, nome, unidade, quantidade, quantidade_minima }

  const dataToSave = {
    nome: payload.nome,
    unidade: payload.unidade,
    quantidade: Number(payload.quantidade ?? 0),
    quantidade_minima: Number(payload.quantidade_minima ?? 0),
  };

  if (payload.id) {
    const { error } = await sb
      .from("ingredientes")
      .update(dataToSave)
      .eq("id", String(payload.id));
    if (error) throw error;
  } else {
    const { error } = await sb.from("ingredientes").insert([dataToSave]);
    if (error) throw error;
  }
}

async function deleteIngredienteDB(id) {
  const { error } = await sb.from("ingredientes").delete().eq("id", String(id));
  if (error) throw error;
}


// ===============================
// 15) EVENTS POR PÁGINA
// ===============================
function bindPageEvents() {
  // DASH FILTER
  const dashForm = document.getElementById("dash-filter");
  if (dashForm) {
    dashForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const ini = document.getElementById("dash-ini")?.value;
      const fim = document.getElementById("dash-fim")?.value;
      app.filtro.dashboardIni = ini;
      app.filtro.dashboardFim = fim;
      renderApp();
    });
  }

  // ===============================
  // KITS (FORM) - 1 BLOCO (evita "already declared")
  // ===============================
  const kitFormEl = document.getElementById("kit-form");
  if (kitFormEl) {
    kitFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("kit-id")?.value?.trim() || null;
      const nome = document.getElementById("kit-nome")?.value?.trim();
      const quantidade = Number(document.getElementById("kit-quantidade")?.value || 0);
      const ativo = !!document.getElementById("kit-ativo")?.checked;

      if (!nome) return alert("Informe o nome do kit.");
      if (!quantidade || quantidade <= 0) return alert("Informe uma quantidade válida.");

      try {
        await upsertKit({ id, nome, quantidade, ativo });
        if (typeof loadKits === "function") await loadKits();
        if (typeof resetKitForm === "function") resetKitForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar kit: " + (err?.message || err));
      }
    });
  }

  const kitResetEl = document.getElementById("kit-reset");
  if (kitResetEl) kitResetEl.addEventListener("click", () => (typeof resetKitForm === "function" ? resetKitForm() : null));

  // ===============================
  // OPÇÕES DO KIT (FORM)
  // ===============================
  const kopFormEl = document.getElementById("kop-form");
  if (kopFormEl) {
    kopFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("kop-id")?.value?.trim() || null;
      const kit_id = document.getElementById("kop-kit")?.value?.trim() || "";
      const titulo = document.getElementById("kop-titulo")?.value?.trim();
      const descricao = document.getElementById("kop-desc")?.value?.trim() || "";

      if (!kit_id) return alert("Selecione um kit.");
      if (!titulo) return alert("Informe o título.");

      try {
        await upsertKitOpcao({ id, kit_id, titulo, descricao });
        if (typeof loadKitOpcoes === "function") await loadKitOpcoes();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar opção do kit: " + (err?.message || err));
      }
    });
  }

  const kopResetEl = document.getElementById("kop-reset");
  if (kopResetEl) {
    kopResetEl.addEventListener("click", () => {
      const id = document.getElementById("kop-id");
      const kit = document.getElementById("kop-kit");
      const titulo = document.getElementById("kop-titulo");
      const desc = document.getElementById("kop-desc");
      if (id) id.value = "";
      if (kit) kit.value = "";
      if (titulo) titulo.value = "";
      if (desc) desc.value = "";
    });
  }

  // ===============================
  // CLIENTES
  // ===============================
  const cliForm = document.getElementById("cli-form");
  if (cliForm) {
    cliForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("cli-id")?.value?.trim() || null;
      const nome = document.getElementById("cli-nome")?.value?.trim();
      const telefone = document.getElementById("cli-tel")?.value?.trim();
      const endereco = document.getElementById("cli-end")?.value?.trim();

      if (!nome) return alert("Informe o nome.");
      if (!telefone) return alert("Informe o telefone.");
      if (!endereco) return alert("Informe o endereço.");

      try {
        await upsertCliente({ id, nome, telefone, endereco });
        await loadClientes();
        resetClienteForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar cliente: " + (err?.message || err));
      }
    });
  }

  const cliReset = document.getElementById("cli-reset");
  if (cliReset) cliReset.addEventListener("click", () => resetClienteForm());

  // ===============================
  // PEDIDOS
  // ===============================
  const pedForm = document.getElementById("ped-form");
  if (pedForm) {
    // botões 7/14/28 (1/2/4 pedidos)
    const setMult = (n) => {
      const multEl = document.getElementById("ped-mult");
      if (multEl) multEl.value = String(n);
    };

    document.getElementById("ped-mult-1")?.addEventListener("click", () => setMult(1));
    document.getElementById("ped-mult-2")?.addEventListener("click", () => setMult(2));
    document.getElementById("ped-mult-4")?.addEventListener("click", () => setMult(4));

    pedForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("ped-id")?.value?.trim() || null;
      const cliente_id = document.getElementById("ped-cliente")?.value || "";
      const cardapio_id = document.getElementById("ped-cardapio")?.value || null;
      const observacoes = document.getElementById("ped-obs")?.value?.trim() || null;

      const valor = Number(document.getElementById("ped-valor")?.value || 0);
      const data = document.getElementById("ped-data")?.value || todayISO();
      const statusUI = document.getElementById("ped-status")?.value || "Recebido";

      if (!cliente_id) return alert("Selecione o cliente.");
      if (!cardapio_id) return alert("Selecione o cardápio.");
      if (!valor || valor <= 0) return alert("Informe um valor válido.");

      const statusMap = {
        Recebido: "recebido",
        Preparando: "preparando",
        Pronto: "pronto",
        Entregue: "entregue",
        Cancelado: "cancelado",
      };

      const payloadBase = {
        id,
        cliente_id,
        cardapio_id,
        observacoes,
        valor,
        data,
        status: statusMap[statusUI] || "recebido",
      };

      try {
        if (id) {
          await upsertPedido(payloadBase);
        } else {
          const mult = Number(document.getElementById("ped-mult")?.value || 1) || 1;

          const inserts = Array.from({ length: mult }, () => ({
            cliente_id: payloadBase.cliente_id,
            cardapio_id: payloadBase.cardapio_id,
            observacoes: payloadBase.observacoes,
            valor: payloadBase.valor,
            valor_total: payloadBase.valor,
            data: payloadBase.data,
            status: payloadBase.status,
          }));

          const { error } = await sb.from("pedidos").insert(inserts);
          if (error) throw error;
        }

        await loadPedidos();
        resetPedidoForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar pedido: " + (err?.message || err));
      }
    });
  }

  const pedReset = document.getElementById("ped-reset");
  if (pedReset) pedReset.addEventListener("click", () => resetPedidoForm());

  // ===============================
  // DESPESAS
  // ===============================
  const despForm = document.getElementById("desp-form");
  if (despForm) {
    despForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = Number(document.getElementById("desp-id")?.value || 0) || null;
      const descricao = document.getElementById("desp-desc")?.value?.trim();
      const valor = Number(document.getElementById("desp-valor")?.value || 0);
      const dataInput = document.getElementById("desp-data")?.value;

      if (!descricao) return alert("Informe a descrição.");
      if (!valor || valor <= 0) return alert("Informe um valor válido.");

      const dataISO = new Date((dataInput || todayISO()) + "T12:00:00").toISOString();

      try {
        await upsertDespesa({ id, descricao, valor, data: dataISO });
        await loadDespesas();
        resetDespesaForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar despesa: " + (err?.message || err));
      }
    });
  }

  const despReset = document.getElementById("desp-reset");
  if (despReset) despReset.addEventListener("click", () => resetDespesaForm());

  // ===============================
  // ESTOQUE
  // ===============================
  const estForm = document.getElementById("est-form");
  if (estForm) {
    estForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("est-id")?.value?.trim() || null;
      const nome = document.getElementById("est-nome")?.value?.trim();
      const unidade = document.getElementById("est-uni")?.value?.trim();

      const quantidade = Number(document.getElementById("est-qtd")?.value || 0);
      const quantidade_minima = Number(document.getElementById("est-min")?.value || 0);

      if (!nome) return alert("Informe o nome.");
      if (!unidade) return alert("Informe a unidade.");

      try {
        await upsertIngrediente({ id, nome, unidade, quantidade, quantidade_minima });
        await loadIngredientes();
        resetEstoqueForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar estoque: " + (err?.message || err));
      }
    });
  }

  const estReset = document.getElementById("est-reset");
  if (estReset) estReset.addEventListener("click", () => resetEstoqueForm());

  // ===============================
  // CARDÁPIOS
  // ===============================
  const carForm = document.getElementById("car-form");
  if (carForm) {
    carForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("car-id")?.value?.trim() || null;
      const nome = document.getElementById("car-nome")?.value?.trim();
      const tipo = document.getElementById("car-tipo")?.value || "padrao";
      const ativo = !!document.getElementById("car-ativo")?.checked;

      if (!nome) return alert("Informe o nome do cardápio.");

      try {
        await upsertCardapio({ id, nome, tipo, ativo });
        await loadCardapios();
        await loadCardapioItens();
        resetCardapioForm();
        if (!app.currentCardapioId && app.data.cardapios?.length) app.currentCardapioId = app.data.cardapios[0].id;
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar cardápio: " + (err?.message || err));
      }
    });
  }

  const carReset = document.getElementById("car-reset");
  if (carReset) carReset.addEventListener("click", () => resetCardapioForm());

  const carSelect = document.getElementById("car-select");
  if (carSelect) {
    carSelect.addEventListener("change", () => {
      app.currentCardapioId = carSelect.value || null;
      resetCardapioItemForm();
      renderApp();
    });
  }

  // ITENS DO CARDÁPIO (1..7)
  const citemForm = document.getElementById("citem-form");
  if (citemForm) {
    citemForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("citem-id")?.value?.trim() || null;
      const cardapio_id = document.getElementById("car-select")?.value || app.currentCardapioId;
      const dia_semana = Number(document.getElementById("citem-dia")?.value || 0);
      const titulo = document.getElementById("citem-titulo")?.value?.trim();
      const descricao = document.getElementById("citem-desc")?.value?.trim() || "";

      if (!cardapio_id) return alert("Selecione um cardápio.");
      if (!dia_semana || dia_semana < 1 || dia_semana > 7) return alert("Dia deve ser de 1 a 7.");
      if (!titulo) return alert("Informe o título.");

      try {
        await upsertCardapioItem({ id, cardapio_id, dia_semana, titulo, descricao });
        await loadCardapioItens();
        resetCardapioItemForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar item: " + (err?.message || err));
      }
    });
  }

  const citemReset = document.getElementById("citem-reset");
  if (citemReset) citemReset.addEventListener("click", () => resetCardapioItemForm());

  // ===============================
  // AÇÕES NAS TABELAS (delegação)
  // ===============================
  root.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const act = btn.dataset.act;

      const rawId = (btn.dataset.id ?? "").trim();
      const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : rawId;

      try {
        if (act === "cli-edit") return fillClienteForm(id);
        if (act === "cli-del") {
          if (!confirm("Excluir cliente?")) return;
          await deleteClienteDB(id);
          await loadClientes();
          renderApp();
          return;
        }

        if (act === "ped-edit") return fillPedidoForm(id);
        if (act === "ped-del") {
          if (!confirm("Excluir pedido?")) return;
          await deletePedidoDB(id);
          await loadPedidos();
          renderApp();
          return;
        }

        if (act === "desp-edit") return fillDespesaForm(id);
        if (act === "desp-del") {
          if (!confirm("Excluir despesa?")) return;
          await deleteDespesaDB(id);
          await loadDespesas();
          renderApp();
          return;
        }

        if (act === "kit-edit") {
          if (typeof fillKitForm === "function") return fillKitForm(id);
          return;
        }
        if (act === "kit-del") {
          if (!confirm("Excluir kit?")) return;
          await sb.from("kits").delete().eq("id", String(id));
          if (typeof loadKits === "function") await loadKits();
          renderApp();
          return;
        }

        if (act === "kop-del") {
          if (!confirm("Excluir opção do kit?")) return;
          await sb.from("kit_opcoes").delete().eq("id", String(id));
          if (typeof loadKitOpcoes === "function") await loadKitOpcoes();
          renderApp();
          return;
        }

        if (act === "car-edit") return fillCardapioForm(id);
        if (act === "car-del") {
          if (!confirm("Excluir cardápio? (vai apagar os 7 itens junto)")) return;
          await deleteCardapioDB(id);
          await loadCardapios();
          await loadCardapioItens();
          app.currentCardapioId = app.data.cardapios?.length ? app.data.cardapios[0].id : null;
          renderApp();
          return;
        }

        if (act === "citem-edit") return fillCardapioItemForm(id);
        if (act === "citem-del") {
          if (!confirm("Excluir item do cardápio?")) return;
          await deleteCardapioItemDB(id);
          await loadCardapioItens();
          renderApp();
          return;
        }

        if (act === "est-edit") return fillEstoqueForm(id);
        if (act === "est-del") {
          if (!confirm("Excluir item do estoque?")) return;
          await deleteIngredienteDB(id);
          await loadIngredientes();
          renderApp();
          return;
        }
      } catch (err) {
        console.error(err);
        alert("Erro: " + (err?.message || err));
      }
    });
  });
}


// ===============================
// 16) FORM HELPERS (RESET + FILL)
// ===============================
function resetClienteForm() {
  const id = document.getElementById("cli-id");
  const nome = document.getElementById("cli-nome");
  const tel = document.getElementById("cli-tel");
  const end = document.getElementById("cli-end");
  const title = document.getElementById("cli-title");
  const submit = document.getElementById("cli-submit");

  if (id) id.value = "";
  if (nome) nome.value = "";
  if (tel) tel.value = "";
  if (end) end.value = "";
  if (title) title.textContent = "Novo Cliente";
  if (submit) submit.textContent = "Salvar";
}

function fillClienteForm(id) {
  const c = app.data.clientes.find((x) => String(x.id) === String(id));
  if (!c) return;

  document.getElementById("cli-id").value = c.id;
  document.getElementById("cli-nome").value = c.nome || "";
  document.getElementById("cli-tel").value = c.telefone || "";
  document.getElementById("cli-end").value = c.endereco || "";
  document.getElementById("cli-title").textContent = "Editar Cliente";
  document.getElementById("cli-submit").textContent = "Atualizar";
}

function resetPedidoForm() {
  const id = document.getElementById("ped-id");
  const cli = document.getElementById("ped-cliente");
  const val = document.getElementById("ped-valor");
  const dt = document.getElementById("ped-data");
  const st = document.getElementById("ped-status");
  const title = document.getElementById("ped-title");
  const submit = document.getElementById("ped-submit");
  const card = document.getElementById("ped-cardapio");
  const obs = document.getElementById("ped-obs");
  const mult = document.getElementById("ped-mult");
  
  if (id) id.value = "";
  if (cli) cli.value = "";
  if (val) val.value = "";
  if (dt) dt.value = todayISO();
  if (st) st.value = "Recebido";
  if (title) title.textContent = "Novo Pedido";
  if (submit) submit.textContent = "Salvar";
  if (card) card.value = "";
  if (obs) obs.value = "";
  if (mult) mult.value = "1";
}

function fillPedidoForm(id) {
  const p = app.data.pedidos.find((x) => String(x.id) === String(id));
  if (!p) return;

  document.getElementById("ped-id").value = p.id;
  document.getElementById("ped-cliente").value = p.cliente_id || "";
  document.getElementById("ped-valor").value = p.valor || "";
  document.getElementById("ped-data").value = p.data ? toISODateInputValue(p.data) : todayISO();
  document.getElementById("ped-status").value = p.status || "Recebido";
  document.getElementById("ped-title").textContent = "Editar Pedido";
  document.getElementById("ped-submit").textContent = "Atualizar";
}


function resetDespesaForm() {
  const id = document.getElementById("desp-id");
  const desc = document.getElementById("desp-desc");
  const val = document.getElementById("desp-valor");
  const dt = document.getElementById("desp-data");
  const title = document.getElementById("desp-title");
  const submit = document.getElementById("desp-submit");

  if (id) id.value = "";
  if (desc) desc.value = "";
  if (val) val.value = "";
  if (dt) dt.value = todayISO();
  if (title) title.textContent = "Nova Despesa";
  if (submit) submit.textContent = "Salvar";
}

function fillDespesaForm(id) {
  const d = app.data.despesas.find((x) => String(x.id) === String(id));
  if (!d) return;

  document.getElementById("desp-id").value = d.id;
  document.getElementById("desp-desc").value = d.descricao || "";
  document.getElementById("desp-valor").value = d.valor || "";
  document.getElementById("desp-data").value = d.data ? toISODateInputValue(d.data) : todayISO();
  document.getElementById("desp-title").textContent = "Editar Despesa";
  document.getElementById("desp-submit").textContent = "Atualizar";
}

function resetEstoqueForm() {
  const id = document.getElementById("est-id");
  const nome = document.getElementById("est-nome");
  const uni = document.getElementById("est-uni");
  const qtd = document.getElementById("est-qtd");
  const min = document.getElementById("est-min");
  const title = document.getElementById("est-title");
  const submit = document.getElementById("est-submit");

  if (id) id.value = "";
  if (nome) nome.value = "";
  if (uni) uni.value = "";
  if (qtd) qtd.value = "";
  if (min) min.value = "";
  if (title) title.textContent = "Novo Item";
  if (submit) submit.textContent = "Salvar";
}

function resetCardapioForm() {
  const id = document.getElementById("car-id");
  const nome = document.getElementById("car-nome");
  const tipo = document.getElementById("car-tipo");
  const ativo = document.getElementById("car-ativo");
  const title = document.getElementById("car-title");
  const submit = document.getElementById("car-submit");

  if (id) id.value = "";
  if (nome) nome.value = "";
  if (tipo) tipo.value = "padrao";
  if (ativo) ativo.checked = true;
  if (title) title.textContent = "Novo Cardápio";
  if (submit) submit.textContent = "Salvar";
}

function fillCardapioForm(id) {
  const c = (app.data.cardapios || []).find((x) => String(x.id) === String(id));
  if (!c) return;

  document.getElementById("car-id").value = c.id;
  document.getElementById("car-nome").value = c.nome || "";
  document.getElementById("car-tipo").value = c.tipo || "padrao";
  document.getElementById("car-ativo").checked = !!c.ativo;

  const title = document.getElementById("car-title");
  const submit = document.getElementById("car-submit");
  if (title) title.textContent = "Editar Cardápio";
  if (submit) submit.textContent = "Atualizar";
}

function resetCardapioItemForm() {
  const id = document.getElementById("citem-id");
  const dia = document.getElementById("citem-dia");
  const titulo = document.getElementById("citem-titulo");
  const desc = document.getElementById("citem-desc");
  const submit = document.getElementById("citem-submit");

  if (id) id.value = "";
  if (dia) dia.value = "1";
  if (titulo) titulo.value = "";
  if (desc) desc.value = "";
  if (submit) submit.textContent = "Salvar";
}

function fillCardapioItemForm(id) {
  const i = (app.data.cardapio_itens || []).find((x) => String(x.id) === String(id));
  if (!i) return;

  // garante cardápio selecionado
  app.currentCardapioId = i.cardapio_id;
  const sel = document.getElementById("car-select");
  if (sel) sel.value = i.cardapio_id;

  document.getElementById("citem-id").value = i.id;
  document.getElementById("citem-dia").value = String(i.dia_semana || 1);
  document.getElementById("citem-titulo").value = i.titulo || "";
  document.getElementById("citem-desc").value = i.descricao || "";

  const submit = document.getElementById("citem-submit");
  if (submit) submit.textContent = "Atualizar";
}


function resetKitForm() {
  const id = document.getElementById("kit-id");
  const nome = document.getElementById("kit-nome");
  const qtd = document.getElementById("kit-quantidade");
  const ativo = document.getElementById("kit-ativo");

  const title = document.getElementById("kit-title");
  const submit = document.getElementById("kit-submit");

  if (id) id.value = "";
  if (nome) nome.value = "";
  if (qtd) qtd.value = "";
  if (ativo) ativo.checked = true;

  if (title) title.textContent = "Novo Kit";
  if (submit) submit.textContent = "Salvar";
}


 function fillEstoqueForm(id) {
  const i = app.data.ingredientes.find((x) => String(x.id) === String(id));
  if (!i) return;

  document.getElementById("est-id").value = i.id; // <<< ESSENCIAL
  document.getElementById("est-nome").value = i.nome || "";
  document.getElementById("est-uni").value = i.unidade || "";
  document.getElementById("est-qtd").value = i.quantidade ?? 0;
  document.getElementById("est-min").value = i.quantidade_minima ?? 0;

  document.getElementById("est-title").textContent = "Editar Item";
  document.getElementById("est-submit").textContent = "Atualizar";
}


// ===============================
// 17) START
// ===============================
document.addEventListener("DOMContentLoaded", checkSession);

