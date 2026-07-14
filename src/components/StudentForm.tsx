import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { alunosApi, matriculasApi, Aluno } from "@/lib/api";
import { maskCPF, maskRG, maskCEP, maskPhone } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/constants";

const grades = GRADES;
const shifts = ["Manhã", "Tarde"] as const;
const racas = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não declarada"];

const studentSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(100),
  serie: z.string().min(1, "Selecione a série"),
  turno: z.enum(["Manhã", "Tarde"]),
  datanascimento: z.string().min(1, "Campo obrigatório"),
  responsavelfinanceiro: z.string().min(1, "Campo obrigatório"),
  cpfrespfin: z.string().min(1, "Campo obrigatório"),
  rgrespfin: z.string().min(1, "Campo obrigatório"),
  logradouro: z.string().min(1, "Campo obrigatório"),
  numero: z.string().min(1, "Campo obrigatório"),
  bairro: z.string().min(1, "Campo obrigatório"),
  cep: z.string().min(1, "Campo obrigatório"),
  cidadetelefone: z.string().min(1, "Campo obrigatório"),
  estadotelefone: z.string().min(1, "Campo obrigatório"),
  telefone1: z.string().min(1, "Campo obrigatório"),
  nometelefone1: z.string().min(1, "Campo obrigatório"),
  ano_letivo: z.coerce.number().nullable().optional(),
  genero: z.string().min(1, "Campo obrigatório"),
  status: z.string().nullable().optional(),
  anodamatricula: z.coerce.number().nullable().optional(),
  datadamatricula: z.string().min(1, "Campo obrigatório"),
  naturalidade: z.string().nullable().optional(),
  cidade: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  nomedocartorio: z.string().nullable().optional(),
  numerodotermo: z.string().nullable().optional(),
  livro: z.string().nullable().optional(),
  folha: z.string().nullable().optional(),
  matriculadocartorio: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  cia: z.string().nullable().optional(),
  nis: z.string().nullable().optional(),
  raça: z.string().nullable().optional(),
  datadovencimento: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(1).max(31).optional()
  ),
  valormensalidade: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(0).optional()
  ),
  nomedopai: z.string().nullable().optional(),
  rgdopai: z.string().nullable().optional(),
  cpfdopai: z.string().nullable().optional(),
  nomedamae: z.string().nullable().optional(),
  rgmae: z.string().nullable().optional(),
  cpfmae: z.string().nullable().optional(),
  datanascimentoresponsavelfin: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : val,
    z.string().nullable().optional()
  ),
  filiacaoresponsavelfin: z.string().nullable().optional(),
  possuiirmao: z.boolean().nullable().optional(),
  nomeirmao: z.string().nullable().optional(),
  telefone2: z.string().nullable().optional(),
  nometelefone2: z.string().nullable().optional(),
  telefone3: z.string().nullable().optional(),
  nometelefone3: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Aluno | null;
  onSave: () => void;
}

export function StudentForm({ open, onOpenChange, student, onSave }: StudentFormProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const aluno = await alunosApi.create(data);
      await matriculasApi.create({
        aluno_id: aluno.id,
        ano_letivo: data.ano_letivo || new Date().getFullYear(),
        serie: data.serie,
        turno: data.turno,
        status: "Ativo",
        data_matricula: data.datadamatricula || new Date().toISOString().split("T")[0],
      });
      return aluno;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Matrícula realizada com sucesso!");
      onSave();
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar aluno: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Aluno> }) => alunosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Dados atualizados com sucesso!");
      onSave();
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar aluno: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const possuiirmao = watch("possuiirmao", false);
  const cpfVal = watch("cpf");
  const rgVal = watch("rg");
  const cpfrespfinVal = watch("cpfrespfin");
  const rgrespfinVal = watch("rgrespfin");
  const cpfdopaiVal = watch("cpfdopai");
  const rgdopaiVal = watch("rgdopai");
  const cpfmaeVal = watch("cpfmae");
  const rgmaeVal = watch("rgmae");
  const cepVal = watch("cep");
  const telefone1Val = watch("telefone1");
  const telefone2Val = watch("telefone2");
  const telefone3Val = watch("telefone3");
  const serieVal = watch("serie");
  const turnoVal = watch("turno");
  const generoVal = watch("genero");
  const statusVal = watch("status");
  const racaVal = watch("raça");

  useEffect(() => {
    if (student) {
      reset({
        nome: student.nome,
        serie: student.serie,
        turno: student.turno,
        ano_letivo: student.ano_letivo,
        genero: student.genero ?? undefined,
        status: student.status,
        anodamatricula: student.anodamatricula,
        datadamatricula: student.datadamatricula || new Date().toISOString().split("T")[0],
        datanascimento: student.datanascimento,
        naturalidade: student.naturalidade,
        cidade: student.cidade,
        estado: student.estado,
        nomedocartorio: student.nomedocartorio,
        numerodotermo: student.numerodotermo,
        livro: student.livro,
        folha: student.folha,
        matriculadocartorio: student.matriculadocartorio,
        rg: student.rg,
        cpf: student.cpf,
        cia: student.cia,
        nis: student.nis,
        raça: student.raça,
        datadovencimento: student.datadovencimento,
        valormensalidade: student.valormensalidade,
        nomedopai: student.nomedopai,
        rgdopai: student.rgdopai,
        cpfdopai: student.cpfdopai,
        nomedamae: student.nomedamae,
        rgmae: student.rgmae,
        cpfmae: student.cpfmae,
        responsavelfinanceiro: student.responsavelfinanceiro,
        datanascimentoresponsavelfin: student.datanascimentoresponsavelfin,
        filiacaoresponsavelfin: student.filiacaoresponsavelfin,
        rgrespfin: student.rgrespfin,
        cpfrespfin: student.cpfrespfin,
        possuiirmao: student.possuiirmao,
        nomeirmao: student.nomeirmao,
        telefone1: student.telefone1,
        nometelefone1: student.nometelefone1,
        telefone2: student.telefone2,
        nometelefone2: student.nometelefone2,
        telefone3: student.telefone3,
        nometelefone3: student.nometelefone3,
        logradouro: student.logradouro,
        numero: student.numero,
        complemento: student.complemento,
        bairro: student.bairro,
        cep: student.cep,
        cidadetelefone: student.cidadetelefone,
        estadotelefone: student.estadotelefone,
      });
    } else {
      reset({
        datadamatricula: new Date().toISOString().split("T")[0],
      });
    }
  }, [student, open]);

  const onSubmit = (data: StudentFormData) => {
    if (student) {
      updateMutation.mutate({ id: student.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const fieldClass = "rounded-lg border-input";
  const getFieldClass = (name: keyof StudentFormData) =>
    cn(fieldClass, errors[name] && "border-destructive");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {student ? "Editar Aluno" : "Novo Aluno"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="filiacao">Filiação</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="documentos">Docs</TabsTrigger>
            </TabsList>

            {/* Dados Pessoais */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" {...register("nome")} className={getFieldClass("nome")} />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Série *</Label>
                  <Select value={serieVal} onValueChange={(v) => setValue("serie", v)}>
                  <SelectTrigger className={getFieldClass("serie")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                  </SelectContent>
                </Select>
                </div>
                <div>
                  <Label>Turno *</Label>
                  <Select value={turnoVal} onValueChange={(v) => setValue("turno", v as "Manhã" | "Tarde")}>
                    <SelectTrigger className={getFieldClass("turno")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {shifts.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ano_letivo">Ano Letivo</Label>
                  <Input id="ano_letivo" type="number" {...register("ano_letivo")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Gênero</Label>
                  <Select value={generoVal} onValueChange={(v) => setValue("genero", v)}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusVal} onValueChange={(v) => setValue("status", v)}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="datanascimento">Data de Nascimento *</Label>
                  <Input id="datanascimento" type="date" {...register("datanascimento")} className={getFieldClass("datanascimento")} />
                  {errors.datanascimento && <p className="text-xs text-destructive mt-1">{errors.datanascimento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="naturalidade">Naturalidade</Label>
                  <Input id="naturalidade" {...register("naturalidade")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="valormensalidade">Mensalidade (R$)</Label>
                  <Input id="valormensalidade" type="number" {...register("valormensalidade")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="datadovencimento">Dia Vencimento</Label>
                  <Input id="datadovencimento" type="number" min={1} max={31} {...register("datadovencimento")} className={fieldClass} />
                </div>
                <div>
                  <Label>Raça/Cor</Label>
                  <Select value={racaVal} onValueChange={(v) => setValue("raça", v)}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {racas.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="datadamatricula">Data da 1ª Matrícula *</Label>
                  <Input id="datadamatricula" type="date" {...register("datadamatricula")} className={getFieldClass("datadamatricula")} />
                  {errors.datadamatricula && <p className="text-xs text-destructive mt-1">{errors.datadamatricula.message}</p>}
                </div>
              </div>
            </TabsContent>

            {/* Filiação */}
            <TabsContent value="filiacao" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="nomedamae">Nome da Mãe</Label>
                  <Input id="nomedamae" {...register("nomedamae")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cpfmae">CPF da Mãe</Label>
                  <Input
                    id="cpfmae"
                    value={cpfmaeVal || ""}
                    onChange={(e) => setValue("cpfmae", maskCPF(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label htmlFor="rgmae">RG da Mãe</Label>
                  <Input
                    id="rgmae"
                    value={rgmaeVal || ""}
                    onChange={(e) => setValue("rgmae", maskRG(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="nomedopai">Nome do Pai</Label>
                  <Input id="nomedopai" {...register("nomedopai")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cpfdopai">CPF do Pai</Label>
                  <Input
                    id="cpfdopai"
                    value={cpfdopaiVal || ""}
                    onChange={(e) => setValue("cpfdopai", maskCPF(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label htmlFor="rgdopai">RG do Pai</Label>
                  <Input
                    id="rgdopai"
                    value={rgdopaiVal || ""}
                    onChange={(e) => setValue("rgdopai", maskRG(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-medium">Responsável Financeiro</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="responsavelfinanceiro">Nome *</Label>
                  <Input id="responsavelfinanceiro" {...register("responsavelfinanceiro")} className={getFieldClass("responsavelfinanceiro")} />
                  {errors.responsavelfinanceiro && <p className="text-xs text-destructive mt-1">{errors.responsavelfinanceiro.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cpfrespfin">CPF *</Label>
                  <Input
                    id="cpfrespfin"
                    value={cpfrespfinVal || ""}
                    onChange={(e) => setValue("cpfrespfin", maskCPF(e.target.value), { shouldValidate: true })}
                    className={getFieldClass("cpfrespfin")}
                  />
                  {errors.cpfrespfin && <p className="text-xs text-destructive mt-1">{errors.cpfrespfin.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rgrespfin">RG *</Label>
                  <Input
                    id="rgrespfin"
                    value={rgrespfinVal || ""}
                    onChange={(e) => setValue("rgrespfin", maskRG(e.target.value), { shouldValidate: true })}
                    className={getFieldClass("rgrespfin")}
                  />
                  {errors.rgrespfin && <p className="text-xs text-destructive mt-1">{errors.rgrespfin.message}</p>}
                </div>
                <div>
                  <Label htmlFor="datanascimentoresponsavelfin">Data Nascimento</Label>
                  <Input id="datanascimentoresponsavelfin" type="date" {...register("datanascimentoresponsavelfin")} className={fieldClass} />
                </div>
              </div>
              <div>
                <Label htmlFor="filiacaoresponsavelfin">Filiação</Label>
                <Input id="filiacaoresponsavelfin" placeholder="Pai, Mãe, Avó..." {...register("filiacaoresponsavelfin")} className={fieldClass} />
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="possuiirmao"
                  checked={possuiirmao}
                  onCheckedChange={(checked) => setValue("possuiirmao", checked as boolean)}
                />
                <Label htmlFor="possuiirmao">Possui irmão(s) na escola?</Label>
              </div>
              {possuiirmao && (
                <div>
                  <Label htmlFor="nomeirmao">Nome do Irmão(ã)</Label>
                  <Input id="nomeirmao" {...register("nomeirmao")} className={fieldClass} />
                </div>
              )}
            </TabsContent>

            {/* Contato */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefone1">Telefone 1 *</Label>
                  <Input
                    id="telefone1"
                    value={telefone1Val || ""}
                    onChange={(e) => setValue("telefone1", maskPhone(e.target.value), { shouldValidate: true })}
                    className={getFieldClass("telefone1")}
                  />
                  {errors.telefone1 && <p className="text-xs text-destructive mt-1">{errors.telefone1.message}</p>}
                </div>
                <div>
                  <Label htmlFor="nometelefone1">Nome/Telefone 1 *</Label>
                  <Input id="nometelefone1" placeholder="Maria (Mãe)" {...register("nometelefone1")} className={getFieldClass("nometelefone1")} />
                  {errors.nometelefone1 && <p className="text-xs text-destructive mt-1">{errors.nometelefone1.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefone2">Telefone 2</Label>
                  <Input
                    id="telefone2"
                    value={telefone2Val || ""}
                    onChange={(e) => setValue("telefone2", maskPhone(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label htmlFor="nometelefone2">Nome/Telefone 2</Label>
                  <Input id="nometelefone2" placeholder="João (Pai)" {...register("nometelefone2")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefone3">Telefone 3</Label>
                  <Input
                    id="telefone3"
                    value={telefone3Val || ""}
                    onChange={(e) => setValue("telefone3", maskPhone(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label htmlFor="nometelefone3">Nome/Telefone 3</Label>
                  <Input id="nometelefone3" placeholder="Avó" {...register("nometelefone3")} className={fieldClass} />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-medium">Endereço *</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={cepVal || ""}
                    onChange={(e) => setValue("cep", maskCEP(e.target.value), { shouldValidate: true })}
                    className={getFieldClass("cep")}
                  />
                  {errors.cep && <p className="text-xs text-destructive mt-1">{errors.cep.message}</p>}
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input id="bairro" {...register("bairro")} className={getFieldClass("bairro")} />
                  {errors.bairro && <p className="text-xs text-destructive mt-1">{errors.bairro.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="logradouro">Logradouro *</Label>
                <Input id="logradouro" {...register("logradouro")} className={getFieldClass("logradouro")} />
                {errors.logradouro && <p className="text-xs text-destructive mt-1">{errors.logradouro.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="numero">Número *</Label>
                  <Input id="numero" {...register("numero")} className={getFieldClass("numero")} />
                  {errors.numero && <p className="text-xs text-destructive mt-1">{errors.numero.message}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" {...register("complemento")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cidadetelefone">Cidade *</Label>
                  <Input id="cidadetelefone" {...register("cidadetelefone")} className={getFieldClass("cidadetelefone")} />
                  {errors.cidadetelefone && <p className="text-xs text-destructive mt-1">{errors.cidadetelefone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="estadotelefone">Estado *</Label>
                  <Input id="estadotelefone" {...register("estadotelefone")} className={getFieldClass("estadotelefone")} />
                  {errors.estadotelefone && <p className="text-xs text-destructive mt-1">{errors.estadotelefone.message}</p>}
                </div>
              </div>
            </TabsContent>

            {/* Documentos */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              <Label className="text-base font-medium">Outros dados do aluno(a)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={rgVal || ""}
                    onChange={(e) => setValue("rg", maskRG(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpfVal || ""}
                    onChange={(e) => setValue("cpf", maskCPF(e.target.value), { shouldValidate: true })}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nis">NIS</Label>
                  <Input id="nis" {...register("nis")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cia">CIA</Label>
                  <Input id="cia" {...register("cia")} className={fieldClass} />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-medium">Dados do Cartório</Label>
              </div>
              <div>
                <Label htmlFor="nomedocartorio">Nome do Cartório</Label>
                <Input id="nomedocartorio" {...register("nomedocartorio")} className={fieldClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="numerodotermo">Nº Termo</Label>
                  <Input id="numerodotermo" {...register("numerodotermo")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="livro">Livro</Label>
                  <Input id="livro" {...register("livro")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="folha">Folha</Label>
                  <Input id="folha" {...register("folha")} className={fieldClass} />
                </div>
              </div>
              <div>
                <Label htmlFor="matriculadocartorio">Matrícula Cartório</Label>
                <Input id="matriculadocartorio" {...register("matriculadocartorio")} className={fieldClass} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
