const fields = [
  "name","role","email","phone","city","linkedin","objective","summary",
  "education","educationDate","educationStatus","company","job","jobDate",
  "jobDescription","courses","skills","languages","projects","additional"
];

const form = document.getElementById("resumeForm");
const preview = document.getElementById("resumePreview");
const templateClasses = {
  classico: "classic-resume",
  moderno: "modern-resume",
  profissional: "professional-resume",
  minimalista: "minimalista-resume",
  criativo: "criativo-resume",
  primeiro: "primeiro-resume"
};
let currentTemplate = "classico";

function value(id) {
  return document.getElementById(id).value.trim();
}

function setOutput(selector, text, fallback = "") {
  const element = document.querySelector(`[data-out="${selector}"]`);
  if (element) element.textContent = text || fallback;
}

function updatePreview() {
  setOutput("name", value("name"), "Seu Nome Completo");
  setOutput("role", value("role"), "Sua área profissional");
  setOutput("objective", value("objective"), "Seu objetivo profissional aparecerá aqui.");
  setOutput("summary", value("summary"), "Apresente um breve resumo sobre você.");
  setOutput("education", value("education"), "Seu curso e instituição");
  setOutput("educationMeta", [value("educationDate"), value("educationStatus")].filter(Boolean).join(" · "));
  setOutput("jobLine", [value("job"), value("company")].filter(Boolean).join(" — ") || "Cargo · Empresa");
  setOutput("jobDate", value("jobDate"));
  setOutput("jobDescription", value("jobDescription"));
  setOutput("courses", value("courses"), "Seus cursos aparecerão aqui.");
  setOutput("skills", value("skills"), "Suas habilidades aparecerão aqui.");
  setOutput("languages", value("languages"));
  setOutput("projects", value("projects"));
  setOutput("additional", value("additional"));
  setOutput("linkedin", value("linkedin"));

  const contact = [value("email"), value("phone"), value("city")].filter(Boolean);
  document.getElementById("outContact").textContent = contact.join("  •  ") || "E-mail · Telefone · Cidade";

  const sectionFields = {
    "sec-objective": ["objective"],
    "sec-summary": ["summary"],
    "sec-education": ["education","educationDate","educationStatus"],
    "sec-experience": ["company","job","jobDate","jobDescription"],
    "sec-courses": ["courses"],
    "sec-skills": ["skills"],
    "sec-extra": ["languages","projects","additional","linkedin"]
  };
  Object.entries(sectionFields).forEach(([section, ids]) => {
    const hasContent = ids.some(id => value(id));
    document.getElementById(section).style.display = hasContent ? "block" : "none";
  });
}

fields.forEach(id => document.getElementById(id).addEventListener("input", updatePreview));

document.querySelectorAll(".model-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".model-card").forEach(item => item.classList.remove("selected"));
    card.classList.add("selected");
    currentTemplate = card.dataset.template;
    preview.className = `resume ${templateClasses[currentTemplate]}`;
  });
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja apagar todas as informações?")) return;
  form.reset();
  updatePreview();
});


const downloadButton = document.getElementById("downloadBtn");

downloadButton.addEventListener("click", () => {
  const JsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!JsPDF) {
    alert("A ferramenta de PDF não carregou. Verifique sua internet e atualize a página.");
    return;
  }

  updatePreview();

  const safeName = (value("name") || "curriculo")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "curriculo";

  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 18;
  const right = 18;
  const usableWidth = pageWidth - left - right;
  let y = 20;

  const palette = {
    classico: [39, 115, 78],
    moderno: [39, 93, 125],
    profissional: [55, 65, 81],
    minimalista: [80, 80, 80],
    criativo: [132, 76, 153],
    primeiro: [39, 115, 78]
  };
  const accent = palette[currentTemplate] || palette.classico;

  const ensureSpace = (height) => {
    if (y + height > pageHeight - 17) {
      doc.addPage();
      y = 18;
    }
  };

  const addWrapped = (text, opts = {}) => {
    if (!text) return;
    const size = opts.size || 10;
    const lineHeight = opts.lineHeight || 5;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color || [45, 55, 49]));
    const lines = doc.splitTextToSize(String(text), usableWidth);
    ensureSpace(lines.length * lineHeight + 1);
    doc.text(lines, left, y);
    y += lines.length * lineHeight + (opts.after || 1);
  };

  const addSection = (title, items) => {
    const content = items.filter(item => item && String(item).trim());
    if (!content.length) return;
    ensureSpace(15);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text(title.toUpperCase(), left, y);
    y += 2;
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.35);
    doc.line(left, y, pageWidth - right, y);
    y += 5;
    content.forEach(item => addWrapped(item, { size: 10, lineHeight: 5, after: 1 }));
  };

  const name = value("name") || "Seu Nome Completo";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(...accent);
  const nameLines = doc.splitTextToSize(name, usableWidth);
  doc.text(nameLines, left, y);
  y += nameLines.length * 9 + 1;

  const role = value("role");
  if (role) addWrapped(role, { size: 12, color: [85, 100, 90], after: 2 });

  const contact = [value("email"), value("phone"), value("city"), value("linkedin")].filter(Boolean).join("  |  ");
  if (contact) addWrapped(contact, { size: 8.5, color: [95, 105, 98], lineHeight: 4, after: 2 });

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.7);
  doc.line(left, y, pageWidth - right, y);
  y += 4;

  addSection("Objetivo profissional", [value("objective")]);
  addSection("Resumo profissional", [value("summary")]);
  addSection("Formação acadêmica", [
    value("education"),
    [value("educationDate"), value("educationStatus")].filter(Boolean).join(" · ")
  ]);
  addSection("Experiência profissional", [
    [value("job"), value("company")].filter(Boolean).join(" — "),
    value("jobDate"),
    value("jobDescription")
  ]);
  addSection("Cursos e certificações", [value("courses")]);
  addSection("Habilidades e competências", [value("skills")]);
  addSection("Informações complementares", [
    value("languages"), value("projects"), value("additional")
  ]);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(145, 150, 146);
    doc.text("Currículo gerado em MeuCurrículo", left, pageHeight - 8);
    doc.text(`${page} / ${pageCount}`, pageWidth - right, pageHeight - 8, { align: "right" });
  }

  doc.save(`curriculo-${safeName}.pdf`);
});

updatePreview();
