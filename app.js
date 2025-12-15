// ===============================
// CFIT DASHBOARD - SUPABASE ONLY
// ===============================

// 1) SUPABASE CONFIG
const SUPABASE_URL = "https://dsfovsdcatskyfgdhblc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZm92c2RjYXRza3lmZ2RoYmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTU4MzUsImV4cCI6MjA4MDc3MTgzNX0.hmZXAOGZ1Gm9SQqjlKClaLmdsP2udDFgQN25S58qiWw";

if (!window.supabase) {
  alert("Supabase lib não carregou. Confira o index.html (script do jsdelivr)!");
  throw new Error("Supabase lib not loaded");
}
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2) ELEMENTOS DO HTML (TEM QUE EXISTIR NO index.html)
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const logoutBtn = document.getElementById("logout-btn");
const root = document.getElementById("root");

if (!loginScreen || !appScreen || !loginForm || !logoutBtn || !root) {
  alert("Faltam IDs no index.html (login-screen/app-screen/login-form/logout-btn/root).");
  throw new Error("Missing required DOM elements");
}

// 3) ESTADO DO APP
const app = {
  currentPage: "dashboard",
  data: {
    clientes: []
  }
};

// ===============================
// UI HELPERS
// ===============================
function showLogin() {
  appScreen.style.display = "none";
  loginScreen.style.display = "block";
}

function showApp() {
  loginScreen.style.display = "none";
  appScreen.style.display = "block";
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===============================
// SUPABASE - CLIENTES
// ===============================
async function loadClientes() {
  const { data, error } = await sb
    .from("clientes")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;
  app.data.clientes = data || [];
}

async function inserirCliente(nome, telefone, endereco) {
  const { error } = await sb.from("clientes").insert([{ nome, telefone, endereco }]);
  if (error) throw error;
  await loadClientes();
}

async function atualizarCliente(id, nome, telefone, endereco) {
  const { error } = await sb.from("clientes").update({ nome, telefone, endereco }).eq("id", id);
  if (error) throw error;
  await loadClientes();
}

async function excluirCliente(id) {
  const { error } = await sb.from("clientes").delete().eq("id", id);
  if (error) throw error;
  await loadClientes();
}

// ===============================
// AUTH FLOW
// ===============================
async function initAfterLogin() {
  try {
    await loadClientes(); // por enquanto só clientes
    renderApp();
  } catch (e) {
    console.error(e);
    alert("Erro carregando dados do Supabase. Veja o console (F12).");
  }
}

async function checkSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) console.error(error);

  if (!data.session) {
    showLogin();
    return;
  }

  showApp();
  await initAfterLogin();
}

// LOGIN SUBMIT
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (loginMsg) loginMsg.textContent = "";

  const email = document.getElementById("login-email")?.value?.trim();
  const password = document.getElementById("login-pass")?.value;

  if (!email || !password) {
    if (loginMsg) loginMsg.textContent = "Preencha email e senha.";
    return;
  }

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    if (loginMsg) loginMsg.textContent = "Erro: " + error.message;
    return;
  }

  showApp();
  await initAfterLogin();
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  showLogin();
});

// ===============================
// RENDER
// ===============================
function renderSidebar() {
  const item = (key, label, icon) => `
    <li class="nav-item ${app.currentPage === key ? "active" : ""}" data-page="${key}">
      <span>${icon}</span> ${label}
    </li>
  `;

  return `
    <div class="sidebar">
      <div class="logo" style="padding: 0 1.5rem; margin-bottom: 2rem; display:flex; align-items:center; gap:0.75rem;">
        <img src="logo.png" alt="CFIT" style="width:40px;height:40px;object-fit:contain;border-radius:6px;">
        <div>
          <div style="font-weight:800;">CFIT</div>
          <div style="font-size:0.75rem;opacity:0.7;">Dashboard</div>
        </div>
      </div>

      <ul class="nav-menu">
        ${item("dashboard", "Dashboard", "📊")}
        ${item("clientes", "Clientes", "👥")}
        ${item("pedidos", "Pedidos", "🛒")}
        ${item("despesas", "Despesas", "📉")}
        ${item("estoque", "Estoque", "📦")}
      </ul>
    </div>
  `;
}

function renderHeader(title) {
  return `
    <div class="main-content">
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div style="text-align:right;">
          <p style="margin:0;opacity:0.7;">Bem-vindo!</p>
        </div>
      </div>
      <div class="container" style="margin-top:2rem;">
  `;
}

function renderFooter() {
  return `
      </div>
    </div>
  `;
}

function renderDashboard() {
  return `
    <h2>Dashboard</h2>
    <div class="card" style="margin-top:1rem;">
      <div class="card-content">
        <p>Base carregada do Supabase ✅</p>
        <p><strong>Clientes cadastrados:</strong> ${app.data.clientes.length}</p>
      </div>
    </div>
  `;
}

function renderClientes() {
  const rows = app.data.clientes.length
    ? `
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th><th>Telefone</th><th>Endereço</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${app.data.clientes.map(c => `
            <tr>
              <td>${escapeHtml(c.nome)}</td>
              <td>${escapeHtml(c.telefone)}</td>
              <td>${escapeHtml(c.endereco)}</td>
              <td>
                <button class="btn btn-small btn-secondary" data-edit-cliente="${c.id}">Editar</button>
                <button class="btn btn-small btn-danger" data-del-cliente="${c.id}">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `
    : `<p style="opacity:0.7;">Nenhum cliente cadastrado.</p>`;

  return `
    <h2>Clientes</h2>

    <div class="grid grid-2" style="margin-top:2rem;">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="cliente-form-title">Novo Cliente</h3>
        </div>
        <div class="card-content">
          <form id="cliente-form">
            <input type="hidden" id="cliente-id">

            <div class="form-group">
              <label class="form-label">Nome Completo</label>
              <input class="form-input" id="cliente-nome" placeholder="Ex: João da Silva">
            </div>

            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input class="form-input" id="cliente-telefone" placeholder="11999999999">
            </div>

            <div class="form-group">
              <label class="form-label">Endereço</label>
              <input class="form-input" id="cliente-endereco" placeholder="Rua, número e bairro">
            </div>

            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary btn-block" id="cliente-submit-btn">Salvar</button>
              <button type="button" class="btn btn-secondary btn-block" id="cliente-limpar-btn">Limpar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de Clientes</h3>
        </div>
        <div class="card-content">
          ${rows}
        </div>
      </div>
    </div>
  `;
}

function renderPlaceholder(titulo) {
  return `
    <h2>${escapeHtml(titulo)}</h2>
    <div class="card" style="margin-top:1rem;">
      <div class="card-content">
        <p>Vamos implementar essa aba depois (Supabase) sem quebrar o sistema ✅</p>
      </div>
    </div>
  `;
}

function renderApp() {
  if (!root) return;

  let html = "";
  html += renderSidebar();

  switch (app.currentPage) {
    case "clientes":
      html += renderHeader("CFIT - Clientes");
      html += renderClientes();
      html += renderFooter();
      break;

    case "pedidos":
      html += renderHeader("CFIT - Pedidos");
      html += renderPlaceholder("Pedidos");
      html += renderFooter();
      break;

    case "despesas":
      html += renderHeader("CFIT - Despesas");
      html += renderPlaceholder("Despesas");
      html += renderFooter();
      break;

    case "estoque":
      html += renderHeader("CFIT - Estoque");
      html += renderPlaceholder("Estoque");
      html += renderFooter();
      break;

    default:
      html += renderHeader("CFIT - Dashboard");
      html += renderDashboard();
      html += renderFooter();
  }

  root.innerHTML = html;
  wireEvents();
}

// ===============================
// EVENTS (NAVEGAÇÃO + CLIENTES)
// ===============================
function resetClienteForm() {
  document.getElementById("cliente-id").value = "";
  document.getElementById("cliente-nome").value = "";
  document.getElementById("cliente-telefone").value = "";
  document.getElementById("cliente-endereco").value = "";
  document.getElementById("cliente-form-title").textContent = "Novo Cliente";
  document.getElementById("cliente-submit-btn").textContent = "Salvar";
}

function wireEvents() {
  // navegação
  document.querySelectorAll(".nav-item").forEach(el => {
    el.addEventListener("click", () => {
      const page = el.getAttribute("data-page");
      if (!page) return;
      app.currentPage = page;
      renderApp();
    });
  });

  // clientes
  const form = document.getElementById("cliente-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const idRaw = document.getElementById("cliente-id").value.trim();
      const nome = document.getElementById("cliente-nome").value.trim();
      const telefone = document.getElementById("cliente-telefone").value.trim();
      const endereco = document.getElementById("cliente-endereco").value.trim();

      if (!nome || !telefone || !endereco) {
        alert("Preencha nome, telefone e endereço.");
        return;
      }

      try {
        if (idRaw) {
          await atualizarCliente(Number(idRaw), nome, telefone, endereco);
        } else {
          await inserirCliente(nome, telefone, endereco);
        }
        resetClienteForm();
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar no Supabase. Veja o console (F12).");
      }
    });
  }

  const limparBtn = document.getElementById("cliente-limpar-btn");
  if (limparBtn) limparBtn.addEventListener("click", resetClienteForm);

  // editar/excluir (botões da tabela)
  document.querySelectorAll("[data-edit-cliente]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-edit-cliente"));
      const cli = app.data.clientes.find(c => c.id === id);
      if (!cli) return;

      document.getElementById("cliente-id").value = cli.id;
      document.getElementById("cliente-nome").value = cli.nome || "";
      document.getElementById("cliente-telefone").value = cli.telefone || "";
      document.getElementById("cliente-endereco").value = cli.endereco || "";
      document.getElementById("cliente-form-title").textContent = "Editar Cliente";
      document.getElementById("cliente-submit-btn").textContent = "Atualizar";
    });
  });

  document.querySelectorAll("[data-del-cliente]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del-cliente"));
      if (!confirm("Excluir cliente?")) return;

      try {
        await excluirCliente(id);
        renderApp();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir no Supabase. Veja o console (F12).");
      }
    });
  });
}

// ===============================
// START
// ===============================
document.addEventListener("DOMContentLoaded", checkSession);
