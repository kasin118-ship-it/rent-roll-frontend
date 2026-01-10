"use client";

import React from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { useLanguage } from "@/contexts/LanguageContext";
import { RentalSpaceCard } from "./RentalSpaceCard";
import { RentalSpace, RentPeriod, Building } from "../types";

interface Step2TermsProps {
    contractNo: string;
    contractStartDate: Date | undefined;
    contractEndDate: Date | undefined;
    depositAmount: number;
    rentalSpaces: RentalSpace[];
    buildings: Building[];
    onUpdateField: (field: string, value: any) => void;
    onAddRentalSpace: () => void;
    onRemoveRentalSpace: (id: string) => void;
    onUpdateRentalSpace: (id: string, field: keyof RentalSpace, value: any) => void;
    onAddRentPeriod: (spaceId: string) => void;
    onRemoveRentPeriod: (spaceId: string, periodId: string) => void;
    onUpdateRentPeriod: (spaceId: string, periodId: string, field: keyof RentPeriod, value: any) => void;
}

export function Step2Terms({
    contractNo,
    contractStartDate,
    contractEndDate,
    depositAmount,
    rentalSpaces,
    buildings,
    onUpdateField,
    onAddRentalSpace,
    onRemoveRentalSpace,
    onUpdateRentalSpace,
    onAddRentPeriod,
    onRemoveRentPeriod,
    onUpdateRentPeriod
}: Step2TermsProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <CardTitle className="text-xl text-teal-700">{t("contracts.wizard.contractTerms")}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t("contracts.wizard.defineSpaces")}</p>
            </div>

            {/* Contract Info */}
            <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>{t("contracts.wizard.contractNumber")}</Label>
                    <Input
                        value={contractNo}
                        onChange={e => onUpdateField("contractNo", e.target.value)}
                        placeholder="KB-2024-001"
                        className="bg-gray-50 focus:bg-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label>{t("contracts.wizard.startDate")}</Label>
                    <DatePicker
                        value={contractStartDate}
                        onChange={date => onUpdateField("contractStartDate", date)}
                        placeholder={t("contracts.wizard.startDate")}
                    />
                </div>
                <div className="space-y-2">
                    <Label>{t("contracts.wizard.endDate")}</Label>
                    <DatePicker
                        value={contractEndDate}
                        onChange={date => onUpdateField("contractEndDate", date)}
                        placeholder={t("contracts.wizard.endDate")}
                    />
                </div>
                <div className="space-y-2">
                    <Label>{t("contracts.wizard.deposit")}</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            className="bg-gray-50 focus:bg-white"
                            value={depositAmount || ""}
                            onChange={e => onUpdateField("depositAmount", parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Rental Spaces Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-teal-700">{t("contracts.wizard.rentalSpaces")}</h3>
                            <p className="text-xs text-gray-500">{t("contracts.wizard.eachSpace")}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddRentalSpace}
                        className="border-teal-300 text-teal-600 hover:bg-teal-50"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        {t("contracts.wizard.addSpace")}
                    </Button>
                </div>

                {/* Rental Space Cards */}
                <div className="space-y-6">
                    {rentalSpaces.map((space, spaceIndex) => (
                        <RentalSpaceCard
                            key={space.id}
                            space={space}
                            index={spaceIndex}
                            totalSpaces={rentalSpaces.length}
                            buildings={buildings}
                            onRemove={onRemoveRentalSpace}
                            onUpdate={onUpdateRentalSpace}
                            onAddPeriod={onAddRentPeriod}
                            onRemovePeriod={onRemoveRentPeriod}
                            onUpdatePeriod={onUpdateRentPeriod}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
