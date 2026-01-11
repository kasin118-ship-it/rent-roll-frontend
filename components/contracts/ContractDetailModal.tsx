"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { FileText, Building2, Calendar, DollarSign, Download, ExternalLink, X, Users, CreditCard, StickyNote, FolderOpen } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContractDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string | null;
}

export function ContractDetailModal({ isOpen, onClose, contractId }: ContractDetailModalProps) {
    const { t } = useLanguage();

    const { data: contract, isLoading } = useQuery({
        queryKey: ['contract', contractId],
        queryFn: async () => {
            if (!contractId) return null;
            const res = await api.get(`/contracts/${contractId}`);
            // Safety check for wrapped responses
            return res.data.data || res.data;
        },
        enabled: !!contractId && isOpen,
    });

    const statusColors = {
        draft: "bg-gray-100 text-gray-700",
        active: "bg-green-100 text-green-700",
        expiring: "bg-amber-100 text-amber-700",
        expired: "bg-red-100 text-red-700",
        terminated: "bg-gray-200 text-gray-600",
    };

    const formatCurrency = (amount: number) => {
        return `฿${Number(amount).toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        return format(new Date(dateString), "dd/MM/yyyy");
    };

    // Calculate totals
    const totals = useMemo(() => {
        if (!contract?.contractUnits) return { rent: 0, fee: 0 };
        let rent = 0;
        let fee = 0;
        contract.contractUnits.forEach((u: any) => {
            const period = u.rentPeriods?.[0]; // Taking first period as baseline
            if (period) {
                rent += Number(period.rentAmount);
                fee += Number(period.serviceFee);
            }
        });
        return { rent, fee };
    }, [contract]);


    const getDocumentUrl = (filePath: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        return `${baseUrl}/uploads/${filePath?.replace(/^.*[\\\/]/, '')}`;
    };

    if (!contractId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b bg-white z-10 shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-heading font-bold text-teal-700 flex items-center gap-3">
                                {isLoading ? <Skeleton className="h-8 w-32" /> : contract?.contractNo}
                                {!isLoading && contract && (
                                    <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                                        {t(`contracts.status.${contract.status}`)}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {t("contracts.detailTitle") || "Contract Details"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : contract ? (
                    <ScrollArea className="flex-1 bg-white">
                        <div className="p-6 space-y-6">

                            {/* SECTION 1: CUSTOMER & PERIOD (FLAT LAYOUT) */}
                            <section>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded-lg overflow-hidden divide-y md:divide-y-0 md:divide-x">
                                    {/* Customer */}
                                    <div className="p-4 flex items-start gap-3 bg-white">
                                        <div className="p-2 bg-teal-50 rounded-md text-teal-600 mt-0.5 shrink-0">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">{t("contracts.customer")}</p>
                                            <p className="font-medium text-gray-900 truncate">{contract.customer?.name}</p>
                                            <p className="text-xs text-gray-400">{contract.customer?.taxId || "-"}</p>
                                        </div>
                                    </div>

                                    {/* Period */}
                                    <div className="p-4 flex items-start gap-3 bg-white">
                                        <div className="p-2 bg-amber-50 rounded-md text-amber-600 mt-0.5 shrink-0">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">{t("contracts.period")}</p>
                                            <p className="font-medium text-gray-900">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
                                            <p className="text-xs text-gray-400">{t("contracts.duration")}: 1 Year (Approx)</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: FINANCIAL SUMMARY (COMPACT GRID) */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" /> {t("contracts.tab.financial") || "Financials"}
                                </h3>
                                <div className="grid grid-cols-3 divide-x border rounded-lg bg-gray-50/50">
                                    <div className="p-4 bg-white">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t("contracts.deposit")}</p>
                                        <p className="text-lg font-bold text-teal-700 mt-1">{formatCurrency(contract.depositAmount)}</p>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t("contracts.totalRent")}</p>
                                        <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(totals.rent)}</p>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t("contracts.totalService")}</p>
                                        <p className="text-lg font-bold text-amber-700 mt-1">{formatCurrency(totals.fee)}</p>
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* SECTION 3: RENTAL SPACES */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-500" /> {t("contracts.rentalSpaces")} <span className="text-gray-400 font-normal">({contract.contractUnits?.length || 0})</span>
                                </h3>
                                <div className="space-y-3">
                                    {contract.contractUnits?.map((unit: any, index: number) => {
                                        const buildingName = unit.unit?.building?.name || unit.directBuilding?.name || "-";
                                        const unitCode = unit.unit?.code || `Floor ${unit.floor}`;

                                        return (
                                            <div key={index} className="border rounded-md overflow-hidden">
                                                <div className="bg-gray-50/80 px-4 py-2 border-b flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="font-medium text-gray-700">{buildingName}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="bg-white border px-1.5 py-0.5 rounded text-xs text-gray-600">{unitCode}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                        <span>{unit.areaSqm} Sqm.</span>
                                                    </div>
                                                </div>
                                                <div className="p-0">
                                                    <div className="grid grid-cols-[2fr_1fr_1fr] divide-x bg-white">
                                                        {unit.rentPeriods?.map((p: any, pIndex: number) => (
                                                            <div key={pIndex} className="contents text-sm">
                                                                <div className="p-3">
                                                                    <span className="text-[10px] text-gray-400 block uppercase tracking-wide mb-0.5">{t("contracts.period")}</span>
                                                                    <span className="text-gray-700 font-medium">{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
                                                                </div>
                                                                <div className="p-3 text-right">
                                                                    <span className="text-[10px] text-gray-400 block uppercase tracking-wide mb-0.5">{t("contracts.rent")}</span>
                                                                    <span className="text-blue-700 font-semibold">{formatCurrency(p.rentAmount)}</span>
                                                                </div>
                                                                <div className="p-3 text-right">
                                                                    <span className="text-[10px] text-gray-400 block uppercase tracking-wide mb-0.5">{t("contracts.service")}</span>
                                                                    <span className="text-amber-700 font-semibold">{formatCurrency(p.serviceFee)}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* SECTION 4: DOCUMENTS & NOTES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {/* DOCUMENTS */}
                                <section className="flex flex-col">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4 text-gray-500" /> {t("contracts.tab.documents")} <span className="text-gray-400 font-normal">({contract.documents?.length || 0})</span>
                                    </h3>
                                    {contract.documents && contract.documents.length > 0 ? (
                                        <div className="border rounded-md divide-y">
                                            {contract.documents.map((doc: any) => (
                                                <div key={doc.id} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm text-gray-700 truncate">{doc.fileName}</p>
                                                            <p className="text-[10px] text-gray-400">{formatDate(doc.uploadedAt)} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-gray-400 hover:text-teal-600" asChild>
                                                        <a href={getDocumentUrl(doc.filePath)} target="_blank" rel="noopener noreferrer">
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center border rounded-md border-dashed bg-gray-50">
                                            <p className="text-xs text-gray-400">No documents attached</p>
                                        </div>
                                    )}
                                </section>

                                {/* NOTES */}
                                <section className="flex flex-col">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <StickyNote className="w-4 h-4 text-gray-500" /> {t("contracts.notes")}
                                    </h3>
                                    <div className="flex-1 bg-yellow-50/50 border border-yellow-100 rounded-md p-4">
                                        <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                                            {contract.notes ? contract.notes : <span className="text-gray-400 italic">No notes available.</span>}
                                        </p>
                                    </div>
                                </section>
                            </div>

                        </div>
                    </ScrollArea>
                ) : (
                    <div className="p-6 text-center text-red-500">Failed to load contract details</div>
                )}

                <div className="p-4 border-t bg-white flex justify-end z-10">
                    <Button onClick={onClose} className="px-6">{t("common.close")}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
