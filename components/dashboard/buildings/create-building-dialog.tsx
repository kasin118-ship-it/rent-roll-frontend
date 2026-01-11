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

interface CreateBuildingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateBuildingDialog({ open, onOpenChange }: CreateBuildingDialogProps) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateBuilding = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Simulate API
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success("Building created successfully!");
            queryClient.invalidateQueries({ queryKey: ['buildings'] });
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create building");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-heading font-bold text-teal-700">{t("buildings.addBuilding")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBuilding} className="space-y-5">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.buildingName")}</Label>
                                <Input placeholder="" required className="h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.code")}</Label>
                                <Input placeholder="" required className="h-10 font-mono" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700">{t("buildings.address")}</Label>
                            <Textarea placeholder="" className="resize-none" rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.ownerCompany")}</Label>
                                <Input placeholder="" className="h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.ownerName")}</Label>
                                <Input placeholder="" className="h-10" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.totalFloors")}</Label>
                                <Input type="number" placeholder="" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("buildings.rentableArea")}</Label>
                                <Input type="number" placeholder="" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="px-6" disabled={isLoading}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" className="btn-gold px-6" disabled={isLoading}>{t("buildings.createBuilding")}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
