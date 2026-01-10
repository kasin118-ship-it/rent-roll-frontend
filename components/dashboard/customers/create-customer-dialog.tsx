"use client";

import { useState } from "react";
import { Plus, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";

interface CreateCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateCustomerDialog({ open, onOpenChange }: CreateCustomerDialogProps) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [customerType, setCustomerType] = useState("corporate");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call or strictly implement if backend is ready.
        // The original code hinted at an API call.
        // Assuming /customers POST exist or will exist.
        // For now, let's keep the toast as per original code, but add query invalidation

        try {
            // await api.post('/customers', formData); // Uncomment when real API is ready if needed
            // For now just simulate success as per original code
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success("Customer created successfully!");
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to create customer");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-heading font-bold text-teal-700">{t("customers.addCustomer")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCustomer} className="space-y-5">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("customers.customerType")}</Label>
                                <Select value={customerType} onValueChange={setCustomerType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("customers.typePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="corporate">{t("customers.corporate")}</SelectItem>
                                        <SelectItem value="individual">{t("customers.individual")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">
                                    {customerType === "individual" ? t("customers.citizenId") : t("customers.taxId")}
                                </Label>
                                <Input placeholder="0105551234567" className="font-mono text-sm" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">{t("customers.name")}</Label>
                            <Input placeholder={t("customers.namePlaceholder")} required className="h-10" />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("customers.phone")}</Label>
                                <Input placeholder="02-123-4567" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("customers.email")}</Label>
                                <Input type="email" placeholder="contact@company.com" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">{t("customers.address")}</Label>
                            <Textarea placeholder={t("customers.addressPlaceholder")} className="resize-none" rows={3} />
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <h3 className="font-heading font-semibold text-teal-700">{t("customers.contactPerson")}</h3>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{t("customers.contactName")}</Label>
                                <Input placeholder={t("customers.contactPersonPlaceholder")} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">{t("customers.contactPhone")}</Label>
                                    <Input placeholder="081-234-5678" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">{t("customers.contactEmail")}</Label>
                                    <Input type="email" placeholder="person@company.com" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="px-6" disabled={isLoading}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" className="btn-gold px-6" disabled={isLoading}>
                            {isLoading ? "Creating..." : t("customers.createCustomer")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
