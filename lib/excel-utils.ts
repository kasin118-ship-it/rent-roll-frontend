"use client";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export const TEMPLATES = {
    customers: {
        name: "Customers",
        filename: "customers_template.xlsx",
        headers: ["customer_id", "name", "type", "tax_id", "phone", "email", "address", "contact_name", "contact_phone"],
        sampleData: [
            ["CUS-001", "Thai Specialty Coffee Co., Ltd.", "corporate", "0123456789012", "02-123-4567", "info@thaicoffee.com", "123 Sukhumvit Road, Bangkok", "Somchai Wongchai", "081-234-5678"],
            ["CUS-002", "Tech Solutions Ltd.", "corporate", "0987654321098", "02-987-6543", "contact@techsolutions.co.th", "456 Silom Road, Bangkok", "Somsak Jaidee", "089-876-5432"],
        ],
    },
    buildings: {
        name: "Buildings",
        filename: "buildings_template.xlsx",
        headers: ["building_id", "name", "address", "total_floors", "total_area_sqm", "status"],
        sampleData: [
            ["BLD-A", "Kingbridge Tower A", "88 Sukhumvit Road", "20", "25000", "active"],
            ["BLD-B", "Kingbridge Tower B", "88 Sukhumvit Road", "18", "18000", "active"],
        ],
    },
    contractMaster: {
        name: "Contract Master",
        filename: "contract_master_template.xlsx",
        headers: ["contract_no", "customer_id", "start_date", "end_date", "deposit_amount", "status", "notes"],
        sampleData: [
            ["KB-2024-001", "CUS-001", "2024-01-01", "2026-12-31", "200000", "active", "3-year contract with price escalation"],
            ["KB-2024-002", "CUS-002", "2024-03-01", "2025-02-28", "100000", "active", "1-year contract"],
        ],
    },
    rentalSpaces: {
        name: "Rental Spaces",
        filename: "rental_spaces_template.xlsx",
        headers: ["contract_no", "building_id", "floor", "area_sqm"],
        sampleData: [
            ["KB-2024-001", "BLD-A", "5", "500"],
            ["KB-2024-001", "BLD-A", "6", "300"],
            ["KB-2024-002", "BLD-B", "10", "250"],
        ],
    },
    pricingTiers: {
        name: "Pricing Tiers",
        filename: "pricing_tiers_template.xlsx",
        headers: ["contract_no", "floor", "tier_order", "start_date", "end_date", "rent_amount", "service_fee"],
        sampleData: [
            ["KB-2024-001", "5", "1", "2024-01-01", "2024-12-31", "50000", "7500"],
            ["KB-2024-001", "5", "2", "2025-01-01", "2026-12-31", "55000", "8250"],
            ["KB-2024-001", "6", "1", "2024-01-01", "2026-12-31", "30000", "4500"],
            ["KB-2024-002", "10", "1", "2024-03-01", "2025-02-28", "35000", "5250"],
        ],
    },
};

// =============================================================================
// EXPORT TEMPLATE FUNCTIONS
// =============================================================================

export function downloadTemplate(templateKey: keyof typeof TEMPLATES) {
    const template = TEMPLATES[templateKey];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const wsData = [template.headers, ...template.sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = template.headers.map((header: string) => ({ wch: Math.max(header.length + 5, 15) }));
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, template.name);

    // Generate and download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, template.filename);
}

// =============================================================================
// MOCK DATA FOR EXPORT (Replace with actual API calls)
// =============================================================================

const mockCustomers = [
    { id: "CUS-001", name: "Thai Specialty Coffee Co., Ltd.", type: "corporate", taxId: "0123456789012", phone: "02-123-4567", email: "info@thaicoffee.com", address: "123 Sukhumvit Road", contactName: "Somchai", contactPhone: "081-234-5678" },
    { id: "CUS-002", name: "Tech Solutions Ltd.", type: "corporate", taxId: "0987654321098", phone: "02-987-6543", email: "contact@techsolutions.co.th", address: "456 Silom Road", contactName: "Somsak", contactPhone: "089-876-5432" },
    { id: "CUS-003", name: "Global Logistics Co.", type: "corporate", taxId: "0112233445566", phone: "02-111-2222", email: "info@globallogistics.com", address: "789 Rama IV Road", contactName: "Sakchai", contactPhone: "082-111-2222" },
];

const mockBuildings = [
    { id: "BLD-A", name: "Kingbridge Tower A", address: "88 Sukhumvit Road", totalFloors: 20, totalAreaSqm: 25000, status: "active" },
    { id: "BLD-B", name: "Kingbridge Tower B", address: "88 Sukhumvit Road", totalFloors: 18, totalAreaSqm: 18000, status: "active" },
    { id: "BLD-C", name: "Kingbridge Tower C", address: "88 Sukhumvit Road", totalFloors: 14, totalAreaSqm: 8750, status: "active" },
];

const mockContracts = [
    {
        contractNo: "KB-2024-001",
        customerId: "CUS-001",
        startDate: "2024-01-01",
        endDate: "2026-12-31",
        depositAmount: 200000,
        status: "active",
        notes: "3-year contract with price escalation",
        rentalSpaces: [
            { buildingId: "BLD-A", floor: "5", areaSqm: 500 },
            { buildingId: "BLD-A", floor: "6", areaSqm: 300 },
        ],
        pricingTiers: [
            { floor: "5", tierOrder: 1, startDate: "2024-01-01", endDate: "2024-12-31", rentAmount: 50000, serviceFee: 7500 },
            { floor: "5", tierOrder: 2, startDate: "2025-01-01", endDate: "2026-12-31", rentAmount: 55000, serviceFee: 8250 },
            { floor: "6", tierOrder: 1, startDate: "2024-01-01", endDate: "2026-12-31", rentAmount: 30000, serviceFee: 4500 },
        ],
    },
    {
        contractNo: "KB-2024-002",
        customerId: "CUS-002",
        startDate: "2024-03-01",
        endDate: "2025-02-28",
        depositAmount: 100000,
        status: "active",
        notes: "1-year contract",
        rentalSpaces: [
            { buildingId: "BLD-B", floor: "10", areaSqm: 250 },
        ],
        pricingTiers: [
            { floor: "10", tierOrder: 1, startDate: "2024-03-01", endDate: "2025-02-28", rentAmount: 35000, serviceFee: 5250 },
        ],
    },
];

// =============================================================================
// EXPORT DATA FUNCTIONS
// =============================================================================

export function exportCustomers() {
    const wb = XLSX.utils.book_new();
    const headers = ["customer_id", "name", "type", "tax_id", "phone", "email", "address", "contact_name", "contact_phone"];
    const data = mockCustomers.map(c => [c.id, c.name, c.type, c.taxId, c.phone, c.email, c.address, c.contactName, c.contactPhone]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));

    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `customers_export_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportBuildings() {
    const wb = XLSX.utils.book_new();
    const headers = ["building_id", "name", "address", "total_floors", "total_area_sqm", "status"];
    const data = mockBuildings.map(b => [b.id, b.name, b.address, b.totalFloors, b.totalAreaSqm, b.status]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));

    XLSX.utils.book_append_sheet(wb, ws, "Buildings");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `buildings_export_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function downloadMasterTemplate() {
    const wb = XLSX.utils.book_new();

    // Loop through all defined templates and add them as sheets
    Object.values(TEMPLATES).forEach((template) => {
        const wsData = [template.headers, ...template.sampleData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = template.headers.map((header: string) => ({ wch: Math.max(header.length + 5, 15) }));
        ws["!cols"] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, template.name);
    });

    // Generate and download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "rent_roll_master_template.xlsx");
}


export function exportContractsFull() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Contract Master
    const masterHeaders = ["contract_no", "customer_id", "start_date", "end_date", "deposit_amount", "status", "notes"];
    const masterData = mockContracts.map(c => [c.contractNo, c.customerId, c.startDate, c.endDate, c.depositAmount, c.status, c.notes]);
    const wsMaster = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterData]);
    wsMaster["!cols"] = masterHeaders.map(h => ({ wch: Math.max(h.length + 5, 15) }));
    XLSX.utils.book_append_sheet(wb, wsMaster, "Contract Master");

    // Sheet 2: Rental Spaces
    const spacesHeaders = ["contract_no", "building_id", "floor", "area_sqm"];
    const spacesData: (string | number)[][] = [];
    mockContracts.forEach(c => {
        c.rentalSpaces.forEach(s => {
            spacesData.push([c.contractNo, s.buildingId, s.floor, s.areaSqm]);
        });
    });
    const wsSpaces = XLSX.utils.aoa_to_sheet([spacesHeaders, ...spacesData]);
    wsSpaces["!cols"] = spacesHeaders.map(h => ({ wch: Math.max(h.length + 5, 15) }));
    XLSX.utils.book_append_sheet(wb, wsSpaces, "Rental Spaces");

    // Sheet 3: Pricing Tiers
    const tiersHeaders = ["contract_no", "floor", "tier_order", "start_date", "end_date", "rent_amount", "service_fee"];
    const tiersData: (string | number)[][] = [];
    mockContracts.forEach(c => {
        c.pricingTiers.forEach(t => {
            tiersData.push([c.contractNo, t.floor, t.tierOrder, t.startDate, t.endDate, t.rentAmount, t.serviceFee]);
        });
    });
    const wsTiers = XLSX.utils.aoa_to_sheet([tiersHeaders, ...tiersData]);
    wsTiers["!cols"] = tiersHeaders.map(h => ({ wch: Math.max(h.length + 5, 15) }));
    XLSX.utils.book_append_sheet(wb, wsTiers, "Pricing Tiers");

    // Generate and download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `contracts_full_export_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

export interface ImportResult {
    success: boolean;
    sheetName: string;
    rowCount: number;
    data: Record<string, unknown>[];
    errors: string[];
}

export async function importExcelFile(file: File): Promise<ImportResult[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });

                const results: ImportResult[] = [];

                workbook.SheetNames.forEach((sheetName) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    results.push({
                        success: true,
                        sheetName,
                        rowCount: jsonData.length,
                        data: jsonData as Record<string, unknown>[],
                        errors: [],
                    });
                });

                resolve(results);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
    });
}

export function validateImportData(sheetName: string, data: Record<string, unknown>[]): string[] {
    const errors: string[] = [];

    // Basic validation based on sheet type
    if (sheetName.toLowerCase().includes("customer")) {
        data.forEach((row, index) => {
            if (!row.name && !row.customer_id) {
                errors.push(`Row ${index + 2}: Missing customer name or ID`);
            }
        });
    } else if (sheetName.toLowerCase().includes("contract") && sheetName.toLowerCase().includes("master")) {
        data.forEach((row, index) => {
            if (!row.contract_no) {
                errors.push(`Row ${index + 2}: Missing contract number`);
            }
            if (!row.customer_id) {
                errors.push(`Row ${index + 2}: Missing customer ID`);
            }
            if (!row.start_date || !row.end_date) {
                errors.push(`Row ${index + 2}: Missing start or end date`);
            }
        });
    } else if (sheetName.toLowerCase().includes("rental") || sheetName.toLowerCase().includes("spaces")) {
        data.forEach((row, index) => {
            if (!row.contract_no) {
                errors.push(`Row ${index + 2}: Missing contract number`);
            }
            if (!row.building_id) {
                errors.push(`Row ${index + 2}: Missing building ID`);
            }
            if (!row.floor) {
                errors.push(`Row ${index + 2}: Missing floor`);
            }
        });
    } else if (sheetName.toLowerCase().includes("pricing") || sheetName.toLowerCase().includes("tier")) {
        data.forEach((row, index) => {
            if (!row.contract_no) {
                errors.push(`Row ${index + 2}: Missing contract number`);
            }
            if (!row.rent_amount) {
                errors.push(`Row ${index + 2}: Missing rent amount`);
            }
        });
    }

    return errors;
}
