"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, Clock, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Types
interface Alert {
    id: string;
    title: string;
    message: string;
    type: "warning" | "error" | "success" | "info";
    timestamp: string;
    read: boolean;
    contractNo?: string;
}

export default function AlertsPage() {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true); // Keep if needed for initial skeleon or derived

    // 1. Fetch Data with useQuery (shares cache with dashboard)
    const { data: contracts = [], isLoading: isLoadingContracts, error } = useQuery({
        queryKey: ['dashboard', 'contracts'], // Same key as dashboard for shared cache
        queryFn: async () => {
            console.log('[Alerts] Fetching contracts...');
            const res = await api.get("/contracts");
            console.log('[Alerts] Response:', res.data);
            return res.data?.data || res.data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    // Debug logs
    console.log('[Alerts] isLoading:', isLoadingContracts);
    console.log('[Alerts] contracts count:', contracts.length);
    console.log('[Alerts] error:', error);

    // 2. Derive Alerts and Stats with useMemo
    const { alerts, stats } = useMemo(() => {
        const today = new Date();
        const days30 = new Date(); days30.setDate(today.getDate() + 30);
        const days60 = new Date(); days60.setDate(today.getDate() + 60);
        const days90 = new Date(); days90.setDate(today.getDate() + 90);

        let in30 = 0, in60 = 0, in90 = 0;
        const alertsList: Alert[] = [];
        const activeContracts = contracts.filter((c: any) => c.status === "active");

        activeContracts.forEach((contract: any) => {
            const endDate = new Date(contract.endDate);
            if (endDate <= days30 && endDate >= today) {
                in30++;
                alertsList.push({
                    id: contract.id,
                    title: "Contract Expiring Soon",
                    message: `Contract #${contract.contractNo} for ${contract.customer?.name || "Unknown"} expires in ${Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days.`,
                    type: "warning",
                    timestamp: new Date().toISOString(),
                    read: false,
                    contractNo: contract.contractNo,
                });
            } else if (endDate <= days60 && endDate > days30) {
                in60++;
                alertsList.push({
                    id: contract.id,
                    title: "Contract Expiring",
                    message: `Contract #${contract.contractNo} for ${contract.customer?.name || "Unknown"} expires in ${Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days.`,
                    type: "info",
                    timestamp: new Date().toISOString(),
                    read: false,
                    contractNo: contract.contractNo,
                });
            } else if (endDate <= days90 && endDate > days60) {
                in90++;
            }
        });

        return {
            alerts: alertsList,
            stats: { in30Days: in30, in60Days: in60, in90Days: in90, total: alertsList.length }
        };
    }, [contracts]);

    // Local state for read status (in a real app, this should be persisted or memoized differently if complex)
    // For now, we'll initialize it from memoized alerts, but `useMemo` runs on every render if dependencies change.
    // Actually, `alerts` will be recreated when `contracts` change. 
    // If we want "mark as read" to work, we need a local state that tracks read IDs, 
    // or we need to separate the "source" alerts from the "display" alerts.
    // Simpler approach for this refactor: 
    // 1. `baseAlerts` from useMemo.
    // 2. `readAlertIds` state.
    // 3. `displayAlerts` = baseAlerts.map(a => readAlertIds.includes(a.id) ? {...a, read: true} : a)

    const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());

    const displayAlerts = useMemo(() => {
        return alerts.map(a => ({
            ...a,
            read: readAlertIds.has(a.id)
        }));
    }, [alerts, readAlertIds]);

    const handleMarkAsRead = (id: string) => {
        setReadAlertIds(prev => new Set(prev).add(id));
    };

    const handleMarkAllAsRead = () => {
        const allIds = alerts.map(a => a.id);
        setReadAlertIds(new Set([...Array.from(readAlertIds), ...allIds]));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case "error": return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case "success": return <Check className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case "warning": return "bg-amber-50 border-amber-200";
            case "error": return "bg-red-50 border-red-200";
            case "success": return "bg-green-50 border-green-200";
            default: return "bg-blue-50 border-blue-200";
        }
    };

    const unreadCount = alerts.filter(a => !a.read).length;

    if (isLoadingContracts) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-teal-700">{t("alerts.title")}</h1>
                    <p className="text-gray-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} ${t("alerts.unread")}` : `${t("alerts.caughtUp")}`}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50">
                        <Check className="w-4 h-4 mr-2" />
                        {t("alerts.markAllRead")}
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-amber-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-amber-600">{stats.in30Days}</span>
                        <span className="text-xs text-amber-700 font-medium mt-1">{t("alerts.stats.30days")}</span>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-orange-600">{stats.in60Days}</span>
                        <span className="text-xs text-orange-700 font-medium mt-1">{t("alerts.stats.60days")}</span>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-blue-600">{stats.in90Days}</span>
                        <span className="text-xs text-blue-700 font-medium mt-1">{t("alerts.stats.90days")}</span>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gray-50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-gray-600">{stats.total}</span>
                        <span className="text-xs text-gray-700 font-medium mt-1">{t("alerts.stats.total")}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts List */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-heading text-teal-700 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gold-500" />
                        {t("alerts.allNotifications")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-lg border ${getBgColor(alert.type)} flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:shadow-md ${!alert.read ? "border-l-4 border-l-teal-500" : ""}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getIcon(alert.type)}
                                        <p className={`font-semibold ${alert.read ? "text-gray-600" : "text-gray-900"}`}>
                                            {alert.title}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs uppercase">
                                            {alert.type}
                                        </Badge>
                                        {alert.contractNo && (
                                            <Badge variant="secondary" className="text-xs">
                                                {alert.contractNo}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(alert.timestamp).toLocaleDateString("th-TH", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {!alert.read && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkAsRead(alert.id)}
                                            className="text-xs h-8"
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            {t("alerts.markRead")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                <p>{t("alerts.noAlerts")}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
