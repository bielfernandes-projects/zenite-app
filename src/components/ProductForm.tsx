import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { produtosApi, Produto } from "@/lib/api";

const productSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  categoria: z.enum(["Fardamento", "Material Didático", "Taxa"]),
  serie_aplicavel: z.string().optional().nullable(),
  preco: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  status: z.enum(["Ativo", "Inativo"]),
});

type ProductFormData = z.infer<typeof productSchema>;

const series = [
  "Educação Infantil",
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
  "6º Ano",
  "7º Ano",
  "8º Ano",
  "9º Ano",
  "1ª Série (Ens. Médio)",
  "2ª Série (Ens. Médio)",
  "3ª Série (Ens. Médio)",
];

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Produto | null;
  onSave: () => void;
}

export function ProductForm({ open, onOpenChange, product, onSave }: ProductFormProps) {
  const queryClient = useQueryClient();

  const formValues = useMemo(
    () =>
      product
        ? {
            nome: product.nome,
            categoria: product.categoria,
            serie_aplicavel: product.serie_aplicavel || "nenhuma",
            preco: product.preco,
            status: product.status,
          }
        : {
            nome: "",
            categoria: "Fardamento" as const,
            serie_aplicavel: "nenhuma",
            preco: undefined as unknown as number,
            status: "Ativo" as const,
          },
    [product],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    values: formValues,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Produto, "id">) => produtosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto criado com sucesso!");
      onSave();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Não foi possível criar o produto. Verifique os campos e tente novamente.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Produto> }) =>
      produtosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto atualizado com sucesso!");
      onSave();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Não foi possível atualizar o produto. Tente novamente em alguns instantes.");
    },
  });

  const onSubmit = (data: ProductFormData) => {
    const payload = {
      nome: data.nome.trim(),
      categoria: data.categoria,
      serie_aplicavel: data.serie_aplicavel === "nenhuma" ? null : data.serie_aplicavel,
      preco: Math.round(data.preco * 100) / 100,
      status: data.status,
    };
    if (product) {
      updateMutation.mutate({ id: product.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const fieldClass = "rounded-lg border-input";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {product ? "Editar Produto" : "Novo Produto"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input id="nome" {...register("nome")} className={fieldClass} placeholder="Ex: Camiseta Fardamento" />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <Label>Categoria *</Label>
            <Select
              value={watch("categoria")}
              onValueChange={(v) =>
                setValue("categoria", v as "Fardamento" | "Material Didático" | "Taxa", { shouldDirty: true })
              }
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fardamento">Fardamento</SelectItem>
                <SelectItem value="Material Didático">Material Didático</SelectItem>
                <SelectItem value="Taxa">Taxa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Série Aplicável</Label>
            <Select
              value={watch("serie_aplicavel")}
              onValueChange={(v) => setValue("serie_aplicavel", v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Geral (Sem série específica)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Geral (Sem série específica)</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="preco">Preço (R$) *</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0.01"
              {...register("preco")}
              className={fieldClass}
              placeholder="0,00"
            />
            {errors.preco && <p className="text-xs text-destructive mt-1">{errors.preco.message}</p>}
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(v) => setValue("status", v as "Ativo" | "Inativo", { shouldDirty: true })}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="mt-8 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
