import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { alunosApi, Aluno } from "@/lib/api";
import { toast } from "sonner";

const grades = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"];
const shifts = ["Manhã", "Tarde", "Integral"] as const;

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Aluno | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["alunos", search, gradeFilter, shiftFilter],
    queryFn: () => alunosApi.list({ 
      search: search || undefined,
      serie: gradeFilter !== "all" ? gradeFilter : undefined
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

  const filtered = (data?.items || []).filter((s) => {
    const matchShift = shiftFilter === "all" || s.turno === shiftFilter;
    return matchShift;
  });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleSave = () => {
    setEditingStudent(null);
    queryClient.invalidateQueries({ queryKey: ["alunos"] });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Alunos</h2>
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

      <Card className="shadow-sm rounded-xl">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-lg">
              <SelectValue placeholder="Série" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-lg">
              <SelectValue placeholder="Turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {shifts.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow 
                  key={student.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/alunos/${student.id}`)}
                >
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(student.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {student.nome}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.situacao === "Ativo" ? "default" : "secondary"}
                      className={
                        student.situacao === "Ativo"
                          ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {student.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.serie}</TableCell>
                  <TableCell className="text-muted-foreground">{student.turno}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {student.responsavelfinanceiro || student.nomedamae || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {student.telefone1}
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
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum aluno encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

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
