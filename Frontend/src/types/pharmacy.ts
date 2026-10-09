export interface DispenseItemInput {
  prescriptionItemId?: string;
  drugName?: string;
  dispensedQuantity: number;
  batchId?: string;
}

export interface DispensePrescriptionDto {
  items: DispenseItemInput[];
  notes?: string;
}

export interface QueryPrescriptionsDto {
  patientId?: string;
  status?: string;
  branchId?: string;
  branch?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BackendPrescription {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  branchId?: string;
  branch?: { id: string; name: string } | string;
  status: 'Pending' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled';
  type?: 'Conventional' | 'Herbal';
  date?: string;
  createdAt: string;
  items: Array<{
    id?: string;
    drugName: string;
    drug?: string;
    dosage: string;
    frequency: string;
    durationDays?: number;
    duration?: string;
    quantity?: number;
    dispensedQuantity?: number;
  }>;
  patientAllergies?: string[];
  patient?: any;
  doctor?: any;
}

export interface CreateStockItemDto {
  name: string;
  code?: string;
  category: string;
  unitOfMeasure: string;
  reorderLevel: number;
  unitPrice?: number;
  description?: string;
}

export interface CreateBatchDto {
  itemId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  unitCost?: number;
  supplierId?: string;
  branchId?: string;
}

export interface TransferStockDto {
  itemId: string;
  batchId?: string;
  sourceBranchId: string;
  targetBranchId: string;
  quantity: number;
  notes?: string;
}

export interface StockTransactionDto {
  itemId: string;
  batchId?: string;
  type: 'Receipt' | 'Dispense' | 'Transfer In' | 'Transfer Out' | 'Adjustment' | 'Write-off';
  quantity: number;
  reason?: string;
  branchId?: string;
}

export interface QueryStockDto {
  search?: string;
  category?: string;
  branchId?: string;
  branch?: string;
  lowStockOnly?: boolean;
  expiringSoonOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface BackendStockItem {
  id: string;
  name: string;
  code?: string;
  category: string;
  unitOfMeasure: string;
  reorderLevel: number;
  totalQuantity: number;
  unitPrice?: number;
  branchId?: string;
  branch?: { id: string; name: string } | string;
  batches?: Array<{
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    unitCost?: number;
  }>;
}
