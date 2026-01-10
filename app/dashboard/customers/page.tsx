"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, Building2, Phone, Mail, MoreHorizontal, Pencil, Trash2, Eye, Filter } from "lucide-react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    contactPerson: string;
    contracts?: any[];
}

export default function CustomersPage() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // TanStack Query
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers');
            return Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
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



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-teal-700">{t("customers.title")}</h1>
                    <p className="text-gray-500 mt-1">{t("customers.subtitle")}</p>
                </div>
                <Button className="btn-gold" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("customers.addCustomer")}
                </Button>
                <CreateCustomerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-md">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-gold-100">
                            <Users className="w-6 h-6 text-gold-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-teal-700">{customers.length}</p>
                            <p className="text-sm text-gray-500">{t("dashboard.stats.totalCustomers")}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-teal-100">
                            <Building2 className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-teal-700">
                                {useMemo(() => customers.filter((c: Customer) => c.type === "corporate").length, [customers])}
                            </p>
                            <p className="text-sm text-gray-500">{t("customers.corporate")}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-teal-700">
                                {useMemo(() => customers.filter((c: Customer) => c.type === "individual").length, [customers])}
                            </p>
                            <p className="text-sm text-gray-500">{t("customers.individual")}</p>
                        </div>
                    </CardContent>
                </Card>
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
                                <TableHead className="w-[300px]">{t("customers.table.customer")}</TableHead>
                                <TableHead>{t("customers.table.taxId")}</TableHead>
                                <TableHead>{t("customers.table.contact")}</TableHead>
                                <TableHead>{t("customers.table.activeContracts")}</TableHead>
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
                            ) : filteredCustomers.map((customer: Customer) => {
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
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${customer.id}`)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        {t("common.viewDetails") || "ดูรายละเอียด"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}>
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
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
