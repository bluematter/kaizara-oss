"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Settings,
  LogOut,
  Pill,
  MessageSquare,
  TestTube,
  ListTodo,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasPermission, type Permission } from "@/lib/rbac";
import { UserRole } from "@prisma/client";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission; // If set, only show if user has this permission
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // No permission - everyone can see dashboard
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    permission: "patients:read",
  },
  {
    title: "Chart Notes",
    href: "/encounters",
    icon: FileText,
    permission: "encounters:read",
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    permission: "patients:read",
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListTodo,
    permission: "tasks:read",
  },
  {
    title: "Labs",
    href: "/labs",
    icon: TestTube,
    permission: "labs:read",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    permission: "inventory:read",
  },
  // Shipping hidden for MVP — not needed to collect revenue
  // {
  //   title: "Shipping",
  //   href: "/shipping",
  //   icon: Truck,
  //   permission: "shipping:read",
  // },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    // Only admins can access settings in production
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";
  const userRole = (session?.user?.role as UserRole) || "STAFF";
  const userRoleDisplay = userRole.charAt(0) + userRole.slice(1).toLowerCase();
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Filter nav items based on user's role permissions
  const visibleNavItems = navItems.filter((item) => {
    if (!item.permission) return true; // No permission required
    return hasPermission(userRole, item.permission);
  });

  return (
    <Sidebar>
      <SidebarHeader className="!p-0 !gap-0 h-16 flex !flex-row items-center border-b border-sidebar-border px-3">
        <Link href="/dashboard" className="flex items-center gap-3 px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Pill className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold tracking-tight leading-none">
              Kaizara
            </span>
            <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
              Clinic OS
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href))
                    }
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href))
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium text-foreground">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground">{userRoleDisplay}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
