import { supabase } from "@/lib/supabase";

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
  created_at: string;
}

export type AlunoComMatriculas = Aluno & { matriculas: Matricula[] };

export const matriculasApi = {
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

  create: async (template: { titulo: string; conteudo: string; status: string }) => {
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

export function substituirTags(conteudo: string, aluno: Aluno, matriculaAtiva?: Matricula | null): string {
  const tags: Record<string, string> = {
    "{{nome_aluno}}": aluno.nome,
    "{{serie_aluno}}": matriculaAtiva?.serie || aluno.serie || "—",
    "{{turno_aluno}}": matriculaAtiva?.turno || aluno.turno || "—",
    "{{responsavel}}": aluno.responsavelfinanceiro || aluno.nomedamae || "—",
    "{{data_atual}}": new Date().toLocaleDateString("pt-BR"),
  };

  let resultado = conteudo;
  for (const [tag, valor] of Object.entries(tags)) {
    resultado = resultado.replace(new RegExp(tag.replace(/[{}]/g, "\\$&"), "g"), valor);
  }
  return resultado;
}

export async function gerarDocumentoPDF(titulo: string, corpo: string): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ESCOLA ZÊNITE", pageWidth / 2, margin, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Ensino Fundamental - 6º ao 9º Ano", pageWidth / 2, margin + 6, { align: "center" });
  doc.text("CNPJ: 00.000.000/0001-00", pageWidth / 2, margin + 12, { align: "center" });

  doc.setDrawColor(21, 43, 33);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 16, pageWidth - margin, margin + 16);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, pageWidth / 2, margin + 26, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(corpo, maxWidth);
  let y = margin + 36;

  for (const line of lines) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 7;
  }

  y = pageHeight - 25;
  doc.line(margin + 30, y, pageWidth - margin - 30, y);
  y += 6;
  doc.setFontSize(9);
  doc.text("Assinatura do Diretor", pageWidth / 2, y, { align: "center" });

  return doc.output("blob");
}
