import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "sonner";
import { grades, shifts } from "@/data/mockData";
import type { Student } from "@/data/mockData";

const studentSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres").max(100),
  birthDate: z.string().min(1, "Data obrigatória"),
  grade: z.string().min(1, "Selecione a série"),
  shift: z.string().min(1, "Selecione o turno"),
  monthlyFee: z.coerce.number().min(0, "Valor inválido"),
  dueDay: z.coerce.number().min(1).max(31, "Dia inválido"),
  motherName: z.string().max(100).optional(),
  motherCpf: z.string().max(14).optional(),
  fatherName: z.string().max(100).optional(),
  fatherCpf: z.string().max(14).optional(),
  financialGuardian: z.string().max(100).optional(),
  financialGuardianCpf: z.string().max(14).optional(),
  zip: z.string().max(9).optional(),
  street: z.string().max(200).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(15).optional(),
  phone2: z.string().max(15).optional(),
  phone3: z.string().max(15).optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSave: (data: StudentFormData) => void;
}

export function StudentForm({ open, onOpenChange, student, onSave }: StudentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          name: student.name,
          birthDate: student.birthDate,
          grade: student.grade,
          shift: student.shift,
          monthlyFee: student.monthlyFee,
          dueDay: student.dueDay,
          motherName: student.motherName,
          motherCpf: student.motherCpf,
          fatherName: student.fatherName,
          fatherCpf: student.fatherCpf,
          financialGuardian: student.financialGuardian,
          financialGuardianCpf: student.financialGuardianCpf,
          zip: student.zip,
          street: student.street,
          neighborhood: student.neighborhood,
          city: student.city,
          phone: student.phone,
          phone2: student.phone2,
          phone3: student.phone3,
        }
      : {},
  });

  const onSubmit = (data: StudentFormData) => {
    onSave(data);
    toast.success(
      student ? "Dados atualizados com sucesso!" : "Matrícula realizada com sucesso!"
    );
    reset();
    onOpenChange(false);
  };

  const fieldClass = "rounded-lg border-input";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {student ? "Editar Aluno" : "Novo Aluno"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <Tabs defaultValue="school" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="school">Dados Escolares</TabsTrigger>
              <TabsTrigger value="guardians">Responsáveis</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
            </TabsList>

            <TabsContent value="school" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" {...register("name")} className={fieldClass} />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" {...register("birthDate")} className={fieldClass} />
                {errors.birthDate && (
                  <p className="text-xs text-destructive mt-1">{errors.birthDate.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Série</Label>
                  <Select
                    defaultValue={student?.grade}
                    onValueChange={(v) => setValue("grade", v)}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.grade && (
                    <p className="text-xs text-destructive mt-1">{errors.grade.message}</p>
                  )}
                </div>
                <div>
                  <Label>Turno</Label>
                  <Select
                    defaultValue={student?.shift}
                    onValueChange={(v) => setValue("shift", v)}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shift && (
                    <p className="text-xs text-destructive mt-1">{errors.shift.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="monthlyFee">Mensalidade (R$)</Label>
                  <Input id="monthlyFee" type="number" {...register("monthlyFee")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="dueDay">Vencimento (Dia)</Label>
                  <Input id="dueDay" type="number" min={1} max={31} {...register("dueDay")} className={fieldClass} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="guardians" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="motherName">Nome da Mãe</Label>
                  <Input id="motherName" {...register("motherName")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="motherCpf">CPF da Mãe</Label>
                  <Input id="motherCpf" {...register("motherCpf")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fatherName">Nome do Pai</Label>
                  <Input id="fatherName" {...register("fatherName")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="fatherCpf">CPF do Pai</Label>
                  <Input id="fatherCpf" {...register("fatherCpf")} className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="financialGuardian">Resp. Financeiro</Label>
                  <Input id="financialGuardian" {...register("financialGuardian")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="financialGuardianCpf">CPF Resp. Financeiro</Label>
                  <Input id="financialGuardianCpf" {...register("financialGuardianCpf")} className={fieldClass} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="zip">CEP</Label>
                  <Input id="zip" {...register("zip")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...register("city")} className={fieldClass} />
                </div>
              </div>
              <div>
                <Label htmlFor="street">Rua</Label>
                <Input id="street" {...register("street")} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" {...register("neighborhood")} className={fieldClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="phone">Telefone 1</Label>
                  <Input id="phone" {...register("phone")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="phone2">Telefone 2</Label>
                  <Input id="phone2" {...register("phone2")} className={fieldClass} />
                </div>
                <div>
                  <Label htmlFor="phone3">Telefone 3</Label>
                  <Input id="phone3" {...register("phone3")} className={fieldClass} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
