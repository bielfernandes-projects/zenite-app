import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Loader2, Search, User, ShoppingCart, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { alunosApi, produtosApi, recibosApi, Aluno, Produto, ReciboItem } from "@/lib/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface SelectedItem extends ReciboItem {
  produtoId: string;
}

export default function Recibos() {
  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const { data: alunosData } = useQuery({
    queryKey: ["alunos", "recibos"],
    queryFn: () => alunosApi.list({ limit: 500 }),
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos", "recibos"],
    queryFn: () => produtosApi.list(),
  });

  const alunosAtivos = (alunosData?.items || []).filter((s) => s.situacao === "Ativo");

  const produtosVisiveis = useMemo(() => {
    let list = produtos.filter((p) => p.status === "Ativo");
    if (selectedStudent?.serie) {
      list = list.filter(
        (p) => !p.serie_aplicavel || p.serie_aplicavel === selectedStudent.serie
      );
    }
    return list;
  }, [produtos, selectedStudent]);

  const toggleProduto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setQuantidade = (id: string, qtd: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, qtd) }));
  };

  const selectedItems = useMemo((): SelectedItem[] => {
    return Array.from(selectedIds)
      .map((id) => {
        const p = produtos.find((pr) => pr.id === id);
        if (!p) return null;
        return {
          produtoId: p.id,
          nome: p.nome,
          preco: p.preco,
          quantidade: quantities[id] || 1,
        };
      })
      .filter((item): item is SelectedItem => item !== null);
  }, [selectedIds, produtos, quantities]);

  const total = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      return acc + item.preco * item.quantidade;
    }, 0);
  }, [selectedItems]);

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const resetForm = () => {
    setSelectedIds(new Set());
    setQuantities({});
  };

  const generatePDF = useCallback(
    async (aluno: Aluno, itens: SelectedItem[], valorTotal: number) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = margin;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Zênite - Sistema de Gestão Escolar", pageWidth / 2, y, { align: "center" });
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Ensino Fundamental - 6º ao 9º Ano", pageWidth / 2, y, { align: "center" });
      y += 6;
      doc.text(`CNPJ: 00.000.000/0001-00`, pageWidth / 2, y, { align: "center" });
      y += 12;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RECIBO DE PAGAMENTO", pageWidth / 2, y, { align: "center" });
      y += 12;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Aluno: ${aluno.nome}`, margin, y);
      y += 6;
      doc.text(`Série: ${aluno.serie} - Turno: ${aluno.turno}`, margin, y);
      y += 6;
      doc.text(`Responsável Financeiro: ${aluno.responsavelfinanceiro || "—"}`, margin, y);
      y += 10;

      const tableColumn = ["Item", "Quantidade", "Valor Unitário", "Subtotal"];
      const tableRows = itens.map((item) => [
        item.nome,
        String(item.quantidade),
        formatBRL(item.preco),
        formatBRL(item.preco * item.quantidade),
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: y,
        margin: { horizontal: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [21, 43, 33], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 245, 242] },
      });

      const docWithTable = doc as jsPDF & { lastAutoTable: { finalY: number } };
      const finalY = docWithTable.lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Total: ${formatBRL(valorTotal)}`, pageWidth - margin, finalY, { align: "right" });
      doc.setDrawColor(21, 43, 33);
      doc.setLineWidth(0.5);
      doc.line(margin, finalY + 3, pageWidth - margin, finalY + 3);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(
        `Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        margin,
        finalY + 12
      );

      return doc.output("blob");
    },
    []
  );

  const handleGenerate = async () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno.");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Selecione ao menos um produto.");
      return;
    }
    setLoading(true);

    try {
      const valorTotal = Math.round(total * 100) / 100;
      const itensSnapshot: ReciboItem[] = selectedItems.map(({ produtoId: _id, ...rest }) => rest);

      await recibosApi.create({
        aluno_id: selectedStudent.id,
        itens: itensSnapshot,
        valor_total: valorTotal,
      });

      const blob = await generatePDF(selectedStudent, selectedItems, valorTotal);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo_${selectedStudent.nome.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Recibo gerado com sucesso!");
      resetForm();
    } catch {
      toast.error("Erro ao gerar recibo. Tente novamente.");
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
      <h2 className="text-2xl font-semibold text-foreground">Emissão de Recibos</h2>

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
                      ? `${selectedStudent.nome} - ${selectedStudent.serie}`
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
                              setSelectedIds(new Set());
                              setQuantities({});
                              setComboOpen(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium">{s.nome}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {s.serie} - {s.turno}
                              </span>
                            </div>
                            {selectedStudent?.id === s.id && (
                              <Check className="h-4 w-4 text-emerald-600" />
                            )}
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
                    {selectedStudent.serie}
                  </Badge>
                  <span>{selectedStudent.turno}</span>
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
                <ScrollArea className="h-[320px] pr-4">
                  <div className="space-y-1">
                    {produtosVisiveis.map((produto) => (
                      <div
                        key={produto.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedIds.has(produto.id)
                            ? "border-emerald-300 bg-emerald-50/50"
                            : "border-transparent hover:bg-muted/30"
                        }`}
                        onClick={() => toggleProduto(produto.id)}
                      >
                        <Checkbox
                          checked={selectedIds.has(produto.id)}
                          onCheckedChange={() => toggleProduto(produto.id)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground truncate">
                              {produto.nome}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${getCategoriaColor(produto.categoria)}`}
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
                        <div className="text-right">
                          <span className="font-semibold text-sm text-foreground">
                            {formatBRL(produto.preco)}
                          </span>
                        </div>
                        {selectedIds.has(produto.id) && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              type="button"
                              className="w-7 h-7 rounded-md border border-input text-xs font-medium hover:bg-muted transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuantidade(produto.id, (quantities[produto.id] || 1) - 1);
                              }}
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {quantities[produto.id] || 1}
                            </span>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-md border border-input text-xs font-medium hover:bg-muted transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuantidade(produto.id, (quantities[produto.id] || 1) + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
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
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <ShoppingCart className="h-8 w-8 mb-2 text-muted-foreground/40" />
                  Nenhum item selecionado
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
                      {selectedItems.map((item) => (
                        <TableRow key={item.produtoId}>
                          <TableCell className="text-sm py-2">{item.nome}</TableCell>
                          <TableCell className="text-sm text-right py-2">
                            {item.quantidade}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium py-2">
                            {formatBRL(item.preco * item.quantidade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-emerald-700">
                  {formatBRL(total)}
                </span>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleGenerate}
                disabled={loading || selectedItems.length === 0 || !selectedStudent}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Gerar Recibo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
