import { useState, useMemo } from "react";
import { Check, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Customer } from "../types";

interface Step1CustomerProps {
    customers: Customer[];
    selectedCustomerId: string;
    onSelect: (customer: Customer) => void;
    onDoubleClick?: (customer: Customer) => void;
}

export function Step1Customer({ customers, selectedCustomerId, onSelect, onDoubleClick }: Step1CustomerProps) {
    const { t } = useLanguage();
    const [search, setSearch] = useState("");

    const filteredCustomers = useMemo(() => {
        const q = search.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.taxId.toLowerCase().includes(q)
        );
    }, [customers, search]);

    return (
        <div className="space-y-6">
            <div>
                <CardTitle className="text-xl text-teal-700">{t("contracts.wizard.selectCustomer")}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t("contracts.wizard.chooseCustomer")}</p>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder={`${t("customers.searchPlaceholder")}`}
                    className="bg-gray-50 border-gray-200 focus:bg-white !pl-14"
                    style={{ paddingLeft: "3.5rem" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="grid gap-3">
                {filteredCustomers.map(customer => (
                    <div
                        key={customer.id}
                        onClick={() => onSelect(customer)}
                        onDoubleClick={() => onDoubleClick?.(customer)}
                        className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                            selectedCustomerId === customer.id
                                ? "border-gold-500 bg-gradient-to-r from-gold-50 to-amber-50 shadow-md"
                                : "border-gray-100 bg-white hover:border-gold-300 hover:shadow-sm"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                    selectedCustomerId === customer.id ? "bg-gold-500" : "bg-teal-500"
                                )}>
                                    {customer.name ? customer.name.charAt(0) : "?"}
                                </div>
                                <div>
                                    <p className="font-semibold text-teal-700">{customer.name}</p>
                                    <p className="text-sm text-gray-500">Tax ID: {customer.taxId}</p>
                                </div>
                            </div>
                            {selectedCustomerId === customer.id && (
                                <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filteredCustomers.length === 0 && (
                    <div className="text-center py-8 text-gray-400 max-w-sm mx-auto">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>{t("common.noData")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
