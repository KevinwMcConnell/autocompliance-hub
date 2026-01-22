import { useAuth } from "@/hooks/useAuth";
import { useFacilities } from "@/hooks/useFacilities";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User, Building2, ChevronDown, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { facilities, currentFacility, setCurrentFacility } = useFacilities();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger />
        
        {/* Prominent Facility Selector */}
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto py-1.5 px-3 gap-2 hover:bg-muted"
              >
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {currentFacility?.name || "Select Facility"}
                  </p>
                  {currentFacility?.city && currentFacility?.state && (
                    <p className="text-xs text-muted-foreground">
                      {currentFacility.city}, {currentFacility.state}
                    </p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Your Facilities</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
                    <p className="font-medium truncate text-foreground">{facility.name}</p>
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
                <Link to="/onboarding" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Facility
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-status-overdue" />
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">Account</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
