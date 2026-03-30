import axios from "axios";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

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
    const { data } = await api.get<{ items: Aluno[]; total: number }>("/alunos", { params });
    return data;
  },
  
  get: async (id: string) => {
    const { data } = await api.get<Aluno>(`/alunos/${id}`);
    return data;
  },
  
  create: async (aluno: Partial<Aluno>) => {
    const { data } = await api.post<Aluno>("/alunos", aluno);
    return data;
  },
  
  update: async (id: string, aluno: Partial<Aluno>) => {
    const { data } = await api.put<Aluno>(`/alunos/${id}`, aluno);
    return data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/alunos/${id}`);
  },
};

export const dashboardApi = {
  getMetrics: async () => {
    const { data } = await api.get<DashboardMetrics>("/dashboard/metrics");
    return data;
  },
};

export const documentosApi = {
  listTemplates: async () => {
    const { data } = await api.get<{ templates: { id: string; name: string }[] }>("/documentos/templates");
    return data.templates;
  },
  
  generate: async (template: string, alunoId: string) => {
    const response = await api.post(
      "/documentos/gerar",
      { template, aluno_id: alunoId },
      { responseType: "blob" }
    );
    return response.data as Blob;
  },
};
