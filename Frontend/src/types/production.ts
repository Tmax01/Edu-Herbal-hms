export type ProductionStage = 'Mixing' | 'Processing' | 'QC' | 'Packaging' | 'Completed' | 'Rejected';

export interface ProductionBatch {
  id: string;
  product: string;
  batchNumber: string;
  stage: ProductionStage;
  startDate: string;
  quantity: number;
  notes?: string;
  branch?: string;
  qcPassed?: boolean;
  qcApprover?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductionBatchDto {
  product: string;
  quantity: number;
  notes?: string;
  branch?: string;
}

export interface UpdateProductionStageDto {
  stage: ProductionStage;
  notes?: string;
}
