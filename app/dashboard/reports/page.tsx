"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, TrendingUp, DollarSign, Building2, AlertTriangle, Wrench, Loader2 } from "lucide-react";
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
    const [isLoading, setIsLoading] = useState(true); // Keep for skeleton if needed, or derive from queries
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear); // Default to current year
    const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]); // Empty = all buildings
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>({
        from: new Date(currentYear, 0, 1),
        to: new Date(currentYear, 11, 31),
    });

    // Sync dateRange when selectedYear changes
    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        setDateRange({
            from: new Date(year, 0, 1),
            to: new Date(year, 11, 31),
        });
    };

    // 1. Fetch Data with useQuery (shares cache with dashboard)
    const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
        queryKey: ['dashboard', 'contracts'], // Same key as dashboard for shared cache
        queryFn: async () => {
            const res = await api.get("/contracts");
            return res.data?.data || res.data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    // Fetch buildings list for filter dropdown
    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get("/buildings");
            return res.data?.data || res.data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    const { data: buildingStatsData = {}, isLoading: isLoadingBuildings } = useQuery({
        queryKey: ['buildingStats'],
        queryFn: async () => {
            const res = await api.get("/buildings/stats");
            return res.data?.data || res.data || {};
        },
        staleTime: 1000 * 60 * 5, // 5 mins
    });


    const isPageLoading = isLoadingContracts || isLoadingBuildings;

    // Helper to get building ID from contract
    const getContractBuildingId = (contract: any): string | null => {
        const firstUnit = contract.contractUnits?.[0];
        return firstUnit?.building?.id || firstUnit?.directBuilding?.id || firstUnit?.unit?.building?.id || null;
    };

    // 2. Derive State with useMemo - filtered by dateRange AND building
    const revenueStats = useMemo(() => {
        let monthlyRent = 0;
        let monthlyServiceFee = 0;

        if (!dateRange?.from || !dateRange?.to) {
            return { monthlyRent: 0, monthlyServiceFee: 0, totalMonthly: 0, activeContracts: 0 };
        }

        const rangeStart = dateRange.from;
        const rangeEnd = dateRange.to;

        // Only count contracts that are active AND have start/end dates overlapping with dateRange
        const activeContracts = contracts.filter((c: any) => {
            if (c.status !== "active") return false;
            const contractStart = new Date(c.startDate);
            const contractEnd = new Date(c.endDate);
            // Contract overlaps with date range
            if (!(contractStart <= rangeEnd && contractEnd >= rangeStart)) return false;

            // Building filter: if selectedBuildingIds is empty, show all; otherwise check if contract's building is selected
            if (selectedBuildingIds.length > 0) {
                const buildingId = getContractBuildingId(c);
                if (!buildingId || !selectedBuildingIds.includes(buildingId)) return false;
            }
            return true;
        });

        activeContracts.forEach((contract: any) => {
            contract.contractUnits?.forEach((unit: any) => {
                // Find rent periods that overlap with the selected date range
                unit.rentPeriods?.forEach((period: any) => {
                    const periodStart = new Date(period.startDate);
                    const periodEnd = new Date(period.endDate);
                    // Period overlaps with date range
                    if (periodStart <= rangeEnd && periodEnd >= rangeStart) {
                        monthlyRent += parseFloat(period.rentAmount) || 0;
                        monthlyServiceFee += parseFloat(period.serviceFee) || 0;
                    }
                });
            });
        });

        return {
            monthlyRent,
            monthlyServiceFee,
            totalMonthly: monthlyRent + monthlyServiceFee,
            activeContracts: activeContracts.length,
        };
    }, [contracts, dateRange, selectedBuildingIds]);

    // Calculate occupancy from buildings data, filtered by selection
    const occupancyStats = useMemo(() => {
        // If no building filter, use all buildings
        const filteredBuildings = selectedBuildingIds.length > 0
            ? buildings.filter((b: any) => selectedBuildingIds.includes(b.id))
            : buildings;

        let totalArea = 0;
        let rentedArea = 0;

        filteredBuildings.forEach((b: any) => {
            totalArea += Number(b.rentableArea) || 0;
            rentedArea += Number(b.rentedArea) || 0;
        });

        const rate = totalArea > 0 ? Math.round((rentedArea / totalArea) * 100) : 0;

        return {
            rate,
            occupied: rentedArea,
            vacant: totalArea - rentedArea,
            total: totalArea,
        };
    }, [buildings, selectedBuildingIds]);

    const expiringContracts = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return [];
        }

        const rangeStart = dateRange.from;
        const rangeEnd = dateRange.to;

        return contracts
            .filter((c: any) => c.status === "active")
            .filter((c: any) => {
                const endDate = new Date(c.endDate);
                // Show contracts expiring within the selected date range
                if (!(endDate >= rangeStart && endDate <= rangeEnd)) return false;

                // Building filter
                if (selectedBuildingIds.length > 0) {
                    const buildingId = getContractBuildingId(c);
                    if (!buildingId || !selectedBuildingIds.includes(buildingId)) return false;
                }
                return true;
            })
            .map((c: any) => {
                const endDate = new Date(c.endDate);
                // Calculate days left from rangeEnd (the reference date)
                const daysLeft = Math.ceil((endDate.getTime() - rangeEnd.getTime()) / (1000 * 60 * 60 * 24));

                let rent = 0, serviceFee = 0;
                // Get building name from first contract unit
                const firstUnit = c.contractUnits?.[0];
                const buildingName = firstUnit?.building?.name || firstUnit?.directBuilding?.name || firstUnit?.unit?.building?.name || "-";

                c.contractUnits?.forEach((unit: any) => {
                    // Get rent period that overlaps with selected range
                    unit.rentPeriods?.forEach((period: any) => {
                        const periodStart = new Date(period.startDate);
                        const periodEnd = new Date(period.endDate);
                        if (periodStart <= rangeEnd && periodEnd >= rangeStart) {
                            rent += parseFloat(period.rentAmount) || 0;
                            serviceFee += parseFloat(period.serviceFee) || 0;
                        }
                    });
                });

                return {
                    id: c.id,
                    contractNo: c.contractNo,
                    customerName: c.customer?.name || "Unknown",
                    buildingName,
                    startDate: c.startDate,
                    expiryDate: c.endDate,
                    daysLeft,
                    rent,
                    serviceFee,
                };
            })
            .sort((a: any, b: any) => a.daysLeft - b.daysLeft);
    }, [contracts, dateRange, selectedBuildingIds]);

    if (isPageLoading) {
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

            {/* Year Filter Tabs */}
            <Card className="border-none shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">เลือกปี:</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={selectedYear === currentYear ? "default" : "outline"}
                                    size="sm"
                                    className={selectedYear === currentYear ? "bg-teal-600 hover:bg-teal-700" : ""}
                                    onClick={() => handleYearChange(currentYear)}
                                >
                                    ปีนี้ ({currentYear})
                                </Button>
                                <Button
                                    variant={selectedYear === currentYear - 1 ? "default" : "outline"}
                                    size="sm"
                                    className={selectedYear === currentYear - 1 ? "bg-teal-600 hover:bg-teal-700" : ""}
                                    onClick={() => handleYearChange(currentYear - 1)}
                                >
                                    ปีที่แล้ว ({currentYear - 1})
                                </Button>
                                <Button
                                    variant={selectedYear === currentYear - 2 ? "default" : "outline"}
                                    size="sm"
                                    className={selectedYear === currentYear - 2 ? "bg-teal-600 hover:bg-teal-700" : ""}
                                    onClick={() => handleYearChange(currentYear - 2)}
                                >
                                    {currentYear - 2}
                                </Button>
                            </div>
                        </div>
                        <div className="border-l border-gray-200 pl-4 flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">หรือเลือกช่วง:</label>
                            <DatePickerWithRange
                                className="w-[280px]"
                                dateRange={dateRange}
                                onDateChange={(range) => setDateRange(range as { from: Date; to: Date } | undefined)}
                            />
                        </div>
                        <div className="border-l border-gray-200 pl-4 flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">อาคาร:</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="min-w-[200px] justify-between">
                                        <span>
                                            {selectedBuildingIds.length === 0
                                                ? "ทั้งหมด"
                                                : `เลือก ${selectedBuildingIds.length} อาคาร`}
                                        </span>
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="start">
                                    <div className="max-h-60 overflow-auto">
                                        {buildings.map((b: any) => (
                                            <label
                                                key={b.id}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBuildingIds.includes(b.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedBuildingIds([...selectedBuildingIds, b.id]);
                                                        } else {
                                                            setSelectedBuildingIds(selectedBuildingIds.filter((id: string) => id !== b.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                                />
                                                <span className="text-sm">{b.name}</span>
                                            </label>
                                        ))}
                                        {selectedBuildingIds.length > 0 && (
                                            <button
                                                onClick={() => setSelectedBuildingIds([])}
                                                className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-t text-left hover:bg-gray-50"
                                            >
                                                ล้างตัวกรอง
                                            </button>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
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
                                <div className="text-2xl font-bold mt-1 text-green-600">{occupancyStats.occupied.toLocaleString()} ตร.ม.</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">{t("reports.occupancy.vacant")}</p>
                                <div className="text-2xl font-bold mt-1 text-red-500">{occupancyStats.vacant.toLocaleString()} ตร.ม.</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-gray-500 text-sm font-medium">พื้นที่ทั้งหมด</p>
                                <div className="text-2xl font-bold mt-1 text-gray-700">{occupancyStats.total.toLocaleString()} ตร.ม.</div>
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
                                            <TableHead>อาคาร</TableHead>
                                            <TableHead>วันที่เริ่มสัญญา</TableHead>
                                            <TableHead>วันที่หมดอายุ</TableHead>
                                            <TableHead className="text-right">{t("reports.table.daysLeft")}</TableHead>
                                            <TableHead className="text-right">{t("contracts.table.monthlyRent")}</TableHead>
                                            <TableHead className="text-right">{t("contracts.table.serviceFee") || "Service Fee"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expiringContracts.map((contract: any) => (
                                            <TableRow key={contract.id}>
                                                <TableCell className="font-medium">{contract.contractNo}</TableCell>
                                                <TableCell>{contract.customerName}</TableCell>
                                                <TableCell>{contract.buildingName}</TableCell>
                                                <TableCell>{new Date(contract.startDate).toLocaleDateString("th-TH")}</TableCell>
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
