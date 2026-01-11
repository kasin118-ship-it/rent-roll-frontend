"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Users, FileText, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { api, API_URL } from "@/lib/api";
import { ContractFormData, RentalSpace, RentPeriod, Building, Customer } from "./types";
import { Step1Customer } from "./components/Step1Customer";
import { Step2Terms } from "./components/Step2Terms";
import { Step3Documents } from "./components/Step3Documents";
import { Step4Review } from "./components/Step4Review";

// Mock data


export default function ContractWizardPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Buildings
    const { data: buildings = [] } = useQuery<Building[]>({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get('/buildings');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        }
    });

    // Fetch Customers
    const { data: customers = [] } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        }
    });

    // Initial State
    const [formData, setFormData] = useState<ContractFormData>({
        customerId: "",
        customerName: "",
        contractNo: "",
        contractStartDate: undefined,
        contractEndDate: undefined,
        depositAmount: 0,
        notes: "",
        rentalSpaces: [
            {
                id: "1",
                buildingId: "",
                buildingName: "",
                floor: "",
                areaSqm: 0,
                rentPeriods: [
                    { id: "1", startDate: undefined, endDate: undefined, monthlyRent: 0, serviceFee: 0 }
                ],
            }
        ],
        documents: [],
    });

    const steps = [
        { id: 1, name: t("contracts.wizard.customer"), icon: Users },
        { id: 2, name: t("contracts.wizard.terms"), icon: FileText },
        { id: 3, name: t("contracts.wizard.documents"), icon: Upload },
        { id: 4, name: t("contracts.wizard.review"), icon: Eye },
    ];

    // Handlers
    const handleCustomerSelect = useCallback((customer: typeof customers[0]) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
        }));
    }, []);

    const handleUpdateField = useCallback((field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleAddRentalSpace = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            rentalSpaces: [...prev.rentalSpaces, {
                id: Date.now().toString(),
                buildingId: "",
                buildingName: "",
                floor: "",
                areaSqm: 0,
                rentPeriods: [
                    { id: Date.now().toString(), startDate: undefined, endDate: undefined, monthlyRent: 0, serviceFee: 0 }
                ],
            }],
        }));
    }, []);

    const handleRemoveRentalSpace = useCallback((id: string) => {
        setFormData(prev => {
            if (prev.rentalSpaces.length <= 1) return prev;
            return {
                ...prev,
                rentalSpaces: prev.rentalSpaces.filter(s => s.id !== id),
            };
        });
    }, []);

    const handleUpdateRentalSpace = useCallback((id: string, field: keyof RentalSpace, value: any) => {
        setFormData(prev => ({
            ...prev,
            rentalSpaces: prev.rentalSpaces.map(s => {
                if (s.id === id) {
                    const updated = { ...s, [field]: value };
                    if (field === "buildingId") {
                        const building = buildings.find(b => b.id === value);
                        updated.buildingName = building?.name || "";
                    }
                    return updated;
                }
                return s;
            }),
        }));
    }, [buildings]);

    const handleAddRentPeriod = useCallback((spaceId: string) => {
        setFormData(prev => ({
            ...prev,
            rentalSpaces: prev.rentalSpaces.map(s => {
                if (s.id === spaceId) {
                    return {
                        ...s,
                        rentPeriods: [...s.rentPeriods, {
                            id: Date.now().toString(),
                            startDate: undefined,
                            endDate: undefined,
                            monthlyRent: 0,
                            serviceFee: 0,
                        }]
                    };
                }
                return s;
            }),
        }));
    }, []);

    const handleRemoveRentPeriod = useCallback((spaceId: string, periodId: string) => {
        setFormData(prev => ({
            ...prev,
            rentalSpaces: prev.rentalSpaces.map(s => {
                if (s.id === spaceId && s.rentPeriods.length > 1) {
                    return {
                        ...s,
                        rentPeriods: s.rentPeriods.filter(p => p.id !== periodId)
                    };
                }
                return s;
            }),
        }));
    }, []);

    const handleUpdateRentPeriod = useCallback((spaceId: string, periodId: string, field: keyof RentPeriod, value: any) => {
        setFormData(prev => ({
            ...prev,
            rentalSpaces: prev.rentalSpaces.map(s => {
                if (s.id === spaceId) {
                    return {
                        ...s,
                        rentPeriods: s.rentPeriods.map(p =>
                            p.id === periodId ? { ...p, [field]: value } : p
                        )
                    };
                }
                return s;
            }),
        }));
    }, []);

    const handleAddDocuments = useCallback((files: File[]) => {
        setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, ...files],
        }));
    }, []);

    const handleRemoveDocument = useCallback((index: number) => {
        setFormData(prev => {
            const newDocs = [...prev.documents];
            newDocs.splice(index, 1);
            return { ...prev, documents: newDocs };
        });
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // ... (Logic remains same, abstracted for brevity but fully implemented below)
        try {
            // Transform data map to DTO
            const dto = {
                customerId: formData.customerId,
                contractNo: formData.contractNo,
                startDate: formData.contractStartDate?.toISOString().split('T')[0],
                endDate: formData.contractEndDate?.toISOString().split('T')[0],
                depositAmount: formData.depositAmount,
                notes: formData.notes,
                rentalSpaces: formData.rentalSpaces.map(space => ({
                    buildingId: space.buildingId,
                    floor: space.floor,
                    areaSqm: space.areaSqm,
                    rentPeriods: space.rentPeriods.map(p => ({ // Fixed: removed .map typo potential
                        startDate: p.startDate ? format(p.startDate, 'yyyy-MM-dd') : '',
                        endDate: p.endDate ? format(p.endDate, 'yyyy-MM-dd') : '',
                        rentAmount: p.monthlyRent,
                        serviceFee: p.serviceFee
                    }))
                }))
            };

            const payload = new FormData();
            payload.append('data', JSON.stringify(dto));

            formData.documents.forEach((file) => {
                payload.append('documents', file);
            });

            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_URL}/contracts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create contract');
            }

            toast.success(t("contracts.createSuccess") || "Contract created successfully!");
            router.push("/dashboard/contracts");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create contract");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return formData.customerId !== "";
            case 2: {
                const hasValidSpaces = formData.rentalSpaces.every(s =>
                    s.buildingId && s.floor && s.areaSqm > 0 &&
                    s.rentPeriods.length > 0 && s.rentPeriods.every(p => p.monthlyRent > 0)
                );
                return !!(formData.contractNo && formData.contractStartDate && formData.contractEndDate && hasValidSpaces);
            }
            case 3: return true;
            case 4: return true;
            default: return false;
        }
    };

    // Need format for submission, imported from date-fns
    const { format } = require("date-fns");

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-teal-700">{t("contracts.newContract")}</h1>
                <p className="text-gray-500 mt-1">{t("dashboard.quickActions.newContractDesc")}</p>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                            currentStep > step.id
                                ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                : currentStep === step.id
                                    ? "bg-gold-500 text-white shadow-lg shadow-gold-200"
                                    : "bg-gray-100 text-gray-400"
                        )}>
                            {currentStep > step.id ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <step.icon className="w-5 h-5" />
                            )}
                        </div>
                        <span className={cn(
                            "ml-2 text-sm font-medium transition-colors",
                            currentStep >= step.id ? "text-teal-700" : "text-gray-400"
                        )}>
                            {step.name}
                        </span>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "w-16 h-1 mx-4 rounded-full transition-colors",
                                "h-1 rounded-full", // Ensure height
                                currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                            )} style={{ width: '4rem' }} /> // Force width via style if class fails
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <Card className="border-none shadow-xl bg-white">
                <CardContent className="p-8">
                    {currentStep === 1 && (
                        <Step1Customer
                            customers={customers}
                            selectedCustomerId={formData.customerId}
                            onSelect={handleCustomerSelect}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2Terms
                            contractNo={formData.contractNo}
                            contractStartDate={formData.contractStartDate}
                            contractEndDate={formData.contractEndDate}
                            depositAmount={formData.depositAmount}
                            rentalSpaces={formData.rentalSpaces}
                            buildings={buildings}
                            onUpdateField={handleUpdateField}
                            onAddRentalSpace={handleAddRentalSpace}
                            onRemoveRentalSpace={handleRemoveRentalSpace}
                            onUpdateRentalSpace={handleUpdateRentalSpace}
                            onAddRentPeriod={handleAddRentPeriod}
                            onRemoveRentPeriod={handleRemoveRentPeriod}
                            onUpdateRentPeriod={handleUpdateRentPeriod}
                        />
                    )}

                    {currentStep === 3 && (
                        <Step3Documents
                            documents={formData.documents}
                            onAddDocuments={handleAddDocuments}
                            onRemoveDocument={handleRemoveDocument}
                        />
                    )}

                    {currentStep === 4 && (
                        <Step4Review formData={formData} />
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/contracts")}
                        className="text-gray-500"
                    >
                        {t("common.cancel")}
                    </Button>

                    {currentStep > 1 && (
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="px-6"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            {t("contracts.wizard.back")}
                        </Button>
                    )}
                </div>

                {currentStep < 4 ? (
                    <Button
                        className="btn-gold px-8"
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        disabled={!canProceed()}
                    >
                        {t("contracts.wizard.next")}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        className="btn-gold px-8"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : t("contracts.wizard.createContract")}
                    </Button>
                )}
            </div>
        </div>
    );
}
