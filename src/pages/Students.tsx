import { useState, useMemo } from "react";
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { students as initialStudents, grades, shifts } from "@/data/mockData";
import type { Student } from "@/data/mockData";
import { toast } from "sonner";

export default function Students() {
  const [data, setData] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    return data.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === "all" || s.grade === gradeFilter;
      const matchShift = shiftFilter === "all" || s.shift === shiftFilter;
      return matchSearch && matchGrade && matchShift;
    });
  }, [data, search, gradeFilter, shiftFilter]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleSave = (formData: Record<string, unknown>) => {
    if (editingStudent) {
      setData((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id ? { ...s, ...formData } as Student : s
        )
      );
    } else {
      const newStudent: Student = {
        ...(formData as Omit<Student, "id" | "photo" | "status" | "guardian">),
        id: String(Date.now()),
        photo: "",
        status: "Ativo",
        guardian: (formData.motherName as string) || "",
      } as Student;
      setData((prev) => [...prev, newStudent]);
    }
    setEditingStudent(null);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((s) => s.id !== id));
    toast.success("Aluno removido com sucesso!");
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
              <TableRow key={student.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {student.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={student.status === "Ativo" ? "default" : "secondary"}
                    className={
                      student.status === "Ativo"
                        ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{student.grade}</TableCell>
                <TableCell className="text-muted-foreground">{student.shift}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {student.guardian}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {student.phone}
                </TableCell>
                <TableCell>
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
      </Card>

      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editingStudent}
        onSave={handleSave}
      />
    </div>
  );
}
