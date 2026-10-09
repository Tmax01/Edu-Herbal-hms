import { useState, useEffect, useCallback } from 'react';
import { patientService, BackendPatient, CreatePatientPayload } from '../services/patientService';
import { Patient } from '../types';

// Helper to convert backend patient format to UI Patient format for smooth integration

export function formatBackendPatientToUi(bp: BackendPatient): Patient {
  const branchObj = (bp as any).registrationBranch || bp.branch;
  const branchName =
    typeof branchObj === 'object' && branchObj !== null
      ? (branchObj.name?.includes('Mankessim') ? 'Mankessim' : 'Accra')
      : (typeof branchObj === 'string' && branchObj.includes('Mankessim') ? 'Mankessim' : 'Accra');

  let allergyList: string[] = [];
  if (Array.isArray(bp.allergies)) {
    allergyList = bp.allergies.map((a: any) => (typeof a === 'string' ? a : a.allergenName));
  }

  let emergencyName = '';
  let emergencyPhone = '';
  if (bp.emergencyContacts && bp.emergencyContacts.length > 0) {
    emergencyName = bp.emergencyContacts[0].contactName;
    emergencyPhone = bp.emergencyContacts[0].phone;
  }

  return {
    id: bp.id,
    mrn: bp.mrn,
    name: bp.fullName || (bp as any).name,
    dob: bp.dateOfBirth || bp.dob || '1990-01-01',
    gender: (bp.gender as any) || 'Male',
    phone: bp.phone,
    email: bp.email || '',
    address: bp.address || '',
    emergencyContact: emergencyName,
    emergencyPhone: emergencyPhone,
    bloodGroup: bp.bloodGroup || 'O+',
    nhisId: bp.nhisId || '',
    allergies: allergyList,
    branch: branchName as any,
    notes: bp.generalNotes || (bp as any).notes || '',
    vitalsHistory: bp.vitals || [],
    medicalHistory: bp.consultations?.map((c: any) => ({
      date: c.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      doctor: c.doctor?.fullName || 'Dr. Mensah',
      diagnosis: c.primaryDiagnosis || c.diagnosis || 'Consultation',
      notes: c.treatmentPlan || c.chiefComplaint || '',
    })) || [],
    prescriptionHistory: bp.prescriptions || [],
    labHistory: bp.labOrders || [],
  };
}

export function usePatients(searchQuery: string = '', activeBranch: string = 'All') {
  const [patients, setPatients] = useState<Patient[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientService.getPatients({
        search: searchQuery,
        branch: activeBranch !== 'All' ? activeBranch : undefined,
      });

      let rawList: BackendPatient[] = [];
      if (Array.isArray(response)) {
        rawList = response;
      } else if (response && Array.isArray((response as any).items)) {
        rawList = (response as any).items;
      }

      if (rawList.length > 0) {
        const formatted = rawList.map(formatBackendPatientToUi);
        setPatients(formatted);
      } else {
        setPatients([]);
      }
    } catch (err: any) {
      setPatients([]);
      setError(err?.message || 'Failed to load patient records');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeBranch]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = async (payload: CreatePatientPayload): Promise<{ success: boolean; data?: Patient; error?: string }> => {
    try {
      const created = await patientService.createPatient(payload);
      const formatted = formatBackendPatientToUi(created);
      setPatients((prev) => [formatted, ...prev]);
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to register patient with clinical records';
      return {
        success: false,
        error: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      };
    }
  };


  return {
    patients,
    loading,
    error,
    refresh: fetchPatients,
    createPatient,
  };
}
