"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, AlertTriangle, TrendingUp, Percent, DollarSign, Wrench, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Trash2 } from "lucide-react";

interface DashboardStats {
    totalBuildings: number;
    occupancyRate: number;
    activeContracts: number;
    totalCustomers: number;
    expiringContracts: number;
}

interface RevenueStats {
    monthlyRent: number;
    monthlyServiceFee: number;
    totalMonthly: number;
    occupiedArea: number;
    totalArea: number;
}

interface Alert {
    id: string;
    message: string;
    type: "warning" | "info";
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalBuildings: 0,
        occupancyRate: 0,
        activeContracts: 0,
        totalCustomers: 0,
        expiringContracts: 0,
    });
    const [revenueStats, setRevenueStats] = useState<RevenueStats>({
        monthlyRent: 0,
        monthlyServiceFee: 0,
        totalMonthly: 0,
        occupiedArea: 0,
        totalArea: 0,
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch all data in parallel
                const [buildingsRes, customersRes, contractsRes] = await Promise.all([
                    api.get("/buildings/stats"),
                    api.get("/customers"),
                    api.get("/contracts"),
                ]);

                const buildingStats = buildingsRes.data?.data || buildingsRes.data || {};
                const customers = customersRes.data?.data || customersRes.data || [];
                const contracts = contractsRes.data?.data || contractsRes.data || [];

                // Calculate active contracts and expiring ones
                const activeContracts = contracts.filter((c: any) => c.status === "active");
                const today = new Date();
                const days30 = new Date();
                days30.setDate(today.getDate() + 30);
                const expiringContracts = activeContracts.filter((c: any) => {
                    const endDate = new Date(c.endDate);
                    return endDate <= days30 && endDate >= today;
                });

                // Calculate revenue from active contracts
                let monthlyRent = 0;
                let monthlyServiceFee = 0;
                let occupiedArea = 0;

                activeContracts.forEach((contract: any) => {
                    contract.contractUnits?.forEach((unit: any) => {
                        occupiedArea += parseFloat(unit.areaSqm) || 0;

                        // Find current rent period
                        const currentPeriod = unit.rentPeriods?.find((period: any) => {
                            const start = new Date(period.startDate);
                            const end = new Date(period.endDate);
                            return today >= start && today <= end;
                        });

                        if (currentPeriod) {
                            monthlyRent += parseFloat(currentPeriod.rentAmount) || 0;
                            monthlyServiceFee += parseFloat(currentPeriod.serviceFee) || 0;
                        }
                    });
                });

                setStats({
                    totalBuildings: buildingStats.totalBuildings || 0,
                    occupancyRate: buildingStats.occupancyRate || 0,
                    activeContracts: activeContracts.length,
                    totalCustomers: customers.length,
                    expiringContracts: expiringContracts.length,
                });

                setRevenueStats({
                    monthlyRent,
                    monthlyServiceFee,
                    totalMonthly: monthlyRent + monthlyServiceFee,
                    occupiedArea: Math.round(occupiedArea),
                    totalArea: buildingStats.totalUnits || 0, // Placeholder
                });

                // Generate alerts from expiring contracts
                const alertsList: Alert[] = expiringContracts.slice(0, 3).map((c: any) => {
                    const daysLeft = Math.ceil((new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return {
                        id: c.id,
                        message: `Contract #${c.contractNo} expires in ${daysLeft} days`,
                        type: daysLeft <= 30 ? "warning" : "info",
                    };
                });
                setAlerts(alertsList);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleReset = async () => {
        if (!confirm(t("dashboard.resetConfirm"))) return;

        try {
            toast.loading(t("settings.resetting"));
            await api.post("/seed/reset");
            localStorage.clear();
            toast.success(t("dashboard.resetSuccess"));
            router.push("/login");
        } catch (error) {
            console.error(error);
            toast.error("Reset failed");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    const statsDisplay = [
        { nameKey: "dashboard.stats.totalBuildings", value: stats.totalBuildings.toString(), icon: Building2, trend: "" },
        { nameKey: "dashboard.stats.occupancyRate", value: `${stats.occupancyRate}%`, icon: Percent, trend: "" },
        { nameKey: "dashboard.stats.activeContracts", value: stats.activeContracts.toString(), icon: FileText, trend: stats.expiringContracts > 0 ? `${stats.expiringContracts} expiring soon` : "" },
        { nameKey: "dashboard.stats.totalCustomers", value: stats.totalCustomers.toString(), icon: Users, trend: "" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-teal-700">{t("dashboard.title")}</h1>
                <p className="text-gray-500 mt-1">{t("dashboard.subtitle")}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsDisplay.map((stat) => (
                    <Card key={stat.nameKey} className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">{t(stat.nameKey)}</CardTitle>
                            <stat.icon className="w-5 h-5 text-gold-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-teal-700">{stat.value}</div>
                            {stat.trend && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                    {stat.trend}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Breakdown Card */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-heading text-teal-700 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gold-500" />
                        {t("dashboard.revenue.title") || "สรุปรายรับรายเดือน"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                            <p className="text-xs text-teal-600 font-medium uppercase tracking-wide flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {t("dashboard.revenue.rent") || "ค่าเช่ารายเดือน"}
                            </p>
                            <p className="text-2xl font-bold text-teal-700 mt-1">
                                ฿{revenueStats.monthlyRent.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                            <p className="text-xs text-amber-600 font-medium uppercase tracking-wide flex items-center gap-1">
                                <Wrench className="w-3 h-3" />
                                {t("dashboard.revenue.serviceFee") || "ค่าบริการรายเดือน"}
                            </p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">
                                ฿{revenueStats.monthlyServiceFee.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-gold-50 to-amber-50 rounded-xl">
                            <p className="text-xs text-gold-600 font-medium uppercase tracking-wide">
                                {t("dashboard.revenue.total") || "รวมรายเดือน"}
                            </p>
                            <p className="text-2xl font-bold text-gold-600 mt-1">
                                ฿{revenueStats.totalMonthly.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                {t("dashboard.revenue.occupiedArea") || "พื้นที่เช่าแล้ว"}
                            </p>
                            <p className="text-2xl font-bold text-teal-700 mt-1">
                                {revenueStats.occupiedArea.toLocaleString()} <span className="text-sm font-normal text-gray-500">ตร.ม.</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts Section */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-heading text-teal-700 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-gold-500" />
                        {t("dashboard.alerts.recent")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {alerts.length === 0 ? (
                            <p className="text-gray-400 text-sm">{t("alerts.noAlerts") || "No alerts"}</p>
                        ) : (
                            alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-lg border-l-4 ${alert.type === "warning"
                                        ? "bg-amber-50 border-amber-400"
                                        : "bg-blue-50 border-blue-400"
                                        }`}
                                >
                                    <p className="text-sm text-gray-700">{alert.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/dashboard/contracts/new">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-gold-500 to-gold-600 text-white">
                        <CardContent className="p-6">
                            <FileText className="w-8 h-8 mb-3" />
                            <h3 className="font-heading font-semibold text-lg">{t("dashboard.quickActions.newContract")}</h3>
                            <p className="text-sm opacity-80 mt-1">{t("dashboard.quickActions.newContractDesc")}</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/customers">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                        <CardContent className="p-6">
                            <Users className="w-8 h-8 mb-3" />
                            <h3 className="font-heading font-semibold text-lg">{t("dashboard.quickActions.addCustomer")}</h3>
                            <p className="text-sm opacity-80 mt-1">{t("dashboard.quickActions.addCustomerDesc")}</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/buildings">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                        <CardContent className="p-6">
                            <Building2 className="w-8 h-8 mb-3" />
                            <h3 className="font-heading font-semibold text-lg">{t("dashboard.quickActions.manageUnits")}</h3>
                            <p className="text-sm opacity-80 mt-1">{t("dashboard.quickActions.manageUnitsDesc")}</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Danger Zone: Reset Button */}
            <div className="flex justify-end pt-8 border-t mt-8">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-200"
                >
                    <Trash2 className="w-4 h-4" />
                    {t("dashboard.resetData")}
                </button>
            </div>
        </div>
    );
}
