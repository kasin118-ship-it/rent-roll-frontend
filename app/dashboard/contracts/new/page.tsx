"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Users, FileText, Upload, Eye, Building2, CalendarIcon, Plus, Trash2, Layers, DollarSign, Cloud } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Steps
const steps = [
    { id: 1, name: "Customer", icon: Users },
    { id: 2, name: "Terms", icon: FileText },
    { id: 3, name: "Documents", icon: Upload },
    { id: 4, name: "Review", icon: Eye },
];

// Mock data
const customers = [
    { id: "1", name: "ABC Corporation", taxId: "0105551234567", type: "corporate" },
    { id: "2", name: "XYZ Trading", taxId: "0105559876543", type: "corporate" },
    { id: "3", name: "Global Tech", taxId: "0105552468135", type: "corporate" },
];

const buildings = [
    { id: "1", name: "Kingbridge Tower A" },
    { id: "2", name: "Kingbridge Tower B" },
];

// Types
interface RentPeriod {
    id: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    monthlyRent: number;
    serviceFee: number;
}

interface RentalSpace {
    id: string;
    buildingId: string;
    buildingName: string;
    floor: string;
    areaSqm: number;
    rentPeriods: RentPeriod[];
}

// Date Picker Component
function DatePicker({
    value,
    onChange,
    placeholder = "Select date"
}: {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gold-500" />
                    {value ? format(value, "dd MMM yyyy", { locale: th }) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export default function ContractWizardPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        customerId: "",
        customerName: "",
        contractNo: "",
        contractStartDate: undefined as Date | undefined,
        contractEndDate: undefined as Date | undefined,
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
                ] as RentPeriod[],
            }
        ] as RentalSpace[],
        documents: [] as File[],
    });

    const handleCustomerSelect = (customer: typeof customers[0]) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
        }));
    };

    // Document Upload Handlers
    const onDrop = (acceptedFiles: File[]) => {
        setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, ...acceptedFiles],
        }));
        toast.success(`Attached ${acceptedFiles.length} file(s)`);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg'],
            'application/msword': ['.doc', '.docx'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxSize: 10485760 // 10MB
    });

    const removeDocument = (index: number) => {
        setFormData(prev => {
            const newDocs = [...prev.documents];
            newDocs.splice(index, 1);
            return { ...prev, documents: newDocs };
        });
    };

    // Rental Space handlers
    const addRentalSpace = () => {
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
    };

    const removeRentalSpace = (id: string) => {
        if (formData.rentalSpaces.length > 1) {
            setFormData(prev => ({
                ...prev,
                rentalSpaces: prev.rentalSpaces.filter(s => s.id !== id),
            }));
        }
    };

    const updateRentalSpace = (id: string, field: keyof RentalSpace, value: any) => {
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
    };

    // Rent Period handlers
    const addRentPeriod = (spaceId: string) => {
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
    };

    const removeRentPeriod = (spaceId: string, periodId: string) => {
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
    };

    const updateRentPeriod = (spaceId: string, periodId: string, field: keyof RentPeriod, value: any) => {
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
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
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
                    rentPeriods: space.rentPeriods.map(p => ({
                        startDate: p.startDate ? format(p.startDate, 'yyyy-MM-dd') : '',
                        endDate: p.endDate ? format(p.endDate, 'yyyy-MM-dd') : '',
                        rentAmount: p.monthlyRent,
                        serviceFee: p.serviceFee
                    }))
                }))
            };

            const payload = new FormData();
            payload.append('data', JSON.stringify(dto));

            // Append files
            formData.documents.forEach((file) => {
                payload.append('documents', file);
            });

            // Use fetch for multipart
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/contracts`, {
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

            toast.success("Contract created successfully with documents!");
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
                return formData.contractNo && formData.contractStartDate && formData.contractEndDate && hasValidSpaces;
            }
            case 3: return true;
            case 4: return true;
            default: return false;
        }
    };

    // Calculate totals
    const totalArea = formData.rentalSpaces.reduce((sum, s) => sum + s.areaSqm, 0);
    const totalMonthlyRent = formData.rentalSpaces.reduce((sum, s) =>
        sum + (s.rentPeriods[0]?.monthlyRent || 0), 0
    );
    const totalServiceFee = formData.rentalSpaces.reduce((sum, s) =>
        sum + (s.rentPeriods[0]?.serviceFee || 0), 0
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-teal-700">New Contract</h1>
                <p className="text-gray-500 mt-1">Create a new rental contract</p>
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
                                currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <Card className="border-none shadow-xl bg-white">
                <CardContent className="p-8">
                    {/* Step 1: Customer Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <CardTitle className="text-xl text-teal-700">Select Customer</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Choose the customer for this contract</p>
                            </div>
                            <Input placeholder="🔍 Search customers..." className="bg-gray-50 border-gray-200 focus:bg-white" />
                            <div className="grid gap-3">
                                {customers.map(customer => (
                                    <div
                                        key={customer.id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                            formData.customerId === customer.id
                                                ? "border-gold-500 bg-gradient-to-r from-gold-50 to-amber-50 shadow-md"
                                                : "border-gray-100 bg-white hover:border-gold-300 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                                    formData.customerId === customer.id ? "bg-gold-500" : "bg-teal-500"
                                                )}>
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-teal-700">{customer.name}</p>
                                                    <p className="text-sm text-gray-500">Tax ID: {customer.taxId}</p>
                                                </div>
                                            </div>
                                            {formData.customerId === customer.id && (
                                                <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contract Terms */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <CardTitle className="text-xl text-teal-700">Contract Terms</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Define rental spaces with tiered pricing</p>
                            </div>

                            {/* Contract Info */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Contract Number</Label>
                                    <Input
                                        value={formData.contractNo}
                                        onChange={e => setFormData(prev => ({ ...prev, contractNo: e.target.value }))}
                                        placeholder="KB-2024-001"
                                        className="bg-gray-50 focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contract Start</Label>
                                    <DatePicker
                                        value={formData.contractStartDate}
                                        onChange={date => setFormData(prev => ({ ...prev, contractStartDate: date }))}
                                        placeholder="Start date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contract End</Label>
                                    <DatePicker
                                        value={formData.contractEndDate}
                                        onChange={date => setFormData(prev => ({ ...prev, contractEndDate: date }))}
                                        placeholder="End date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Deposit (THB)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
                                        <Input
                                            type="number"
                                            className="bg-gray-50 focus:bg-white pl-7"
                                            value={formData.depositAmount || ""}
                                            onChange={e => setFormData(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
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
                                            <h3 className="font-semibold text-teal-700">Rental Spaces</h3>
                                            <p className="text-xs text-gray-500">Each space can have tiered pricing</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addRentalSpace}
                                        className="border-teal-300 text-teal-600 hover:bg-teal-50"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Space
                                    </Button>
                                </div>

                                {/* Rental Space Cards */}
                                <div className="space-y-6">
                                    {formData.rentalSpaces.map((space, spaceIndex) => (
                                        <div
                                            key={space.id}
                                            className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200"
                                        >
                                            {/* Space Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                                                        {spaceIndex + 1}
                                                    </div>
                                                    <span className="font-medium text-teal-700">
                                                        {space.buildingName && space.floor
                                                            ? `${space.buildingName} - ชั้น ${space.floor}`
                                                            : `Rental Space ${spaceIndex + 1}`}
                                                    </span>
                                                </div>
                                                {formData.rentalSpaces.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRentalSpace(space.id)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Property Info Row */}
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">Building</Label>
                                                    <Select
                                                        value={space.buildingId}
                                                        onValueChange={v => updateRentalSpace(space.id, "buildingId", v)}
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
                                                    <Label className="text-xs text-gray-500">Floor</Label>
                                                    <Input
                                                        placeholder="e.g. 1, G, M"
                                                        className="bg-white h-9"
                                                        value={space.floor}
                                                        onChange={e => updateRentalSpace(space.id, "floor", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">Area</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            className="bg-white h-9 pr-12"
                                                            value={space.areaSqm || ""}
                                                            onChange={e => updateRentalSpace(space.id, "areaSqm", parseFloat(e.target.value) || 0)}
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
                                                        <span className="text-sm font-medium text-amber-700">Pricing Tiers</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addRentPeriod(space.id)}
                                                        className="h-7 text-xs text-amber-600 hover:bg-amber-100"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add Tier
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {/* Header */}
                                                    <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 px-1">
                                                        <span>Start Date</span>
                                                        <span>End Date</span>
                                                        <span>Monthly Rent</span>
                                                        <span>Service Fee</span>
                                                        <span></span>
                                                    </div>

                                                    {space.rentPeriods.map((period, periodIndex) => (
                                                        <div key={period.id} className="grid grid-cols-5 gap-2 items-center">
                                                            <DatePicker
                                                                value={period.startDate}
                                                                onChange={date => updateRentPeriod(space.id, period.id, "startDate", date)}
                                                                placeholder="Start"
                                                            />
                                                            <DatePicker
                                                                value={period.endDate}
                                                                onChange={date => updateRentPeriod(space.id, period.id, "endDate", date)}
                                                                placeholder="End"
                                                            />
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">฿</span>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Rent"
                                                                    className="bg-white h-9 pl-5 text-sm"
                                                                    value={period.monthlyRent || ""}
                                                                    onChange={e => updateRentPeriod(space.id, period.id, "monthlyRent", parseFloat(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">฿</span>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Service"
                                                                    className="bg-white h-9 pl-5 text-sm"
                                                                    value={period.serviceFee || ""}
                                                                    onChange={e => updateRentPeriod(space.id, period.id, "serviceFee", parseFloat(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                            {space.rentPeriods.length > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeRentPeriod(space.id, period.id)}
                                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-xs text-teal-600">Total Spaces</p>
                                            <p className="text-lg font-bold text-teal-700">{formData.rentalSpaces.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-teal-600">Total Area</p>
                                            <p className="text-lg font-bold text-teal-700">{totalArea.toLocaleString()} ตร.ม.</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-teal-600">Total Monthly (Rent + Service)</p>
                                        <p className="text-2xl font-bold text-gold-600">
                                            ฿{(totalMonthlyRent + totalServiceFee).toLocaleString()}
                                            <span className="text-sm text-gray-500 font-normal ml-2">
                                                (฿{totalMonthlyRent.toLocaleString()} + ฿{totalServiceFee.toLocaleString()})
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes about this contract..."
                                    className="bg-gray-50 focus:bg-white min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Documents */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <CardTitle className="text-xl text-teal-700">Upload Documents</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Attach relevant documents to this contract</p>
                            </div>

                            <div
                                {...getRootProps()}
                                className={cn(
                                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                                    isDragActive
                                        ? "border-gold-500 bg-gold-50"
                                        : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gold-300"
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-4">
                                    <Upload className={cn("w-8 h-8", isDragActive ? "text-gold-600" : "text-gold-500")} />
                                </div>
                                {isDragActive ? (
                                    <p className="text-gold-700 font-medium">Drop the files here...</p>
                                ) : (
                                    <>
                                        <p className="text-gray-600 font-medium">Drag and drop files here</p>
                                        <p className="text-sm text-gray-400 mt-2">or click to browse</p>
                                    </>
                                )}
                                <p className="text-xs text-gray-400 mt-4">Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                                <Button variant="outline" className="mt-6 border-gold-300 text-gold-600 hover:bg-gold-50" onClick={(e) => e.preventDefault()}>
                                    Browse Files
                                </Button>
                            </div>

                            {/* File List */}
                            {formData.documents && formData.documents.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="text-gray-600">Attached Files ({formData.documents.length})</Label>
                                    <div className="grid gap-3">
                                        {formData.documents.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</p>
                                                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeDocument(index)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Google Cloud Info Alert */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                                <div className="mt-1">
                                    <Cloud className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-800">Storage Information</h4>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Files are securely stored in Google Cloud Storage. Ensure backend GCS credentials are configured.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <CardTitle className="text-xl text-teal-700">Review Contract</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">Please review all details before creating</p>
                            </div>

                            {/* Contract Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                                    <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Customer</p>
                                    <p className="text-lg font-semibold text-teal-700 mt-1">{formData.customerName}</p>
                                </div>
                                <div className="p-5 bg-gradient-to-br from-gold-50 to-amber-50 rounded-xl">
                                    <p className="text-xs text-gold-600 font-medium uppercase tracking-wide">Contract No.</p>
                                    <p className="text-lg font-semibold text-teal-700 mt-1">{formData.contractNo}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500">Contract Period</p>
                                    <p className="font-medium mt-1">
                                        {formData.contractStartDate ? format(formData.contractStartDate, "dd/MM/yy") : "-"} - {formData.contractEndDate ? format(formData.contractEndDate, "dd/MM/yy") : "-"}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500">Total Area</p>
                                    <p className="font-medium mt-1">{totalArea.toLocaleString()} ตร.ม.</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500">Deposit</p>
                                    <p className="font-medium mt-1">฿{formData.depositAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Rental Spaces Summary */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-teal-700 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Rental Spaces ({formData.rentalSpaces.length})
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
                                        <p className="text-sm text-white/80">Monthly Rent</p>
                                        <p className="text-2xl font-bold">฿{totalMonthlyRent.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-white/80">Service Fee</p>
                                        <p className="text-2xl font-bold">฿{totalServiceFee.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-white/80">Total Monthly</p>
                                        <p className="text-3xl font-bold">฿{(totalMonthlyRent + totalServiceFee).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => currentStep === 1 ? router.back() : setCurrentStep(prev => prev - 1)}
                    className="px-6"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {currentStep === 1 ? "Cancel" : "Back"}
                </Button>

                {currentStep < 4 ? (
                    <Button
                        className="btn-gold px-8"
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        disabled={!canProceed()}
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        className="btn-gold px-8"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create Contract"}
                    </Button>
                )}
            </div>
        </div>
    );
}
