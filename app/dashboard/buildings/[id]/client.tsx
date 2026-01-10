"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, MapPin, Layers } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BuildingDetailsClient() {
    const { id } = useParams();
    const { t } = useLanguage();

    // Mock Data
    const building = {
        id: id,
        name: "Kingbridge Tower A",
        code: "KT-A",
        address: "123 Sukhumvit Road",
        totalFloors: 25,
        rentableArea: 15000,
        status: "Active"
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-teal-50">
                    <Link href="/dashboard/buildings">
                        <ArrowLeft className="w-6 h-6 text-teal-700" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-teal-800 flex items-center gap-3">
                        {building.name}
                    </h1>
                    <p className="text-gray-500">{building.address}</p>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg text-teal-700 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Building Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Code</label>
                            <p className="font-medium text-lg">{building.code}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Total Floors</label>
                            <p className="font-medium text-lg flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-400" />
                                {building.totalFloors}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Rentable Area</label>
                            <p className="font-medium text-lg">{building.rentableArea.toLocaleString()} sqm</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
