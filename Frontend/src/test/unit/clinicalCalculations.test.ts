import { describe, it, expect } from 'vitest';

/**
 * Domain calculation functions representing clinical logic in EduHMS
 */
export function calculateBmi(weightKg: number, heightCm: number): { bmi: number; category: string } {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error('Weight and height must be strictly positive numbers');
  }
  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 18.5 && bmi < 25.0) category = 'Normal';
  else if (bmi >= 25.0 && bmi < 30.0) category = 'Overweight';
  else category = 'Obese';

  return { bmi, category };
}

export function classifyBloodPressure(systolic: number, diastolic: number): string {
  if (systolic <= 0 || diastolic <= 0 || systolic < diastolic) {
    throw new Error('Invalid blood pressure values');
  }
  if (systolic > 180 || diastolic > 120) return 'Hypertensive Crisis';
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2 Hypertension';
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return 'Stage 1 Hypertension';
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return 'Elevated';
  return 'Normal';
}

export function classifyTemperature(tempCelsius: number): string {
  if (tempCelsius < 30.0 || tempCelsius > 45.0) {
    throw new Error('Physiologically implausible body temperature');
  }
  if (tempCelsius < 35.0) return 'Hypothermia';
  if (tempCelsius <= 37.2) return 'Normal';
  if (tempCelsius <= 38.3) return 'Low-grade Fever';
  return 'High Fever';
}

describe('Clinical Calculations & Physiological Invariants', () => {
  describe('BMI Calculation & Boundaries', () => {
    it('calculates normal BMI correctly (70kg, 175cm => 22.9 Normal)', () => {
      const res = calculateBmi(70, 175);
      expect(res.bmi).toBe(22.9);
      expect(res.category).toBe('Normal');
    });

    it('identifies Underweight boundary (< 18.5)', () => {
      const res = calculateBmi(45, 170);
      expect(res.bmi).toBe(15.6);
      expect(res.category).toBe('Underweight');
    });

    it('identifies Overweight boundary (25.0 - 29.9)', () => {
      const res = calculateBmi(80, 170);
      expect(res.bmi).toBe(27.7);
      expect(res.category).toBe('Overweight');
    });

    it('identifies Obese boundary (>= 30.0)', () => {
      const res = calculateBmi(105, 170);
      expect(res.bmi).toBe(36.3);
      expect(res.category).toBe('Obese');
    });

    it('ADVERSARIAL: Rejects zero or negative weight/height with explicit error', () => {
      expect(() => calculateBmi(0, 170)).toThrow('Weight and height must be strictly positive numbers');
      expect(() => calculateBmi(-70, 170)).toThrow('Weight and height must be strictly positive numbers');
      expect(() => calculateBmi(70, 0)).toThrow('Weight and height must be strictly positive numbers');
      expect(() => calculateBmi(70, -170)).toThrow('Weight and height must be strictly positive numbers');
    });
  });

  describe('Blood Pressure Classification Invariants', () => {
    it('classifies Normal (< 120 and < 80)', () => {
      expect(classifyBloodPressure(115, 75)).toBe('Normal');
    });

    it('classifies Elevated (120-129 and < 80)', () => {
      expect(classifyBloodPressure(125, 78)).toBe('Elevated');
    });

    it('classifies Stage 1 Hypertension (130-139 or 80-89)', () => {
      expect(classifyBloodPressure(135, 85)).toBe('Stage 1 Hypertension');
      expect(classifyBloodPressure(122, 84)).toBe('Stage 1 Hypertension');
    });

    it('classifies Stage 2 Hypertension (>= 140 or >= 90)', () => {
      expect(classifyBloodPressure(145, 92)).toBe('Stage 2 Hypertension');
      expect(classifyBloodPressure(150, 75)).toBe('Stage 2 Hypertension');
    });

    it('classifies Hypertensive Crisis (> 180 or > 120)', () => {
      expect(classifyBloodPressure(190, 110)).toBe('Hypertensive Crisis');
      expect(classifyBloodPressure(160, 125)).toBe('Hypertensive Crisis');
    });

    it('ADVERSARIAL: Rejects physically impossible values (systolic < diastolic or negatives)', () => {
      expect(() => classifyBloodPressure(70, 120)).toThrow('Invalid blood pressure values');
      expect(() => classifyBloodPressure(-120, -80)).toThrow('Invalid blood pressure values');
    });
  });

  describe('Temperature Triage Boundaries', () => {
    it('classifies Normal (36.1 - 37.2°C)', () => {
      expect(classifyTemperature(36.8)).toBe('Normal');
    });

    it('classifies Hypothermia (< 35.0°C)', () => {
      expect(classifyTemperature(34.4)).toBe('Hypothermia');
    });

    it('classifies Low-grade Fever (37.3 - 38.3°C)', () => {
      expect(classifyTemperature(37.8)).toBe('Low-grade Fever');
    });

    it('classifies High Fever (> 38.3°C)', () => {
      expect(classifyTemperature(39.5)).toBe('High Fever');
    });

    it('ADVERSARIAL: Rejects implausible readings (< 30°C or > 45°C)', () => {
      expect(() => classifyTemperature(15)).toThrow('Physiologically implausible body temperature');
      expect(() => classifyTemperature(50)).toThrow('Physiologically implausible body temperature');
    });
  });
});
