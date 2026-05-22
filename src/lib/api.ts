import { supabase } from "@/lib/supabase";

export interface Aluno {
  id: string;
  nome: string;
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
  list: async (params?: { page?: number; limit?: number; search?: string; serie?: string }) => {
    let query = supabase.from("alunos").select("*", { count: "exact" });

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
    return { items: (data || []) as Aluno[], total: count || 0 };
  },

  get: async (id: string) => {
    const { data, error } = await supabase.from("alunos").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Aluno;
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
      total_alunos_ativos: all.filter((a) => a.situacao === "Ativo").length,
      alunos_inadimplentes: 0,
      alunos_manhã: all.filter((a) => a.turno === "Manhã").length,
      alunos_tarde: all.filter((a) => a.turno === "Tarde").length,
      alunos_integral: all.filter((a) => a.turno === "Integral").length,
      por_serie: Array.from(porSerieMap.entries()).map(([serie, count]) => ({ serie, count })),
    } as DashboardMetrics;
  },
};

export const documentosApi = {
  listTemplates: async () => {
    return [
      { id: "declaracao", name: "Declaração de Matrícula" },
      { id: "recibo", name: "Recibo de Pagamento" },
      { id: "historico", name: "Histórico Escolar" },
    ];
  },

  generate: async (template: string, aluno: Aluno) => {
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lh = 7;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Zênite - Sistema de Gestão Escolar", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(templateLabel(template), pageWidth / 2, y, { align: "center" });
    y += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const lines: string[] = [];

    if (template === "declaracao") {
      lines.push(
        `Declaramos para os devidos fins que o(a) aluno(a) ${aluno.nome},`,
        `regularmente matriculado(a) no ${aluno.serie}, turno ${aluno.turno},`,
        `é aluno(a) desta instituição de ensino.`,
        "",
        `Responsável financeiro: ${aluno.responsavelfinanceiro || "—"}`,
      );
    } else if (template === "recibo") {
      const valor = aluno.valormensalidade
        ? `R$ ${aluno.valormensalidade.toFixed(2).replace(".", ",")}`
        : "—";
      lines.push(
        `Recebemos de ${aluno.responsavelfinanceiro || aluno.nome} o valor de ${valor}`,
        `referente à mensalidade do(a) aluno(a) ${aluno.nome}, matriculado(a) no`,
        `${aluno.serie}, turno ${aluno.turno}.`,
        "",
        `Vencimento: dia ${aluno.datadovencimento || "—"}`,
      );
    } else if (template === "historico") {
      lines.push(
        `Nome: ${aluno.nome}`,
        `Série: ${aluno.serie}`,
        `Turno: ${aluno.turno}`,
        `Data de Nascimento: ${aluno.datanascimento ? new Date(aluno.datanascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}`,
        `Naturalidade: ${aluno.naturalidade || "—"}`,
        `Nome da Mãe: ${aluno.nomedamae || "—"}`,
        `Nome do Pai: ${aluno.nomedopai || "—"}`,
      );
    }

    lines.push("", `Emitido em: ${new Date().toLocaleDateString("pt-BR")}`);
    lines.forEach((line) => {
      doc.text(line, margin, y);
      y += lh;
    });

    return doc.output("blob");
  },
};

function templateLabel(template: string): string {
  const labels: Record<string, string> = {
    declaracao: "DECLARAÇÃO DE MATRÍCULA",
    recibo: "RECIBO DE PAGAMENTO",
    historico: "HISTÓRICO ESCOLAR",
  };
  return labels[template] || "DOCUMENTO";
}
