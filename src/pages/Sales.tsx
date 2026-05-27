import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Loader2, Search, User, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { alunosApi, produtosApi, recibosApi, Aluno, AlunoComMatriculas, getMatriculaAtiva, VendaItem } from "@/lib/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Quantities {
  [produtoId: string]: number;
}

export default function Sales() {
  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [quantities, setQuantities] = useState<Quantities>({});
  const [loading, setLoading] = useState(false);

  const { data: alunosData } = useQuery({
    queryKey: ["alunos", "sales"],
    queryFn: () => alunosApi.list({ limit: 500, withMatriculas: true }),
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos", "sales"],
    queryFn: () => produtosApi.list(),
  });

  useEffect(() => {
    const initialQuantities: Quantities = {};
    produtos.forEach((p) => {
      initialQuantities[p.id] = 0;
    });
    setQuantities(initialQuantities);
  }, [produtos]);

  const alunosAtivos = ((alunosData?.items || []) as AlunoComMatriculas[]).filter((s) => s.situacao === "Ativo");

  const serieDoAluno = useMemo(() => {
    if (!selectedStudent) return null;
    const matriculaAtiva = getMatriculaAtiva(selectedStudent as AlunoComMatriculas);
    return matriculaAtiva?.serie || selectedStudent.serie;
  }, [selectedStudent]);

  const turnoDoAluno = useMemo(() => {
    if (!selectedStudent) return null;
    const matriculaAtiva = getMatriculaAtiva(selectedStudent as AlunoComMatriculas);
    return matriculaAtiva?.turno || selectedStudent.turno;
  }, [selectedStudent]);

  const produtosVisiveis = useMemo(() => {
    let list = produtos.filter((p) => p.status === "Ativo");
    if (serieDoAluno) {
      list = list.filter(
        (p) =>
          !p.serie_aplicavel ||
          p.serie_aplicavel === "" ||
          p.serie_aplicavel.toLowerCase() === "nenhuma" ||
          p.serie_aplicavel === serieDoAluno
      );
    }
    return list;
  }, [produtos, serieDoAluno]);

  const setQuantidade = useCallback((id: string, qtd: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, qtd),
    }));
  }, []);

  const itensComprados = useMemo((): VendaItem[] => {
    return produtosVisiveis
      .filter((p) => quantities[p.id] > 0)
      .map((p) => {
        const subtotal = Number((p.preco * quantities[p.id]).toFixed(2));
        return {
          id_produto: p.id,
          nome: p.nome,
          preco_unitario: p.preco,
          quantidade: quantities[p.id],
          subtotal,
        };
      });
  }, [produtosVisiveis, quantities]);

  const total = useMemo(() => {
    const soma = itensComprados.reduce((acc, item) => {
      return acc + item.subtotal;
    }, 0);
    return Number(soma.toFixed(2));
  }, [itensComprados]);

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const resetForm = useCallback(() => {
    const reset: Quantities = {};
    produtos.forEach((p) => {
      reset[p.id] = 0;
    });
    setQuantities(reset);
  }, [produtos]);

  const generatePDF = useCallback(
    async (aluno: Aluno, itens: VendaItem[], valorTotal: number) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = margin;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("ESCOLA ZÊNITE", pageWidth / 2, y, { align: "center" });
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Ensino Fundamental - 6º ao 9º Ano", pageWidth / 2, y, { align: "center" });
      y += 6;
      doc.text(`CNPJ: 00.000.000/0001-00`, pageWidth / 2, y, { align: "center" });
      y += 14;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RECIBO DE PAGAMENTO", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dataEmissao = new Date().toLocaleDateString("pt-BR");
      const horaEmissao = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`Data da Emissão: ${dataEmissao} às ${horaEmissao}`, pageWidth - margin, y, {
        align: "right",
      });
      y += 12;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO ALUNO", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${aluno.nome}`, margin, y);
      y += 6;
      const matAtiva = getMatriculaAtiva(aluno as AlunoComMatriculas);
      doc.text(`Série: ${matAtiva?.serie || aluno.serie}`, margin, y);
      y += 6;
      doc.text(`Turno: ${matAtiva?.turno || aluno.turno}`, margin, y);
      y += 12;

      const tableColumn = ["Qtd", "Descrição", "Vlr Unitário", "Subtotal"];
      const tableRows = itens.map((item) => [
        String(item.quantidade),
        item.nome,
        formatBRL(item.preco_unitario),
        formatBRL(item.subtotal),
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: y,
        margin: { horizontal: margin },
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [21, 43, 33], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 245, 242] },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: 40, halign: "right" },
        },
      });

      const docWithTable = doc as jsPDF & { lastAutoTable: { finalY: number } };
      const finalY = docWithTable.lastAutoTable.finalY + 12;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Pago: ${formatBRL(valorTotal)}`, pageWidth - margin, finalY, {
        align: "right",
      });
      y = finalY + 20;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const linhaY = pageWidth - 40;
      doc.line(margin + 30, y, linhaY, y);
      y += 8;
      doc.text("Assinatura da Secretaria", pageWidth / 2, y, { align: "center" });

      return doc.output("blob");
    },
    []
  );

  const handleFinalizarVenda = async () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno.");
      return;
    }
    if (itensComprados.length === 0 || total <= 0) {
      toast.error("Carrinho vazio. Adicione produtos para finalizar a venda.");
      return;
    }

    setLoading(true);

    try {
      await recibosApi.create({
        aluno_id: selectedStudent.id,
        itens: itensComprados,
        valor_total: total,
      });

      const blob = await generatePDF(selectedStudent, itensComprados, total);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const dataStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const nomeArquivo = `Recibo_${selectedStudent.nome.replace(/\s+/g, "_")}_${dataStr}.pdf`;
      a.download = nomeArquivo;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Venda finalizada! Recibo gerado com sucesso.");
      resetForm();
    } catch {
      toast.error("Erro ao finalizar venda. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaColor = (cat: string) => {
    const colors: Record<string, string> = {
      Fardamento: "bg-blue-100 text-blue-700 border-blue-200",
      "Material Didático": "bg-amber-100 text-amber-700 border-amber-200",
      Taxa: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[cat] || "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Vendas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Selecione o Aluno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start font-normal rounded-lg h-10"
                  >
                    <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedStudent
                      ? `${selectedStudent.nome} - ${serieDoAluno || selectedStudent.serie}`
                      : "Buscar aluno..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar aluno por nome..." />
                    <CommandList>
                      <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                      <CommandGroup>
                        {alunosAtivos.map((s) => (
                          <CommandItem
                            key={s.id}
                            onSelect={() => {
                              setSelectedStudent(s);
                              resetForm();
                              setComboOpen(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium">{s.nome}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {getMatriculaAtiva(s as AlunoComMatriculas)?.serie || s.serie} - {getMatriculaAtiva(s as AlunoComMatriculas)?.turno || s.turno}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedStudent && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {serieDoAluno || selectedStudent.serie}
                  </Badge>
                  <span>{turnoDoAluno || selectedStudent.turno}</span>
                  <span className="text-xs text-muted-foreground/60">•</span>
                  <span className="text-xs">
                    Resp.: {selectedStudent.responsavelfinanceiro || "—"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                Produtos Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedStudent ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Selecione um aluno para ver os produtos disponíveis.
                </div>
              ) : (
                <ScrollArea className="h-[380px] pr-4">
                  <div className="space-y-2">
                    {produtosVisiveis.map((produto) => {
                      const qtd = quantities[produto.id] || 0;
                      const temNoCarrinho = qtd > 0;

                      return (
                        <div
                          key={produto.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            temNoCarrinho
                              ? "border-emerald-300 bg-emerald-50/50"
                              : "border-transparent hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground truncate">
                                {produto.nome}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${getCategoriaColor(
                                  produto.categoria
                                )}`}
                              >
                                {produto.categoria}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {produto.serie_aplicavel
                                ? `Série: ${produto.serie_aplicavel}`
                                : "Todas as séries"}
                            </span>
                          </div>

                          <div className="text-right mr-2">
                            <span className="font-semibold text-sm text-foreground">
                              {formatBRL(produto.preco)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="w-8 h-8 rounded-md border border-input text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
                              onClick={() => setQuantidade(produto.id, qtd - 1)}
                              disabled={qtd === 0}
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{qtd}</span>
                            <button
                              type="button"
                              className="w-8 h-8 rounded-md border border-input text-sm font-medium hover:bg-muted transition-colors"
                              onClick={() => setQuantidade(produto.id, qtd + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {produtosVisiveis.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum produto disponível para esta série.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itensComprados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <ShoppingCart className="h-8 w-8 mb-2 text-muted-foreground/40" />
                  Carrinho vazio
                </div>
              ) : (
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Item</TableHead>
                        <TableHead className="text-xs text-right">Qtd</TableHead>
                        <TableHead className="text-xs text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensComprados.map((item) => (
                        <TableRow key={item.id_produto}>
                          <TableCell className="text-sm py-2">{item.nome}</TableCell>
                          <TableCell className="text-sm text-right py-2">
                            {item.quantidade}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium py-2">
                            {formatBRL(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total da Compra</span>
                <span className="text-xl font-bold text-emerald-700">
                  {formatBRL(total)}
                </span>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleFinalizarVenda}
                disabled={loading || total <= 0 || !selectedStudent}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Finalizar Venda / Gerar Recibo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
