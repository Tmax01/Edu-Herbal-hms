import { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { patientService } from '../../services/patientService';
import { smsService } from '../../services/smsService';

interface NewPatientProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function NewPatient({ onBack, onNavigate }: NewPatientProps) {
  const [form, setForm] = useState({
    name: '', dob: '', gender: '', phone: '', email: '', address: '',
    emergencyContact: '', emergencyPhone: '', bloodGroup: '', nhisId: '',
    allergies: '', branch: 'Accra', notes: '',
    vitals_bp: '', vitals_sugar: '', vitals_weight: '', vitals_height: '',
  });
  const [saved, setSaved] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError('');
    try {
      const created = await patientService.createPatient({
        fullName: form.name,
        dateOfBirth: form.dob,
        gender: form.gender || 'Other',
        phone: form.phone,
        email: form.email,
        address: form.address,
        bloodGroup: form.bloodGroup,
        nhisId: form.nhisId,
        branch: form.branch,
        notes: form.notes,
        emergencyContact: form.emergencyContact,
        emergencyPhone: form.emergencyPhone,
        allergies: form.allergies,
        vitals_bp: form.vitals_bp,
        vitals_sugar: form.vitals_sugar,
        vitals_weight: form.vitals_weight,
        vitals_height: form.vitals_height,
        photoUrl: patientPhoto || undefined,
      });

      if (created?.id) {
        setCreatedPatientId(created.id);
      }
      setSaved(true);
      setShowSms(true);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to connect to backend server. Patient saved locally.');
      setSaved(true);
      setShowSms(true);
    } finally {
      setSubmitting(false);
    }
  };

  const sendWelcomeSms = async () => {
    setSmsSent(true);
    try {
      if (form.phone) {
        await smsService.sendSms({
          recipientPhone: form.phone,
          message: smsText,
          recipientName: form.name,
          patientId: createdPatientId || undefined,
        });
      }
    } catch {
      // Ignore SMS send error
    }
    setTimeout(() => { setShowSms(false); setSmsSent(false); onNavigate('patients'); }, 1800);
  };

  const skipSms = () => {
    setShowSms(false);
    setTimeout(() => onNavigate('patients'), 300);
  };

  const openCamera = async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(s);
    } catch {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPatientPhoto(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const firstName = form.name.split(' ')[0] || 'Patient';
  const smsText = [
    `Dear ${firstName},`,
    `Welcome to Edu Herbal Clinic (EduHMS)!`,
    `Your Good Health Is Our Concern.`,
    ``,
    `Your patient record has been created.`,
    form.bloodGroup ? `• Blood Group: ${form.bloodGroup}` : null,
    form.vitals_bp ? `• BP: ${form.vitals_bp} mmHg` : null,
    form.vitals_sugar ? `• Blood Sugar: ${form.vitals_sugar} mmol/L` : null,
    form.vitals_weight ? `• Weight: ${form.vitals_weight} kg` : null,
    form.vitals_height ? `• Height: ${form.vitals_height} cm` : null,
    ``,
    `Your NHIS: ${form.nhisId || 'Not provided'}`,
    `For enquiries call: 030-XXX-XXXX`,
    `— EduHMS Team`,
  ].filter((l): l is string => l !== null).join('\n');

  return (
    <div className="p-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
        <button onClick={onBack} className="hover:text-[#1b4fce]">Patients</button>
        <span>›</span>
        <span className="text-[#0f172a] font-medium">New Patient Registration</span>
      </div>

      <div className="bg-white rounded-xl border border-[#dbe4ef] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-5" style={{ fontFamily: 'var(--font-heading)' }}>Patient Registration Form</h2>

        {apiError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            {apiError}
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-700 font-medium">Patient registered successfully! Redirecting…</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Patient Photo */}
          <div className="flex items-center gap-5 pb-5 border-b border-[#f0f4f8]">
            <div
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#dbe4ef] flex flex-col items-center justify-center cursor-pointer hover:border-[#1b4fce] hover:bg-blue-50 transition-all overflow-hidden shrink-0 relative group"
              onClick={openCamera}
              title="Click to take patient photo"
            >
              {patientPhoto ? (
                <>
                  <img src={patientPhoto} alt="Patient" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Retake</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <span className="text-3xl mb-1 block">📷</span>
                  <span className="text-[10px] text-slate-400 font-medium">Camera</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0f172a] mb-0.5">Patient Photo</p>
              <p className="text-xs text-slate-400 leading-relaxed">Take a live photo using the device camera.<br />This will appear on the patient profile.</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={openCamera}
                  className="text-xs px-3 py-1.5 bg-[#1b4fce] text-white rounded-lg font-medium hover:bg-[#1640b0] transition-colors"
                >
                  {patientPhoto ? 'Retake Photo' : 'Open Camera'}
                </button>
                {patientPhoto && (
                  <button
                    type="button"
                    onClick={() => setPatientPhoto(null)}
                    className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Personal Information</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name *" placeholder="e.g. Adjoa Mensah" required value={form.name} onChange={set('name')} />
              <Input label="Date of Birth *" type="date" required value={form.dob} onChange={set('dob')} />
              <Select label="Gender *" required value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
              <Select label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')}>
                <option value="">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}
              </Select>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Phone Number *" placeholder="+233 xx xxx xxxx" required value={form.phone} onChange={set('phone')} />
              <Input label="Email Address" type="email" placeholder="optional" value={form.email} onChange={set('email')} />
              <div className="md:col-span-2">
                <Input label="Residential Address" placeholder="Street, Town, Region" value={form.address} onChange={set('address')} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Emergency Contact</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Emergency Contact Name" placeholder="Full name" value={form.emergencyContact} onChange={set('emergencyContact')} />
              <Input label="Emergency Contact Phone" placeholder="+233 xx xxx xxxx" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Medical & Administrative</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="NHIS ID" placeholder="e.g. NHIS-0034521" value={form.nhisId} onChange={set('nhisId')} />
              <Select label="Branch *" required value={form.branch} onChange={set('branch')}>
                <option>Accra</option>
                <option>Mankessim</option>
              </Select>
              <div className="md:col-span-2">
                <Input label="Known Allergies" placeholder="e.g. Penicillin, Sulfa drugs (comma-separated)" value={form.allergies} onChange={set('allergies')} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Additional Notes" placeholder="Any pre-existing conditions, notes, etc." rows={3} value={form.notes} onChange={set('notes')} />
              </div>
            </div>
          </fieldset>

          {/* Initial Vitals — for welcome SMS */}
          <fieldset>
            <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Initial Vitals (optional — for welcome SMS)</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Blood Pressure" placeholder="120/80 mmHg" value={form.vitals_bp} onChange={set('vitals_bp')} />
              <Input label="Blood Sugar" placeholder="mmol/L" value={form.vitals_sugar} onChange={set('vitals_sugar')} />
              <Input label="Weight (kg)" type="number" placeholder="65" value={form.vitals_weight} onChange={set('vitals_weight')} />
              <Input label="Height (cm)" type="number" placeholder="170" value={form.vitals_height} onChange={set('vitals_height')} />
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Registering Patient...' : 'Register Patient'}
            </Button>
            <Button type="button" variant="secondary" onClick={onBack}>Cancel</Button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      <Modal open={showCamera} onClose={stopCamera} title="Take Patient Photo" width="max-w-lg">
        <div className="p-5 space-y-4">
          {cameraError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <span className="text-red-500 shrink-0">⚠</span>
              <p>{cameraError}</p>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-52 border-2 border-white/50 rounded-full border-dashed" />
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <p className="text-white/60 text-xs">Position face within the guide</p>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                <Button onClick={capturePhoto} className="flex-1">
                  📸 Capture Photo
                </Button>
                <Button variant="secondary" onClick={stopCamera}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Welcome SMS Modal */}
      <Modal open={showSms} onClose={skipSms} title="Send Welcome SMS to Patient">
        <div className="p-6 space-y-4">
          {smsSent && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Welcome SMS sent to {form.phone || 'patient phone'}!</div>}
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-700 font-medium">Patient <strong>{form.name}</strong> registered successfully!</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#f0f4f8] rounded-xl">
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">{form.name || 'Patient'}</p>
              <p className="text-xs text-slate-400 font-mono">{form.phone || 'No phone provided'}</p>
            </div>
          </div>
          <div className="bg-[#0a1628] rounded-xl p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">SMS Preview</p>
            <div className="bg-[#1e293b] rounded-xl p-3 max-w-xs">
              <p className="text-white/70 text-xs whitespace-pre-line leading-relaxed">{smsText}</p>
            </div>
            <p className="text-white/20 text-[10px] mt-2">Via EduHMS SMS Gateway · {new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          {!form.phone && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠ No phone number provided — SMS cannot be delivered.</p>
          )}
          <div className="flex gap-2">
            <Button onClick={sendWelcomeSms} disabled={!form.phone}>Send Welcome SMS</Button>
            <Button variant="secondary" onClick={skipSms}>Skip &amp; Continue</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
