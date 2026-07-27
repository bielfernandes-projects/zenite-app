import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Shield, ShieldCheck, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  display_name: string | null;
  role: "admin" | "funcionario" | null;
  updated_at: string;
  email?: string;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [pendingChange, setPendingChange] = useState<{ id: string; newRole: "admin" | "funcionario"; name: string } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, role, updated_at")
        .order("display_name", { ascending: true });
      if (pErr) throw pErr;
      return (profiles || []) as AdminUser[];
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: "admin" | "funcionario" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Perfil atualizado com sucesso!");
      setPendingChange(null);
    },
    onError: () => {
      toast.error("Não foi possível atualizar o perfil. Tente novamente.");
      setPendingChange(null);
    },
  });

  const handleRoleChange = (id: string, newRole: "admin" | "funcionario", name: string) => {
    setPendingChange({ id, newRole, name });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
        </div>
        <p className="text-muted-foreground">
          Defina quem tem acesso administrativo ao sistema.
        </p>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold">Usuários do Sistema</CardTitle>
          <CardDescription>
            {users?.length ?? 0} usuário(s) cadastrado(s). Apenas administradores podem
            alterar perfis de outros usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{u.display_name || "(sem nome)"}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground">você</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Administrador
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Funcionário
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role || "funcionario"}
                        onValueChange={(v) => handleRoleChange(u.id, v as "admin" | "funcionario", u.display_name || "este usuário")}
                        disabled={u.id === currentUser?.id}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="funcionario">Funcionário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhum usuário encontrado.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Sobre perfis e convites</p>
          <p>
            <strong>Funcionário:</strong> acesso padrão ao sistema (alunos, matrículas, financeiro, documentos).
          </p>
          <p>
            <strong>Administrador:</strong> acesso completo, incluindo a gestão de usuários.
          </p>
          <p className="pt-2">
            Novos usuários devem ser criados pelo painel do Supabase (Authentication → Users).
            Após o primeiro login com confirmação de email, eles aparecem aqui para que você
            defina o perfil.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingChange} onOpenChange={(open) => !open && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar perfil de {pendingChange?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange?.newRole === "admin"
                ? "Este usuário terá acesso completo ao sistema, incluindo a gestão de outros usuários."
                : "Este usuário terá acesso padrão ao sistema (sem gestão de outros usuários)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingChange && changeRole.mutate({ id: pendingChange.id, newRole: pendingChange.newRole })}
              disabled={changeRole.isPending}
            >
              {changeRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
