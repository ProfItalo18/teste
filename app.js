// app.js (módulo ES)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ====== Configuração Firebase ====== */
const firebaseConfig = {
  apiKey: "AIzaSyAuYLoREzLh9z2JFlBJhUk0oys8vAV_Zw",
  authDomain: "relatoriosescolamanain.firebaseapp.com",
  projectId: "relatoriosescolamanain",
  storageBucket: "relatoriosescolamanain.appspot.com",
  messagingSenderId: "618086734758",
  appId: "1:618086734758:web:abe0e11610bc90ee9a662b"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ====== Utilitários DOM ====== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ====== Elementos principais ====== */
const dataNascEl = $("#data-nasc");
const idadeEl = $("#idade");
const dataAvaliacaoEl = $("#data-avaliacao");
const dataEixoEl = $("#data-eixo");

const btnSave = $("#btn-save");
const btnDB = $("#btn-db");
const btnPrint = $("#btn-print");

/* ====== Assinaturas (apenas locais) ====== */
function bindSignature(selectId, imgId) {
  const sel = $(selectId), img = $(imgId);
  sel.addEventListener("change", () => {
    const src = sel.value || "";
    img.src = src;
    img.style.display = src ? "block" : "none";
  });
}
bindSignature("#coord-pedagogica", "#assinatura-coord");
bindSignature("#psicologa", "#assinatura-psico");
bindSignature("#assist-social", "#assinatura-social");

/* ====== Cálculo de idade ====== */
function calculateAge(dateStr) {
  if (!dateStr) return "";
  const dob = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 ? `${age} anos` : "";
}
dataNascEl.addEventListener("change", () => {
  idadeEl.value = calculateAge(dataNascEl.value);
});

/* Atualiza data no rodapé */
dataAvaliacaoEl.addEventListener("change", () => {
  const d = dataAvaliacaoEl.value;
  dataEixoEl.textContent = d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "[data da avaliação]";
});

/* ====== DADOS_CHECKLIST (resumido para performance) ====== */
const DADOS_CHECKLIST = {
  pedagogica: {
    titulo: "Avaliação Pedagógica",
    grupos: [
      { nome: "Cognição, Currículo e Aprendizagem", itens: [
        { label: "Nível de Alfabetização", txt: "Aluno não alfabetizado ou pré-silábico.", ind: "Método fônico/multissensorial.", enc: "Psicopedagogia" },
        { label: "Letramento de Sobrevivência", txt: "Não lê placas de perigo, saída ou banheiros.", ind: "Leitura incidental de símbolos.", enc: "Pedagogia" }
      ]},
      { nome: "Habilidades de Vida Diária", itens: [
        { label: "Controle Esfincteriano", txt: "Uso de fraldas ou escapes frequentes.", ind: "Treino de toalete/Trocas.", enc: "Enfermagem/Família" }
      ]}
    ]
  },
  clinica: {
    titulo: "Avaliação Clínica",
    grupos: [
      { nome: "Diagnósticos e Histórico Médico", itens: [
        { label: "Diagnóstico Principal (CID)", txt: "Laudo ausente ou vencido.", ind: "Solicitar laudo atualizado.", enc: "Médico Especialista" }
      ]}
    ]
  },
  social: {
    titulo: "Serviço Social",
    grupos: [
      { nome: "Direitos e Benefícios", itens: [
        { label: "Benefício BPC/LOAS", txt: "Perfil elegível, benefício não solicitado.", ind: "Orientação para INSS.", enc: "Assistente Social" }
      ]}
    ]
  }
};

/* ====== Estado ====== */
const state = {
  areaAtual: null,
  selecionados: { pedagogica: [], clinica: [], social: [] },
  textoRelatorio: { pedagogica: "", clinica: "", social: "" }
};

/* ====== Modal checklist (fullscreen) ====== */
function openChecklist(area) {
  state.areaAtual = area;
  $("#modal-title").textContent = `Checklist: ${DADOS_CHECKLIST[area].titulo}`;
  mountChecklist(area);
  $("#modal-checklist").setAttribute("aria-hidden", "false");
}
function closeChecklist() { $("#modal-checklist").setAttribute("aria-hidden", "true"); }
$("[data-close]").addEventListener("click", closeChecklist);

$("#open-pedagogica").addEventListener("click", () => openChecklist("pedagogica"));
$("#open-clinica").addEventListener("click", () => openChecklist("clinica"));
$("#open-social").addEventListener("click", () => openChecklist("social"));

function mountChecklist(area) {
  const cont = $("#checklist-container");
  cont.innerHTML = "";
  const dados = DADOS_CHECKLIST[area];
  dados.grupos.forEach((grupo, gi) => {
    const gEl = document.createElement("div"); gEl.className = "grupo";
    const header = document.createElement("header"); header.textContent = `${gi+1}. ${grupo.nome}`; gEl.appendChild(header);
    grupo.itens.forEach((item, ii) => {
      const it = document.createElement("div"); it.className = "item";
      const chk = document.createElement("input"); chk.type = "checkbox"; chk.id = `chk-${area}-${gi}-${ii}`;
      const lbl = document.createElement("label"); lbl.setAttribute("for", chk.id); lbl.textContent = item.label;
      it.appendChild(chk); it.appendChild(lbl);
      gEl.appendChild(it);

      chk.addEventListener("change", () => {
        const list = state.selecionados[area];
        if (chk.checked) list.push(item);
        else {
          const idx = list.findIndex(x => x.label === item.label);
          if (idx > -1) list.splice(idx, 1);
        }
        refreshAutoFields(area);
        toggleConfirmButton();
      });
    });
    cont.appendChild(gEl);
  });

  $("#texto-relatorio").value = state.textoRelatorio[area] || "";
  refreshAutoFields(area);
  toggleConfirmButton();
}

function refreshAutoFields(area) {
  const sel = state.selecionados[area];
  $("#indicacoes-auto").value = sel.length ? sel.map(i => `• ${i.ind}`).join("\n") : "";
  $("#encaminhamentos-auto").value = sel.length ? sel.map(i => `• ${i.enc}`).join("\n") : "";
  if (!$("#texto-relatorio").value) {
    $("#texto-relatorio").value = sel.length ? sel.map(i => `- ${i.txt}`).join("\n") : "";
  }
}

function toggleConfirmButton() {
  const area = state.areaAtual;
  const hasSelection = state.selecionados[area].length > 0;
  const hasText = ($("#texto-relatorio").value || "").trim().length > 0;
  $("#confirmar-fechar").disabled = !(hasSelection || hasText);
}

$("#confirmar-fechar").addEventListener("click", () => {
  const area = state.areaAtual;
  state.textoRelatorio[area] = $("#texto-relatorio").value;
  $(`#sintese-${area}`).textContent = state.textoRelatorio[area] || "Sem registros.";
  closeChecklist();
});

/* ====== Modal Banco de Dados ====== */
const modalDb = $("#modal-db");
$("#btn-db").addEventListener("click", () => {
  modalDb.setAttribute("aria-hidden", "false");
  carregarRegistros();
});
$("[data-close-db]").addEventListener("click", () => modalDb.setAttribute("aria-hidden", "true"));
$("#db-refresh").addEventListener("click", carregarRegistros);
$("#db-search-btn").addEventListener("click", buscarRegistros);

/* ====== Firestore: salvar, carregar, excluir, buscar ====== */
async function salvarDados() {
  const dados = {
    nome: $("#nome").value || "",
    idade: $("#idade").value || "",
    escola: $("#escola").value || "",
    municipio: $("#municipio").value || "",
    nre: $("#nre").value || "",
    filiacao: $("#filiacao").value || "",
    dataAvaliacao: $("#data-avaliacao").value || "",
    conclusao: $("#conclusao-text").textContent || "",
    indicacoes: $("#indicacoes-text").textContent || "",
    encaminhamentos: $("#encaminhamentos-text").textContent || "",
    observacoes: $("#observacoes-text").textContent || "",
    createdAt: new Date().toISOString()
  };
  try {
    await addDoc(collection(db, "relatorios"), dados);
    alert("Relatório salvo com sucesso!");
    carregarRegistros();
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar. Verifique a conexão.");
  }
}
btnSave.addEventListener("click", salvarDados);

async function carregarRegistros() {
  const lista = $("#lista-registros");
  lista.innerHTML = "<li>Carregando...</li>";
  try {
    const snap = await getDocs(query(collection(db, "relatorios"), orderBy("createdAt", "desc"), limit(200)));
    lista.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `<div><strong>${data.nome || "(sem nome)"}</strong><br><small>${data.escola || ""} • ${data.dataAvaliacao || data.createdAt.split("T")[0]}</small></div>`;
      const actions = document.createElement("div");
      const btnLoad = document.createElement("button"); btnLoad.textContent = "Carregar"; btnLoad.className = "btn";
      btnLoad.onclick = () => preencherFormularioFromDoc(docSnap.id, data);
      const btnDel = document.createElement("button"); btnDel.textContent = "Excluir"; btnDel.className = "btn";
      btnDel.onclick = () => excluirRegistro(docSnap.id);
      actions.appendChild(btnLoad); actions.appendChild(btnDel);
      li.appendChild(actions);
      lista.appendChild(li);
    });
    if (!lista.children.length) lista.innerHTML = "<li>Nenhum registro encontrado.</li>";
  } catch (err) {
    console.error(err);
    lista.innerHTML = "<li>Erro ao carregar registros.</li>";
  }
}

async function excluirRegistro(id) {
  if (!confirm("Excluir este registro? Esta ação é irreversível.")) return;
  try {
    await deleteDoc(doc(db, "relatorios", id));
    alert("Registro excluído.");
    carregarRegistros();
  } catch (err) {
    console.error(err);
    alert("Erro ao excluir.");
  }
}

/* Preenche apenas os campos persistidos; NÃO altera assinaturas locais */
function preencherFormularioFromDoc(id, data) {
  $("#nome").value = data.nome || "";
  $("#idade").value = data.idade || "";
  $("#escola").value = data.escola || "";
  $("#municipio").value = data.municipio || "";
  $("#nre").value = data.nre || "";
  $("#filiacao").value = data.filiacao || "";
  $("#data-avaliacao").value = data.dataAvaliacao || "";
  dataEixoEl.textContent = data.dataAvaliacao ? new Intl.DateTimeFormat("pt-BR").format(new Date(data.dataAvaliacao)) : "[data da avaliação]";
  $("#conclusao-text").textContent = data.conclusao || "";
  $("#indicacoes-text").textContent = data.indicacoes || "";
  $("#encaminhamentos-text").textContent = data.encaminhamentos || "";
  $("#observacoes-text").textContent = data.observacoes || "";
  modalDb.setAttribute("aria-hidden", "true");
}

/* Buscar por termo (nome, escola ou data) */
async function buscarRegistros() {
  const termo = $("#db-search").value.trim();
  if (!termo) { carregarRegistros(); return; }
  const lista = $("#lista-registros"); lista.innerHTML = "<li>Buscando...</li>";
  try {
    const results = [];
    const q1 = query(collection(db, "relatorios"), where("nome", "==", termo));
    const q2 = query(collection(db, "relatorios"), where("escola", "==", termo));
    const snap1 = await getDocs(q1); snap1.forEach(s => results.push({ id: s.id, data: s.data() }));
    const snap2 = await getDocs(q2); snap2.forEach(s => results.push({ id: s.id, data: s.data() }));
    if (/^\d{4}-\d{2}-\d{2}$/.test(termo)) {
      const snap3 = await getDocs(query(collection(db, "relatorios"), where("dataAvaliacao", "==", termo)));
      snap3.forEach(s => results.push({ id: s.id, data: s.data() }));
    }
    lista.innerHTML = "";
    if (!results.length) lista.innerHTML = "<li>Nenhum registro encontrado.</li>";
    results.forEach(r => {
      const li = document.createElement("li");
      li.innerHTML = `<div><strong>${r.data.nome || "(sem nome)"}</strong><br><small>${r.data.escola || ""} • ${r.data.dataAvaliacao || r.data.createdAt.split("T")[0]}</small></div>`;
      const actions = document.createElement("div");
      const btnLoad = document.createElement("button"); btnLoad.textContent = "Carregar"; btnLoad.className = "btn";
      btnLoad.onclick = () => preencherFormularioFromDoc(r.id, r.data);
      const btnDel = document.createElement("button"); btnDel.textContent = "Excluir"; btnDel.className = "btn";
      btnDel.onclick = () => excluirRegistro(r.id);
      actions.appendChild(btnLoad); actions.appendChild(btnDel);
      li.appendChild(actions);
      lista.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    lista.innerHTML = "<li>Erro na busca.</li>";
  }
}

/* ====== Impressão (botão) ====== */
$("#btn-print").addEventListener("click", () => {
  const d = dataAvaliacaoEl.value;
  dataEixoEl.textContent = d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "[data da avaliação]";
  window.print();
});

/* ====== Inicializações ====== */
document.addEventListener("DOMContentLoaded", () => {
  idadeEl.value = calculateAge(dataNascEl.value);
  dataEixoEl.textContent = dataAvaliacaoEl.value ? new Intl.DateTimeFormat("pt-BR").format(new Date(dataAvaliacaoEl.value)) : "[data da avaliação]";
});

/* ====== Fechar modal com ESC ====== */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("#modal-checklist").setAttribute("aria-hidden", "true");
    $("#modal-db").setAttribute("aria-hidden", "true");
  }
});
