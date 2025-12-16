const SUPABASE_URL = "https://dsfovsdcatskyfgdhblc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZm92c2RjYXRza3lmZ2RoYmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTU4MzUsImV4cCI6MjA4MDc3MTgzNX0.hmZXAOGZ1Gm9SQqjlKClaLmdsP2udDFgQN25S58qiWw";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const elLoginBox = document.getElementById("loginBox");
const elAppBox = document.getElementById("appBox");
const elMsg = document.getElementById("k-msg");
const elInfo = document.getElementById("k-info");
const elList = document.getElementById("k-list");

function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}
function brDate(iso) {
  const s = String(iso || "").slice(0,10);
  return s ? s.split("-").reverse().join("/") : "-";
}
function esc(s){ return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

async function refresh() {
  elList.innerHTML = "Carregando...";

  // carrega pedidos + clientes + cardápios (em 3 consultas simples e estáveis)
  const [{ data: pedidos, error: e1 }, { data: clientes, error: e2 }, { data: cardapios, error: e3 }, { data: itens, error: e4 }] =
    await Promise.all([
      sb.from("pedidos").select("id,cliente_id,cardapio_id,data,valor,status,observacoes").order("data", { ascending: true }),
      sb.from("clientes").select("id,nome"),
      sb.from("cardapios").select("id,nome"),
      sb.from("cardapio_itens").select("cardapio_id,dia_semana,titulo,descricao").order("dia_semana", { ascending: true })
    ]);

  if (e1 || e2 || e3 || e4) {
    console.error(e1||e2||e3||e4);
    elList.innerHTML = "Erro ao carregar.";
    return;
  }

  const cliById = new Map((clientes||[]).map(c => [String(c.id), c.nome]));
  const carById = new Map((cardapios||[]).map(c => [String(c.id), c.nome]));
  const itensByCard = new Map();
  for (const it of (itens||[])) {
    const k = String(it.cardapio_id);
    if (!itensByCard.has(k)) itensByCard.set(k, []);
    itensByCard.get(k).push(it);
  }

  // mostra só o que interessa na cozinha (ex: não entregues/cancelados, e por data recente)
  const hoje = todayISO();
  const lista = (pedidos||[])
    .filter(p => String(p.status||"") !== "entregue" && String(p.status||"") !== "cancelado")
    .sort((a,b) => String(a.data||"").localeCompare(String(b.data||"")));

  if (!lista.length) {
    elList.innerHTML = `<div style="opacity:.75;">Nenhum pedido pendente.</div>`;
    return;
  }

  elList.innerHTML = lista.map(p => {
    const cliente = cliById.get(String(p.cliente_id)) || "—";
    const cardNome = carById.get(String(p.cardapio_id)) || "—";
    const cardItens = itensByCard.get(String(p.cardapio_id)) || [];

    const itensHtml = cardItens.length
      ? `<ol style="margin:8px 0 0 18px; opacity:.95;">
           ${cardItens.map(i => `<li><strong>Dia ${esc(i.dia_semana)}:</strong> ${esc(i.titulo||"")} <span style="opacity:.8;">${esc(i.descricao||"")}</span></li>`).join("")}
         </ol>`
      : `<div style="opacity:.7; margin-top:6px;">(Sem itens cadastrados no cardápio)</div>`;

    return `
      <div class="card" style="padding:12px; margin:10px 0;">
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <div><strong>${esc(cliente)}</strong></div>
          <div style="opacity:.8;">Data: <strong>${esc(brDate(p.data))}</strong></div>
          <div style="opacity:.8;">Qtd: <strong>7 marmitas</strong></div>
          <div style="opacity:.8;">Cardápio: <strong>${esc(cardNome)}</strong></div>
          <div style="margin-left:auto; opacity:.8;">Status: <strong>${esc(p.status||"recebido")}</strong></div>
        </div>

        ${p.observacoes ? `<div style="margin-top:6px; opacity:.85;"><strong>Obs:</strong> ${esc(p.observacoes)}</div>` : ""}

        ${itensHtml}

        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
          <button class="btn btn-secondary" data-set="preparando" data-id="${esc(p.id)}">Preparando</button>
          <button class="btn btn-primary" data-set="pronto" data-id="${esc(p.id)}">Pronto</button>
          <button class="btn btn-primary" data-set="entregue" data-id="${esc(p.id)}">Entregue</button>
          <button class="btn btn-danger" data-set="cancelado" data-id="${esc(p.id)}">Cancelar</button>
        </div>
      </div>
    `;
  }).join("");

  // bind botões
  elList.querySelectorAll("button[data-set][data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const st = btn.dataset.set;
      btn.disabled = true;

      const { error } = await sb.rpc("set_pedido_status", { p_pedido_id: id, p_status: st });
      if (error) {
        console.error(error);
        alert("Erro ao mudar status: " + error.message);
      }
      await refresh();
    });
  });
}

async function showState() {
  const { data } = await sb.auth.getSession();
  const logged = !!data?.session;
  elLoginBox.style.display = logged ? "none" : "block";
  elAppBox.style.display = logged ? "block" : "none";
  elInfo.textContent = logged ? (data.session.user.email || "") : "";
  if (logged) await refresh();
}

document.getElementById("k-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  elMsg.textContent = "";

  const email = document.getElementById("k-email").value.trim();
  const password = document.getElementById("k-pass").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { elMsg.textContent = error.message; return; }
  await showState();
});

document.getElementById("k-refresh").addEventListener("click", refresh);
document.getElementById("k-logout").addEventListener("click", async () => {
  await sb.auth.signOut();
  await showState();
});

sb.auth.onAuthStateChange(() => showState());
showState();
