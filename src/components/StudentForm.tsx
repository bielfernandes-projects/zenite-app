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
import { alunosApi, Aluno } from "@/lib/api";

const grades = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"];
const shifts = ["Manhã", "Tarde", "Integral"] as const;
const racas = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não declarada"];

const studentSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(100),
  serie: z.string().min(1, "Selecione a série"),
  turno: z.enum(["Manhã", "Tarde", "Integral"]),
  anodamatricula: z.coerce.number().optional(),
  datadamatricula: z.string().optional(),
  datanascimento: z.string().optional(),
  naturalidade: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  nomedocartorio: z.string().optional(),
  numerodotermo: z.string().optional(),
  livro: z.string().optional(),
  folha: z.string().optional(),
  matriculadocartorio: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  cia: z.string().optional(),
  nis: z.string().optional(),
  raça: z.string().optional(),
  datadovencimento: z.coerce.number().min(1).max(31).optional(),
  valormensalidade: z.coerce.number().min(0).optional(),
  nomedopai: z.string().optional(),
  rgdopai: z.string().optional(),
  cpfdopai: z.string().optional(),
  nomedamae: z.string().optional(),
  rgmae: z.string().optional(),
  cpfmae: z.string().optional(),
  responsavelfinanceiro: z.string().optional(),
  datanascimentoresponsavelfin: z.string().optional(),
  filiacaoresponsavelfin: z.string().optional(),
  rgrespfin: z.string().optional(),
  cpfrespfin: z.string().optional(),
  possuiirmao: z.boolean().optional(),
  nomeirmao: z.string().optional(),
  telefone1: z.string().optional(),
  nometelefone1: z.string().optional(),
  telefone2: z.string().optional(),
  nometelefone2: z.string().optional(),
  telefone3: z.string().optional(),
  nometelefone3: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  cidadetelefone: z.string().optional(),
  estadotelefone: z.string().optional(),
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
    mutationFn: (data: Partial<Aluno>) => alunosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Matrícula realizada com sucesso!");
      onSave();
      reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao criar aluno. Tente novamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Aluno> }) => alunosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Dados atualizados com sucesso!");
      onSave();
      reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar aluno. Tente novamente.");
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

  useEffect(() => {
    if (student) {
      reset({
        nome: student.nome,
        serie: student.serie,
        turno: student.turno,
        anodamatricula: student.anodamatricula,
        datadamatricula: student.datadamatricula,
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
      reset({});
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
                <Input id="nome" {...register("nome")} className={fieldClass} />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Série *</Label>
                  <Select value={student?.serie} onValueChange={(v) => setValue("serie", v)}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Turno *</Label>
                  <Select value={student?.turno} onValueChange={(v) => setValue("turno", v as "Manhã" | "Tarde" | "Integral")}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {shifts.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="datanascimento">Data de Nascimento</Label>
                  <Input id="datanascimento" type="date" {...register("datanascimento")} className={fieldClass} />
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
                  <Select value={student?.raça} onValueChange={(v) => setValue("raça", v)}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {racas.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Filiação */}
            <TabsContent value="filiacao" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nomedamae">Nome da Mãe</Label>
                  <Input id="nomedamae" {...register("nomedamae")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cpfmae">CPF da Mãe</Label>
                  <Input id="cpfmae" {...register("cpfmae")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nomedopai">Nome do Pai</Label>
                  <Input id="nomedopai" {...register("nomedopai")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cpfdopai">CPF do Pai</Label>
                  <Input id="cpfdopai" {...register("cpfdopai")} className={fieldClass} />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-medium">Responsável Financeiro</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="responsavelfinanceiro">Nome</Label>
                  <Input id="responsavelfinanceiro" {...register("responsavelfinanceiro")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cpfrespfin">CPF</Label>
                  <Input id="cpfrespfin" {...register("cpfrespfin")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="datanascimentoresponsavelfin">Data Nascimento</Label>
                  <Input id="datanascimentoresponsavelfin" type="date" {...register("datanascimentoresponsavelfin")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="filiacaoresponsavelfin">Filiação</Label>
                  <Input id="filiacaoresponsavelfin" placeholder="Pai, Mãe, Avó..." {...register("filiacaoresponsavelfin")} className={fieldClass} />
                </div>
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
                  <Label htmlFor="telefone1">Telefone 1</Label>
                  <Input id="telefone1" {...register("telefone1")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="nometelefone1">Nome/Telefone 1</Label>
                  <Input id="nometelefone1" placeholder="Maria (Mãe)" {...register("nometelefone1")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefone2">Telefone 2</Label>
                  <Input id="telefone2" {...register("telefone2")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="nometelefone2">Nome/Telefone 2</Label>
                  <Input id="nometelefone2" placeholder="João (Pai)" {...register("nometelefone2")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefone3">Telefone 3</Label>
                  <Input id="telefone3" {...register("telefone3")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="nometelefone3">Nome/Telefone 3</Label>
                  <Input id="nometelefone3" placeholder="Avó" {...register("nometelefone3")} className={fieldClass} />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-medium">Endereço</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" {...register("cep")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" {...register("bairro")} className={fieldClass} />
                </div>
              </div>
              <div>
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" {...register("logradouro")} className={fieldClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" {...register("numero")} className={fieldClass} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" {...register("complemento")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cidadetelefone">Cidade</Label>
                  <Input id="cidadetelefone" {...register("cidadetelefone")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="estadotelefone">Estado</Label>
                  <Input id="estadotelefone" {...register("estadotelefone")} className={fieldClass} />
                </div>
              </div>
            </TabsContent>

            {/* Documentos */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input id="rg" {...register("rg")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" {...register("cpf")} className={fieldClass} />
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
