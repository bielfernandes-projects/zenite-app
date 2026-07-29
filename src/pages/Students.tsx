import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, FileDown, List, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { GRADES, SHIFTS } from "@/lib/constants";

const grades = GRADES;
const shifts = SHIFTS;

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Ativo"]);
  const [formOpen, setFormOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<"nome" | "status" | "serie" | "turno">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingStudent, setEditingStudent] = useState<Aluno | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Aluno | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [serieDialogOpen, setSerieDialogOpen] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("students-filters");
    if (saved) {
      try {
        const f = JSON.parse(saved);
        setSearch(f.search ?? "");
        setSelectedGrades(f.selectedGrades ?? []);
        setSelectedShifts(f.selectedShifts ?? []);
        setSelectedStatuses(f.selectedStatuses ?? ["Ativo"]);
      } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      sessionStorage.setItem("students-filters", JSON.stringify({
        search, selectedGrades, selectedShifts, selectedStatuses,
      }));
    };
  });

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
      toast.error("Não foi possível excluir o aluno. Tente novamente em alguns instantes.");
    },
  });

  const alunos = (data?.items || []) as AlunoComMatriculas[];

  const filtered = alunos.filter((s) => {
    const matriculaAtiva = getMatriculaAtiva(s);
    const matchShift = selectedShifts.length === 0 || selectedShifts.includes(matriculaAtiva?.turno || s.turno || "");
    const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status || s.situacao || "");
    const matchGrade = selectedGrades.length === 0 || selectedGrades.includes(matriculaAtiva?.serie || s.serie || "");
    return matchShift && matchStatus && matchGrade;
  });

  const handleSort = (column: "nome" | "status" | "serie" | "turno") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredAndSorted = [...filtered].sort((a, b) => {
    const matA = getMatriculaAtiva(a);
    const matB = getMatriculaAtiva(b);
    let valA: string;
    let valB: string;
    switch (sortColumn) {
      case "nome": valA = a.nome || ""; valB = b.nome || ""; break;
      case "status": valA = a.status || a.situacao || ""; valB = b.status || b.situacao || ""; break;
      case "serie": valA = matA?.serie || a.serie || ""; valB = matB?.serie || b.serie || ""; break;
      case "turno": valA = matA?.turno || a.turno || ""; valB = matB?.turno || b.turno || ""; break;
      default: valA = ""; valB = "";
    }
    return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const SortIcon = ({ column }: { column: "nome" | "status" | "serie" | "turno" }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-foreground" />
      : <ArrowDown className="h-3 w-3 ml-1 text-foreground" />;
  };

  const handleSave = () => {
    setEditingStudent(null);
    queryClient.invalidateQueries({ queryKey: ["alunos"] });
    queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
  };

  const handleDelete = (id: string) => {
    const student = alunos.find((s) => s.id === id);
    if (student) setStudentToDelete(student);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const toggleArrayFilter = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const hasActiveFilters = selectedGrades.length > 0 || selectedShifts.length > 0 || selectedStatuses.length > 1 || search.length > 0 || (selectedStatuses.length === 1 && selectedStatuses[0] !== "Ativo");

  const clearFilters = () => {
    setSelectedGrades([]);
    setSelectedShifts([]);
    setSelectedStatuses(["Ativo"]);
    setSearch("");
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

      const tableColumn = ["Nome", "Série", "Turno", "Responsável", "Telefone Principal", "Telefone 2"];
      const tableRows = students.map((s) => {
        const mat = getMatriculaAtiva(s);
        return [
          s.nome,
          mat?.serie || s.serie || "—",
          mat?.turno || s.turno || "—",
          s.responsavelfinanceiro || s.nomedamae || "—",
          s.telefone_principal === 2 ? s.telefone2 : s.telefone_principal === 3 ? s.telefone3 : s.telefone1 || "—",
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
      toast.error("Não foi possível gerar o PDF. Tente novamente em alguns instantes.");
    } finally {
      setPdfLoading(false);
    }
  }, []);

  const handleGeral = () => generatePDF(filtered, "Alunos Filtrados");
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
                Alunos Filtrados
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

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Filtrar alunos</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
              <X className="h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Nome</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-7 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Série</Label>
            <div className="space-y-1.5">
              {grades.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedGrades.includes(g)}
                    onCheckedChange={() => toggleArrayFilter(selectedGrades, setSelectedGrades, g)}
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Turno</Label>
            <div className="space-y-1.5">
              {shifts.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedShifts.includes(s)}
                    onCheckedChange={() => toggleArrayFilter(selectedShifts, setSelectedShifts, s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Status</Label>
            <div className="space-y-1.5">
              {["Ativo", "Transferido", "Desistente"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedStatuses.includes(s)}
                    onCheckedChange={() => toggleArrayFilter(selectedStatuses, setSelectedStatuses, s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          {filtered.length} aluno(s) encontrado(s)
          {hasActiveFilters && ` de ${alunos.length}`}
        </p>
      </Card>

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
                  <button onClick={() => handleSort("nome")} className="flex items-center hover:text-foreground transition-colors">
                    Nome <SortIcon column="nome" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("status")} className="flex items-center hover:text-foreground transition-colors">
                    Status <SortIcon column="status" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("serie")} className="flex items-center hover:text-foreground transition-colors">
                    Série <SortIcon column="serie" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("turno")} className="flex items-center hover:text-foreground transition-colors">
                    Turno <SortIcon column="turno" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone Principal</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone 2</TableHead>
                <TableHead className="hidden xl:table-cell">Telefone 3</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((student) => {
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
                      variant="outline"
                      className={
                        {
                          Ativo: "bg-success/10 text-success border-success/20 hover:bg-success/20",
                          Transferido: "bg-amber-100 text-amber-700 border-amber-200",
                          Desistente: "bg-destructive/10 text-destructive border-destructive/20",
                        }[student.status || student.situacao || ""]
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
                    {student.telefone_principal === 2 ? student.telefone2 : student.telefone_principal === 3 ? student.telefone3 : student.telefone1 || "—"}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Mais ações para ${student.nome}`}>
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
              {filteredAndSorted.length === 0 && (
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
            <DialogDescription className="sr-only">
              Escolha a série para gerar a lista em PDF.
            </DialogDescription>
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

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => { if (!open) setStudentToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. <strong>{studentToDelete?.nome}</strong> e todas as matrículas, histórico e dados vinculados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
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
