"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, Building2, Phone, Mail, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/use-debounce";

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
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [customerType, setCustomerType] = useState("corporate");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/customers');
                // Backend wraps response in {success, data, timestamp}
                const data = res.data.data || res.data;
                setCustomers(Array.isArray(data) ? data : []);
            } catch (e: any) {
                console.error("Fetch Customers Error:", e);
                toast.error(`Failed to load customers: ${e.response?.data?.message || e.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const debouncedSearch = useDebounce(search, 300);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.taxId?.includes(debouncedSearch) || // taxId might be null
            c.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [customers, debouncedSearch]);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Customer created successfully!");
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-teal-700">{t("customers.title")}</h1>
                    <p className="text-gray-500 mt-1">{t("customers.subtitle")}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="btn-gold">
                            <Plus className="w-4 h-4 mr-2" />
                            {t("customers.addCustomer")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl p-6">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-2xl font-heading font-bold text-teal-700">{t("customers.addCustomer")}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCustomer} className="space-y-5">
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">{t("customers.customerType")}</Label>
                                        <Select value={customerType} onValueChange={setCustomerType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("customers.typePlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="corporate">{t("customers.corporate")}</SelectItem>
                                                <SelectItem value="individual">{t("customers.individual")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">
                                            {customerType === "individual" ? t("customers.citizenId") : t("customers.taxId")}
                                        </Label>
                                        <Input placeholder="0105551234567" className="font-mono text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700">{t("customers.name")}</Label>
                                    <Input placeholder={t("customers.namePlaceholder")} required className="h-10" />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">{t("customers.phone")}</Label>
                                        <Input placeholder="02-123-4567" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">{t("customers.email")}</Label>
                                        <Input type="email" placeholder="contact@company.com" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700">{t("customers.address")}</Label>
                                    <Textarea placeholder="Full address" className="resize-none" rows={3} />
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-4">
                                    <h3 className="font-heading font-semibold text-teal-700">{t("customers.contactPerson")}</h3>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">{t("customers.contactName")}</Label>
                                        <Input placeholder="Name of contact person" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-gray-700">{t("customers.contactPhone")}</Label>
                                            <Input placeholder="081-234-5678" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-700">{t("customers.contactEmail")}</Label>
                                            <Input type="email" placeholder="person@company.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} className="px-6">
                                    {t("common.cancel")}
                                </Button>
                                <Button type="submit" className="btn-gold px-6">{t("customers.createCustomer")}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
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
                            <p className="text-sm text-gray-500">Total Customers</p>
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
                                {useMemo(() => customers.filter(c => c.type === "corporate").length, [customers])}
                            </p>
                            <p className="text-sm text-gray-500">Corporate</p>
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
                                {useMemo(() => customers.filter(c => c.type === "individual").length, [customers])}
                            </p>
                            <p className="text-sm text-gray-500">Individual</p>
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
                    {/* Search inside the card */}
                    <div className="relative max-w-md mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={t("customers.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="!pl-14"
                            style={{ paddingLeft: "3.5rem" }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Customer</TableHead>
                                <TableHead>Tax ID</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Active Contracts</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => {
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
                                    setCustomers(customers.filter(c => c.id !== customerToDelete.id));
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
