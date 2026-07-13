import { supabase } from "@/lib/supabase";
import { LOGO_ESCOLA_BASE64, ASSINATURA_BASE64 } from "@/lib/assets";

export interface Aluno {
  id: string;
  nome: string;
  genero?: string;
  ano_letivo?: number;
  status?: string;
  serie: string;
  turno: string;
  anodamatricula?: number;
  datadamatricula?: string;
  datanascimento?: string;
  naturalidade?: string;
  cidade?: string;
  estado?: string;
  nomedocartorio?: string;
  numerodotermo?: string;
  livro?: string;
  folha?: string;
  matriculadocartorio?: string;
  rg?: string;
  cpf?: string;
  cia?: string;
  nis?: string;
  raça?: string;
  datadovencimento?: number;
  valormensalidade?: number;
  situacao?: string;
  nomedopai?: string;
  rgdopai?: string;
  cpfdopai?: string;
  nomedamae?: string;
  rgmae?: string;
  cpfmae?: string;
  responsavelfinanceiro?: string;
  datanascimentoresponsavelfin?: string;
  filiacaoresponsavelfin?: string;
  rgrespfin?: string;
  cpfrespfin?: string;
  possuiirmao?: boolean;
  nomeirmao?: string;
  telefone1?: string;
  nometelefone1?: string;
  telefone2?: string;
  nometelefone2?: string;
  telefone3?: string;
  nometelefone3?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidadetelefone?: string;
  estadotelefone?: string;
  escola_id?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface DashboardMetrics {
  total_alunos_ativos: number;
  alunos_inadimplentes: number;
  alunos_manhã: number;
  alunos_tarde: number;
  alunos_integral: number;
  por_serie: { serie: string; count: number }[];
}

export const alunosApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; serie?: string; withMatriculas?: boolean }) => {
    const selectFields = params?.withMatriculas ? "*, matriculas(*)" : "*";
    let query = supabase.from("alunos").select(selectFields, { count: "exact" });

    if (params?.search) {
      query = query.ilike("nome", `%${params.search}%`);
    }
    if (params?.serie) {
      query = query.eq("serie", params.serie);
    }

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query.order("nome", { ascending: true });

    if (error) throw error;
    const items = (data || []) as unknown[];
    return { items: params?.withMatriculas ? items as AlunoComMatriculas[] : items as Aluno[], total: count || 0 };
  },

  get: async (id: string) => {
    const { data, error } = await supabase.from("alunos").select("*, matriculas(*)").eq("id", id).single();
    if (error) throw error;
    return data as AlunoComMatriculas;
  },

  create: async (aluno: Partial<Aluno>) => {
    const { data, error } = await supabase.from("alunos").insert(aluno).select().single();
    if (error) throw error;
    return data as Aluno;
  },

  update: async (id: string, aluno: Partial<Aluno>) => {
    const { data, error } = await supabase.from("alunos").update(aluno).eq("id", id).select().single();
    if (error) throw error;
    return data as Aluno;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("alunos").delete().eq("id", id);
    if (error) throw error;
  },
};

export const dashboardApi = {
  getMetrics: async () => {
    const { data: alunos, error } = await supabase.from("alunos").select("*");
    if (error) throw error;

    const all = (alunos || []) as Aluno[];

    const porSerieMap = new Map<string, number>();
    all.forEach((a) => {
      const serie = a.serie || "Sem série";
      porSerieMap.set(serie, (porSerieMap.get(serie) || 0) + 1);
    });

    return {
      total_alunos_ativos: all.filter((a) => (a.status || a.situacao) === "Ativo").length,
      alunos_inadimplentes: 0,
      alunos_manhã: all.filter((a) => a.turno === "Manhã").length,
      alunos_tarde: all.filter((a) => a.turno === "Tarde").length,
      alunos_integral: all.filter((a) => a.turno === "Integral").length,
      por_serie: Array.from(porSerieMap.entries()).map(([serie, count]) => ({ serie, count })),
    } as DashboardMetrics;
  },
};

export interface Produto {
  id: string;
  nome: string;
  categoria: "Fardamento" | "Material Didático" | "Taxa";
  serie_aplicavel: string | null;
  preco: number;
  status: "Ativo" | "Inativo";
}

export interface ReciboItem {
  nome: string;
  preco: number;
  quantidade: number;
}

export interface Recibo {
  id: string;
  aluno_id: string;
  data_emissao: string;
  itens: ReciboItem[];
  valor_total: number;
}

export interface VendaItem {
  id_produto: string;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

export interface Matricula {
  id: string;
  aluno_id: string;
  ano_letivo: number;
  serie: string;
  turno: string;
  status: "Ativo" | "Concluído" | "Transferido" | "Cancelado";
  data_matricula?: string;
  created_at: string;
}

export type AlunoComMatriculas = Aluno & { matriculas: Matricula[] };

export const matriculasApi = {
  listAll: async () => {
    const { data, error } = await supabase
      .from("matriculas")
      .select("*")
      .order("data_matricula", { ascending: true });
    if (error) throw error;
    return (data || []) as Matricula[];
  },

  list: async (alunoId: string) => {
    const { data, error } = await supabase
      .from("matriculas")
      .select("*")
      .eq("aluno_id", alunoId)
      .order("ano_letivo", { ascending: false });
    if (error) throw error;
    return (data || []) as Matricula[];
  },

  create: async (matricula: {
    aluno_id: string;
    ano_letivo: number;
    serie: string;
    turno: string;
    status: string;
    data_matricula?: string;
  }) => {
    const { data, error } = await supabase
      .from("matriculas")
      .insert(matricula)
      .select()
      .single();
    if (error) throw error;
    return data as Matricula;
  },
};

export function getMatriculaAtiva(aluno: AlunoComMatriculas | Aluno): Matricula | null {
  const matriculas = (aluno as AlunoComMatriculas).matriculas;
  if (!matriculas || !Array.isArray(matriculas) || matriculas.length === 0) return null;
  const ativas = matriculas.filter((m) => m.status === "Ativo");
  if (ativas.length === 0) return null;
  return ativas.reduce((a, b) => (a.ano_letivo > b.ano_letivo ? a : b));
}

export const produtosApi = {
  list: async () => {
    const { data, error } = await supabase.from("produtos").select("*").order("nome");
    if (error) throw error;
    return (data || []) as Produto[];
  },

  create: async (produto: Omit<Produto, "id">) => {
    const { data, error } = await supabase.from("produtos").insert(produto).select().single();
    if (error) throw error;
    return data as Produto;
  },

  update: async (id: string, data: Partial<Produto>) => {
    const { data: updated, error } = await supabase.from("produtos").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated as Produto;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) throw error;
  },
};

export const recibosApi = {
  create: async (recibo: { aluno_id: string; itens: (ReciboItem | VendaItem)[]; valor_total: number }) => {
    const payload = {
      aluno_id: recibo.aluno_id,
      itens: recibo.itens,
      valor_total: recibo.valor_total,
    };
    const { data, error } = await supabase.from("recibos").insert(payload).select().single();
    if (error) throw error;
    return data as Recibo;
  },

  list: async () => {
    const { data, error } = await supabase.from("recibos").select("*").order("data_emissao", { ascending: false });
    if (error) throw error;
    return (data || []) as Recibo[];
  },
};

export interface TemplateDocumento {
  id: string;
  titulo: string;
  conteudo: string;
  status: "Ativo" | "Inativo";
  titulo_impresso?: string;
  requer_assinatura?: boolean;
  created_at?: string;
}

export const templatesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from("templates_documentos")
      .select("*")
      .order("titulo", { ascending: true });
    if (error) throw error;
    return (data || []) as TemplateDocumento[];
  },

  listAtivos: async () => {
    const { data, error } = await supabase
      .from("templates_documentos")
      .select("*")
      .eq("status", "Ativo")
      .order("titulo", { ascending: true });
    if (error) throw error;
    return (data || []) as TemplateDocumento[];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("templates_documentos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as TemplateDocumento;
  },

  create: async (template: { titulo: string; conteudo: string; status: string; titulo_impresso?: string; requer_assinatura?: boolean }) => {
    const { data, error } = await supabase
      .from("templates_documentos")
      .insert(template)
      .select()
      .single();
    if (error) throw error;
    return data as TemplateDocumento;
  },

  update: async (id: string, template: Partial<TemplateDocumento>) => {
    const { data, error } = await supabase
      .from("templates_documentos")
      .update(template)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as TemplateDocumento;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("templates_documentos")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export function formatarDataExtenso(): string {
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const hoje = new Date();
  return `Fortaleza, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}

function safe(valor: string | null | undefined): string {
  return valor && valor.trim() ? valor : "Não informado";
}

function formatarData(d: string | null | undefined): string {
  if (!d) return "Não informado";
  const date = new Date(d + "T12:00:00");
  if (isNaN(date.getTime())) return "Não informado";
  return date.toLocaleDateString("pt-BR");
}

export function substituirTags(conteudo: string, aluno: Aluno, matriculaAtiva?: Matricula | null): string {
  const tags: Record<string, string> = {
    "{{nome_aluno}}": safe(aluno.nome),
    "{{data_nascimento}}": formatarData(aluno.datanascimento),
    "{{serie_aluno}}": safe(matriculaAtiva?.serie || aluno.serie),
    "{{turno_aluno}}": safe(matriculaAtiva?.turno || aluno.turno),
    "{{nome_pai}}": safe(aluno.nomedopai),
    "{{nome_mae}}": safe(aluno.nomedamae),
    "{{responsavel}}": safe(aluno.responsavelfinanceiro || aluno.nomedamae),
    "{{cpf_responsavel}}": safe(aluno.cpfrespfin),
    "{{ano_letivo}}": matriculaAtiva?.ano_letivo ? String(matriculaAtiva.ano_letivo) : "Não informado",
    "{{data_atual}}": formatarDataExtenso(),
  };

  let resultado = conteudo;
  for (const [tag, valor] of Object.entries(tags)) {
    resultado = resultado.replace(new RegExp(tag.replace(/[{}]/g, "\\$&"), "g"), valor);
  }
  return resultado;
}

interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function parseStyledText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const tagRegex = /<(\/?)([biu])>/gi;
  let lastIndex = 0;
  let bold = false;
  let italic = false;
  let underline = false;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold, italic, underline });
    }
    const isClosing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (tag === "b") bold = !isClosing;
    else if (tag === "i") italic = !isClosing;
    else if (tag === "u") underline = !isClosing;
    lastIndex = tagRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold, italic, underline });
  }

  return segments.filter((s) => s.text.length > 0);
}

function renderFormattedParagraph(
  doc: ReturnType<typeof import("jspdf").default>,
  text: string,
  startY: number,
  margin: number,
  maxWidth: number,
  pageHeight: number,
): number {
  const segments = parseStyledText(text);
  let x = margin;
  let y = startY;
  const lineHeight = 7;

  for (const seg of segments) {
    if (!seg.text) continue;

    const style =
      seg.bold && seg.italic
        ? "bolditalic"
        : seg.bold
          ? "bold"
          : seg.italic
            ? "italic"
            : "normal";

    doc.setFont("helvetica", style);

    const parts = seg.text.split(/(\s+)/);

    for (const part of parts) {
      if (part === "") continue;

      const partWidth = doc.getTextWidth(part);

      if (x + partWidth > margin + maxWidth && x > margin) {
        y += lineHeight;
        x = margin;
      }

      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      doc.text(part, x, y);

      if (seg.underline) {
        doc.setLineWidth(0.3);
        doc.line(x, y + 1, x + partWidth, y + 1);
      }

      x += partWidth;
    }
  }

  return y + lineHeight;
}

export async function gerarDocumentoPDF(titulo: string, corpo: string, tituloImpresso?: string, requerAssinatura: boolean = true): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const cx = pageWidth / 2;

  const textX = 65;

  if (LOGO_ESCOLA_BASE64) {
    doc.addImage(LOGO_ESCOLA_BASE64, "PNG", 15, 15, 45, 30);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INSTITUTO INFANTIL TIA NEUMA", textX, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Educação Infantil e Ensino Fundamental I", textX, 24);

  doc.setFontSize(11);
  doc.text("Rua: Alameda Ana Elisa, 133, Quadra 2, Cidade 2000 - Fortaleza-CE", textX, 29);

  doc.text("Telefone: (85) 3212.1112", textX, 34);
  doc.text("WhatsApp: (85) 9 9292-5662", textX + 45, 34);

  doc.text("E-mail: institutotianeuma@gmail.com", textX, 39);

  doc.text("INEP: 23075112", textX, 44);
  doc.text("CNPJ: 05.813.399.0001-43", textX + 45, 44);

  let y = 65;

  const tituloDoc = (tituloImpresso || titulo).toUpperCase();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(tituloDoc, cx, y, { align: "center" });
  y += 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const paragrafos = corpo.split(/\r?\n/);

  for (const paragrafo of paragrafos) {
    if (paragrafo.trim() === "") {
      y += 6;
    } else {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }
      y = renderFormattedParagraph(doc, paragrafo, y, margin, maxWidth, pageHeight) + 2;
    }
  }

  y += 15;

  doc.text(formatarDataExtenso(), pageWidth - margin, y, { align: "right" });

  if (requerAssinatura) {
    y += 25;

    if (ASSINATURA_BASE64) {
      doc.addImage(ASSINATURA_BASE64, "PNG", cx - 20, y, 40, 20);
      y += 24;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Vicente Herbet Fernandes Evangelista", cx, y, { align: "center" });
    y += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Diretor Pedagógico", cx, y, { align: "center" });
  }

  return doc.output("blob");
}

export async function gerarFichaAlunoPDF(aluno: Aluno, matriculas: Matricula[]): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const cx = pageWidth / 2;
  const textX = 65;

  if (LOGO_ESCOLA_BASE64) {
    doc.addImage(LOGO_ESCOLA_BASE64, "PNG", 15, 15, 45, 30);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INSTITUTO INFANTIL TIA NEUMA", textX, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Educação Infantil e Ensino Fundamental I", textX, 24);
  doc.setFontSize(11);
  doc.text("Rua: Alameda Ana Elisa, 133, Quadra 2, Cidade 2000 - Fortaleza-CE", textX, 29);
  doc.text("Telefone: (85) 3212.1112", textX, 34);
  doc.text("WhatsApp: (85) 9 9292-5662", textX + 45, 34);
  doc.text("E-mail: institutotianeuma@gmail.com", textX, 39);
  doc.text("INEP: 23075112", textX, 44);
  doc.text("CNPJ: 05.813.399.0001-43", textX + 45, 44);

  let y = 65;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA DO ALUNO", cx, y, { align: "center" });
  y += 18;

  // Dados Pessoais
  doc.setFontSize(14);
  doc.text("Dados Pessoais", margin, y);
  y += 10;

  const fields: [string, string][] = [
    ["Nome", aluno.nome],
    ["Data de Nascimento", formatarData(aluno.datanascimento)],
    ["Série", aluno.serie],
    ["Turno", aluno.turno],
    ["RG", safe(aluno.rg)],
    ["CPF", safe(aluno.cpf)],
    ["NIS", safe(aluno.nis)],
    ["Naturalidade", safe(aluno.naturalidade)],
    ["Mãe", safe(aluno.nomedamae)],
    ["Pai", safe(aluno.nomedopai)],
    ["Responsável Financeiro", safe(aluno.responsavelfinanceiro)],
    ["Telefone", safe(aluno.telefone1)],
    ["Endereço", `${aluno.logradouro}, ${aluno.numero}${aluno.bairro ? ` - ${aluno.bairro}` : ""}`],
    ["CEP", safe(aluno.cep)],
    ["Cidade/Estado", `${aluno.cidadetelefone || ""}/${aluno.estadotelefone || ""}`],
  ];

  doc.setFontSize(10);
  for (const [label, value] of fields) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.text(String(value), margin + labelWidth + 2, y);
    y += 6;
  }

  y += 12;

  // Histórico de Matrícula
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Histórico de Matrícula", margin, y);
  y += 10;

  const grades = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"];
  const colWidths = [25, 35, 30, 40, 30];
  const headers = ["Série", "Ano Letivo", "Turno", "Data Matrícula", "Status"];
  const tableX = margin;

  const matriculaBySerie = new Map(matriculas.map((m) => [m.serie, m]));

  const drawTableHeader = (yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let xx = tableX;
    headers.forEach((h, i) => {
      doc.text(h, xx + 2, yy);
      xx += colWidths[i];
    });
    doc.line(tableX, yy + 1, tableX + colWidths.reduce((a, b) => a + b, 0), yy + 1);
    return yy + 8;
  };

  y = drawTableHeader(y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const grade of grades) {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
      y = drawTableHeader(y);
    }

    const m = matriculaBySerie.get(grade);
    const row = [
      grade,
      m?.ano_letivo?.toString() || "",
      m?.turno || "",
      m?.data_matricula ? formatarData(m.data_matricula) : "",
      m?.status || "",
    ];

    let xx = tableX;
    row.forEach((cell, i) => {
      doc.text(cell, xx + 2, y);
      xx += colWidths[i];
    });
    y += 7;
  }

  return doc.output("blob");
}
