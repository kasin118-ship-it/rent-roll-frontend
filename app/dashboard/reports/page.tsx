"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, Filter, TrendingUp, DollarSign, Building2, AlertTriangle, Wrench, Loader2 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface RevenueStats {
    monthlyRent: number;
    monthlyServiceFee: number;
    totalMonthly: number;
    activeContracts: number;
}

interface BuildingStats {
    id: string;
    name: string;
    totalUnits: number;
    occupied: number;
    vacant: number;
    monthlyRent: number;
    monthlyServiceFee: number;
}

interface ExpiringContract {
    id: string;
    contractNo: string;
    customerName: string;
    expiryDate: string;
    daysLeft: number;
    rent: number;
    serviceFee: number;
}

export default function ReportsPage() {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [revenueStats, setRevenueStats] = useState<RevenueStats>({
        monthlyRent: 0,
        monthlyServiceFee: 0,
        totalMonthly: 0,
        activeContracts: 0,
    });
    const [buildingStats, setBuildingStats] = useState<BuildingStats[]>([]);
    const [expiringContracts, setExpiringContracts] = useState<ExpiringContract[]>([]);
    const [occupancyStats, setOccupancyStats] = useState({ rate: 0, occupied: 0, vacant: 0, total: 0 });

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            try {
                const [contractsRes, buildingsRes] = await Promise.all([
                    api.get("/contracts"),
                    api.get("/buildings/stats"),
                ]);

                const contracts = contractsRes.data?.data || contractsRes.data || [];
                const buildingStatsData = buildingsRes.data?.data || buildingsRes.data || {};
                const today = new Date();

                // Filter active contracts
                const activeContracts = contracts.filter((c: any) => c.status === "active");

                // Calculate revenue
                let monthlyRent = 0;
                let monthlyServiceFee = 0;

                activeContracts.forEach((contract: any) => {
                    contract.contractUnits?.forEach((unit: any) => {
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

                setRevenueStats({
                    monthlyRent,
                    monthlyServiceFee,
                    totalMonthly: monthlyRent + monthlyServiceFee,
                    activeContracts: activeContracts.length,
                });

                // Occupancy stats
                setOccupancyStats({
                    rate: buildingStatsData.occupancyRate || 0,
                    occupied: buildingStatsData.occupiedUnits || 0,
                    vacant: (buildingStatsData.totalUnits || 0) - (buildingStatsData.occupiedUnits || 0),
                    total: buildingStatsData.totalUnits || 0,
                });

                // Expiring contracts (next 90 days)
                const days90 = new Date();
                days90.setDate(today.getDate() + 90);

                const expiring: ExpiringContract[] = activeContracts
                    .filter((c: any) => {
                        const endDate = new Date(c.endDate);
                        return endDate <= days90 && endDate >= today;
                    })
                    .map((c: any) => {
                        const endDate = new Date(c.endDate);
                        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        let rent = 0, serviceFee = 0;
                        c.contractUnits?.forEach((unit: any) => {
                            const currentPeriod = unit.rentPeriods?.find((period: any) => {
                                const start = new Date(period.startDate);
                                const end = new Date(period.endDate);
                                return today >= start && today <= end;
                            });
                            if (currentPeriod) {
                                rent += parseFloat(currentPeriod.rentAmount) || 0;
                                serviceFee += parseFloat(currentPeriod.serviceFee) || 0;
                            }
                        });

                        return {
                            id: c.id,
                            contractNo: c.contractNo,
                            customerName: c.customer?.name || "Unknown",
                            expiryDate: c.endDate,
                            daysLeft,
                            rent,
                            serviceFee,
                        };
                    })
                    .sort((a: ExpiringContract, b: ExpiringContract) => a.daysLeft - b.daysLeft);

                setExpiringContracts(expiring);

            } catch (error) {
                console.error("Failed to fetch report data:", error);
                toast.error("Failed to load report data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    // Pie chart data
    const revenueByType = [
        { name: "Rent", value: revenueStats.monthlyRent, color: "#0d9488" },
        { name: "Service Fee", value: revenueStats.monthlyServiceFee, color: "#f59e0b" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-teal-700">{t("reports.title")}</h1>
                    <p className="text-gray-500 mt-1">{t("reports.subtitle")}</p>
                </div>
                <Button variant="outline" className="border-gold-400 text-gold-600 hover:bg-gold-50">
                    <Download className="w-4 h-4 mr-2" />
                    {t("reports.exportExcel")}
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t("reports.startDate")} - {t("reports.endDate")}</label>
                            <DatePickerWithRange className="w-full md:w-[300px]" />
                        </div>
                        <Button className="btn-gold">
                            <Filter className="w-4 h-4 mr-2" />
                            {t("reports.applyFilter")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="revenue" className="space-y-6">
                <TabsList className="bg-white border p-1 shadow-sm">
                    <TabsTrigger value="revenue" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {t("reports.tabs.revenue")}
                    </TabsTrigger>
                    <TabsTrigger value="occupancy" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        <Building2 className="w-4 h-4 mr-2" />
                        {t("reports.tabs.occupancy")}
                    </TabsTrigger>
                    <TabsTrigger value="expiring" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {t("reports.tabs.expiring")}
                    </TabsTrigger>
                </TabsList>

                {/* Revenue Report */}
                <TabsContent value="revenue" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                            <CardContent className="p-4">
                                <p className="text-teal-100 text-sm font-medium">{t("reports.revenue.totalRent") || "ค่าเช่า/เดือน"}</p>
                                <div className="text-2xl font-bold mt-1">฿{revenueStats.monthlyRent.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                            <CardContent className="p-4">
                                <p className="text-amber-100 text-sm font-medium flex items-center gap-1">
                                    <Wrench className="w-3 h-3" />
                                    {t("reports.revenue.serviceFee") || "ค่าบริการ/เดือน"}
                                </p>
                                <div className="text-2xl font-bold mt-1">฿{revenueStats.monthlyServiceFee.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-gold-500 to-gold-600 text-white">
                            <CardContent className="p-4">
                                <p className="text-gold-100 text-sm font-medium">{t("reports.revenue.total")}</p>
                                <div className="text-2xl font-bold mt-1">฿{revenueStats.totalMonthly.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">{t("reports.revenue.activeContracts")}</p>
                                <div className="text-2xl font-bold mt-1 text-gray-700">{revenueStats.activeContracts}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>{t("reports.revenue.byBuildingTitle") || "สัดส่วนรายรับ"}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center">
                                    {revenueStats.totalMonthly > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={revenueByType}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {revenueByType.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-gray-400">{t("common.noData") || "No data"}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>{t("reports.revenue.trendTitle") || "สรุปข้อมูล"}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                                        <span className="text-teal-700 font-medium">ค่าเช่ารายเดือน</span>
                                        <span className="text-teal-700 font-bold">฿{revenueStats.monthlyRent.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                                        <span className="text-amber-700 font-medium">ค่าบริการรายเดือน</span>
                                        <span className="text-amber-700 font-bold">฿{revenueStats.monthlyServiceFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gold-50 rounded-lg">
                                        <span className="text-gold-700 font-medium">รวมรายรับรายเดือน</span>
                                        <span className="text-gold-700 font-bold">฿{revenueStats.totalMonthly.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-700 font-medium">สัญญาที่ใช้งานอยู่</span>
                                        <span className="text-gray-700 font-bold">{revenueStats.activeContracts} ฉบับ</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Occupancy Report */}
                <TabsContent value="occupancy" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">{t("reports.occupancy.rate")}</p>
                                <div className="text-2xl font-bold mt-1 text-teal-700">{occupancyStats.rate}%</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">{t("reports.occupancy.occupied")}</p>
                                <div className="text-2xl font-bold mt-1 text-green-600">{occupancyStats.occupied}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">{t("reports.occupancy.vacant")}</p>
                                <div className="text-2xl font-bold mt-1 text-red-500">{occupancyStats.vacant}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">Total Units</p>
                                <div className="text-2xl font-bold mt-1 text-gray-700">{occupancyStats.total}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {occupancyStats.total === 0 && (
                        <Card className="border-none shadow-md">
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-400">{t("common.noData") || "No occupancy data available"}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Expiring Contracts */}
                <TabsContent value="expiring">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>{t("reports.expiring.next90Days")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {expiringContracts.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("contracts.table.contractNo")}</TableHead>
                                            <TableHead>{t("contracts.table.customer")}</TableHead>
                                            <TableHead>{t("contracts.table.period")}</TableHead>
                                            <TableHead className="text-right">{t("reports.table.daysLeft")}</TableHead>
                                            <TableHead className="text-right">{t("contracts.table.monthlyRent")}</TableHead>
                                            <TableHead className="text-right">{t("contracts.table.serviceFee") || "Service Fee"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expiringContracts.map(contract => (
                                            <TableRow key={contract.id}>
                                                <TableCell className="font-medium">{contract.contractNo}</TableCell>
                                                <TableCell>{contract.customerName}</TableCell>
                                                <TableCell>{new Date(contract.expiryDate).toLocaleDateString("th-TH")}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge
                                                        className={
                                                            contract.daysLeft <= 30 ? "bg-red-100 text-red-700" :
                                                                contract.daysLeft <= 60 ? "bg-amber-100 text-amber-700" :
                                                                    "bg-blue-100 text-blue-700"
                                                        }
                                                    >
                                                        {contract.daysLeft} days
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-teal-600 font-medium">฿{contract.rent.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-amber-600 font-medium">฿{contract.serviceFee.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>{t("common.noData") || "No expiring contracts in the next 90 days"}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
