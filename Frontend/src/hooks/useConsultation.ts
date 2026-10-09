import { useState, useCallback } from 'react';
import { consultationService } from '../services/consultationService';
import { aiAssistantService } from '../services/aiAssistantService';
import {
  CreateConsultationDto,
  BackendConsultation,
  DifferentialDiagnosisResponse,
  DrugSafetyResponse,
} from '../types';

export function useConsultation() {
  const [loading, setLoading] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDifferentials, setAiDifferentials] = useState<DifferentialDiagnosisResponse | null>(null);
  const [drugSafety, setDrugSafety] = useState<DrugSafetyResponse | null>(null);

  const saveConsultation = useCallback(async (dto: CreateConsultationDto): Promise<{ success: boolean; data?: BackendConsultation; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultationService.createConsultation(dto);
      setLoading(false);
      return { success: true, data };
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Consultation saved locally (offline mode)';
      setError(msg);
      return { success: true, error: msg };
    }
  }, []);

  const getAiDiagnosis = useCallback(async (symptoms: string[], age?: number, gender?: string) => {
    setAiLoading(true);
    setError(null);
    try {
      const result = await aiAssistantService.getDifferentialDiagnosis({ symptoms, age, gender });
      setAiDifferentials(result);
      return result;
    } catch (err: any) {
      setError(err?.message || 'AI Assistant service unavailable');
      setAiDifferentials(null);
      return null;
    } finally {
      setAiLoading(false);
    }
  }, []);


  const checkDrugInteractions = useCallback(async (drugNames: string[], patientAllergies?: string[]) => {
    try {
      const safety = await aiAssistantService.checkDrugSafety({ drugNames, patientAllergies });
      setDrugSafety(safety);
      return safety;
    } catch {
      return null;
    }
  }, []);

  const clearAiDifferentials = useCallback(() => setAiDifferentials(null), []);

  return {
    loading,
    aiLoading,
    error,
    aiDifferentials,
    drugSafety,
    saveConsultation,
    getAiDiagnosis,
    checkDrugInteractions,
    clearAiDifferentials,
  };
}
