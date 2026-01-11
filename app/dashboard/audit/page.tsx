"use client";

import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Eye, ChevronDown, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Types
interface AuditLog {
    id: string;
    performedAt: string;
    userId: string;
    action: "POST" | "PUT" | "PATCH" | "DELETE";
    endpoint: string;
    statusCode: number;
    durationMs: number;
    requestBody?: string;
    responseData?: string;
    errorMessage?: string;
}

export default function AuditLogPage() {
    const { t } = useLanguage();
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAction, setSelectedAction] = useState<string>("ALL");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        const fetchAuditLogs = async () => {
            setIsLoading(true);
            try {
                const res = await api.get("/audit", {
                    params: { action: selectedAction !== "ALL" ? selectedAction : undefined, limit: 100 }
                });
                const data = res.data?.data || res.data || [];
                setAuditLogs(data);
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
                toast.error("Failed to load audit logs");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuditLogs();
    }, [selectedAction]);

    const filteredLogs = auditLogs.filter(log => {
        const matchesSearch =
            log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return "bg-green-100 text-green-700";
        if (status >= 400 && status < 500) return "bg-amber-100 text-amber-700";
        if (status >= 500) return "bg-red-100 text-red-700";
        return "bg-gray-100 text-gray-700";
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "POST": return "text-green-600 bg-green-50 border-green-200";
            case "PUT": return "text-blue-600 bg-blue-50 border-blue-200";
            case "PATCH": return "text-indigo-600 bg-indigo-50 border-indigo-200";
            case "DELETE": return "text-red-600 bg-red-50 border-red-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const parseJson = (str: string | undefined) => {
        if (!str) return null;
        try {
            return JSON.parse(str);
        } catch {
            return str;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-teal-700">{t("audit.title")}</h1>
                <p className="text-gray-500 mt-1">{t("audit.subtitle")}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder={t("audit.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="!pl-10"
                        style={{ paddingLeft: "2.5rem" }}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="w-4 h-4 mr-2" />
                                {t("audit.filter.action")}: {selectedAction === "ALL" ? t("audit.filter.all") : selectedAction}
                                <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem checked={selectedAction === "ALL"} onCheckedChange={() => setSelectedAction("ALL")}>
                                {t("audit.filter.all")}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={selectedAction === "POST"} onCheckedChange={() => setSelectedAction("POST")}>
                                CREATE (POST)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={selectedAction === "PUT"} onCheckedChange={() => setSelectedAction("PUT")}>
                                UPDATE (PUT)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={selectedAction === "PATCH"} onCheckedChange={() => setSelectedAction("PATCH")}>
                                PATCH
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={selectedAction === "DELETE"} onCheckedChange={() => setSelectedAction("DELETE")}>
                                DELETE
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="border rounded-md shadow-sm bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("audit.table.timestamp")}</TableHead>
                            <TableHead>{t("audit.table.user")}</TableHead>
                            <TableHead>{t("audit.table.action")}</TableHead>
                            <TableHead className="hidden md:table-cell">{t("audit.table.endpoint")}</TableHead>
                            <TableHead>{t("audit.table.status")}</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">{t("audit.table.duration")}</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                                    {t("common.noData") || "No audit logs found"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} className="group hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                                    <TableCell className="whitespace-nowrap text-gray-600 font-mono text-xs">
                                        {new Date(log.performedAt).toLocaleString("th-TH")}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-gray-500 font-mono">{log.userId}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${getActionColor(log.action)}`}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell font-mono text-xs text-gray-600 max-w-[200px] truncate" title={log.endpoint}>
                                        {log.endpoint}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`${getStatusColor(log.statusCode)}`}>
                                            {log.statusCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right hidden sm:table-cell text-gray-500 text-sm">
                                        {log.durationMs}ms
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 group-hover:text-teal-600">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-heading text-teal-800">
                            {t("audit.detail.title")}
                            {selectedLog && (
                                <Badge variant="outline" className={`${getActionColor(selectedLog.action)} ml-2`}>
                                    {selectedLog.action}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Request ID: {selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">{t("audit.detail.timestamp")}</h4>
                                    <p className="text-sm font-mono">{new Date(selectedLog.performedAt).toLocaleString("th-TH")}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">{t("audit.detail.user")}</h4>
                                    <p className="text-sm font-mono">{selectedLog.userId}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">{t("audit.detail.status")}</h4>
                                    <Badge variant="secondary" className={`${getStatusColor(selectedLog.statusCode)}`}>
                                        {selectedLog.statusCode} ({selectedLog.durationMs}ms)
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">{t("audit.detail.endpoint")}</h4>
                                    <p className="text-sm font-mono break-all">{selectedLog.endpoint}</p>
                                </div>
                            </div>

                            {selectedLog.requestBody && (
                                <div className="space-y-2 mt-2">
                                    <h4 className="text-sm font-medium text-gray-700">{t("audit.detail.requestBody")}</h4>
                                    <ScrollArea className="h-[100px] w-full rounded-md border bg-gray-50 p-2">
                                        <pre className="text-xs font-mono text-gray-600">
                                            {JSON.stringify(parseJson(selectedLog.requestBody), null, 2)}
                                        </pre>
                                    </ScrollArea>
                                </div>
                            )}

                            {selectedLog.responseData && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">{t("audit.detail.responseData")}</h4>
                                    <ScrollArea className="h-[100px] w-full rounded-md border bg-gray-50 p-2">
                                        <pre className="text-xs font-mono text-gray-600">
                                            {JSON.stringify(parseJson(selectedLog.responseData), null, 2)}
                                        </pre>
                                    </ScrollArea>
                                </div>
                            )}

                            {selectedLog.errorMessage && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-red-600">{t("audit.detail.error")}</h4>
                                    <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                                        {selectedLog.errorMessage}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
