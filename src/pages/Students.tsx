import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, FileDown, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { StudentForm } from "@/components/StudentForm";
import { alunosApi, Aluno, AlunoComMatriculas, getMatriculaAtiva } from "@/lib/api";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);
import { toast } from "sonner";

const grades = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"];
const shifts = ["Manhã", "Tarde", "Integral"] as const;

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Aluno | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [serieDialogOpen, setSerieDialogOpen] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["alunos", search],
    queryFn: () => alunosApi.list({ 
      search: search || undefined,
      withMatriculas: true,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alunosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir aluno");
    },
  });

  const alunos = (data?.items || []) as AlunoComMatriculas[];

  const filtered = alunos.filter((s) => {
    const matriculaAtiva = getMatriculaAtiva(s);
    const matchShift = shiftFilter === "all" || (matriculaAtiva?.turno || s.turno) === shiftFilter;
    const matchStatus = statusFilter === "all" || (s.status || s.situacao) === statusFilter;
    const matchGrade = gradeFilter === "all" || (matriculaAtiva?.serie || s.serie) === gradeFilter;
    return matchShift && matchStatus && matchGrade;
  });

  const handleSave = () => {
    setEditingStudent(null);
    queryClient.invalidateQueries({ queryKey: ["alunos"] });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const generatePDF = useCallback(async (students: Aluno[], title: string) => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Zênite - Sistema de Gestão Escolar", pageWidth / 2, margin, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(title, pageWidth / 2, margin + 8, { align: "center" });

      doc.setFontSize(9);
      doc.text(`Total de alunos: ${students.length}`, margin, margin + 16);
      doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - margin, margin + 16, { align: "right" });

      const tableColumn = ["Nome", "Série", "Turno", "Responsável", "Telefone 1", "Telefone 2"];
      const tableRows = students.map((s) => {
        const mat = getMatriculaAtiva(s);
        return [
          s.nome,
          mat?.serie || s.serie || "—",
          mat?.turno || s.turno || "—",
          s.responsavelfinanceiro || s.nomedamae || "—",
          s.telefone1 || "—",
          s.telefone2 || "—",
        ];
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: margin + 22,
        margin: { horizontal: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [21, 43, 33], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 245, 242] },
      });

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Lista gerada com sucesso!");
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  }, []);

  const handleGeral = () => generatePDF(filtered, "Alunos Matriculados");
  const handleMasculina = () => {
    const filteredByGender = filtered.filter((s) => s.genero === "Masculino");
    if (filteredByGender.length === 0) {
      toast.error("Nenhum aluno do gênero masculino encontrado.");
      return;
    }
    generatePDF(filteredByGender, "Lista Masculina");
  };
  const handleFeminina = () => {
    const filteredByGender = filtered.filter((s) => s.genero === "Feminino");
    if (filteredByGender.length === 0) {
      toast.error("Nenhum aluno do gênero feminino encontrado.");
      return;
    }
    generatePDF(filteredByGender, "Lista Feminina");
  };
  const handlePorSerie = () => setSerieDialogOpen(true);

  const handleSerieConfirm = () => {
    if (!selectedSerie) {
      toast.error("Selecione uma série.");
      return;
    }
    const filteredBySerie = filtered.filter((s) => {
      const mat = getMatriculaAtiva(s);
      return (mat?.serie || s.serie) === selectedSerie;
    });
    if (filteredBySerie.length === 0) {
      toast.error("Nenhum aluno encontrado para esta série.");
      return;
    }
    generatePDF(filteredBySerie, `Alunos - ${selectedSerie}`);
    setSerieDialogOpen(false);
    setSelectedSerie("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Alunos</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={pdfLoading}>
                {pdfLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-1" />
                )}
                Gerar Lista
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleGeral}>
                <List className="mr-2 h-4 w-4" />
                Alunos Matriculados (Geral)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMasculina}>
                <List className="mr-2 h-4 w-4" />
                Lista Masculina
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFeminina}>
                <List className="mr-2 h-4 w-4" />
                Lista Feminina
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePorSerie}>
                <List className="mr-2 h-4 w-4" />
                Por Série
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => {
              setEditingStudent(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Aluno
          </Button>
        </div>
      </div>

      <Card className="shadow-sm rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erro ao carregar alunos. Tente novamente.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Nome..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 pl-7 text-xs rounded-md"
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Série" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>
                  <Select value={shiftFilter} onValueChange={setShiftFilter}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {shifts.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone 1</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone 2</TableHead>
                <TableHead className="hidden xl:table-cell">Telefone 3</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => {
                const matriculaAtiva = getMatriculaAtiva(student);
                return (
                <TableRow 
                  key={student.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/alunos/${student.id}`)}
                >
                  <TableCell className="font-semibold text-foreground">
                    {student.nome}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={(student.status || student.situacao) === "Ativo" ? "default" : "secondary"}
                      className={
                        (student.status || student.situacao) === "Ativo"
                          ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {student.status || student.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{matriculaAtiva?.serie || "Sem matrícula"}</TableCell>
                  <TableCell className="text-muted-foreground">{matriculaAtiva?.turno || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {student.responsavelfinanceiro || student.nomedamae || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {student.telefone1 || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {student.telefone2 || "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {student.telefone3 || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingStudent(student);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum aluno encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={serieDialogOpen} onOpenChange={setSerieDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Selecionar Série</DialogTitle>
          </DialogHeader>
          <Select value={selectedSerie} onValueChange={setSelectedSerie}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Escolha a série" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSerieDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSerieConfirm}>
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingStudent(null);
        }}
        student={editingStudent}
        onSave={handleSave}
      />
    </div>
  );
}
