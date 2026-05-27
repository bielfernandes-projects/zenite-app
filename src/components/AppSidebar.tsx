import { LayoutDashboard, Users, FileText, Sparkles, LogOut, Package, ShoppingCart } from "lucide-react";
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
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Alunos", url: "/alunos", icon: Users },
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
      <SidebarHeader className={collapsed ? "p-4" : "p-6 border-b border-sidebar-border"}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">
              Zênite
            </h1>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? "space-y-2" : "space-y-1 px-3"}>
              {items.map((item) => {
                const isActive = item.url === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`
                          group relative hover:bg-sidebar-accent/80 transition-all duration-200 rounded-lg
                          ${collapsed ? "w-full flex items-center justify-center px-2" : ""}
                        `}
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-md"
                      >
                        <item.icon 
                          className={`h-4 w-4 transition-transform group-hover:scale-110 ${collapsed ? "mx-auto" : ""}`} 
                        />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className={`
                          group relative hover:bg-sidebar-accent/80 transition-all duration-200 rounded-lg
                          ${collapsed ? "w-full flex items-center justify-center px-2" : ""}
                        `}
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-md"
                      >
                        <item.icon 
                          className={`h-4 w-4 transition-transform group-hover:scale-110 ${collapsed ? "mx-auto" : ""}`} 
                        />
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
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={`w-full justify-${collapsed ? 'center' : 'start'} text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent`}
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
