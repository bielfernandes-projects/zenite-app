import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileDown, Loader2, Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  alunosApi,
  templatesApi,
  Aluno,
  TemplateDocumento,
  substituirTags,
  gerarDocumentoPDF,
  getMatriculaAtiva,
  AlunoComMatriculas,
} from "@/lib/api";

const availableTags = [
  { label: "Nome do Aluno", tag: "{{nome_aluno}}" },
  { label: "Data de Nascimento", tag: "{{data_nascimento}}" },
  { label: "Série", tag: "{{serie_aluno}}" },
  { label: "Turno", tag: "{{turno_aluno}}" },
  { label: "Nome do Pai", tag: "{{nome_pai}}" },
  { label: "Nome da Mãe", tag: "{{nome_mae}}" },
  { label: "Resp. Fin.", tag: "{{responsavel}}" },
  { label: "CPF do Resp. Fin.", tag: "{{cpf_responsavel}}" },
  { label: "Ano Letivo", tag: "{{ano_letivo}}" },
  { label: "Data Atual", tag: "{{data_atual}}" },
];

export default function Documents() {
  const queryClient = useQueryClient();

  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDocumento | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDocumento | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [status, setStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [tituloImpresso, setTituloImpresso] = useState("");
  const [requerAssinatura, setRequerAssinatura] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: alunos } = useQuery({
    queryKey: ["alunos", "documentos"],
    queryFn: () => alunosApi.list({ limit: 500, withMatriculas: true }),
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["templates-documentos"],
    queryFn: () => templatesApi.list(),
  });

  const { data: templatesAtivos = [] } = useQuery({
    queryKey: ["templates-documentos", "ativos"],
    queryFn: () => templatesApi.listAtivos(),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        status,
        titulo_impresso: tituloImpresso.trim() || "DECLARAÇÃO",
        requer_assinatura: Boolean(requerAssinatura),
      };
      return templatesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-documentos"] });
      queryClient.refetchQueries({ queryKey: ["templates-documentos"] });
      toast.success("Template criado com sucesso!");
      handleCloseTemplateSheet();
    },
    onError: (err) => {
      console.error("Erro ao criar template:", err);
      toast.error("Não foi possível salvar o template. Verifique o conteúdo e tente novamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        status,
        titulo_impresso: tituloImpresso.trim() || "DECLARAÇÃO",
        requer_assinatura: Boolean(requerAssinatura),
      };
      return templatesApi.update(editingTemplate!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-documentos"] });
      queryClient.refetchQueries({ queryKey: ["templates-documentos"] });
      toast.success("Template atualizado com sucesso!");
      handleCloseTemplateSheet();
    },
    onError: (err) => {
      console.error("Erro ao atualizar template:", err);
      toast.error("Não foi possível atualizar o template. Tente novamente em alguns instantes.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-documentos"] });
      toast.success("Template excluído com sucesso!");
    },
    onError: (err) => {
      console.error("Erro ao excluir template:", err);
      toast.error("Não foi possível excluir o template. Tente novamente em alguns instantes.");
    },
  });

  const alunosAtivos = ((alunos?.items || []) as AlunoComMatriculas[]).filter((s) => s.situacao === "Ativo");

  const handleGenerate = async () => {
    if (!selectedStudent || !selectedTemplate) {
      toast.error("Selecione um aluno e um template.");
      return;
    }
    setLoading(true);

    try {
      const matriculaAtiva = getMatriculaAtiva(selectedStudent as AlunoComMatriculas);
      const corpo = substituirTags(selectedTemplate.conteudo, selectedStudent, matriculaAtiva);
      const blob = await gerarDocumentoPDF(selectedTemplate.titulo, corpo, selectedTemplate.titulo_impresso, selectedTemplate.requer_assinatura);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate.titulo.replace(/\s+/g, "_")}_${selectedStudent.nome.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Documento gerado com sucesso!");
    } catch {
      toast.error("Não foi possível gerar o PDF. Verifique se o template tem conteúdo e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTemplateSheet = () => {
    setTemplateSheetOpen(false);
    setEditingTemplate(null);
    setTitulo("");
    setConteudo("");
    setStatus("Ativo");
    setTituloImpresso("");
    setRequerAssinatura(true);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTitulo("");
    setConteudo("");
    setStatus("Ativo");
    setTituloImpresso("");
    setRequerAssinatura(true);
    setTemplateSheetOpen(true);
  };

  const handleOpenEdit = (template: TemplateDocumento) => {
    setEditingTemplate(template);
    setTitulo(template.titulo);
    setConteudo(template.conteudo);
    setStatus(template.status);
    setTituloImpresso(template.titulo_impresso || "DECLARAÇÃO");
    setRequerAssinatura(template.requer_assinatura ?? true);
    setTemplateSheetOpen(true);
  };

  const injectTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setConteudo((prev) => prev + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = conteudo.slice(0, start) + tag + conteudo.slice(end);
    setConteudo(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + tag.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const handleSaveTemplate = () => {
    if (!titulo.trim()) {
      toast.error("Informe o título do template.");
      return;
    }
    if (!conteudo.trim()) {
      toast.error("Informe o conteúdo do template.");
      return;
    }
    if (editingTemplate) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este template?")) {
      deleteMutation.mutate(id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Documentos</h2>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="generate">Gerar Documento</TabsTrigger>
          <TabsTrigger value="templates">Modelos de Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
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
                          ? selectedStudent.nome
                          : "Buscar aluno..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar aluno..." />
                        <CommandList>
                          <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                          <CommandGroup>
                            {alunosAtivos.map((s) => (
                              <CommandItem
                                key={s.id}
                                onSelect={() => {
                                  setSelectedStudent(s);
                                  setComboOpen(false);
                                }}
                              >
                                {s.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="mb-2 block">Modelo de Documento</Label>
                  {templatesAtivos.length === 0 ? (
                    <Alert variant="default" className="bg-muted/50">
                      <AlertDescription className="text-sm text-muted-foreground">
                        Nenhum template ativo encontrado. Crie templates na aba &ldquo;Modelos de Documentos&rdquo;.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={selectedTemplate?.id || ""}
                      onValueChange={(v) => {
                        const t = templatesAtivos.find((t) => t.id === v);
                        setSelectedTemplate(t || null);
                      }}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templatesAtivos.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={loading || !selectedStudent || !selectedTemplate}
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
                {selectedStudent && selectedTemplate ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-3">
                        Dados que serão usados:
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template</span>
                          <span className="font-medium text-foreground">{selectedTemplate.titulo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome</span>
                          <span className="font-medium text-foreground">{selectedStudent.nome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Série</span>
                          <span className="font-medium text-foreground">{selectedStudent.serie}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Turno</span>
                          <span className="font-medium text-foreground">{selectedStudent.turno}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Responsável</span>
                          <span className="font-medium text-foreground">{selectedStudent.responsavelfinanceiro || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    Selecione um aluno e um template para ver a prévia.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Modelos de Documentos
              </CardTitle>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Novo Template
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhum template cadastrado. Clique em "Novo Template" para criar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Título</TableHead>
                      <TableHead>Título Impresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Conteúdo</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.titulo}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{t.titulo_impresso || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              t.status === "Ativo"
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                          {t.conteudo}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={templateSheetOpen} onOpenChange={(open) => !open && handleCloseTemplateSheet()}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</SheetTitle>
            <SheetDescription>
              Use as tags clicáveis abaixo para inserir dados dinâmicos no documento.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Declaração de Vínculo"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: "Ativo" | "Inativo") => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo_impresso">Título Impresso no Documento</Label>
              <Input
                id="titulo_impresso"
                value={tituloImpresso}
                onChange={(e) => setTituloImpresso(e.target.value)}
                placeholder="Ex: DECLARAÇÃO DE MATRÍCULA"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tags className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Tags Disponíveis</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((t) => (
                  <Badge
                    key={t.tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => injectTag(t.tag)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use <code className="text-foreground/70">&lt;b&gt;texto&lt;/b&gt;</code> para <b>negrito</b>,{" "}
                <code className="text-foreground/70">&lt;i&gt;texto&lt;/i&gt;</code> para <i>itálico</i> e{" "}
                <code className="text-foreground/70">&lt;u&gt;texto&lt;/u&gt;</code> para <u>sublinhado</u>.
                As tags funcionam combinadas e podem ser usadas em qualquer parte do texto.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo do Documento</Label>
              <Textarea
                ref={textareaRef}
                id="conteudo"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Escreva o texto do documento usando as tags acima..."
                className="min-h-[300px] font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="requer_assinatura"
                checked={requerAssinatura}
                onCheckedChange={setRequerAssinatura}
              />
              <Label htmlFor="requer_assinatura" className="text-sm font-normal leading-none cursor-pointer">
                Incluir Assinatura da Direção no rodapé deste documento
              </Label>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={handleCloseTemplateSheet}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
