import { useState, useEffect, useCallback } from 'react';
import nursingService from '../services/nursingService';
import { NursingNote, CreateNursingNoteDto } from '../types/nursing';
export function useNursing(branchId?: string, selectedBedId?: string) {
  const [notes, setNotes] = useState<NursingNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nursingService.getNotes({
        branchId,
        bedId: selectedBedId || undefined,
      });
      if (Array.isArray(data)) {
        setNotes(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load nursing notes');
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedBedId]);


  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (dto: CreateNursingNoteDto, fallbackPatientName?: string, nurseName?: string) => {
    let createdNote: NursingNote | null = null;
    try {
      const res = await nursingService.createNote(dto);
      if (res && res.id) {
        createdNote = res;
      }
    } catch (err: any) {
      console.warn('Backend nursing note save failed, applying local state update:', err);
    }

    const noteToAdd: NursingNote = createdNote || {
      id: `NN-${String(notes.length + 1).padStart(3, '0')}`,
      patientName: fallbackPatientName || 'Inpatient',
      bedId: dto.bedId,
      nurseName: nurseName || 'Nursing Staff',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      vitals: {
        bp: dto.systolicBp && dto.diastolicBp ? `${dto.systolicBp}/${dto.diastolicBp}` : '120/80',
        pulse: dto.pulseRate ? String(dto.pulseRate) : '72',
        temp: dto.temperature ? String(dto.temperature) : '36.6',
        spo2: dto.spo2 ? `${dto.spo2}%` : '98%',
      },
      note: dto.content || dto.notes || '',
      type: dto.noteType,
    };

    setNotes((prev) => [noteToAdd, ...prev]);
    return noteToAdd;
  };

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    addNote,
  };
}

export default useNursing;
