"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

export default function CustomerDetailsClient() {
    const { id } = useParams();
    const { t } = useLanguage();

    // Mock Data
    const customer = {
        id: id,
        name: "Global Lumber Co., Ltd.",
        type: "Corporate",
        taxId: "0105551234567",
        phone: "02-123-4567",
        email: "contact@globallumber.com",
        address: "123 Rama 3 Road, Bangkok"
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-teal-50">
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="w-6 h-6 text-teal-700" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold font-heading text-teal-800">
                            {customer.name}
                        </h1>
                        <Badge>{customer.type}</Badge>
                    </div>
                    <p className="text-gray-500">View customer profile and history</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-teal-700 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Tax ID</label>
                                <p className="font-mono">{customer.taxId}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Head Office</label>
                                <p className="text-sm">{customer.address}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span>{customer.email}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
