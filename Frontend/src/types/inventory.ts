export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  type: 'Drug' | 'Herbal' | 'Consumable' | 'Equipment' | 'Raw Material';
  items: string[];
  paymentTerms: string;
  rating: number;
  lastOrder?: string;
  branch: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierDto {
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  type?: 'Drug' | 'Herbal' | 'Consumable' | 'Equipment' | 'Raw Material';
  items?: string[];
  paymentTerms?: string;
  branch?: string;
}
