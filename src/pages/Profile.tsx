import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Camera, Save, Lock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { profileApi, Profile } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileApi.get(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: () => profileApi.update(user!.id, { display_name: displayName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => toast.error("Não foi possível atualizar o perfil. Tente novamente em alguns instantes."),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(user!.id, file),
    onSuccess: (url) => {
      setAvatarPreview(url);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Foto de perfil atualizada!");
    },
    onError: () => toast.error("Não foi possível enviar a foto. Verifique o tamanho (máx 2MB) e tente novamente."),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => supabase.auth.updateUser({ password: newPassword }),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => toast.error("Não foi possível alterar a senha. Verifique se tem pelo menos 6 caracteres."),
  });

  const handleSaveProfile = () => {
    if (selectedFile) {
      uploadAvatarMutation.mutate(selectedFile);
    }
    if (displayName !== (profile?.display_name || "")) {
      updateProfileMutation.mutate();
    }
    if (!selectedFile && displayName === (profile?.display_name || "")) {
      toast.info("Nenhuma alteração para salvar.");
    }
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const userName = user?.email?.split("@")[0] || "Admin";
  const userInitials = userName.slice(0, 2).toUpperCase();
  const isSaving = updateProfileMutation.isPending || uploadAvatarMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <h2 className="text-2xl font-semibold text-foreground">Meu Perfil</h2>

      {/* Foto e Nome */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Altere sua foto e nome de exibição.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview && <AvatarImage src={avatarPreview} className="object-cover" />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-[#01182C] text-primary-foreground text-2xl font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="display_name">Nome de exibição</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como você quer ser chamado"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Alterar Senha */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Use uma senha segura com pelo menos 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">Nova senha</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar senha</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending || !newPassword}
          >
            {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
