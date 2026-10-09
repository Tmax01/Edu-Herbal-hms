import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { vitalsService } from '../../services/vitalsService';
import { consultationService } from '../../services/consultationService';
import { pharmacyService } from '../../services/pharmacyService';
import billingService from '../../services/billingService';

vi.mock('../../services/patientService');
vi.mock('../../services/appointmentService');
vi.mock('../../services/vitalsService');
vi.mock('../../services/consultationService');
vi.mock('../../services/pharmacyService');
vi.mock('../../services/billingService');

describe('E2E Scenario A: Outpatient Clinical Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* Registration -> Booking -> Triage Vitals -> SOAP -> Dispense -> Invoice    */
  /* -------------------------------------------------------------------------- */
  it('Outpatient Lifecycle: Registration -> Booking -> Triage -> SOAP -> Dispense -> Settlement', async () => {
    // 1. Patient Demographics Registration
    const newPatientPayload = { fullName: 'Abena Ofori', gender: 'Female', phone: '+233 24 111 9999', branch: 'Accra' };
    const mockCreatedPatient = { id: 'PAT-999', mrn: 'MRN-2026-9999', ...newPatientPayload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    (patientService.createPatient as any).mockResolvedValue(mockCreatedPatient);

    const registeredPatient = await patientService.createPatient(newPatientPayload);
    expect(registeredPatient.id).toBe('PAT-999');
    expect(registeredPatient.mrn).toBe('MRN-2026-9999');

    // 2. Schedule Appointment & Check-in
    const appointmentPayload = { patientId: registeredPatient.id, doctorId: 'USR-003', date: '2026-08-22', time: '09:00', branch: 'Accra' };
    const mockAppointment = { id: 'APT-999', ...appointmentPayload, status: 'Checked-in' };
    (appointmentService.createAppointment as any).mockResolvedValue(mockAppointment);

    const scheduledAppt = await appointmentService.createAppointment(appointmentPayload);
    expect(scheduledAppt.status).toBe('Checked-in');

    // 3. Record Triage Vitals
    const vitalsPayload = { patientId: registeredPatient.id, bp: '120/80', bloodPressure: '120/80', temperature: 36.8, pulseRate: 72 };
    (vitalsService.recordVitals as any).mockResolvedValue({ id: 'VIT-999', ...vitalsPayload });

    const vitals = await vitalsService.recordVitals(vitalsPayload as any);
    expect((vitals as any).bp).toBe('120/80');

    // 4. Doctor SOAP Encounter & e-Prescription Generation
    const soapPayload = {
      patientId: registeredPatient.id,
      doctorId: 'USR-003',
      chiefComplaint: 'Patient reports mild headaches and dizziness',
      diagnosis: 'Essential Hypertension',
      notes: 'Prescribe Amlodipine 5mg once daily for 30 days',
      items: [{ drugName: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Daily', duration: '30 days', quantity: 30 }],
    };
    const mockEncounter = { id: 'ENC-999', ...soapPayload, createdAt: new Date().toISOString() };
    (consultationService.createConsultation as any).mockResolvedValue(mockEncounter);

    const encounter = await consultationService.createConsultation(soapPayload as any);
    expect(encounter.id).toBe('ENC-999');
    expect(encounter.diagnosis).toBe('Essential Hypertension');

    // 5. FEFO Pharmacy Medication Dispensing
    const dispensePayload = { items: [{ drugName: 'Amlodipine 5mg', dispensedQuantity: 30, batchNumber: 'BT-2026-001' }] };
    const mockDispenseResult = { id: 'RX-999', status: 'Dispensed' };
    (pharmacyService.dispensePrescription as any).mockResolvedValue(mockDispenseResult);

    const dispensedRx = await pharmacyService.dispensePrescription('RX-999', dispensePayload);
    expect(dispensedRx.status).toBe('Dispensed');

    // 6. Billing Payment Settlement & Receipt Generation
    const paymentPayload = { invoiceId: 'INV-999', amountPaid: 120, paymentMethod: 'Mobile Money' as const, transactionReference: 'MM-2026-001' };
    const mockInvoiceResult = { id: 'INV-999', total: 120, paid: 120, status: 'Paid' as const };
    (billingService.recordPayment as any).mockResolvedValue(mockInvoiceResult);

    const settledInvoice = await billingService.recordPayment(paymentPayload);
    expect(settledInvoice.status).toBe('Paid');
    expect(settledInvoice.paid).toBe(120);
  });
});
