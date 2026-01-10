"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, FileText, Calendar, Users, Wrench, Building2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Trash2, RefreshCw, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

interface Contract {
    id: string;
    contractNo: string;
    customer: { name: string };
    startDate: string;
    endDate: string;
    status: string;
    contractUnits: any[];
}

type SortField = "building" | "contractNo" | "customer" | "startDate" | "endDate" | "rent" | "serviceFee" | "status";
type SortDirection = "asc" | "desc";

export default function ContractsPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [buildingFilters, setBuildingFilters] = useState<string[]>([]);

    // TanStack Query for Contracts
    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: async () => {
            const res = await api.get('/contracts');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        },
        staleTime: 60 * 1000, // 1 minute stale time
    });

    const [sortField, setSortField] = useState<SortField>("contractNo");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);



    // Helper to get building name from contract
    const getBuildingName = (contract: Contract): string => {
        const firstUnit = contract.contractUnits?.[0];
        if (firstUnit?.directBuilding?.name) return firstUnit.directBuilding.name;
        if (firstUnit?.unit?.building?.name) return firstUnit.unit.building.name;
        return "-";
    };

    // Helper to calc rent
    const calculateCurrentRent = (contract: Contract) => {
        const today = new Date();
        let rent = 0;
        let fee = 0;
        contract.contractUnits?.forEach((u: any) => {
            const period = u.rentPeriods?.find((p: any) => new Date(p.startDate) <= today && new Date(p.endDate) >= today);
            if (period) {
                rent += Number(period.rentAmount);
                fee += Number(period.serviceFee);
            }
        });
        return { rent, fee };
    };

    const statusColors = {
        draft: "bg-gray-100 text-gray-700",
        active: "bg-green-100 text-green-700",
        expiring: "bg-amber-100 text-amber-700",
        expired: "bg-red-100 text-red-700",
        terminated: "bg-gray-200 text-gray-600",
    };

    // Debounce search term to prevent excessive re-renders during typing
    const debouncedSearch = useDebounce(search, 300);

    // Get unique building names for filter dropdown
    const uniqueBuildings = useMemo(() => {
        return [...new Set(contracts.map((c: Contract) => getBuildingName(c)).filter((b: string) => b !== "-"))];
    }, [contracts]);

    // Filter contracts - Memoized
    const filteredContracts = useMemo(() => {
        return contracts.filter((contract: Contract) => {
            const matchesSearch =
                contract.contractNo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                contract.customer?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                getBuildingName(contract).toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesStatus =
                statusFilters.length === 0 || statusFilters.includes(contract.status);
            const matchesBuilding =
                buildingFilters.length === 0 || buildingFilters.includes(getBuildingName(contract));
            return matchesSearch && matchesStatus && matchesBuilding;
        });
    }, [contracts, debouncedSearch, statusFilters, buildingFilters]);

    // Sort contracts - Memoized
    const sortedContracts = useMemo(() => {
        return [...filteredContracts].sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortField) {
                case "building":
                    aVal = getBuildingName(a);
                    bVal = getBuildingName(b);
                    break;
                case "contractNo":
                    aVal = a.contractNo;
                    bVal = b.contractNo;
                    break;
                case "customer":
                    aVal = a.customer?.name || "";
                    bVal = b.customer?.name || "";
                    break;
                case "startDate":
                    aVal = new Date(a.startDate).getTime();
                    bVal = new Date(b.startDate).getTime();
                    break;
                case "endDate":
                    aVal = new Date(a.endDate).getTime();
                    bVal = new Date(b.endDate).getTime();
                    break;
                case "rent":
                    aVal = calculateCurrentRent(a).rent;
                    bVal = calculateCurrentRent(b).rent;
                    break;
                case "serviceFee":
                    aVal = calculateCurrentRent(a).fee;
                    bVal = calculateCurrentRent(b).fee;
                    break;
                case "status":
                    aVal = a.status;
                    bVal = b.status;
                    break;
                default:
                    aVal = a.contractNo;
                    bVal = b.contractNo;
            }

            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        });
    }, [filteredContracts, sortField, sortDirection]);

    // Toggle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Sort icon component
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
        return sortDirection === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
    };

    // Calculate totals - Memoized
    const totals = useMemo(() => {
        return sortedContracts.reduce((acc, c) => {
            const { rent, fee } = calculateCurrentRent(c);
            return { rent: acc.rent + rent, fee: acc.fee + fee };
        }, { rent: 0, fee: 0 });
    }, [sortedContracts]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-teal-700">{t("contracts.title")}</h1>
                    <p className="text-gray-500 mt-1">{t("contracts.subtitle")}</p>
                </div>
                <Link href="/dashboard/contracts/new">
                    <Button className="btn-gold">
                        <Plus className="w-4 h-4 mr-2" />
                        {t("contracts.newContract")}
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{t("contracts.summary.rent") || "Monthly Rent"}</p>
                        <p className="text-2xl font-bold text-teal-700">฿{totals.rent.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {t("contracts.summary.serviceFee") || "Service Fee"}
                        </p>
                        <p className="text-2xl font-bold text-amber-600">฿{totals.fee.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-gold-50 to-amber-50">
                    <CardContent className="p-4">
                        <p className="text-xs text-gold-600 uppercase tracking-wide">{t("contracts.summary.total") || "Total Monthly"}</p>
                        <p className="text-2xl font-bold text-gold-600">฿{(totals.rent + totals.fee).toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Contracts Table with Filters */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-heading text-teal-700">
                        {t("contracts.title")} ({sortedContracts.length})
                    </CardTitle>
                    {/* Filters inside the card */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={t("contracts.searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="!pl-14"
                                style={{ paddingLeft: "3.5rem" }}
                            />
                        </div>
                        {/* Building Multi-Select */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-56 justify-between">
                                    <div className="flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        {buildingFilters.length === 0
                                            ? "อาคารทั้งหมด"
                                            : buildingFilters.length === 1
                                                ? buildingFilters[0]
                                                : `${buildingFilters.length} อาคาร`}
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                                <div className="space-y-2">
                                    {uniqueBuildings.map((building: unknown) => (
                                        <div key={building as string} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`building-${building}`}
                                                checked={buildingFilters.includes(building as string)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setBuildingFilters([...buildingFilters, building as string]);
                                                    } else {
                                                        setBuildingFilters(buildingFilters.filter(b => b !== building));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`building-${building}`} className="text-sm cursor-pointer flex-1">
                                                {building as React.ReactNode}
                                            </label>
                                        </div>
                                    ))}
                                    {buildingFilters.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full mt-2 text-gray-500"
                                            onClick={() => setBuildingFilters([])}
                                        >
                                            ล้างตัวกรอง
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                        {/* Status Multi-Select */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-56 justify-between">
                                    <div className="flex items-center">
                                        <Filter className="w-4 h-4 mr-2" />
                                        {statusFilters.length === 0
                                            ? "สถานะทั้งหมด"
                                            : statusFilters.length === 1
                                                ? t(`contracts.status.${statusFilters[0]}`)
                                                : `${statusFilters.length} สถานะ`}
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                                <div className="space-y-2">
                                    {["draft", "active", "expiring", "expired"].map(status => (
                                        <div key={status} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`status-${status}`}
                                                checked={statusFilters.includes(status)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setStatusFilters([...statusFilters, status]);
                                                    } else {
                                                        setStatusFilters(statusFilters.filter(s => s !== status));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`status-${status}`} className="text-sm cursor-pointer flex-1">
                                                {t(`contracts.status.${status}`)}
                                            </label>
                                        </div>
                                    ))}
                                    {statusFilters.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full mt-2 text-gray-500"
                                            onClick={() => setStatusFilters([])}
                                        >
                                            ล้างตัวกรอง
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("building")}>
                                    <div className="flex items-center">
                                        {t("common.building") || "อาคาร"}
                                        <SortIcon field="building" />
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("contractNo")}>
                                    <div className="flex items-center">
                                        {t("contracts.table.contractNo")}
                                        <SortIcon field="contractNo" />
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("customer")}>
                                    <div className="flex items-center">
                                        {t("contracts.table.customer")}
                                        <SortIcon field="customer" />
                                    </div>
                                </TableHead>
                                <TableHead>{t("contracts.table.units")}</TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("endDate")}>
                                    <div className="flex items-center">
                                        {t("contracts.table.period")}
                                        <SortIcon field="endDate" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-gray-50" onClick={() => handleSort("rent")}>
                                    <div className="flex items-center justify-end">
                                        {t("contracts.table.monthlyRent")}
                                        <SortIcon field="rent" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-gray-50" onClick={() => handleSort("serviceFee")}>
                                    <div className="flex items-center justify-end">
                                        {t("contracts.table.serviceFee") || "Service Fee"}
                                        <SortIcon field="serviceFee" />
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("status")}>
                                    <div className="flex items-center">
                                        {t("contracts.table.status")}
                                        <SortIcon field="status" />
                                    </div>
                                </TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sortedContracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                                        {t("common.noData") || "No contracts found"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedContracts.map((contract) => {
                                    const { rent, fee } = calculateCurrentRent(contract);
                                    const buildingName = getBuildingName(contract);

                                    return (
                                        <TableRow key={contract.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-teal-500" />
                                                    <span className="font-medium">{buildingName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gold-500" />
                                                    {contract.contractNo}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    {contract.customer?.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {contract.contractUnits?.map((unit: any, i: number) => {
                                                        const label = unit.unit?.code || (unit.directBuilding?.name ? `${unit.directBuilding.code || 'B'} ${unit.floor}F` : `Fl.${unit.floor}`);
                                                        return (
                                                            <Badge key={i} variant="outline" className="text-xs">
                                                                {label}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(contract.startDate).toLocaleDateString("th-TH")} - {new Date(contract.endDate).toLocaleDateString("th-TH")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-teal-600">
                                                ฿{rent.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-amber-600">
                                                ฿{fee.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                                                    {t(`contracts.status.${contract.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            {t("common.viewDetails") || "ดูรายละเอียด"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}/edit`)}>
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            {t("common.edit") || "แก้ไข"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}/renew`)}>
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            {t("contracts.renew") || "ต่อสัญญา"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => {
                                                                setContractToDelete(contract);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {t("common.delete") || "ลบ"}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                            {t("contracts.deleteTitle") || "ยืนยันการลบสัญญา"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("contracts.deleteConfirm") || "คุณต้องการลบสัญญา"} <strong>{contractToDelete?.contractNo}</strong>?
                            <br />
                            {t("contracts.deleteWarning") || "การดำเนินการนี้ไม่สามารถย้อนกลับได้"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel") || "ยกเลิก"}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                                if (!contractToDelete) return;
                                try {
                                    await api.delete(`/contracts/${contractToDelete.id}`);
                                    toast.success(t("contracts.deleteSuccess") || "ลบสัญญาเรียบร้อยแล้ว");
                                    // Invalidate query to refetch
                                    queryClient.invalidateQueries({ queryKey: ['contracts'] });
                                } catch (e: any) {
                                    toast.error(`${t("contracts.deleteFailed") || "ลบสัญญาไม่สำเร็จ"}: ${e.response?.data?.message || e.message}`);
                                } finally {
                                    setContractToDelete(null);
                                    setDeleteDialogOpen(false);
                                }
                            }}
                        >
                            {t("common.delete") || "ลบ"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
