"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Building2,
    Users,
    FileText,
    Bell,
    Settings,
    BarChart3,
    Upload,
    Shield,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import React, { useState } from "react";



import { useLanguage } from "@/contexts/LanguageContext";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navigation = [
        { name: t("sidebar.dashboard"), href: "/dashboard", icon: Home },
        { name: t("sidebar.buildings"), href: "/dashboard/buildings", icon: Building2 },
        { name: t("sidebar.customers"), href: "/dashboard/customers", icon: Users },
        { name: t("sidebar.contracts"), href: "/dashboard/contracts", icon: FileText },
        { name: t("sidebar.alerts"), href: "/dashboard/alerts", icon: Bell },
        { name: t("sidebar.reports"), href: "/dashboard/reports", icon: BarChart3 },
        { name: t("sidebar.settings"), href: "/dashboard/settings", icon: Settings },
        { name: t("sidebar.auditLog"), href: "/dashboard/audit", icon: Shield },
    ];

    return (
        <div className="flex flex-col h-full sidebar text-white">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-heading font-semibold text-gold-400">
                            KINGBRIDGE
                        </span>
                        <span className="text-xs tracking-widest text-teal-200">
                            TOWER
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard" || pathname === "/dashboard/"
                            : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                                isActive
                                    ? "active text-gold-400"
                                    : "text-white/70 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-gold-500/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-gold-400">AD</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Admin</p>
                        <p className="text-xs text-white/50 truncate">admin@kingbridge.com</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function Sidebar() {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch with Radix UI Sheet
    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-teal-700 px-4 py-3 flex items-center gap-3">
                {mounted ? (
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0 border-none">
                            <SidebarContent onNavigate={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                ) : (
                    <Button variant="ghost" size="icon" className="text-white">
                        <Menu className="w-6 h-6" />
                    </Button>
                )}
                <span className="text-lg font-heading font-semibold text-gold-400">KINGBRIDGE</span>
            </div>
        </>
    );
}
