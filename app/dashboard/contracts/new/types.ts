export interface Customer {
    id: string;
    name: string;
    taxId: string;
    type: string;
}

export interface RentPeriod {
    id: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    monthlyRent: number;
    serviceFee: number;
}

export interface RentalSpace {
    id: string;
    buildingId: string;
    buildingName: string;
    floor: string;
    areaSqm: number;
    rentPeriods: RentPeriod[];
}

export interface Building {
    id: string;
    name: string;
}



export interface ContractFormData {
    customerId: string;
    customerName: string;
    contractNo: string;
    contractStartDate: Date | undefined;
    contractEndDate: Date | undefined;
    depositAmount: number;
    notes: string;
    rentalSpaces: RentalSpace[];
    documents: File[];
}

