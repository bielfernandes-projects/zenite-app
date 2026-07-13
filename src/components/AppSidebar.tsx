import { Home, Users, FileText, Upload, LogOut, Package, ShoppingCart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const items = [
  { title: "Início", url: "/", icon: Home },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Importar", url: "/importar", icon: Upload },
  { title: "Documentos", url: "/documentos", icon: FileText },
];

const financeiroItems = [
  { title: "Vendas", url: "/financeiro/vendas", icon: ShoppingCart },
  { title: "Produtos", url: "/financeiro/produtos", icon: Package },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-xl">
      <SidebarContent className="py-4 flex flex-col justify-center">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? "space-y-2" : "space-y-1 px-3"}>
              {items.map((item) => {
                const isActive = item.url === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title} className={collapsed ? "flex justify-center" : ""}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`hover:bg-sidebar-accent/80 rounded-lg ${collapsed ? "w-full flex items-center justify-center px-2" : ""}`}
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-md"
                      >
                        <item.icon className={`h-4 w-4 ${collapsed ? "mx-auto" : ""}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4" />

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupContent>
              <div className="px-6 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Financeiro
                </p>
              </div>
            </SidebarGroupContent>
          )}
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? "space-y-2" : "space-y-1 px-3"}>
              {financeiroItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title} className={collapsed ? "flex justify-center" : ""}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className={`hover:bg-sidebar-accent/80 rounded-lg ${collapsed ? "w-full flex items-center justify-center px-2" : ""}`}
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-md"
                      >
                        <item.icon className={`h-4 w-4 ${collapsed ? "mx-auto" : ""}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={`${collapsed ? "p-2" : "p-4"} border-t border-white/10`}>
        <Button
          variant="ghost"
          className={`w-full ${collapsed ? "justify-center" : "justify-start"} text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent`}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
        {!collapsed && (
          <div className="text-xs text-sidebar-foreground/60 text-center mt-2">
            v1.0.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
