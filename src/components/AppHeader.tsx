import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { AvatarImage } from "@/components/ui/avatar";

const breadcrumbMap: Record<string, string> = {
  "/": "Início",
  "/alunos": "Alunos",
  "/documentos": "Documentos",
  "/financeiro/vendas": "Vendas",
  "/financeiro/produtos": "Produtos",
  "/perfil": "Meu Perfil",
};

function getBreadcrumbs(pathname: string): { label: string; path?: string }[] {
  const crumbs: { label: string; path?: string }[] = [{ label: "Início", path: "/" }];

  if (pathname === "/") {
    return crumbs;
  }

  const alunoMatch = pathname.match(/^\/alunos\/(.+)$/);
  if (alunoMatch) {
    crumbs.push({ label: "Alunos", path: "/alunos" });
    crumbs.push({ label: "Perfil do Aluno" });
    return crumbs;
  }

  const staticLabel = breadcrumbMap[pathname];
  if (staticLabel) {
    crumbs.push({ label: staticLabel });
  } else {
    crumbs.push({ label: "Página" });
  }

  return crumbs;
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileApi.get(),
    enabled: !!user?.id,
  });

  const userName = profile?.display_name || user?.email?.split("@")[0] || "Admin";
  const userEmail = user?.email || "";
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between border-b px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 mr-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
          <span className="text-sm font-bold text-[#01182C] whitespace-nowrap">I. I. Tia Neuma</span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted-foreground/40">/</span>}
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="text-muted-foreground font-medium hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-semibold text-foreground" : "text-muted-foreground font-medium"}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Separator orientation="vertical" className="h-6" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-full hover:bg-accent transition-colors p-1.5 pr-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-[#01182C] text-primary-foreground text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-foreground capitalize">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/perfil")}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
