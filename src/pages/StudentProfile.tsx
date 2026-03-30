import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, User, Contact, Loader2, GraduationCap, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { alunosApi } from "@/lib/api";
import { toast } from "sonner";
import { StudentForm } from "@/components/StudentForm";
import { useState } from "react";

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data: student, isLoading, error } = useQuery({
    queryKey: ["aluno", id],
    queryFn: () => alunosApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => alunosApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno excluído com sucesso!");
      navigate("/alunos");
    },
    onError: () => {
      toast.error("Erro ao excluir aluno");
    },
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este aluno?")) {
      deleteMutation.mutate();
    }
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
        <Button variant="outline" onClick={() => navigate("/alunos")}>
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/alunos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
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
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {getInitials(student.nome)}
              </AvatarFallback>
            </Avatar>
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

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dados Pessoais */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-card to-accent/20">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Mensalidade</span>
              <span className="font-medium">{formatCurrency(student.valormensalidade)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Vencimento</span>
              <span className="font-medium">Dia {student.datadovencimento || 10}</span>
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
          </CardContent>
        </Card>

        {/* Filiação */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-card to-accent/20">
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
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm">Pai</p>
              <p className="font-medium">{student.nomedopai || "—"}</p>
              {student.cpfdopai && <p className="text-sm text-muted-foreground">CPF: {student.cpfdopai}</p>}
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground text-sm">Resp. Financeiro</p>
              <p className="font-medium">{student.responsavelfinanceiro || "—"}</p>
              {student.cpfrespfin && <p className="text-sm text-muted-foreground">CPF: {student.cpfrespfin}</p>}
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
          <CardHeader className="border-b bg-gradient-to-r from-card to-accent/20">
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
      </div>

      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={student}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ["aluno", id] });
          queryClient.invalidateQueries({ queryKey: ["alunos"] });
        }}
      />
    </div>
  );
}
