"use client";

import { useState } from "react";
import { Download, Upload, FileSpreadsheet, Check, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock templates data
const templates = [
    {
        id: "buildings",
        name: "Buildings & Units",
        columns: ["building_code", "floor_number", "unit_number", "sqm", "status"],
        lastImport: "2024-01-05 10:30",
    },
    {
        id: "customers",
        name: "Customers",
        columns: ["customer_code", "name_th", "name_en", "tax_id", "branch_code"],
        lastImport: "2023-12-28 14:15",
    },
    {
        id: "contracts",
        name: "Rent Contracts",
        columns: ["contract_no", "customer_code", "start_date", "end_date", "deposit_amount"],
        lastImport: "Never",
    },
];

export default function ImportExportPage() {
    const { t } = useLanguage();
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

    const simulateImport = () => {
        setIsImporting(true);
        setImportStatus("idle");
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsImporting(false);
                    setImportStatus("success");
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-teal-700">{t("importExport.title")}</h1>
                <p className="text-gray-500 mt-1">{t("importExport.subtitle")}</p>
            </div>

            <Tabs defaultValue="export" className="space-y-6">
                <TabsList className="bg-white border p-1 shadow-sm">
                    <TabsTrigger value="export" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        <Download className="w-4 h-4 mr-2" />
                        {t("importExport.tabs.export")}
                    </TabsTrigger>
                    <TabsTrigger value="import" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                        <Upload className="w-4 h-4 mr-2" />
                        {t("importExport.tabs.import")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="export">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>{t("importExport.tabs.export")}</CardTitle>
                            <CardDescription>
                                {t("importExport.subtitle")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Template</TableHead>
                                        <TableHead>Required Columns</TableHead>
                                        <TableHead>Last Import</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((template) => (
                                        <TableRow key={template.name}>
                                            <TableCell className="font-medium">{template.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {template.columns.slice(0, 4).map((col) => (
                                                        <Badge key={col} variant="outline" className="text-xs">
                                                            {col}
                                                        </Badge>
                                                    ))}
                                                    {template.columns.length > 4 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{template.columns.length - 4} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500">
                                                {template.lastImport || "Never"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
