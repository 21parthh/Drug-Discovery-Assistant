import { Home, FileText, User, LogOut, BarChart3 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Report History", 
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Profile",
    url: "/profile", 
    icon: User,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/" || currentPath.startsWith("/?");
    }
    return currentPath === path;
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar shadow-lg" collapsible="icon">
      <SidebarContent className="h-full bg-sidebar">
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium px-3 py-3 text-xs uppercase tracking-wider">
            {state !== "collapsed" && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ease-in-out
                      ${isActive(item.url)
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md font-medium scale-[1.02]"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:scale-[1.01]"
                      }
                    `}
                  >
                    <NavLink to={item.url} className="w-full flex items-center gap-3">
                      <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive(item.url) ? "text-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                      }`} />
                      {state !== "collapsed" && (
                        <span className="truncate transition-all duration-200">{item.title}</span>
                      )}
                      {isActive(item.url) && state !== "collapsed" && (
                        <div className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <div className="my-4 mx-3 border-t border-sidebar-border/50"></div>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 hover:scale-[1.01]"
                >
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3">
                    <LogOut className="h-5 w-5 flex-shrink-0 transition-colors group-hover:text-destructive" />
                    {state !== "collapsed" && (
                      <span className="truncate transition-all duration-200 group-hover:text-destructive">Sign Out</span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}