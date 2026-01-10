"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { Layers } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContractFormData } from "../types";

interface Step4ReviewProps {
    formData: ContractFormData;
}

export function Step4Review({ formData }: Step4ReviewProps) {
    const { t } = useLanguage();

    const totalArea = useMemo(() => formData.rentalSpaces.reduce((sum, s) => sum + s.areaSqm, 0), [formData.rentalSpaces]);
    const totalMonthlyRent = useMemo(() => formData.rentalSpaces.reduce((sum, s) =>
        sum + (s.rentPeriods[0]?.monthlyRent || 0), 0
    ), [formData.rentalSpaces]);
    const totalServiceFee = useMemo(() => formData.rentalSpaces.reduce((sum, s) =>
        sum + (s.rentPeriods[0]?.serviceFee || 0), 0
    ), [formData.rentalSpaces]);

    return (
        <div className="space-y-6">
            <div>
                <CardTitle className="text-xl text-teal-700">{t("contracts.wizard.reviewContract")}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t("contracts.wizard.reviewDesc")}</p>
            </div>

            {/* Contract Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                    <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">{t("contracts.wizard.customer")}</p>
                    <p className="text-lg font-semibold text-teal-700 mt-1">{formData.customerName}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-gold-50 to-amber-50 rounded-xl">
                    <p className="text-xs text-gold-600 font-medium uppercase tracking-wide">{t("contracts.wizard.contractNumber")}</p>
                    <p className="text-lg font-semibold text-teal-700 mt-1">{formData.contractNo}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">{t("contracts.wizard.contractPeriod")}</p>
                    <p className="font-medium mt-1">
                        {formData.contractStartDate ? format(formData.contractStartDate, "dd/MM/yy") : "-"} - {formData.contractEndDate ? format(formData.contractEndDate, "dd/MM/yy") : "-"}
                    </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">{t("contracts.wizard.totalArea")}</p>
                    <p className="font-medium mt-1">{totalArea.toLocaleString()} ตร.ม.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">{t("contracts.wizard.deposit")}</p>
                    <p className="font-medium mt-1">฿{formData.depositAmount.toLocaleString()}</p>
                </div>
            </div>

            {/* Rental Spaces Summary */}
            <div className="space-y-3">
                <h4 className="font-medium text-teal-700 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {t("contracts.wizard.rentalSpaces")} ({formData.rentalSpaces.length})
                </h4>
                {formData.rentalSpaces.map((space, index) => (
                    <div key={space.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-medium">{space.buildingName} ชั้น {space.floor}</p>
                                <p className="text-sm text-gray-500">{space.areaSqm} ตร.ม.</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {space.rentPeriods.map((period, pIndex) => (
                                <div key={period.id} className="flex justify-between text-sm bg-white p-2 rounded">
                                    <span className="text-gray-500">
                                        Tier {pIndex + 1}: {period.startDate ? format(period.startDate, "dd/MM/yy") : "-"} - {period.endDate ? format(period.endDate, "dd/MM/yy") : "-"}
                                    </span>
                                    <span className="font-medium">
                                        ฿{period.monthlyRent.toLocaleString()} + ฿{period.serviceFee.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-gradient-to-r from-gold-500 to-amber-500 rounded-xl text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-white/80">{t("contracts.wizard.tierRent")}</p>
                        <p className="text-2xl font-bold">฿{totalMonthlyRent.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-white/80">{t("contracts.wizard.tierService")}</p>
                        <p className="text-2xl font-bold">฿{totalServiceFee.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-white/80">{t("contracts.wizard.totalMonthly")}</p>
                        <p className="text-3xl font-bold">฿{(totalMonthlyRent + totalServiceFee).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
