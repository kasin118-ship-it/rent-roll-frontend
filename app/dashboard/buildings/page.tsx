"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Building2, Layers, MapPin } from "lucide-react";
import Link from 'next/link';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import dynamic from 'next/dynamic';

// Lazy load dialog
const CreateBuildingDialog = dynamic(() => import('@/components/dashboard/buildings/create-building-dialog'), {
    loading: () => null,
});

// Empty mock data removal
interface Building {
    id: string;
    name: string;
    code: string;
    address: string;
    totalFloors: number;
    rentableArea: number;
    // Computed on frontend or from API if available
    units?: any[];
    status: string;
}




export default function BuildingsPage() {
    const { t } = useLanguage();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // TanStack Query
    const { data: buildings = [], isLoading } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get('/buildings');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        }
    });

    const debouncedSearch = useDebounce(search, 300);

    const filteredBuildings = useMemo(() => {
        return buildings.filter((b: Building) =>
            b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            b.code.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [buildings, debouncedSearch]);



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-teal-700">{t("buildings.title")}</h1>
                    <p className="text-gray-500 mt-1">{t("buildings.subtitle")}</p>
                </div>
                <Button className="btn-gold" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("buildings.addBuilding")}
                </Button>
                <CreateBuildingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder={t("buildings.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="!pl-14"
                    style={{ paddingLeft: "3.5rem" }}
                />
            </div>

            {/* Buildings Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="border-none shadow-md">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-12 h-12 rounded-lg" />
                                        <div>
                                            <Skeleton className="h-6 w-32 mb-2" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-4 h-4 rounded-full" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                    <Skeleton className="h-2 w-full rounded-full" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : filteredBuildings.map((building: Building) => {
                    const totalUnits = building.units?.length || 0;
                    const occupiedUnits = building.units?.filter((u: any) => u.status === 'occupied').length || 0;
                    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
                    return (
                        <Card key={building.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{building.name}</CardTitle>
                                            <p className="text-sm text-gray-500">{building.code}</p>
                                        </div>
                                    </div>
                                    <Badge variant={building.status === "active" ? "default" : "secondary"}>
                                        {building.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate">{building.address}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-gray-400" />
                                        <span>{building.totalFloors} {t("buildings.floors")}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{building.rentableArea.toLocaleString()} sqm</span>
                                    </div>
                                </div>

                                {/* Occupancy Bar */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">{t("buildings.occupancy")}</span>
                                        <span className="font-medium text-gold-600">{occupancyRate}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all"
                                            style={{ width: `${occupancyRate}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>{occupiedUnits} {t("buildings.occupied")}</span>
                                        <span>{totalUnits - occupiedUnits} {t("buildings.vacant")}</span>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/dashboard/buildings/${building.id}`}>
                                        {t("common.viewDetails")}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
