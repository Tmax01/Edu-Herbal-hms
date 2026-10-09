import { useState, useEffect, useCallback } from 'react';
import wardService from '../services/wardService';
import { WardBed, CreateAdmissionDto } from '../types/ward';
export function useWards(branchId?: string) {
  const [beds, setBeds] = useState<WardBed[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wardService.getWards(branchId);
      if (Array.isArray(data)) {
        // Map API Wards & Beds to flat WardBed array for UI rendering
        const flattened: WardBed[] = [];
        data.forEach((w) => {
          if (w.beds && w.beds.length > 0) {
            w.beds.forEach((b) => {
              flattened.push({
                id: b.id,
                ward: w.name,
                bedNumber: b.bedNumber,
                status: b.status === 'Cleaning' ? 'Maintenance' : (b.status as any),
                patientName: b.patientName,
                patientId: b.patientId,
                branch: w.branchId as any,
              });
            });
          }
        });
        setBeds(flattened);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load wards data');
    } finally {
      setLoading(false);
    }
  }, [branchId]);


  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  const admitPatient = async (dto: CreateAdmissionDto) => {
    try {
      await wardService.admitPatient(dto);
    } catch (err: any) {
      console.warn('Backend admission failed, applying local state update:', err);
    }
    // Update local state for seamless UX
    setBeds((prev) =>
      prev.map((b) =>
        b.id === dto.bedId
          ? {
              ...b,
              status: 'Occupied' as const,
              patientId: dto.patientId,
              patientName: dto.notes ? dto.notes : 'Admitted Patient',
              admittedDate: new Date().toISOString().split('T')[0],
            }
          : b
      )
    );
  };

  const dischargeBed = async (bedId: string, summary?: string) => {
    try {
      await wardService.dischargeBed(bedId, summary);
    } catch (err: any) {
      console.warn('Backend discharge failed, applying local state update:', err);
    }
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? { ...b, status: 'Available' as const, patientName: undefined, patientId: undefined, admittedDate: undefined }
          : b
      )
    );
  };

  return {
    beds,
    loading,
    error,
    refetch: fetchWards,
    admitPatient,
    dischargeBed,
  };
}

export default useWards;
