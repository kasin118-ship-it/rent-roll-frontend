"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CreateBuildingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface BuildingFormData {
    name: string;
    code: string;
    address: string;
    ownerCompany: string;
    ownerName: string;
    totalFloors: string;
    rentableArea: string;
}

const initialFormData: BuildingFormData = {
    name: "",
    code: "",
    address: "",
    ownerCompany: "",
    ownerName: "",
    totalFloors: "",
    rentableArea: "",
};

export default function CreateBuildingDialog({ open, onOpenChange }: CreateBuildingDialogProps) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<BuildingFormData>(initialFormData);

    const handleChange = (field: keyof BuildingFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
    };

    const handleCreateBuilding = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                address: formData.address || undefined,
                ownerCompany: formData.ownerCompany || undefined,
                ownerName: formData.ownerName || undefined,
                totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
                rentableArea: formData.rentableArea ? parseFloat(formData.rentableArea) : undefined,
            };
            await api.post("/buildings", payload);
            toast.success("สร้างอาคารเรียบร้อยแล้ว");
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            resetForm();
            onOpenChange(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างอาคาร";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-xl p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-heading font-bold text-teal-700">{t("buildings.addBuilding")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBuilding} className="space-y-5">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.buildingName")}</Label>
                                <Input
                                    placeholder=""
                                    required
                                    className="h-10"
                                    value={formData.name}
                                    onChange={handleChange("name")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.code")}</Label>
                                <Input
                                    placeholder=""
                                    required
                                    className="h-10 font-mono"
                                    value={formData.code}
                                    onChange={handleChange("code")}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700">{t("buildings.address")}</Label>
                            <Textarea
                                placeholder=""
                                className="resize-none"
                                rows={3}
                                value={formData.address}
                                onChange={handleChange("address")}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.ownerCompany")}</Label>
                                <Input
                                    placeholder=""
                                    className="h-10"
                                    value={formData.ownerCompany}
                                    onChange={handleChange("ownerCompany")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.ownerName")}</Label>
                                <Input
                                    placeholder=""
                                    className="h-10"
                                    value={formData.ownerName}
                                    onChange={handleChange("ownerName")}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.totalFloors")}</Label>
                                <Input
                                    type="number"
                                    placeholder=""
                                    value={formData.totalFloors}
                                    onChange={handleChange("totalFloors")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.rentableArea")}</Label>
                                <Input
                                    type="number"
                                    placeholder=""
                                    value={formData.rentableArea}
                                    onChange={handleChange("rentableArea")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button variant="outline" type="button" onClick={() => handleOpenChange(false)} className="px-6" disabled={isLoading}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" className="btn-gold px-6" disabled={isLoading}>
                            {isLoading ? "กำลังสร้าง..." : t("buildings.createBuilding")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
