import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDocxFiles, ParsedStudent } from "@/lib/docxParser";
import { generateModelDocx, RECOGNIZED_FIELDS } from "@/lib/docxModel";
import { alunosApi, matriculasApi } from "@/lib/api";
import { toast } from "sonner";
import { GRADES, SHIFTS } from "@/lib/constants";

const grades = GRADES;
const shifts = SHIFTS;

interface ImportResult {
  imported: number;
  errors: string[];
}

export default function ImportStudents() {
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const docxFiles = Array.from(files).filter(
      (f) =>
        f.name.endsWith(".docx") ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (docxFiles.length === 0) {
      toast.error("Nenhum arquivo .docx válido encontrado");
      return;
    }

    setIsProcessing(true);
    setImportResult(null);

    try {
      const result = await parseDocxFiles(docxFiles);
      setStudents((prev) => [...prev, ...result.students]);
      setParseErrors(result.errors);

      if (result.students.length > 0) {
        toast.success(
          `${result.students.length} aluno(s) encontrado(s) com sucesso!`
        );
      }
      if (result.errors.length > 0) {
        toast.warning(
          `${result.errors.length} arquivo(s) tiveram problemas na leitura`
        );
      }
    } catch {
      toast.error("Não foi possível processar os arquivos. Verifique se são .docx válidos.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeStudent = (idx: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
  };

  const prepareStudentData = (student: ParsedStudent): Record<string, unknown> => {
    const { matriculas, _sourceFile: _source, ...parsedData } = student;

    const primeiroAno = matriculas?.[0];
    if (primeiroAno?.serie) parsedData.serie = primeiroAno.serie;
    if (primeiroAno?.turno) parsedData.turno = primeiroAno.turno;
    if (primeiroAno?.ano) parsedData.anodamatricula = primeiroAno.ano;
    if (primeiroAno?.datamatricula) parsedData.datadamatricula = primeiroAno.datamatricula;

    if (!parsedData.serie) parsedData.serie = "1º Ano";
    if (!parsedData.turno) parsedData.turno = "Manhã";
    if (!parsedData.status) parsedData.status = "Ativo";
    if (!parsedData.situacao) parsedData.situacao = "Ativo";
    if (!parsedData.ano_letivo) parsedData.ano_letivo = new Date().getFullYear();

    const { cor, datadovencimento, ...restData } = parsedData;
    const alunoData: Record<string, unknown> = { ...restData };
    if (cor) alunoData["raça"] = cor;
    if (datadovencimento) alunoData.datadovencimento = Number(datadovencimento);

    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    for (const key of ["datanascimento", "datadamatricula", "datanascimentoresponsavelfin"]) {
      const val = String(alunoData[key] || "");
      if (val && datePattern.test(val)) {
        const [d, m, y] = val.split("/");
        alunoData[key] = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } else if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        console.warn(`Campo ${key} descartado (valor inválido: "${val}")`);
        delete alunoData[key];
      }
    }

    return alunoData;
  };

  const BATCH_SIZE = 5;

  const importMutation = useMutation({
    mutationFn: async (toImport: ParsedStudent[]) => {
      let imported = 0;
      const errors: string[] = [];
      const now = new Date().toISOString().split("T")[0];
      const currentYear = new Date().getFullYear();

      for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
        const batch = toImport.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (student) => {
            const alunoData = prepareStudentData(student);
            const created = await alunosApi.create(alunoData as Partial<Aluno>);

            try {
              await matriculasApi.create({
                aluno_id: created.id,
                serie: alunoData.serie as string || "1º Ano",
                turno: alunoData.turno as string || "Manhã",
                ano_letivo: currentYear,
                data_matricula: now,
                status: "Ativo",
              });
            } catch {
              // Matrícula é opcional
            }

            return created;
          })
        );

        for (let j = 0; j < results.length; j++) {
          if (results[j].status === "fulfilled") {
            imported++;
          } else {
            console.error("Erro ao importar aluno:", results[j].reason);
            errors.push(batch[j].nome || "Nome desconhecido");
          }
        }
      }

      return { imported, errors };
    },
    onSuccess: (result) => {
      setImportResult(result);
      if (result.imported > 0) {
        toast.success(`${result.imported} aluno(s) importado(s) com sucesso!`);
        setStudents([]);
        setParseErrors([]);
      }
      if (result.errors.length > 0) {
        toast.error(
          `${result.errors.length} aluno(s) falharam: ${result.errors.join(", ")}`
        );
      }
    },
    onError: () => {
      toast.error("Erro inesperado na importação");
    },
  });

  const handleImport = () => {
    if (students.length === 0) return;
    importMutation.mutate(students);
  };

  const handleDownloadModel = async () => {
    try {
      const blob = await generateModelDocx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modelo-ficha-aluno.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Modelo baixado com sucesso");
    } catch {
      toast.error("Erro ao gerar modelo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Importar Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Importe fichas de aluno a partir de arquivos .docx
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadModel}>
          <Download className="h-4 w-4 mr-2" />
          Baixar modelo .docx
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium">Campos reconhecidos no .docx</p>
            <p className="text-xs text-muted-foreground">
              O sistema identifica automaticamente os seguintes campos. Campos não reconhecidos são ignorados sem erro.
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer text-primary hover:underline">
                Ver lista completa de campos
              </summary>
              <ul className="mt-2 space-y-1 text-muted-foreground pl-4 list-disc">
                {RECOGNIZED_FIELDS.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </Card>

      <Card
        className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center py-12 px-6">
          {isProcessing ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <p className="mt-3 text-sm font-medium">
            {isProcessing
              ? "Processando arquivos..."
              : "Arraste fichas .docx aqui ou clique para selecionar"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Aceita múltiplos arquivos .docx de fichas de aluno
          </p>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {parseErrors.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Arquivos com problemas:
              </p>
              <ul className="mt-1 text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {students.length > 0 && (
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Alunos encontrados
                </h2>
                <p className="text-sm text-muted-foreground">
                  {students.length} aluno(s) prontos para importação
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStudents([]);
                    setParseErrors([]);
                    setImportResult(null);
                  }}
                >
                  Limpar tudo
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importar {students.length} aluno(s)
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Pai</TableHead>
                  <TableHead>Mãe</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {s.nome}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {s.datanascimento || "-"}
                    </TableCell>
                    <TableCell>
                      {s.matriculas?.[0]?.serie ? (
                        <Badge variant="secondary">
                          {s.matriculas[0].serie}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.matriculas?.[0]?.turno || "-"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">
                      {s.nomedopai || "-"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">
                      {s.nomedamae || "-"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">
                      {s.responsavelfinanceiro || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeStudent(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {importResult && importResult.imported > 0 && (
        <Card className="p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Importação concluída!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {importResult.imported} aluno(s) importado(s) com sucesso.
                {importResult.errors.length > 0 &&
                  ` ${importResult.errors.length} falharam.`}
              </p>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
