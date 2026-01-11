"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, Building2, Phone, Mail, MoreHorizontal, Pencil, Trash2, Eye, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from 'next/link';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/use-debounce";
import dynamic from 'next/dynamic';

// Lazy load dialog
const CreateCustomerDialog = dynamic(() => import('@/components/dashboard/customers/create-customer-dialog'), {
    loading: () => null,
});

interface Customer {
    id: string;
    name: string;
    type: string;
    taxId: string;
    phone: string;
    email: string;
    address?: string;
    contactPerson: string;
    contactPhone?: string;
    contactEmail?: string;
    contracts?: any[];
    createdAt?: string;
}

type SortField = 'name' | 'type' | 'activeContracts' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function CustomersPage() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // New state for view/edit dialogs
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});

    // Sorting state - default by latest creation
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // TanStack Query
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        }
    });

    // Edit mutation
    const editMutation = useMutation({
        mutationFn: async (data: { id: string; updates: Partial<Customer> }) => {
            await api.patch(`/customers/${data.id}`, data.updates);
        },
        onSuccess: () => {
            toast.success("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว");
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setEditDialogOpen(false);
            setSelectedCustomer(null);
        },
        onError: () => {
            toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        }
    });

    const debouncedSearch = useDebounce(search, 300);

    const filteredCustomers = useMemo(() => {
        return customers.filter((c: Customer) => {
            const matchesSearch = c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                c.taxId?.includes(debouncedSearch) || // taxId might be null
                c.email?.toLowerCase().includes(debouncedSearch.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === "all") return true;

            const hasActiveContract = c.contracts?.some((contract: any) => contract.status === 'active');

            if (statusFilter === "active") return hasActiveContract;
            if (statusFilter === "inactive") return !hasActiveContract;

            return true;
        });
    }, [customers, debouncedSearch, statusFilter]);

    // Sorted customers
    const sortedCustomers = useMemo(() => {
        const sorted = [...filteredCustomers];
        sorted.sort((a: any, b: any) => {
            let valueA, valueB;

            switch (sortField) {
                case 'name':
                    valueA = a.name?.toLowerCase() || '';
                    valueB = b.name?.toLowerCase() || '';
                    break;
                case 'type':
                    valueA = a.type || '';
                    valueB = b.type || '';
                    break;
                case 'activeContracts':
                    valueA = a.contracts?.filter((c: any) => c.status === 'active').length || 0;
                    valueB = b.contracts?.filter((c: any) => c.status === 'active').length || 0;
                    break;
                case 'createdAt':
                    // Sort by latest contract or customer creation
                    const latestContractA = a.contracts?.reduce((latest: any, c: any) => {
                        const d = new Date(c.createdAt || 0);
                        return d > latest ? d : latest;
                    }, new Date(a.createdAt || 0));
                    const latestContractB = b.contracts?.reduce((latest: any, c: any) => {
                        const d = new Date(c.createdAt || 0);
                        return d > latest ? d : latest;
                    }, new Date(b.createdAt || 0));
                    valueA = latestContractA?.getTime() || 0;
                    valueB = latestContractB?.getTime() || 0;
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredCustomers, sortField, sortDirection]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    // Paginate data
    const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
    const paginatedCustomers = useMemo(() => {
        return sortedCustomers.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [sortedCustomers, currentPage]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 ml-1" />
            : <ArrowDown className="w-4 h-4 ml-1" />;
    };

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setViewDialogOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setEditForm({
            name: customer.name,
            type: customer.type,
            taxId: customer.taxId,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            contactPerson: customer.contactPerson,
            contactPhone: customer.contactPhone,
            contactEmail: customer.contactEmail,
        });
        setEditDialogOpen(true);
    };

    const confirmEdit = () => {
        if (selectedCustomer) {
            editMutation.mutate({ id: selectedCustomer.id, updates: editForm });
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact Header & Stats */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-teal-700">{t("customers.title")}</h1>
                        <p className="text-xs text-gray-500">{t("customers.subtitle")}</p>
                    </div>
                    <Button size="sm" className="btn-gold h-9" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("customers.addCustomer")}
                    </Button>
                    <CreateCustomerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
                </div>

                {/* Compact Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-gold-50 to-white">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-gold-100/80 text-gold-600">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-medium">{t("dashboard.stats.totalCustomers")}</p>
                                    <p className="text-lg font-bold text-teal-700 leading-none mt-0.5">{customers.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-teal-50/50">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-teal-100/80 text-teal-600">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-brand-teal-700 uppercase font-medium">{t("customers.corporate")}</p>
                                    <p className="text-lg font-bold text-brand-teal-700 leading-none mt-0.5">
                                        {useMemo(() => customers.filter((c: Customer) => c.type === "corporate").length, [customers])}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100/80 text-blue-600">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-700 uppercase font-medium">{t("customers.individual")}</p>
                                    <p className="text-lg font-bold text-blue-700 leading-none mt-0.5">
                                        {useMemo(() => customers.filter((c: Customer) => c.type === "individual").length, [customers])}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Customers Table with Search */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-heading text-teal-700">
                        {t("customers.title")} ({filteredCustomers.length})
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 mt-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={t("customers.searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="!pl-14"
                                style={{ paddingLeft: "3.5rem" }}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="w-4 h-4" />
                                    {statusFilter === "all" ? t("customers.status.all") :
                                        statusFilter === "active" ? t("customers.status.active") :
                                            t("customers.status.inactive")}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                                    {t("customers.status.all")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                                    {t("customers.status.active")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                                    {t("customers.status.inactive")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center hover:text-teal-600 transition-colors"
                                    >
                                        {t("customers.table.customer")}
                                        <SortIcon field="name" />
                                    </button>
                                </TableHead>
                                <TableHead>{t("customers.table.taxId")}</TableHead>
                                <TableHead>{t("customers.table.contact")}</TableHead>
                                <TableHead>
                                    <button
                                        onClick={() => handleSort('activeContracts')}
                                        className="flex items-center hover:text-teal-600 transition-colors"
                                    >
                                        {t("customers.table.activeContracts")}
                                        <SortIcon field="activeContracts" />
                                    </button>
                                </TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-[200px] rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-[50px] rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                paginatedCustomers.map((customer: Customer) => {
                                    const activeContracts = customer.contracts?.filter((c: any) => c.status === 'active').length || 0;
                                    return (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-teal-700">
                                                            {customer.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{customer.name}</p>
                                                        <Badge variant="outline" className="text-xs mt-1">
                                                            {customer.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {customer.taxId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {customer.phone}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                        <Mail className="w-3 h-3 text-gray-400" />
                                                        {customer.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{activeContracts}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            {t("common.viewDetails") || "ดูรายละเอียด"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            {t("common.edit") || "แก้ไข"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => {
                                                                setCustomerToDelete(customer);
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

                    {/* Pagination Controls */}
                    {sortedCustomers.length > 0 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-gray-500">
                                {t("common.showing") || "Showing"} <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedCustomers.length)}</span> of <span className="font-medium">{sortedCustomers.length}</span> {t("common.entries") || "entries"}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    {t("common.previous") || "Previous"}
                                </Button>
                                <div className="text-sm font-medium px-2">
                                    {t("common.page") || "Page"} {currentPage} of {Math.max(1, totalPages)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    {t("common.next") || "Next"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            {selectedCustomer?.name}
                        </DialogTitle>
                        <DialogDescription>รายละเอียดลูกค้า</DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">ประเภท</Label>
                                    <Badge variant="outline" className="mt-1">
                                        {selectedCustomer.type === "corporate" ? "นิติบุคคล" : "บุคคลธรรมดา"}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-gray-500">เลขผู้เสียภาษี</Label>
                                    <p className="font-mono font-medium">{selectedCustomer.taxId || "-"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">โทรศัพท์</Label>
                                    <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">อีเมล</Label>
                                    <p className="font-medium">{selectedCustomer.email || "-"}</p>
                                </div>
                            </div>
                            {selectedCustomer.address && (
                                <div>
                                    <Label className="text-gray-500">ที่อยู่</Label>
                                    <p className="font-medium">{selectedCustomer.address}</p>
                                </div>
                            )}
                            <div className="pt-2 border-t">
                                <Label className="text-gray-500 mb-2 block">ผู้ติดต่อ</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">ชื่อ</p>
                                        <p className="font-medium">{selectedCustomer.contactPerson || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">โทร</p>
                                        <p className="font-medium">{selectedCustomer.contactPhone || selectedCustomer.phone || "-"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <Label className="text-gray-500">สัญญาที่ใช้งาน</Label>
                                <p className="font-medium text-teal-600">
                                    {selectedCustomer.contracts?.filter((c: any) => c.status === 'active').length || 0} สัญญา
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>ปิด</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
                        <DialogDescription>แก้ไขข้อมูล {selectedCustomer?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>ชื่อ</Label>
                                <Input
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>ประเภท</Label>
                                <select
                                    value={editForm.type || ""}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="corporate">นิติบุคคล</option>
                                    <option value="individual">บุคคลธรรมดา</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>เลขผู้เสียภาษี</Label>
                            <Input
                                value={editForm.taxId || ""}
                                onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>โทรศัพท์</Label>
                                <Input
                                    value={editForm.phone || ""}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>อีเมล</Label>
                                <Input
                                    value={editForm.email || ""}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>ที่อยู่</Label>
                            <Input
                                value={editForm.address || ""}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </div>
                        <div className="pt-2 border-t">
                            <Label className="mb-2 block">ข้อมูลผู้ติดต่อ</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">ชื่อผู้ติดต่อ</Label>
                                    <Input
                                        value={editForm.contactPerson || ""}
                                        onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">โทรผู้ติดต่อ</Label>
                                    <Input
                                        value={editForm.contactPhone || ""}
                                        onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={confirmEdit} disabled={editMutation.isPending}>
                            {editMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                            {t("customers.deleteTitle") || "ยืนยันการลบลูกค้า"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("customers.deleteConfirm") || "คุณต้องการลบลูกค้า"} <strong>{customerToDelete?.name}</strong>?
                            <br />
                            {t("customers.deleteWarning") || "การดำเนินการนี้ไม่สามารถย้อนกลับได้"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel") || "ยกเลิก"}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                                if (!customerToDelete) return;
                                try {
                                    await api.delete(`/customers/${customerToDelete.id}`);
                                    toast.success(t("customers.deleteSuccess") || "ลบลูกค้าเรียบร้อยแล้ว");
                                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                                } catch (e: any) {
                                    toast.error(`${t("customers.deleteFailed") || "ลบลูกค้าไม่สำเร็จ"}: ${e.response?.data?.message || e.message}`);
                                } finally {
                                    setCustomerToDelete(null);
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

