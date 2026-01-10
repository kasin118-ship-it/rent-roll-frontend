"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function ContractDetailsClient() {
    const { id } = useParams();
    const { t } = useLanguage();

    // Mock Data (Replace with API fetch in future)
    const contract = {
        id: id,
        contractNo: "CNT-2024-001",
        customer: "Global Lumber Co., Ltd.",
        status: "active",
        startDate: "2024-01-01",
        endDate: "2026-12-31",
        period: "3 Years",
        depositAmount: 150000,
        rentalSpaces: [
            { name: "Unit 1201 (Floor 12)", area: 250, rent: 125000 },
        ]
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
                        Contract {contract.contractNo}
                        <Badge>{contract.status}</Badge>
                    </h1>
                    <p className="text-gray-500">View contract details and documents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <Card className="md:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-teal-700 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            General Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Customer</label>
                                <p className="font-medium text-lg">{contract.customer}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Contract Period</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{contract.startDate} - {contract.endDate}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Side Actions (Placeholder) */}
                <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-teal-800">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full btn-gold" disabled>Edit Contract</Button>
                            <Button variant="outline" className="w-full" disabled>Terminate</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
