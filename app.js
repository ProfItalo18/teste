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
  if (!sel || !img) return;
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
if (dataNascEl) dataNascEl.addEventListener("change", () => {
  idadeEl.value = calculateAge(dataNascEl.value);
});

/* Atualiza data no rodapé */
if (dataAvaliacaoEl) dataAvaliacaoEl.addEventListener("change", () => {
  const d = dataAvaliacaoEl.value;
  dataEixoEl.textContent = d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "[data da avaliação]";
});

/* ====== DADOS_CHECKLIST (completo conforme arquivo enviado) ====== */
const DADOS_CHECKLIST = {
    pedagogica: {
        titulo: "1.2 Avaliação Pedagógica e Funcional (Educação Especial)",
        grupos: [
            {
                nome: "Cognição, Currículo e Aprendizagem",
                itens: [
                    { label: "Nível de Alfabetização", txt: "Aluno não alfabetizado ou pré-silábico.", ind: "Método fônico/multissensorial.", enc: "Psicopedagogia" },
                    { label: "Letramento de Sobrevivência", txt: "Não lê placas de perigo, saída ou banheiros.", ind: "Leitura incidental de símbolos.", enc: "Pedagogia" },
                    { label: "Compreensão de Comandos", txt: "Necessita de apoio gestual/visual para entender.", ind: "Comunicação multimodal.", enc: "Fonoaudiologia" },
                    { label: "Raciocínio Lógico (Dinheiro)", txt: "Não reconhece valores ou não sabe usar dinheiro.", ind: "Mercadinho simulado.", enc: "Pedagogia" },
                    { label: "Memória Operacional", txt: "Esquece a instrução logo após ouvi-la.", ind: "Instruções curtas e fracionadas.", enc: "Neuropsicologia" },
                    { label: "Noção Temporal", txt: "Não compreende ontem/hoje/amanhã ou relógio.", ind: "Rotina visual linear.", enc: "Pedagogia" },
                    { label: "Generalização do Saber", txt: "Faz a tarefa na sala, mas não aplica na vida real.", ind: "Ensino naturalístico.", enc: "Psicopedagogia" },
                    { label: "Cores e Formas", txt: "Dificuldade em parear ou nomear cores/formas.", ind: "Jogos de classificação.", enc: "Pedagogia" },
                    { label: "Escrita do Nome", txt: "Não reconhece ou não escreve o próprio nome.", ind: "Crachá e treino motor.", enc: "Terapia Ocupacional" },
                    { label: "Causa e Efeito", txt: "Dificuldade em entender consequências de ações.", ind: "Jogos de ação/reação.", enc: "Psicologia" }
                ]
            },
            {
                nome: "Habilidades de Vida Diária (AVDs) e Autonomia",
                itens: [
                    { label: "Controle Esfincteriano", txt: "Uso de fraldas ou escapes frequentes.", ind: "Treino de toalete/Trocas.", enc: "Enfermagem/Família" },
                    { label: "Alimentação Autônoma", txt: "Dependência total/parcial para levar à boca.", ind: "Talheres engrossados/adaptados.", enc: "Terapia Ocupacional" },
                    { label: "Vestuário (Botões/Zíper)", txt: "Não consegue manipular fechos de roupas.", ind: "Treino com alinhavos/botões.", enc: "Terapia Ocupacional" },
                    { label: "Higiene Pessoal (Limpeza)", txt: "Não consegue limpar-se após usar o banheiro.", ind: "Supervisão e apoio físico.", enc: "Monitoria" },
                    { label: "Higiene Bucal", txt: "Não consegue escovar os dentes sozinho.", ind: "Escovação guiada.", enc: "Odontologia" },
                    { label: "Organização de Pertences", txt: "Não reconhece sua mochila ou perde itens.", ind: "Etiquetas visuais grandes.", enc: "Pedagogia" },
                    { label: "Uso de Bebedouro", txt: "Dificuldade motora para usar copo ou bebedouro.", ind: "Garrafa adaptada com canudo.", enc: "Terapia Ocupacional" },
                    { label: "Assoar o Nariz", txt: "Não sabe assoar o nariz ou limpar secreção.", ind: "Treino de higiene respiratória.", enc: "Fonoaudiologia" },
                    { label: "Amarrar Cadarços", txt: "Dificuldade motora fina para laços.", ind: "Tênis com velcro/elástico.", enc: "Família" },
                    { label: "Pedir Ajuda", txt: "Não solicita auxílio quando em dificuldade.", ind: "Treino de comunicação funcional.", enc: "Psicologia" }
                ]
            },
            {
                nome: "Comportamento, Socialização e Emocional",
                itens: [
                    { label: "Interação com Pares", txt: "Isolamento, não brinca ou agride colegas.", ind: "Mediação de brincadeiras.", enc: "Psicologia" },
                    { label: "Autoagressividade", txt: "Morde-se, bate a cabeça ou se arranha.", ind: "Contenção segura/Análise funcional.", enc: "Psiquiatria" },
                    { label: "Heteroagressividade", txt: "Agride fisicamente professores ou colegas.", ind: "Manejo comportamental.", enc: "Psicologia/Psiquiatria" },
                    { label: "Percepção de Perigo", txt: "Não avalia riscos (altura, carros, tomadas).", ind: "Supervisão 1:1 constante.", enc: "Monitoria/Família" },
                    { label: "Tolerância à Frustração", txt: "Desorganiza-se gravemente diante do 'não'.", ind: "Reforço diferencial.", enc: "Psicologia" },
                    { label: "Estereotipias Motoras", txt: "Movimentos repetitivos que atrapalham a função.", ind: "Redirecionamento de atenção.", enc: "Terapia Ocupacional" },
                    { label: "Comportamento Sexual", txt: "Toque inadequado em si ou nos outros em público.", ind: "Educação sexual adequada à idade.", enc: "Psicologia" },
                    { label: "Respeito a Regras", txt: "Dificuldade em seguir combinados da sala.", ind: "Quadro de regras visual.", enc: "Pedagogia" },
                    { label: "Contato Visual", txt: "Evita olhar nos olhos durante a interação.", ind: "Posicionar-se na altura do aluno.", enc: "Fonoaudiologia" },
                    { label: "Mudança de Rotina", txt: "Crise diante de imprevistos ou trocas de sala.", ind: "Antecipação visual de mudanças.", enc: "Pedagogia" }
                ]
            },
            {
                nome: "Tecnologia Assistiva e Adaptação de Materiais",
                itens: [
                    { label: "Recursos de Baixa Tecnologia", txt: "Não possui engrossadores ou tesoura adaptada.", ind: "Confecção/compra de recursos.", enc: "Terapia Ocupacional" },
                    { label: "Uso de Tablet/Computador", txt: "Dificuldade motora impede uso de mouse/teclado.", ind: "Mouse adaptado/Acionadores.", enc: "Informática Inclusiva" },
                    { label: "Softwares de Comunicação", txt: "Necessita de app (ex: Livox) mas não usa.", ind: "Implementação de prancha digital.", enc: "Fonoaudiologia" },
                    { label: "Adaptação Postural na Mesa", txt: "Cadeira escolar inadequada, pés balançando.", ind: "Apoio para pés e adaptação.", enc: "Fisioterapia" },
                    { label: "Recursos Visuais Ampliados", txt: "Fonte do material didático muito pequena.", ind: "Ampliação (Fonte 24+) e alto contraste.", enc: "Pedagogia" },
                    { label: "Cadernos Pautados", txt: "Dificuldade em respeitar a linha comum.", ind: "Pauta ampliada ou colorida.", enc: "Psicopedagogia" },
                    { label: "Óculos e Lupas", txt: "Possui óculos mas recusa o uso na sala.", ind: "Treino de adaptação.", enc: "Família/Professor" },
                    { label: "Eliminação de Barreiras", txt: "Mochila ou layout da sala impedem circulação.", ind: "Reorganização do espaço físico.", enc: "Gestão Escolar" },
                    { label: "Tempo de Prova", txt: "Não consegue terminar avaliações no tempo.", ind: "Tempo estendido (Lei).", enc: "Coordenação Pedagógica" },
                    { label: "Ledores e Escribas", txt: "Necessita de apoio para ler/escrever na prova.", ind: "Designação de tutor.", enc: "Coordenação Pedagógica" }
                ]
            },
            {
                nome: "Educação Física e Motricidade Global",
                itens: [
                    { label: "Participação nas Aulas", txt: "Excluído das atividades práticas.", ind: "Adaptação das regras/atividades.", enc: "Prof. Ed. Física" },
                    { label: "Coordenação Motora Grossa", txt: "Tropeça muito, cai ao correr.", ind: "Circuito psicomotor.", enc: "Fisioterapia" },
                    { label: "Compreensão de Regras", txt: "Não entende regras coletivas de jogos.", ind: "Jogos simplificados.", enc: "Prof. Ed. Física" },
                    { label: "Esquema Corporal", txt: "Não identifica direita/esquerda no corpo.", ind: "Atividades com espelho.", enc: "Psicomotricidade" },
                    { label: "Tolerância ao Esforço", txt: "Cansaço extremo ou falta de ar rápida.", ind: "Avaliação cardiorrespiratória.", enc: "Cardiologia" },
                    { label: "Equilíbrio", txt: "Dificuldade em pular num pé só.", ind: "Treino de equilíbrio.", enc: "Fisioterapia" },
                    { label: "Medo de Altura/Movimento", txt: "Pânico em brinquedos de parque.", ind: "Insegurança gravitacional.", enc: "Terapia Ocupacional" },
                    { label: "Vestuário Esportivo", txt: "Dificuldade em trocar de roupa para a aula.", ind: "Tempo extra/Privacidade.", enc: "Auxiliar de Classe" },
                    { label: "Inclusão no Time", txt: "Colegas não passam a bola/excluem.", ind: "Conscientização da turma.", enc: "Psicologia Escolar" },
                    { label: "Esporte Paralímpico", txt: "Potencial para bocha ou atletismo adaptado.", ind: "Encaminhar para centros de treino.", enc: "Esporte/Lazer" }
                ]
            },
            {
                nome: "Habilidades Artísticas e Criatividade",
                itens: [
                    { label: "Expressão pelo Desenho", txt: "Desenho muito imaturo (garatujas).", ind: "Estimulação do grafismo.", enc: "Arte-terapia" },
                    { label: "Sensibilidade Musical", txt: "Interesse intenso ou aversão a músicas.", ind: "Musicoterapia.", enc: "Musicoterapia" },
                    { label: "Manuseio de Materiais", txt: "Aversão a tocar em tinta ou cola.", ind: "Dessensibilização tátil.", enc: "Terapia Ocupacional" },
                    { label: "Criatividade", txt: "Brincadeira muito concreta, sem 'faz de conta'.", ind: "Estimulação do simbólico.", enc: "Psicologia" },
                    { label: "Recorte e Colagem", txt: "Não consegue usar tesoura.", ind: "Tesoura com mola.", enc: "Terapia Ocupacional" },
                    { label: "Memorização de Canções", txt: "Dificuldade em decorar letras.", ind: "Repetição e apoio visual.", enc: "Fonoaudiologia" },
                    { label: "Participação em Eventos", txt: "Recusa-se a participar de festas.", ind: "Respeitar limites/Bastidores.", enc: "Coordenação" },
                    { label: "Pintura", txt: "Não pinta dentro do contorno.", ind: "Bordas em relevo (cola quente).", enc: "Pedagogia" },
                    { label: "Teatro e Role-play", txt: "Dificuldade em assumir personagens.", ind: "Dramatização de histórias.", enc: "Artes" },
                    { label: "Interesse Focado", txt: "Desenha apenas um único tema.", ind: "Ampliação de repertório.", enc: "Psicologia" }
                ]
            }
        ]
    },
    clinica: {
        titulo: "1.3 Avaliação Clínica e Anamnese de Saúde (SUS)",
        grupos: [
            {
                nome: "Diagnósticos, CIDs e Histórico Médico",
                itens: [
                    { label: "Diagnóstico Principal (CID)", txt: "Laudo ausente, vencido ou CID genérico.", ind: "Solicitar laudo atualizado.", enc: "Médico Especialista" },
                    { label: "Deficiência Intelectual", txt: "Sinais de DI sem laudo formalizado.", ind: "Avaliação neuropsicológica/QI.", enc: "Neuropsicologia" },
                    { label: "Comorbidades Psiquiátricas", txt: "TDAH, TOD ou Ansiedade associados.", ind: "Acompanhamento psiquiátrico.", enc: "Psiquiatria" },
                    { label: "Doenças Crônicas", txt: "Diabetes, Asma, Cardiopatia, Hipertensão.", ind: "Plano de cuidados escolar.", enc: "Pediatria/Cardiologia" },
                    { label: "Alergias Alimentares", txt: "Alergia a leite (AALV), glúten, corantes.", ind: "Dieta especial/Alerta na cozinha.", enc: "Nutrição" },
                    { label: "Alergias Medicamentosas", txt: "Reação grave a Dipirona, Penicilina, etc.", ind: "Registro em ficha de emergência.", enc: "Enfermagem" },
                    { label: "Carteira de Vacinação", txt: "Vacinas atrasadas ou incompletas.", ind: "Atualização vacinal obrigatória.", enc: "UBS/Posto de Saúde" },
                    { label: "Exames Sensoriais", txt: "Nunca fez audiometria ou oftalmológico.", ind: "Triagem auditiva e visual.", enc: "Oftalmo/Otorrino" },
                    { label: "Histórico de Internações", txt: "Internações frequentes ou recentes.", ind: "Atenção à imunidade/fadiga.", enc: "Enfermagem" },
                    { label: "Prematuridade", txt: "Histórico de parto prematuro extremo.", ind: "Vigilância do desenvolvimento.", enc: "Neuropediatra" }
                ]
            },
            {
                nome: "Gerenciamento Medicamentoso",
                itens: [
                    { label: "Uso de Psicofármacos", txt: "Uso contínuo (Ritalina, Risperidona, etc.).", ind: "Monitorar comportamento.", enc: "Psiquiatria" },
                    { label: "Anticonvulsivantes", txt: "Uso para controle de epilepsia (Depakote, etc.).", ind: "Atenção à sonolência.", enc: "Neurologia" },
                    { label: "Administração na Escola", txt: "Necessita tomar remédio no horário de aula.", ind: "Receita e autorização dos pais.", enc: "Enfermagem" },
                    { label: "Adesão da Família", txt: "Família esquece ou não compra a medicação.", ind: "Conscientização/Serviço Social.", enc: "Assistente Social" },
                    { label: "Efeitos Colaterais", txt: "Aluno apresenta tremores, babação ou sedação.", ind: "Relatório para o médico.", enc: "Médico Assistente" },
                    { label: "Farmácia de Alto Custo", txt: "Dificuldade em conseguir medicação pelo SUS.", ind: "Auxílio no processo administrativo.", enc: "Assistente Social/Farmácia" },
                    { label: "Interação Medicamentosa", txt: "Uso de múltiplos fármacos (polifarmácia).", ind: "Vigilância de reações adversas.", enc: "Médico/Farmacêutico" },
                    { label: "Via de Administração", txt: "Uso de sonda (GTT) ou insulina injetável.", ind: "Cuidados de enfermagem.", enc: "Enfermagem" },
                    { label: "Medicação de Resgate", txt: "Necessita de medicação para crise convulsiva.", ind: "Protocolo de emergência.", enc: "SAMU/Enfermagem" },
                    { label: "Armazenamento", txt: "Medicamento requer refrigeração na escola.", ind: "Geladeira com controle temp.", enc: "Enfermagem" }
                ]
            },
            {
                nome: "Neurológico, Físico e Sensorial",
                itens: [
                    { label: "Crises Convulsivas", txt: "Crises ativas, ausências ou espasmos.", ind: "Proteção física durante crise.", enc: "Neurologia" },
                    { label: "Disfagia (Engasgo)", txt: "Tosse ao comer/beber, risco de aspiração.", ind: "Espessante e postura.", enc: "Fonoaudiologia" },
                    { label: "Hipersensibilidade Auditiva", txt: "Chora/agride com barulho alto.", ind: "Protetor auricular (fone).", enc: "Terapia Ocupacional" },
                    { label: "Baixa Visão/Cegueira", txt: "Dificuldade visual severa mesmo com óculos.", ind: "Materiais ampliados/Braille.", enc: "Oftalmo/Pedagogia" },
                    { label: "Perda Auditiva", txt: "Não responde a chamados ou pede repetição.", ind: "Uso de AASI/Libras.", enc: "Otorrino/Fono" },
                    { label: "Mobilidade (Cadeira)", txt: "Uso de cadeira de rodas, andador ou muletas.", ind: "Acessibilidade/Rampas.", enc: "Fisioterapia" },
                    { label: "Deformidades Ósseas", txt: "Escoliose grave, pés tortos, contraturas.", ind: "Posicionamento adequado.", enc: "Ortopedia/Fisio" },
                    { label: "Tônus Muscular", txt: "Espasticidade (duro) ou Hipotonia (mole).", ind: "Mobiliário adaptado.", enc: "Fisioterapia" },
                    { label: "Órteses (AFO/KAFO)", txt: "Indicado uso de órtese mas não possui.", ind: "Encaminhar p/ oficina ortopédica.", enc: "Reabilitação Física" },
                    { label: "Sialorreia (Babação)", txt: "Babação excessiva, molha roupa e mesa.", ind: "Uso de babador/bandana.", enc: "Fonoaudiologia" }
                ]
            },
            {
                nome: "Sexualidade, Puberdade e Adolescência",
                itens: [
                    { label: "Menarca/Menstruação", txt: "Menina não sabe lidar com absorvente.", ind: "Treino concreto de troca.", enc: "Enfermagem/T.O." },
                    { label: "Polução Noturna/Ereção", txt: "Menino assustado com mudanças corporais.", ind: "Conversa explicativa.", enc: "Psicologia/Médico" },
                    { label: "Privacidade", txt: "Troca de roupa ou toca partes íntimas em público.", ind: "Ensino de público x privado.", enc: "Psicologia Comportamental" },
                    { label: "Prevenção de Abuso", txt: "Não sabe identificar toque bom x ruim.", ind: "Treino de autoproteção.", enc: "Psicologia" },
                    { label: "Consentimento", txt: "Abraça/beija estranhos sem pedir permissão.", ind: "Regra do 'círculo de confiança'.", enc: "Psicologia" },
                    { label: "Higiene Íntima", txt: "Dificuldade na limpeza adequada.", ind: "Supervisão e treino de AVD.", enc: "Terapia Ocupacional" },
                    { label: "Identidade de Gênero", txt: "Questões sobre identidade/orientação.", ind: "Acolhimento sem julgamento.", enc: "Psicologia" },
                    { label: "Métodos Contraceptivos", txt: "Adolescente ativo sexualmente sem proteção.", ind: "Planejamento familiar/DIU.", enc: "Ginecologia/Urologia" },
                    { label: "Comportamento Masturbatório", txt: "Masturbação em sala de aula.", ind: "Redirecionamento para privado.", enc: "Psicologia" },
                    { label: "Mudanças Hormonais", txt: "TPM severa ou agressividade cíclica.", ind: "Avaliação hormonal.", enc: "Ginecologia/Endócrino" }
                ]
            },
            {
                nome: "Saúde Preventiva e Geral",
                itens: [
                    { label: "Saúde Bucal (Cáries)", txt: "Dentes em mau estado, dor ou halitose.", ind: "Tratamento odontológico.", enc: "CEO (Centro Odonto)" },
                    { label: "Bruxismo", txt: "Ranger de dentes diurno ou noturno.", ind: "Avaliação de estresse/Placa.", enc: "Odontologia" },
                    { label: "Parasitoses (Vermes)", txt: "Relato de coceira anal, barriga inchada.", ind: "Exame de fezes/Vermífugo.", enc: "Pediatria" },
                    { label: "Dermatologia", txt: "Micoses, assaduras por fralda ou escaras.", ind: "Cuidado com a pele.", enc: "Enfermagem" },
                    { label: "Obesidade/Sobrepeso", txt: "Ganho de peso excessivo.", ind: "Reeducação alimentar.", enc: "Nutrição" },
                    { label: "Baixo Peso/Anemia", txt: "Palidez, fraqueza, recusa alimentar.", ind: "Suplementação vitamínica.", enc: "Pediatria/Nutrição" },
                    { label: "Coluna/Postura", txt: "Postura curvada (cifose/lordose).", ind: "Reeducação postural (RPG).", enc: "Fisioterapia" },
                    { label: "Pés e Pisada", txt: "Pé chato ou caminhar na ponta dos pés.", ind: "Palmilhas ou botox.", enc: "Ortopedia" },
                    { label: "Constipação Intestinal", txt: "Fica dias sem evacuar, dor.", ind: "Aumento de fibras/água.", enc: "Gastroenterologista" },
                    { label: "Hidratação", txt: "Não bebe água espontaneamente.", ind: "Oferta programada de água.", enc: "Escola/Família" }
                ]
            },
            {
                nome: "Saúde Mental (Sintomas Específicos)",
                itens: [
                    { label: "Fobia Específica", txt: "Medo paralisante (cachorro, escuro).", ind: "Dessensibilização.", enc: "Psicologia" },
                    { label: "Transtorno de Pânico", txt: "Crises súbitas de taquicardia.", ind: "Manejo da ansiedade.", enc: "Psiquiatria" },
                    { label: "Luto ou Perda", txt: "Mudança após perda de ente querido.", ind: "Acolhimento do luto.", enc: "Psicologia" },
                    { label: "Tricotilomania", txt: "Arrancar cabelos ou sobrancelhas.", ind: "Terapia comportamental.", enc: "Psiquiatria" },
                    { label: "Escoriação", txt: "Cutucar feridas até sangrar.", ind: "Tratamento dermato/psi.", enc: "Psicologia" },
                    { label: "Humor Eufórico", txt: "Agitação extrema, não dorme.", ind: "Estabilização do humor.", enc: "Psiquiatria" },
                    { label: "Mutismo Seletivo", txt: "Fala em casa, mas não na escola.", ind: "Não forçar a fala.", enc: "Psicologia/Fono" },
                    { label: "Baixa Tolerância ao Erro", txt: "Rasga a tarefa se erra.", ind: "Trabalhar o erro como aprendizado.", enc: "Psicopedagogia" },
                    { label: "Dependência de Telas", txt: "Agressivo se retirado o celular.", ind: "Desmame gradual.", enc: "Psicologia" },
                    { label: "Alucinações", txt: "Fala sozinho/responde vozes.", ind: "Avaliação urgente.", enc: "CAPS Infantil" }
                ]
            }
        ]
    },
    social: {
        titulo: "1.4 Serviço Social e Garantia de Direitos",
        grupos: [
            {
                nome: "Direitos, Benefícios e Cidadania",
                itens: [
                    { label: "Benefício BPC/LOAS", txt: "Perfil elegível, mas benefício negado/não pedido.", ind: "Orientação para INSS.", enc: "Assistente Social" },
                    { label: "Curatela/Interdição", txt: "Adulto com DI sem responsável legal oficial.", ind: "Ação de curatela.", enc: "Defensoria Pública" },
                    { label: "Passe Livre", txt: "Sem recursos para transporte.", ind: "Cadastro Passe Livre.", enc: "CRAS/Transporte" },
                    { label: "Documentação Civil", txt: "Falta RG, CPF ou está desatualizado.", ind: "Emissão de 2ª via.", enc: "Instituto de Identificação" },
                    { label: "Carteira do Autista/PCD", txt: "Não possui CIPTEA ou identificação.", ind: "Solicitação do documento.", enc: "Órgão Competente" },
                    { label: "Insumos do SUS", txt: "Necessita de fraldas, sonda ou leite.", ind: "Cadastro programa insumos.", enc: "Secretaria de Saúde" },
                    { label: "TFD (Tratamento Fora)", txt: "Precisa de cirurgia em outra cidade.", ind: "Solicitação de TFD.", enc: "Secretaria de Saúde" },
                    { label: "Isenção Tarifária", txt: "Conta de luz/água atrasada.", ind: "Cadastro Tarifa Social.", enc: "CRAS" },
                    { label: "Cartão de Estacionamento", txt: "Direito a vaga especial não usufruído.", ind: "Solicitação ao trânsito.", enc: "Detran/Prefeitura" },
                    { label: "Prioridade Legal", txt: "Não conhecimento sobre fila preferencial.", ind: "Orientação sobre Lei.", enc: "Serviço Social" }
                ]
            },
            {
                nome: "Contexto Familiar e Vulnerabilidade",
                itens: [
                    { label: "Sobrecarga do Cuidador", txt: "Cuidador com sinais de exaustão/depressão.", ind: "Acolhimento e suporte.", enc: "CAPS/Psicologia" },
                    { label: "Segurança Alimentar", txt: "Relato de fome ou falta de alimentos.", ind: "Cesta básica emergencial.", enc: "CRAS/ONGs" },
                    { label: "Habitabilidade", txt: "Moradia insalubre (umidade/risco).", ind: "Visita domiciliar técnica.", enc: "Defesa Civil" },
                    { label: "Violência Doméstica", txt: "Suspeita de violência física/sexual.", ind: "Notificação compulsória.", enc: "Conselho Tutelar" },
                    { label: "Negligência", txt: "Criança chega suja ou roupas inadequadas.", ind: "Acompanhamento familiar.", enc: "CREAS" },
                    { label: "Uso de Drogas na Família", txt: "Responsáveis usuários de álcool/drogas.", ind: "Tratamento da dependência.", enc: "CAPS AD" },
                    { label: "Analfabetismo dos Pais", txt: "Pais não conseguem ler bilhetes.", ind: "Comunicação por áudio/EJA.", enc: "Educação de Jovens" },
                    { label: "Rede de Apoio Frágil", txt: "Família isolada, sem parentes.", ind: "Fortalecimento de vínculos.", enc: "CRAS" },
                    { label: "Irmãos com Deficiência", txt: "Outros filhos com deficiência sem atendimento.", ind: "Busca ativa dos irmãos.", enc: "Saúde/Educação" },
                    { label: "Acesso Digital", txt: "Sem celular/internet para contato.", ind: "Recados via vizinho.", enc: "Secretaria Escolar" }
                ]
            },
            {
                nome: "Preparação para o Trabalho e Vida Adulta",
                itens: [
                    { label: "Vocação/Habilidades", txt: "Sem projeto de vida profissional.", ind: "Teste vocacional adaptado.", enc: "Psicologia/T.O." },
                    { label: "Programa Jovem Aprendiz", txt: "Idade elegível mas não inscrito.", ind: "Encaminhar para CIEE/Instituições.", enc: "Serviço Social" },
                    { label: "Autonomia de Transporte", txt: "Não sabe pegar ônibus sozinho.", ind: "Treino de mobilidade urbana.", enc: "Família/T.O." },
                    { label: "Uso de Celular Funcional", txt: "Usa celular só para jogos.", ind: "Treino de apps úteis.", enc: "Pedagogia" },
                    { label: "Documentação Trabalhista", txt: "Não possui Carteira de Trabalho.", ind: "Emissão digital.", enc: "Poupatempo/Sine" },
                    { label: "Comportamento Profissional", txt: "Não entende hierarquia.", ind: "Simulação de ambiente de trabalho.", enc: "Oficinas" },
                    { label: "Manejo do Dinheiro", txt: "Não sabe conferir troco.", ind: "Educação financeira.", enc: "Pedagogia" },
                    { label: "Assinatura", txt: "Não sabe assinar o nome.", ind: "Treino de assinatura.", enc: "Terapia Ocupacional" },
                    { label: "Curatela Parcial", txt: "Avaliar necessidade para atos civis.", ind: "Orientação jurídica.", enc: "Defensoria" },
                    { label: "Cursos Profissionalizantes", txt: "Interesse em culinária/info.", ind: "Matrícula em cursos adaptados.", enc: "Serviço Social" }
                ]
            },
            {
                nome: "Lazer, Cultura e Esporte",
                itens: [
                    { label: "Atividade Física Extra", txt: "Sedentarismo fora da escola.", ind: "Projetos esportivos inclusivos.", enc: "Esportes" },
                    { label: "Convívio Comunitário", txt: "Frequenta apenas casa e escola.", ind: "Incentivo a ir em praças.", enc: "Família" },
                    { label: "Acesso à Cultura", txt: "Nunca foi ao cinema ou teatro.", ind: "Carteirinha meia-entrada.", enc: "Cultura" },
                    { label: "Férias e Finais de Semana", txt: "Passa feriados isolado.", ind: "Planejamento de lazer.", enc: "Família" },
                    { label: "Amizades Fora da Escola", txt: "Não tem amigos no bairro.", ind: "Aproximação com vizinhos.", enc: "Família" },
                    { label: "Habilidades Digitais", txt: "Não sabe buscar vídeos que gosta.", ind: "Ensino de navegação.", enc: "Informática" },
                    { label: "Acampamentos/Passeios", txt: "Nunca dormiu fora de casa.", ind: "Incentivo à autonomia.", enc: "Família" },
                    { label: "Talentos Especiais", txt: "Habilidade alta em arte/memória.", ind: "Investir no talento.", enc: "Arte/Cultura" },
                    { label: "Brinquedos Adequados", txt: "Brinquedos não condizem com idade.", ind: "Adequação material.", enc: "Terapia Ocupacional" },
                    { label: "Centros de Convivência", txt: "Necessita de espaço de socialização.", ind: "Inscrição no CCA.", enc: "CRAS" }
                ]
            },
            {
                nome: "Logística e Rotina Familiar",
                itens: [
                    { label: "Transporte Escolar", txt: "Dificuldade com horário da perua.", ind: "Ajuste de rotina matinal.", enc: "Transporte" },
                    { label: "Retaguarda Familiar", txt: "Se a mãe adoece, ninguém cuida.", ind: "Mapeamento de rede.", enc: "Serviço Social" },
                    { label: "Rotina de Sono (Casa)", txt: "Casa barulhenta/sem horário.", ind: "Higiene do sono familiar.", enc: "Orientação Parental" },
                    { label: "Espaço de Estudo", txt: "Não tem mesa para lição.", ind: "Adaptação de canto de estudos.", enc: "Serviço Social" },
                    { label: "Participação do Pai", txt: "Pai ausente dos cuidados.", ind: "Convite para reuniões.", enc: "Psicologia" },
                    { label: "Uso de Telas em Casa", txt: "Pais usam telas como 'babá'.", ind: "Conscientização.", enc: "Pedagogia" },
                    { label: "Organização Medicamentosa", txt: "Remédios ao alcance da criança.", ind: "Orientação de segurança.", enc: "Enfermagem" },
                    { label: "Comparecimento Escolar", txt: "Faltas excessivas.", ind: "Termo de responsabilidade.", enc: "Secretaria" },
                    { label: "Comunicação Escola", txt: "Agenda não é lida.", ind: "Reforço na comunicação.", enc: "Coordenação" },
                    { label: "Expectativas Familiares", txt: "Família espera 'cura' milagrosa.", ind: "Alinhamento de expectativas.", enc: "Psicologia" }
                ]
            }
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
  if (!DADOS_CHECKLIST[area]) return;
  state.areaAtual = area;
  $("#modal-title").textContent = `Checklist: ${DADOS_CHECKLIST[area].titulo}`;
  mountChecklist(area);
  $("#modal-checklist").setAttribute("aria-hidden", "false");
}
function closeChecklist() { $("#modal-checklist").setAttribute("aria-hidden", "true"); }
const closeBtn = $("[data-close]");
if (closeBtn) closeBtn.addEventListener("click", closeChecklist);

const openPed = $("#open-pedagogica");
if (openPed) openPed.addEventListener("click", () => openChecklist("pedagogica"));
const openClin = $("#open-clinica");
if (openClin) openClin.addEventListener("click", () => openChecklist("clinica"));
const openSoc = $("#open-social");
if (openSoc) openSoc.addEventListener("click", () => openChecklist("social"));

function mountChecklist(area) {
  const cont = $("#checklist-container");
  if (!cont) return;
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

  const textoRel = $("#texto-relatorio");
  if (textoRel) textoRel.value = state.textoRelatorio[area] || "";
  refreshAutoFields(area);
  toggleConfirmButton();
}

function refreshAutoFields(area) {
  const sel = state.selecionados[area] || [];
  const indic = $("#indicacoes-auto");
  const enc = $("#encaminhamentos-auto");
  if (indic) indic.value = sel.length ? sel.map(i => `• ${i.ind}`).join("\n") : "";
  if (enc) enc.value = sel.length ? sel.map(i => `• ${i.enc}`).join("\n") : "";
  const textoRel = $("#texto-relatorio");
  if (textoRel && !textoRel.value) {
    textoRel.value = sel.length ? sel.map(i => `- ${i.txt}`).join("\n") : "";
  }
}

function toggleConfirmButton() {
  const area = state.areaAtual;
  if (!area) return;
  const hasSelection = (state.selecionados[area] || []).length > 0;
  const textoRel = $("#texto-relatorio");
  const hasText = (textoRel && textoRel.value || "").trim().length > 0;
  const btn = $("#confirmar-fechar");
  if (btn) btn.disabled = !(hasSelection || hasText);
}

const confirmarBtn = $("#confirmar-fechar");
if (confirmarBtn) confirmarBtn.addEventListener("click", () => {
  const area = state.areaAtual;
  if (!area) return;
  const textoRel = $("#texto-relatorio");
  state.textoRelatorio[area] = textoRel ? textoRel.value : "";
  const sinteseEl = $(`#sintese-${area}`);
  if (sinteseEl) sinteseEl.textContent = state.textoRelatorio[area] || "Sem registros.";
  closeChecklist();
});

/* ====== Modal Banco de Dados ====== */
const modalDb = $("#modal-db");
if (btnDB) btnDB.addEventListener("click", () => {
  if (modalDb) modalDb.setAttribute("aria-hidden", "false");
  carregarRegistros();
});
const closeDbBtn = $("[data-close-db]");
if (closeDbBtn) closeDbBtn.addEventListener("click", () => modalDb.setAttribute("aria-hidden", "true"));
const dbRefresh = $("#db-refresh");
if (dbRefresh) dbRefresh.addEventListener("click", carregarRegistros);
const dbSearchBtn = $("#db-search-btn");
if (dbSearchBtn) dbSearchBtn.addEventListener("click", buscarRegistros);

/* ====== Firestore: salvar, carregar, excluir, buscar ====== */
async function salvarDados() {
  const dados = {
    nome: $("#nome") ? $("#nome").value : "",
    idade: $("#idade") ? $("#idade").value : "",
    escola: $("#escola") ? $("#escola").value : "",
    municipio: $("#municipio") ? $("#municipio").value : "",
    nre: $("#nre") ? $("#nre").value : "",
    filiacao: $("#filiacao") ? $("#filiacao").value : "",
    dataAvaliacao: $("#data-avaliacao") ? $("#data-avaliacao").value : "",
    conclusao: $("#conclusao-text") ? $("#conclusao-text").textContent : "",
    indicacoes: $("#indicacoes-text") ? $("#indicacoes-text").textContent : "",
    encaminhamentos: $("#encaminhamentos-text") ? $("#encaminhamentos-text").textContent : "",
    observacoes: $("#observacoes-text") ? $("#observacoes-text").textContent : "",
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
if (btnSave) btnSave.addEventListener("click", salvarDados);

async function carregarRegistros() {
  const lista = $("#lista-registros");
  if (!lista) return;
  lista.innerHTML = "<li>Carregando...</li>";
  try {
    const snap = await getDocs(query(collection(db, "relatorios"), orderBy("createdAt", "desc"), limit(200)));
    lista.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `<div><strong>${data.nome || "(sem nome)"}</strong><br><small>${data.escola || ""} • ${data.dataAvaliacao || (data.createdAt ? data.createdAt.split("T")[0] : "")}</small></div>`;
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
  if (!data) return;
  if ($("#nome")) $("#nome").value = data.nome || "";
  if ($("#idade")) $("#idade").value = data.idade || "";
  if ($("#escola")) $("#escola").value = data.escola || "";
  if ($("#municipio")) $("#municipio").value = data.municipio || "";
  if ($("#nre")) $("#nre").value = data.nre || "";
  if ($("#filiacao")) $("#filiacao").value = data.filiacao || "";
  if ($("#data-avaliacao")) $("#data-avaliacao").value = data.dataAvaliacao || "";
  if (data.dataAvaliacao && dataEixoEl) dataEixoEl.textContent = new Intl.DateTimeFormat("pt-BR").format(new Date(data.dataAvaliacao));
  if ($("#conclusao-text")) $("#conclusao-text").textContent = data.conclusao || "";
  if ($("#indicacoes-text")) $("#indicacoes-text").textContent = data.indicacoes || "";
  if ($("#encaminhamentos-text")) $("#encaminhamentos-text").textContent = data.encaminhamentos || "";
  if ($("#observacoes-text")) $("#observacoes-text").textContent = data.observacoes || "";
  if (modalDb) modalDb.setAttribute("aria-hidden", "true");
}

/* Buscar por termo (nome, escola ou data) */
async function buscarRegistros() {
  const termo = $("#db-search") ? $("#db-search").value.trim() : "";
  if (!termo) { carregarRegistros(); return; }
  const lista = $("#lista-registros"); if (!lista) return;
  lista.innerHTML = "<li>Buscando...</li>";
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
      li.innerHTML = `<div><strong>${r.data.nome || "(sem nome)"}</strong><br><small>${r.data.escola || ""} • ${r.data.dataAvaliacao || (r.data.createdAt ? r.data.createdAt.split("T")[0] : "")}</small></div>`;
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
if (btnPrint) btnPrint.addEventListener("click", () => {
  const d = dataAvaliacaoEl ? dataAvaliacaoEl.value : "";
  if (dataEixoEl) dataEixoEl.textContent = d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "[data da avaliação]";
  window.print();
});

/* ====== Inicializações ====== */
document.addEventListener("DOMContentLoaded", () => {
  if (dataNascEl) idadeEl.value = calculateAge(dataNascEl.value);
  if (dataAvaliacaoEl) dataEixoEl.textContent = dataAvaliacaoEl.value ? new Intl.DateTimeFormat("pt-BR").format(new Date(dataAvaliacaoEl.value)) : "[data da avaliação]";
});

/* ====== Fechar modal com ESC ====== */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const mc = $("#modal-checklist"); if (mc) mc.setAttribute("aria-hidden", "true");
    const md = $("#modal-db"); if (md) md.setAttribute("aria-hidden", "true");
  }
});
