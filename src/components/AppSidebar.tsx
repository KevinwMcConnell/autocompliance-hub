import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useFacilities } from "@/hooks/useFacilities";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileSearch,
  Upload,
  CheckSquare,
  FileOutput,
  Building2,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navigation = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Evidence Map", url: "/evidence", icon: FileSearch },
  { title: "Upload Inbox", url: "/uploads", icon: Upload },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Exports", url: "/exports", icon: FileOutput },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { facilities, currentFacility, setCurrentFacility } = useFacilities();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-2 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 h-auto py-2",
                collapsed && "justify-center px-2"
              )}
            >
              <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {currentFacility?.name || "Select Facility"}
                    </p>
                    {currentFacility?.city && currentFacility?.state && (
                      <p className="text-xs text-muted-foreground truncate">
                        {currentFacility.city}, {currentFacility.state}
                      </p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {facilities.map((facility) => (
              <DropdownMenuItem
                key={facility.id}
                onClick={() => setCurrentFacility(facility)}
                className={cn(
                  "cursor-pointer",
                  currentFacility?.id === facility.id && "bg-accent"
                )}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{facility.name}</p>
                  {facility.city && facility.state && (
                    <p className="text-xs text-muted-foreground truncate">
                      {facility.city}, {facility.state}
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/onboarding" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add New Facility
              </NavLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center py-2">
            ComplianceHub v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
