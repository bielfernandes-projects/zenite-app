import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { students, documentTypes } from "@/data/mockData";
import type { Student } from "@/data/mockData";
import { toast } from "sonner";

export default function Documents() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [docType, setDocType] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!selectedStudent || !docType) {
      toast.error("Selecione um aluno e o tipo de documento.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Documento gerado com sucesso!");
    }, 2000);
  };

  const docLabel = documentTypes.find((d) => d.value === docType)?.label;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Documentos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Gerar Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-2 block">Aluno</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start font-normal rounded-lg"
                  >
                    {selectedStudent
                      ? selectedStudent.name
                      : "Buscar aluno..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar aluno..." />
                    <CommandList>
                      <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                      <CommandGroup>
                        {students
                          .filter((s) => s.status === "Ativo")
                          .map((s) => (
                            <CommandItem
                              key={s.id}
                              onSelect={() => {
                                setSelectedStudent(s);
                                setComboOpen(false);
                              }}
                            >
                              {s.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="mb-2 block">Tipo de Documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Gerar e Baixar PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent && docType ? (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Dados que serão usados:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Documento</span>
                      <span className="font-medium text-foreground">{docLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome</span>
                      <span className="font-medium text-foreground">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Série</span>
                      <span className="font-medium text-foreground">{selectedStudent.grade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Turno</span>
                      <span className="font-medium text-foreground">{selectedStudent.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsável</span>
                      <span className="font-medium text-foreground">{selectedStudent.guardian}</span>
                    </div>
                    {docType === "recibo" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mensalidade</span>
                        <span className="font-medium text-foreground">
                          R$ {selectedStudent.monthlyFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Selecione um aluno e o tipo de documento para ver a prévia.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
