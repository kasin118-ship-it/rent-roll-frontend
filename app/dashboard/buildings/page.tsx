"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Building2, Layers, MapPin, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
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
    ownerCompany?: string;
    ownerName?: string;
    // Computed on frontend or from API if available
    units?: any[];
    status: string;
}




export default function BuildingsPage() {
    const { t } = useLanguage();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Building>>({});
    const queryClient = useQueryClient();

    // TanStack Query
    const { data: buildings = [], isLoading } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get('/buildings');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/buildings/${id}`);
        },
        onSuccess: () => {
            toast.success("ลบอาคารเรียบร้อยแล้ว");
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            setDeleteDialogOpen(false);
            setSelectedBuilding(null);
        },
        onError: () => {
            toast.error("เกิดข้อผิดพลาดในการลบอาคาร");
        }
    });

    // Edit mutation
    const editMutation = useMutation({
        mutationFn: async (data: { id: string; updates: Partial<Building> }) => {
            await api.patch(`/buildings/${data.id}`, data.updates);
        },
        onSuccess: () => {
            toast.success("แก้ไขอาคารเรียบร้อยแล้ว");
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            setEditDialogOpen(false);
            setSelectedBuilding(null);
        },
        onError: () => {
            toast.error("เกิดข้อผิดพลาดในการแก้ไขอาคาร");
        }
    });

    const debouncedSearch = useDebounce(search, 300);

    const filteredBuildings = useMemo(() => {
        return buildings.filter((b: Building) =>
            b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            b.code.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [buildings, debouncedSearch]);

    const handleViewDetails = (building: Building) => {
        setSelectedBuilding(building);
        setViewDialogOpen(true);
    };

    const handleEdit = (building: Building) => {
        setSelectedBuilding(building);
        setEditForm({
            name: building.name,
            code: building.code,
            address: building.address,
            totalFloors: building.totalFloors,
            rentableArea: building.rentableArea,
            ownerCompany: building.ownerCompany,
            ownerName: building.ownerName,
        });
        setEditDialogOpen(true);
    };

    const handleDelete = (building: Building) => {
        setSelectedBuilding(building);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedBuilding) {
            deleteMutation.mutate(selectedBuilding.id);
        }
    };

    const confirmEdit = () => {
        if (selectedBuilding) {
            editMutation.mutate({ id: selectedBuilding.id, updates: editForm });
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact Header & Search */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-teal-700">{t("buildings.title")}</h1>
                        <p className="text-xs text-gray-500">{t("buildings.subtitle")}</p>
                    </div>
                    <Button size="sm" className="btn-gold h-9" onClick={() => setIsDialogOpen(true)}>
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
                        className="!pl-10"
                        style={{ paddingLeft: "2.5rem" }}
                    />
                </div>
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
                ) : filteredBuildings.map((building: any) => {
                    // Now use occupancyRate and rentedArea from API
                    const occupancyRate = building.occupancyRate || 0;
                    const rentedArea = building.rentedArea || 0;
                    const vacantArea = Number(building.rentableArea || 0) - rentedArea;
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
                                        <span className="text-gray-500">{Number(building.rentableArea).toLocaleString()} ตร.ม.</span>
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
                                        <span>{rentedArea.toLocaleString()} ตร.ม. เช่าแล้ว</span>
                                        <span>{vacantArea.toLocaleString()} ตร.ม. ว่าง</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(building)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        ดูรายละเอียด
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(building)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                แก้ไข
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(building)} className="text-red-600">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                ลบ
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-teal-600" />
                            {selectedBuilding?.name}
                        </DialogTitle>
                        <DialogDescription>รายละเอียดอาคาร</DialogDescription>
                    </DialogHeader>
                    {selectedBuilding && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">รหัสอาคาร</Label>
                                    <p className="font-medium">{selectedBuilding.code}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">สถานะ</Label>
                                    <Badge variant={selectedBuilding.status === "active" ? "default" : "secondary"}>
                                        {selectedBuilding.status}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-gray-500">ที่อยู่</Label>
                                <p className="font-medium">{selectedBuilding.address}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">จำนวนชั้น</Label>
                                    <p className="font-medium">{selectedBuilding.totalFloors} ชั้น</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">พื้นที่เช่า</Label>
                                    <p className="font-medium">{selectedBuilding.rentableArea.toLocaleString()} ตร.ม.</p>
                                </div>
                            </div>
                            {selectedBuilding.ownerCompany && (
                                <div>
                                    <Label className="text-gray-500">บริษัทเจ้าของ</Label>
                                    <p className="font-medium">{selectedBuilding.ownerCompany}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div>
                                    <Label className="text-gray-500">จำนวนยูนิต</Label>
                                    <p className="font-medium">{selectedBuilding.units?.length || 0} ยูนิต</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">มีผู้เช่า</Label>
                                    <p className="font-medium">{selectedBuilding.units?.filter((u: any) => u.status === 'occupied').length || 0} ยูนิต</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>ปิด</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>แก้ไขอาคาร</DialogTitle>
                        <DialogDescription>แก้ไขข้อมูลอาคาร {selectedBuilding?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>ชื่ออาคาร</Label>
                                <Input
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>รหัสอาคาร</Label>
                                <Input
                                    value={editForm.code || ""}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>ที่อยู่</Label>
                            <Input
                                value={editForm.address || ""}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>จำนวนชั้น</Label>
                                <Input
                                    type="number"
                                    value={editForm.totalFloors || ""}
                                    onChange={(e) => setEditForm({ ...editForm, totalFloors: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>พื้นที่เช่า (ตร.ม.)</Label>
                                <Input
                                    type="number"
                                    value={editForm.rentableArea || ""}
                                    onChange={(e) => setEditForm({ ...editForm, rentableArea: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={confirmEdit} disabled={editMutation.isPending}>
                            {editMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">ยืนยันการลบอาคาร</DialogTitle>
                        <DialogDescription>
                            คุณแน่ใจหรือไม่ว่าต้องการลบอาคาร <strong>{selectedBuilding?.name}</strong>?
                            <br />
                            <span className="text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "กำลังลบ..." : "ลบ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

