"use client";

import { useState, useRef } from "react";
import { Download, Upload, Database, Trash2, Shield, Globe, AlertTriangle, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    downloadTemplate,
    exportCustomers,
    exportBuildings,
    exportContractsFull,
    importExcelFile,
    validateImportData,
    type ImportResult,
} from "@/lib/excel-utils";

export default function SettingsPage() {
    const { language, setLanguage, t } = useLanguage();
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLanguageChange = (value: string) => {
        setLanguage(value as "en" | "th");
        toast.success(value === "th" ? "เปลี่ยนภาษาเป็นไทยเรียบร้อยแล้ว" : "Language changed to English");
    };

    const handleBackup = async () => {
        toast.loading("Creating backup...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.dismiss();
        toast.success("Backup created successfully!");
    };

    const handleRestore = async () => {
        toast.info("Select a backup file to restore");
    };

    const handleExportTemplate = (templateKey: string) => {
        try {
            downloadTemplate(templateKey as "customers" | "buildings" | "contractMaster" | "rentalSpaces" | "pricingTiers");
            toast.success(`${templateKey} template downloaded!`);
        } catch (error) {
            toast.error("Failed to download template");
        }
    };

    const handleFileSelect = async (file: File) => {
        if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            toast.error("Please select an Excel file (.xlsx or .xls)");
            return;
        }

        setIsImporting(true);
        setImportResults(null);

        try {
            const results = await importExcelFile(file);

            // Validate each sheet
            results.forEach(result => {
                const errors = validateImportData(result.sheetName, result.data);
                result.errors = errors;
                result.success = errors.length === 0;
            });

            setImportResults(results);

            const totalRows = results.reduce((sum, r) => sum + r.rowCount, 0);
            const hasErrors = results.some(r => r.errors.length > 0);

            if (hasErrors) {
                toast.warning(`Imported ${totalRows} rows with some validation errors`);
            } else {
                toast.success(`Successfully imported ${totalRows} rows from ${results.length} sheet(s)`);
            }
        } catch (error) {
            toast.error("Failed to import file: " + (error as Error).message);
        } finally {
            setIsImporting(false);
        }
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleFactoryReset = async () => {
        if (resetConfirmation !== "RESET") {
            toast.error("Please type RESET to confirm");
            return;
        }

        setIsResetting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            toast.success("Factory reset completed. Please login again.");
            setIsResetDialogOpen(false);
        } catch (error) {
            toast.error("Reset failed");
        } finally {
            setIsResetting(false);
            setResetConfirmation("");
        }
    };

    const handleSeedData = async () => {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm("This will generate test data (Buildings, Customers, Contracts). Continue?")) return;

        setIsSeeding(true);
        toast.info("Generating mock data... This may take a moment.");

        try {
            const { api } = await import("@/lib/api");
            const res = await api.post("/seed");
            toast.success(res.data?.message || "Mock data generated successfully!");
            // Reload page to see new data
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            toast.error("Seeding failed: " + (error?.response?.data?.message || error.message));
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-teal-700">{t("settings.title")}</h1>
                <p className="text-gray-500 mt-1">{t("settings.subtitle")}</p>
            </div>

            {/* Language & Preferences */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gold-500" />
                        {t("settings.langPref")}
                    </CardTitle>
                    <CardDescription>{t("settings.configDisplay")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{t("settings.language")}</Label>
                            <p className="text-sm text-gray-500">{t("settings.selectLang")}</p>
                        </div>
                        <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="th">ไทย</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </CardContent>
            </Card>

            {/* Backup & Restore */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-gold-500" />
                        {t("settings.backupRestore")}
                    </CardTitle>
                    <CardDescription>{t("settings.manageBackup")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Button onClick={handleBackup} className="btn-gold h-auto py-4 flex-col gap-2">
                            <Download className="w-6 h-6" />
                            <span>{t("settings.createBackup")}</span>
                        </Button>
                        <Button onClick={handleRestore} variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Upload className="w-6 h-6" />
                            <span>{t("settings.restoreBackup")}</span>
                        </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                        Last backup: <span className="font-medium">2024-01-10 09:00:00</span>
                    </div>
                </CardContent>
            </Card>

            {/* Import/Export */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-gold-500" />
                        {t("settings.importExportTitle")}
                    </CardTitle>
                    <CardDescription>{t("settings.importExportDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Contract Templates Info */}
                    <Alert className="bg-blue-50 border-blue-200">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-700">โครงสร้างข้อมูลสัญญาเช่า</AlertTitle>
                        <AlertDescription className="text-blue-600 text-xs mt-1">
                            <ul className="list-disc ml-4 space-y-1">
                                <li><strong>Contract Master</strong> - ข้อมูลสัญญาหลัก (เลขสัญญา, ลูกค้า, ระยะเวลา)</li>
                                <li><strong>Rental Spaces</strong> - พื้นที่เช่าแต่ละชั้น (อาคาร, ชั้น, พื้นที่ ตร.ม.)</li>
                                <li><strong>Pricing Tiers</strong> - ราคาเป็นช่วง (เริ่ม-สิ้นสุด, ค่าเช่า, ค่าบริการ)</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div>
                        <Label className="text-sm text-gray-500 mb-2 block">{t("settings.downloadTemplates")}</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleExportTemplate("customers")}>
                                <Download className="w-4 h-4 mr-2" />
                                Customers
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExportTemplate("buildings")}>
                                <Download className="w-4 h-4 mr-2" />
                                Buildings
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Contract-specific Templates */}
                    <div>
                        <Label className="text-sm text-teal-600 mb-2 block font-medium">📋 Contract Templates (Multi-Floor / Multi-Period)</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-teal-200 text-teal-700 hover:bg-teal-50"
                                onClick={() => handleExportTemplate("contractMaster")}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Contract Master
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => handleExportTemplate("rentalSpaces")}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Rental Spaces
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-gold-200 text-gold-700 hover:bg-gold-50"
                                onClick={() => handleExportTemplate("pricingTiers")}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Pricing Tiers
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <Label className="text-sm text-gray-500 mb-2 block">{t("settings.exportSystemData")}</Label>
                        <p className="text-xs text-gray-400 mb-2">{t("settings.exportDataDesc")}</p>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                exportCustomers();
                                toast.success("ส่งออกข้อมูลลูกค้าเรียบร้อย!");
                            }}>
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-teal-600" />
                                Export Customers
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                                exportBuildings();
                                toast.success("ส่งออกข้อมูลอาคารเรียบร้อย!");
                            }}>
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-teal-600" />
                                Export Buildings
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                                exportContractsFull();
                                toast.success("ส่งออกข้อมูลสัญญา (พร้อมพื้นที่และราคา) เรียบร้อย!");
                            }}>
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-gold-600" />
                                Export Contracts (Full)
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <Label className="text-sm text-gray-500 mb-2 block">{t("settings.importData")}</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                                e.target.value = "";
                            }}
                        />
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={handleImport}
                        >
                            {isImporting ? (
                                <>
                                    <div className="w-8 h-8 mx-auto mb-2 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-teal-600">กำลังนำเข้าข้อมูล...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500 mb-2">{t("settings.dragDrop")}</p>
                                    <p className="text-xs text-gray-400 mb-3">รองรับ: Customers, Buildings, Units, Contract Master, Rental Spaces, Pricing Tiers</p>
                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleImport(); }}>
                                        {t("settings.browseFiles")}
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Import Results */}
                        {importResults && (
                            <div className="mt-4 space-y-2">
                                <Label className="text-sm font-medium">ผลการนำเข้า:</Label>
                                {importResults.map((result, idx) => (
                                    <div key={idx} className={`p-3 rounded-lg text-sm ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                                        <div className="flex items-center gap-2">
                                            {result.success ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            )}
                                            <span className="font-medium">{result.sheetName}</span>
                                            <span className="text-gray-500">({result.rowCount} แถว)</span>
                                        </div>
                                        {result.errors.length > 0 && (
                                            <ul className="mt-2 text-xs text-red-600 list-disc ml-6">
                                                {result.errors.slice(0, 3).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                                {result.errors.length > 3 && (
                                                    <li>...และอีก {result.errors.length - 3} errors</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gold-500" />
                        {t("settings.security")}
                    </CardTitle>
                    <CardDescription>{t("settings.accountAccess")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{t("settings.twoFactor")}</Label>
                            <p className="text-sm text-gray-500">{t("settings.extraSecurity")}</p>
                        </div>
                        <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>{t("settings.sessionTimeout")}</Label>
                            <p className="text-sm text-gray-500">{t("settings.autoLogout")}</p>
                        </div>
                        <Select defaultValue="30">
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Mock Data (Dev) */}
            <Card className="border-none shadow-md border-indigo-200 bg-indigo-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-700">
                        <Database className="w-5 h-5" />
                        Mock Data Generation
                    </CardTitle>
                    <CardDescription>Generate test data (300 Customers, Contracts 2023-2025)</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSeeding ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Database className="w-4 h-4 mr-2" />
                                Generate Mock Data
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-none shadow-md border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        {t("settings.dangerZone")}
                    </CardTitle>
                    <CardDescription>{t("settings.irreversible")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t("settings.warning")}</AlertTitle>
                        <AlertDescription>
                            {t("settings.factoryResetMsg")}
                        </AlertDescription>
                    </Alert>
                    <Button
                        variant="destructive"
                        onClick={() => setIsResetDialogOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("settings.factoryReset")}
                    </Button>
                </CardContent>
            </Card>

            {/* Factory Reset Dialog */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{t("settings.resetConfirmTitle")}</DialogTitle>
                        <DialogDescription>
                            {t("settings.resetConfirmMsg")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>{t("settings.typeToConfirm")}</Label>
                        <Input
                            value={resetConfirmation}
                            onChange={(e) => setResetConfirmation(e.target.value)}
                            placeholder="RESET"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                            {t("settings.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleFactoryReset}
                            disabled={resetConfirmation !== "RESET" || isResetting}
                        >
                            {isResetting ? t("settings.resetting") : t("settings.confirmReset")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
