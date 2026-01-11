"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Users, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContractDetailsClient() {
    const { id } = useParams();
    const { t } = useLanguage();

    // Fetch contract from API
    const { data: contract, isLoading, error } = useQuery({
        queryKey: ['contract', id],
        queryFn: async () => {
            const res = await api.get(`/contracts/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
    });

    const statusColors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700",
        active: "bg-green-100 text-green-700",
        expired: "bg-red-100 text-red-700",
        terminated: "bg-orange-100 text-orange-700",
        cancelled: "bg-gray-100 text-gray-500",
    };

    // Calculate current rent from periods
    const calculateCurrentRent = () => {
        if (!contract?.contractUnits) return { rent: 0, serviceFee: 0 };
        let rent = 0;
        let serviceFee = 0;
        const now = new Date();
        contract.contractUnits.forEach((unit: any) => {
            unit.rentPeriods?.forEach((period: any) => {
                const start = new Date(period.startDate);
                const end = new Date(period.endDate);
                if (now >= start && now <= end) {
                    rent += parseFloat(period.rentAmount) || 0;
                    serviceFee += parseFloat(period.serviceFee) || 0;
                }
            });
        });
        return { rent, serviceFee };
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 md:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-red-500 mb-4">ไม่พบข้อมูลสัญญา</p>
                <Button asChild>
                    <Link href="/dashboard/contracts">กลับไปหน้ารายการสัญญา</Link>
                </Button>
            </div>
        );
    }

    const { rent, serviceFee } = calculateCurrentRent();
    const getBuildingName = () => {
        const firstUnit = contract.contractUnits?.[0];
        return firstUnit?.building?.name || firstUnit?.directBuilding?.name || "-";
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-teal-50">
                    <Link href="/dashboard/contracts">
                        <ArrowLeft className="w-6 h-6 text-teal-700" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-teal-800 flex items-center gap-3">
                        สัญญา {contract.contractNo}
                        <Badge className={statusColors[contract.status] || ""}>
                            {t(`contracts.status.${contract.status}`)}
                        </Badge>
                    </h1>
                    <p className="text-gray-500">รายละเอียดสัญญาเช่า</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <Card className="md:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-teal-700 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            ข้อมูลทั่วไป
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">ลูกค้า</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <p className="font-medium text-lg">{contract.customer?.name || "-"}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">อาคาร</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <p className="font-medium">{getBuildingName()}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">ระยะเวลาสัญญา</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>
                                        {new Date(contract.startDate).toLocaleDateString("th-TH")} - {new Date(contract.endDate).toLocaleDateString("th-TH")}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">เงินมัดจำ</label>
                                <p className="font-medium text-lg mt-1">฿{parseFloat(contract.depositAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Rental Units */}
                        <div>
                            <label className="text-xs text-gray-500 uppercase mb-2 block">พื้นที่เช่า</label>
                            <div className="space-y-2">
                                {contract.contractUnits?.map((unit: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <div>
                                            <span className="font-medium">
                                                {unit.building?.name || unit.directBuilding?.name || ""} - ชั้น {unit.floor}
                                            </span>
                                            <span className="text-gray-500 ml-2">({parseFloat(unit.areaSqm || 0).toLocaleString()} ตร.ม.)</span>
                                        </div>
                                        <div className="text-right">
                                            {unit.rentPeriods?.map((p: any, j: number) => (
                                                <div key={j} className="text-sm">
                                                    <span className="text-teal-600 font-medium">฿{parseFloat(p.rentAmount || 0).toLocaleString()}</span>
                                                    <span className="text-gray-400 mx-1">+</span>
                                                    <span className="text-amber-600">฿{parseFloat(p.serviceFee || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Side Summary & Actions */}
                <div className="space-y-4">
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-gray-700">สรุปค่าใช้จ่าย/เดือน</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">ค่าเช่า</span>
                                <span className="font-semibold text-teal-600">฿{rent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ค่าบริการ</span>
                                <span className="font-semibold text-amber-600">฿{serviceFee.toLocaleString()}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="font-medium">รวม</span>
                                <span className="font-bold text-lg">฿{(rent + serviceFee).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-teal-800">การดำเนินการ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full btn-gold" asChild>
                                <Link href={`/dashboard/contracts/${id}/edit`}>แก้ไขสัญญา</Link>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboard/contracts/${id}/renew`}>ต่อสัญญา</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

