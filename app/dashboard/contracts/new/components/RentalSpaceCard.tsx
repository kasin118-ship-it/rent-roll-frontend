"use client";

import React, { memo } from "react";
import { Trash2, Layers, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { DatePicker } from "@/components/ui/date-picker";
import { RentalSpace, RentPeriod, Building } from "../types";

interface RentalSpaceCardProps {
    space: RentalSpace;
    index: number;
    totalSpaces: number;
    buildings: Building[];
    onRemove: (id: string) => void;
    onUpdate: (id: string, field: keyof RentalSpace, value: any) => void;
    onAddPeriod: (spaceId: string) => void;
    onRemovePeriod: (spaceId: string, periodId: string) => void;
    onUpdatePeriod: (spaceId: string, periodId: string, field: keyof RentPeriod, value: any) => void;
}

function RentalSpaceCardComponent({
    space,
    index,
    totalSpaces,
    buildings,
    onRemove,
    onUpdate,
    onAddPeriod,
    onRemovePeriod,
    onUpdatePeriod
}: RentalSpaceCardProps) {
    const { t } = useLanguage();

    return (
        <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
            {/* Space Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                    </div>
                    <span className="font-medium text-teal-700">
                        {space.buildingName && space.floor
                            ? `${space.buildingName} - ชั้น ${space.floor}`
                            : `Rental Space ${index + 1}`}
                    </span>
                </div>
                {totalSpaces > 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(space.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Property Info Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">{t("contracts.wizard.building")}</Label>
                    <Select
                        value={space.buildingId}
                        onValueChange={v => onUpdate(space.id, "buildingId", v)}
                    >
                        <SelectTrigger className="bg-white h-9">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            {buildings.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">{t("contracts.wizard.floor")}</Label>
                    <Input
                        placeholder="e.g. 1, G, M"
                        className="bg-white h-9"
                        value={space.floor}
                        onChange={e => onUpdate(space.id, "floor", e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">{t("contracts.wizard.area")}</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0"
                            className="bg-white h-9 pr-12"
                            value={space.areaSqm || ""}
                            onChange={e => onUpdate(space.id, "areaSqm", parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ตร.ม.</span>
                    </div>
                </div>
            </div>

            {/* Rent Periods (Tiered Pricing) */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">{t("contracts.wizard.pricingTiers")}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddPeriod(space.id)}
                        className="h-7 text-xs text-amber-600 hover:bg-amber-100"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        {t("contracts.wizard.addTier")}
                    </Button>
                </div>

                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-2">
                        <div className="col-span-3">{t("contracts.wizard.tierStart")}</div>
                        <div className="col-span-3">{t("contracts.wizard.tierEnd")}</div>
                        <div className="col-span-3">{t("contracts.wizard.tierRent")}</div>
                        <div className="col-span-2">{t("contracts.wizard.tierService")}</div>
                        <div className="col-span-1"></div>
                    </div>

                    {space.rentPeriods.map((period, pIndex) => (
                        <div key={period.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                                <DatePicker
                                    value={period.startDate}
                                    onChange={date => onUpdatePeriod(space.id, period.id, "startDate", date)}
                                    placeholder={t("contracts.wizard.tierStart")}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="col-span-3">
                                <DatePicker
                                    value={period.endDate}
                                    onChange={date => onUpdatePeriod(space.id, period.id, "endDate", date)}
                                    placeholder={t("contracts.wizard.tierEnd")}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="col-span-3">
                                <Input
                                    type="number"
                                    className="h-8 text-xs bg-white"
                                    value={period.monthlyRent || ""}
                                    onChange={e => onUpdatePeriod(space.id, period.id, "monthlyRent", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    className="h-8 text-xs bg-white"
                                    value={period.serviceFee || ""}
                                    onChange={e => onUpdatePeriod(space.id, period.id, "serviceFee", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="col-span-1 text-center">
                                {space.rentPeriods.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onRemovePeriod(space.id, period.id)}
                                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export const RentalSpaceCard = memo(RentalSpaceCardComponent);
