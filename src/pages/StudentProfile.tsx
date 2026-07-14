import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, User, Contact, Loader2, GraduationCap, Phone, Plus, BookOpen, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { alunosApi, matriculasApi, gerarFichaAlunoPDF, AlunoComMatriculas, Matricula } from "@/lib/api";
import { toast } from "sonner";
import { StudentForm } from "@/components/StudentForm";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GRADES, SHIFTS } from "@/lib/constants";

const grades = GRADES;
const shifts = SHIFTS;
const matriculaStatuses = ["Ativo", "Concluído", "Transferido", "Cancelado"];

const matriculaSchema = z.object({
  ano_letivo: z.coerce.number().min(2020, "Ano letivo inválido").max(2030),
  serie: z.string().min(1, "Selecione a série"),
  turno: z.string().min(1, "Selecione o turno"),
  status: z.string().min(1, "Selecione o status"),
  data_matricula: z.string().min(1, "Campo obrigatório"),
});

type MatriculaFormData = z.infer<typeof matriculaSchema>;

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [matriculaDialogOpen, setMatriculaDialogOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(null);
  const [deletingMatriculaId, setDeletingMatriculaId] = useState<string | null>(null);
  const [deletingAluno, setDeletingAluno] = useState(false);
  const [tabValue, setTabValue] = useState("personal");

  const { data: student, isLoading, error } = useQuery({
    queryKey: ["aluno", id],
    queryFn: () => alunosApi.get(id!),
    enabled: !!id,
  });

  const { data: matriculas = [], isLoading: matriculasLoading } = useQuery({
    queryKey: ["matriculas", id],
    queryFn: () => matriculasApi.list(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => alunosApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno excluído com sucesso!");
      navigate(-1);
    },
    onError: () => {
      toast.error("Não foi possível excluir o aluno. Tente novamente em alguns instantes.");
    },
  });

  const matriculaForm = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      ano_letivo: new Date().getFullYear(),
      serie: "",
      turno: "",
      status: "Ativo",
      data_matricula: new Date().toISOString().split("T")[0],
    },
  });

  const createMatriculaMutation = useMutation({
    mutationFn: (data: MatriculaFormData) =>
      matriculasApi.create({
        aluno_id: id!,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas", id] });
      queryClient.invalidateQueries({ queryKey: ["aluno", id] });
      toast.success("Matrícula cadastrada com sucesso!");
      setMatriculaDialogOpen(false);
      matriculaForm.reset();
    },
    onError: () => {
      toast.error("Não foi possível cadastrar a matrícula. Verifique os campos e tente novamente.");
    },
  });

  const updateMatriculaMutation = useMutation({
    mutationFn: ({ id: matId, data }: { id: string; data: MatriculaFormData }) =>
      matriculasApi.update(matId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas", id] });
      queryClient.invalidateQueries({ queryKey: ["aluno", id] });
      toast.success("Matrícula atualizada com sucesso!");
      setMatriculaDialogOpen(false);
      setEditingMatricula(null);
      matriculaForm.reset();
    },
    onError: () => {
      toast.error("Não foi possível atualizar a matrícula. Tente novamente em alguns instantes.");
    },
  });

  const deleteMatriculaMutation = useMutation({
    mutationFn: (matId: string) => matriculasApi.delete(matId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas", id] });
      queryClient.invalidateQueries({ queryKey: ["aluno", id] });
      toast.success("Matrícula excluída com sucesso!");
      setDeletingMatriculaId(null);
    },
    onError: () => {
      toast.error("Não foi possível excluir a matrícula. Tente novamente em alguns instantes.");
    },
  });

  useEffect(() => {
    if (matriculaDialogOpen) {
      if (editingMatricula) {
        matriculaForm.reset({
          ano_letivo: editingMatricula.ano_letivo,
          serie: editingMatricula.serie,
          turno: editingMatricula.turno,
          status: editingMatricula.status,
          data_matricula: editingMatricula.data_matricula || new Date().toISOString().split("T")[0],
        });
      } else {
        matriculaForm.reset({
          ano_letivo: new Date().getFullYear(),
          serie: "",
          turno: "",
          status: "Ativo",
          data_matricula: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [matriculaDialogOpen, editingMatricula, matriculaForm]);

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleDelete = () => {
    setDeletingAluno(true);
  };

  const confirmDeleteAluno = () => {
    deleteMutation.mutate();
    setDeletingAluno(false);
  };

  const onSubmitMatricula = (data: MatriculaFormData) => {
    if (editingMatricula) {
      updateMatriculaMutation.mutate({ id: editingMatricula.id, data });
    } else {
      createMatriculaMutation.mutate(data);
    }
  };

  const handlePrintFicha = async () => {
    try {
      const blob = await gerarFichaAlunoPDF(student, matriculas);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("Não foi possível gerar a ficha do aluno. Tente novamente em alguns instantes.");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      Ativo: "bg-success/10 text-success border-success/20 hover:bg-success/20",
      Concluído: "bg-blue-100 text-blue-700 border-blue-200",
      Transferido: "bg-amber-100 text-amber-700 border-amber-200",
      Cancelado: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Aluno não encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Alunos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintFicha}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Ficha
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir
          </Button>
        </div>
      </div>

      {/* Student Header Card */}
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{student.nome}</h1>
                <Badge
                  variant={student.situacao === "Ativo" ? "default" : "secondary"}
                  className={
                    student.situacao === "Ativo"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {student.situacao || "Ativo"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(student.datanascimento)}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {student.serie}
                </span>
                <span>{student.turno}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Histórico de Matrícula
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados Pessoais */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Gênero</span>
                  <span className="font-medium">{student.genero || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Raça/Cor</span>
                  <span className="font-medium">{student.raça || "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Naturalidade</span>
                  <span className="font-medium">{student.naturalidade || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Cidade/UF</span>
                  <span className="font-medium">{student.cidade ? `${student.cidade}/${student.estado}` : "—"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Mensalidade</span>
                  <span className="font-medium">{formatCurrency(student.valormensalidade)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Vencimento</span>
                  <span className="font-medium">Dia {student.datadovencimento || 10}</span>
                </div>
              </CardContent>
            </Card>

            {/* Filiação */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Contact className="h-4 w-4" />
                  Filiação
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Mãe</p>
                  <p className="font-medium">{student.nomedamae || "—"}</p>
                  {student.cpfmae && <p className="text-sm text-muted-foreground">CPF: {student.cpfmae}</p>}
                  {student.rgmae && <p className="text-sm text-muted-foreground">RG: {student.rgmae}</p>}
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm">Pai</p>
                  <p className="font-medium">{student.nomedopai || "—"}</p>
                  {student.cpfdopai && <p className="text-sm text-muted-foreground">CPF: {student.cpfdopai}</p>}
                  {student.rgdopai && <p className="text-sm text-muted-foreground">RG: {student.rgdopai}</p>}
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm">Resp. Financeiro</p>
                  <p className="font-medium">{student.responsavelfinanceiro || "—"}</p>
                  {student.cpfrespfin && <p className="text-sm text-muted-foreground">CPF: {student.cpfrespfin}</p>}
                  {student.rgrespfin && <p className="text-sm text-muted-foreground">RG: {student.rgrespfin}</p>}
                  {student.datanascimentoresponsavelfin && <p className="text-sm text-muted-foreground">Nascimento: {formatDate(student.datanascimentoresponsavelfin)}</p>}
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Filiação</p>
                  <p className="font-medium">{student.filiacaoresponsavelfin || "—"}</p>
                </div>
                {student.possuiirmao && student.nomeirmao && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-sm">Irmão na escola</p>
                      <p className="font-medium">{student.nomeirmao}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contato e Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Telefones</p>
                  {student.telefone1 ? (
                    <div className="space-y-1">
                      <p className="font-medium">{student.telefone1}</p>
                      <p className="text-xs text-muted-foreground">{student.nometelefone1}</p>
                      {student.telefone2 && (
                        <>
                          <p className="font-medium mt-2">{student.telefone2}</p>
                          <p className="text-xs text-muted-foreground">{student.nometelefone2}</p>
                        </>
                      )}
                      {student.telefone3 && (
                        <>
                          <p className="font-medium mt-2">{student.telefone3}</p>
                          <p className="text-xs text-muted-foreground">{student.nometelefone3}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm">Endereço</p>
                  {student.logradouro ? (
                    <p className="font-medium">
                      {student.logradouro}, {student.numero}
                      {student.complemento && ` - ${student.complemento}`}
                    </p>
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {student.bairro} {student.cep && `• ${student.cep}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.cidadetelefone} {student.estadotelefone && `, ${student.estadotelefone}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-muted-foreground text-sm font-medium">Outros dados do aluno(a)</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">RG</span>
                  <span className="font-medium">{student.rg || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">CPF</span>
                  <span className="font-medium">{student.cpf || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">NIS</span>
                  <span className="font-medium">{student.nis || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">CIA</span>
                  <span className="font-medium">{student.cia || "—"}</span>
                </div>
                <Separator />
                <p className="text-muted-foreground text-sm font-medium">Dados do Cartório</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Nome do Cartório</span>
                  <span className="font-medium">{student.nomedocartorio || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Nº Termo</span>
                  <span className="font-medium">{student.numerodotermo || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Livro</span>
                  <span className="font-medium">{student.livro || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Folha</span>
                  <span className="font-medium">{student.folha || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Matrícula Cartório</span>
                  <span className="font-medium">{student.matriculadocartorio || "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Matrículas
              </CardTitle>
              <Button size="sm" onClick={() => setMatriculaDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nova Matrícula
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {matriculasLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Série</TableHead>
                      <TableHead className="text-xs">Ano Letivo</TableHead>
                      <TableHead className="text-xs">Turno</TableHead>
                      <TableHead className="text-xs">Data da Matrícula</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matriculas.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.serie}</TableCell>
                        <TableCell>{m.ano_letivo}</TableCell>
                        <TableCell>{m.turno}</TableCell>
                        <TableCell>{m.data_matricula ? formatDate(m.data_matricula) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeColor(m.status)}>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setEditingMatricula(m);
                                setMatriculaDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeletingMatriculaId(m.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {matriculas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma matrícula cadastrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nova/Editar Matrícula Dialog */}
      <Dialog open={matriculaDialogOpen} onOpenChange={(open) => {
        setMatriculaDialogOpen(open);
        if (!open) setEditingMatricula(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMatricula ? "Editar Matrícula" : "Nova Matrícula"}</DialogTitle>
            <DialogDescription>
              {editingMatricula ? "Altere os dados da matrícula." : `Cadastre uma nova matrícula para ${student.nome}.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={matriculaForm.handleSubmit(onSubmitMatricula)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ano_letivo">Ano Letivo</Label>
              <Input
                id="ano_letivo"
                type="number"
                placeholder="2026"
                {...matriculaForm.register("ano_letivo")}
              />
              {matriculaForm.formState.errors.ano_letivo && (
                <p className="text-xs text-destructive">{matriculaForm.formState.errors.ano_letivo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Série</Label>
              <Select
                value={matriculaForm.watch("serie")}
                onValueChange={(v) => matriculaForm.setValue("serie", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {matriculaForm.formState.errors.serie && (
                <p className="text-xs text-destructive">{matriculaForm.formState.errors.serie.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Turno</Label>
              <Select
                value={matriculaForm.watch("turno")}
                onValueChange={(v) => matriculaForm.setValue("turno", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {matriculaForm.formState.errors.turno && (
                <p className="text-xs text-destructive">{matriculaForm.formState.errors.turno.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={matriculaForm.watch("status")}
                onValueChange={(v) => matriculaForm.setValue("status", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {matriculaStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {matriculaForm.formState.errors.status && (
                <p className="text-xs text-destructive">{matriculaForm.formState.errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_matricula">Data da Matrícula *</Label>
              <Input
                id="data_matricula"
                type="date"
                {...matriculaForm.register("data_matricula")}
              />
              {matriculaForm.formState.errors.data_matricula && (
                <p className="text-xs text-destructive">{matriculaForm.formState.errors.data_matricula.message}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMatriculaDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMatriculaMutation.isPending || updateMatriculaMutation.isPending}>
                {(createMatriculaMutation.isPending || updateMatriculaMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMatriculaId} onOpenChange={(open) => { if (!open) setDeletingMatriculaId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir matrícula?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A matrícula será removida permanentemente do histórico do aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingMatriculaId && deleteMatriculaMutation.mutate(deletingMatriculaId)}
            >
              {deleteMatriculaMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={student}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ["aluno", id] });
          queryClient.invalidateQueries({ queryKey: ["alunos"] });
          queryClient.invalidateQueries({ queryKey: ["matriculas", id] });
        }}
      />

      <AlertDialog open={deletingAluno} onOpenChange={(open) => { if (!open) setDeletingAluno(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. <strong>{student?.nome}</strong> e todas as matrículas, histórico e dados vinculados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteAluno}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
