import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/alunos": "Alunos",
  "/documentos": "Documentos",
};

export function AppHeader() {
  const location = useLocation();
  const currentPage = breadcrumbMap[location.pathname] || "Página";

  return (
    <header className="h-14 flex items-center justify-between border-b px-4 bg-background">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <nav className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Início</span>
          {currentPage !== "Dashboard" && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">{currentPage}</span>
            </>
          )}
        </nav>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                AD
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
