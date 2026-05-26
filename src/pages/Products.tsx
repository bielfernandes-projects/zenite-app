import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Package } from "lucide-react";
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
import { ProductForm } from "@/components/ProductForm";
import { toast } from "sonner";
import { produtosApi, Produto } from "@/lib/api";

const categorias = ["Fardamento", "Material Didático", "Taxa"] as const;

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ["produtos"],
    queryFn: () => produtosApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => produtosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover produto"),
  });

  const filtered = (produtos || []).filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.categoria === catFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSave = () => {
    setEditingProduct(null);
    queryClient.invalidateQueries({ queryKey: ["produtos"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Produtos</h2>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Produto
        </Button>
      </div>

      <Card className="shadow-sm rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erro ao carregar produtos. Tente novamente.
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
                  <Select value={catFilter} onValueChange={setCatFilter}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Preço</TableHead>
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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {produto.nome}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {produto.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {produto.serie_aplicavel || "—"}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {formatBRL(produto.preco)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={produto.status === "Ativo" ? "default" : "secondary"}
                      className={
                        produto.status === "Ativo"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {produto.status}
                    </Badge>
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
                            setEditingProduct(produto);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(produto.id)}
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ProductForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}
