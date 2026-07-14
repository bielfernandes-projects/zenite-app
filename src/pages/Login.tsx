import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Email ou senha incorretos. Verifique e tente novamente.");
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpPassword !== signUpConfirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (signUpPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSignUpLoading(true);

    const { error } = await signUp(signUpEmail, signUpPassword, signUpName || undefined);

    if (error) {
      toast.error(error.message || "Não foi possível criar a conta. Tente novamente.");
      setSignUpLoading(false);
    } else {
      setSignUpSuccess(true);
      setSignUpLoading(false);
    }
  };

  const resetSignUp = () => {
    setShowSignUp(false);
    setSignUpSuccess(false);
    setSignUpEmail("");
    setSignUpPassword("");
    setSignUpConfirmPassword("");
    setSignUpName("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Zenite</CardTitle>
              <CardDescription className="mt-1">
                I. I. Tia Neuma · Sistema de Gestão Escolar
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-11 mt-4"
                onClick={() => setShowSignUp(true)}
              >
                Criar Conta
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Zenite — I. I. Tia Neuma · {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-[#EF7F2D]/80 items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center text-primary-foreground max-w-md">
          <GraduationCap className="h-24 w-24 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Gestão Escolar Simplificada</h2>
          <p className="text-lg opacity-90">
            Matrículas, mensalidades e documentos em um só lugar.
          </p>
        </div>
      </div>

      {/* Sign Up Dialog */}
      <Dialog open={showSignUp} onOpenChange={(open) => { if (!open) resetSignUp(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Conta</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar sua conta.
            </DialogDescription>
          </DialogHeader>

          {signUpSuccess ? (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm font-medium text-foreground">Conta criada com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  Verifique seu email para confirmar o cadastro e poder acessar o sistema.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={resetSignUp}>
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="signUpName" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="signUpName"
                  type="text"
                  placeholder="Seu nome"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signUpEmail" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="signUpEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signUpPassword" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="signUpPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signUpConfirmPassword" className="text-sm font-medium">
                  Confirmar Senha
                </label>
                <Input
                  id="signUpConfirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetSignUp} disabled={signUpLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={signUpLoading}>
                  {signUpLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
