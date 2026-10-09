import { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Patient } from './types';
import Login from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/patients/PatientList';
import PatientProfile from './pages/patients/PatientProfile';
import NewPatient from './pages/patients/NewPatient';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import ConsultationPage from './pages/consultation/ConsultationPage';
import PharmacyPage from './pages/pharmacy/PharmacyPage';
import LabPage from './pages/lab/LabPage';
import BillingPage from './pages/billing/BillingPage';
import WardPage from './pages/ward/WardPage';
import CallCentrePage from './pages/callcentre/CallCentrePage';
import ProductionPage from './pages/production/ProductionPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ReportsPage from './pages/reports/ReportsPage';
import UserManagement from './pages/cto/UserManagement';
import AccessControl from './pages/cto/AccessControl';
import AuditLogPage from './pages/cto/AuditLogPage';
import MeetingsPage from './pages/meetings/MeetingsPage';
import AccountingPage from './pages/accounting/AccountingPage';
import FollowUpsPage from './pages/followups/FollowUpsPage';
import NursingPage from './pages/nursing/NursingPage';
import SuppliersPage from './pages/inventory/SuppliersPage';
import HRPage from './pages/hr/HRPage';
import ChatPage from './pages/chat/ChatPage';
import DailyReportsPage from './pages/reports/DailyReportsPage';
import TelemedicinePage from './pages/telemedicine/TelemedicinePage';
import AIAssistantPage from './pages/ai/AIAssistantPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';

type Page = string;

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patient Registry',
  new_patient: 'New Patient Registration',
  patient_profile: 'Patient Profile',
  appointments: 'Appointments',
  consultation: 'Consultation & EMR',
  pharmacy: 'Pharmacy',
  lab: 'Laboratory',
  billing: 'Billing & Accounts',
  ward: 'Ward & Admissions',
  nursing: 'Nursing Notes & Daily Chart',
  followups: 'Patient Follow-ups & Reviews',
  callcentre: 'Call Centre & CRM',
  production: 'Production Management',
  inventory: 'Inventory & Stores',
  suppliers: 'Supplier Directory',
  accounting: 'Accounting & Finance',
  hr: 'Human Resources',
  meetings: 'Meetings & Scheduling',
  chat: 'Staff Chat',
  daily_reports: 'Daily Activity Reports',
  telemedicine: 'Telemedicine',
  analytics: 'Analytics & Intelligence',
  ai_assistant: 'AI Assistant',
  reports: 'Reports & Analytics',
  user_management: 'User Management',
  access_control: 'Access Control',
  audit_log: 'Audit Log',
};

const roleLanding: Record<string, string> = {
  cto: 'dashboard',
  admin: 'dashboard',
  doctor: 'consultation',
  nurse: 'nursing',
  pharmacist: 'pharmacy',
  lab_tech: 'lab',
  receptionist: 'appointments',
  accountant: 'accounting',
  call_centre: 'callcentre',
  store_officer: 'inventory',
};

function HMS() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigate to role-appropriate landing page on login
  useEffect(() => {
    if (user) setPage(roleLanding[user.role] ?? 'dashboard');
  }, [user?.id]);

  const navigate = (p: Page, data?: unknown) => {
    if (p === 'patient_profile' && data) {
      setSelectedPatient(data as Patient);
    }
    setPage(p);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  if (!user) return <Login />;

  const title = pageTitles[page] ?? page;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8]">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} onNavigate={navigate} onMenuToggle={() => setSidebarOpen((s) => !s)} />

        <main className="flex-1 overflow-y-auto">
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'patients' && <PatientList onNavigate={navigate} />}
          {page === 'new_patient' && <NewPatient onBack={() => navigate('patients')} onNavigate={navigate} />}
          {page === 'patient_profile' && selectedPatient && (
            <PatientProfile patient={selectedPatient} onBack={() => navigate('patients')} onNavigate={navigate} />
          )}
          {page === 'appointments' && <AppointmentsPage />}
          {page === 'consultation' && <ConsultationPage />}
          {page === 'pharmacy' && <PharmacyPage />}
          {page === 'lab' && <LabPage />}
          {page === 'billing' && <BillingPage />}
          {page === 'ward' && <WardPage />}
          {page === 'callcentre' && <CallCentrePage />}
          {page === 'production' && <ProductionPage />}
          {page === 'inventory' && <InventoryPage />}
          {page === 'reports' && <ReportsPage />}
          {page === 'meetings' && <MeetingsPage />}
          {page === 'accounting' && <AccountingPage />}
          {page === 'followups' && <FollowUpsPage />}
          {page === 'nursing' && <NursingPage />}
          {page === 'suppliers' && <SuppliersPage />}
          {page === 'hr' && <HRPage />}
          {page === 'chat' && <ChatPage />}
          {page === 'daily_reports' && <DailyReportsPage />}
          {page === 'telemedicine' && <TelemedicinePage />}
          {page === 'ai_assistant' && <AIAssistantPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'user_management' && <UserManagement />}
          {page === 'access_control' && <AccessControl />}
          {page === 'audit_log' && <AuditLogPage />}
          {page === 'profile' && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, logout } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfilePhoto(url);
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-lg">
      <div className="bg-white rounded-xl border border-[#dbe4ef] p-6">
        {photoSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Profile photo updated!</div>
        )}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative group">
            {profilePhoto ? (
              <img src={profilePhoto} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-[#1b4fce]/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-xl font-bold">
                {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <button
              onClick={() => photoRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <span className="text-white text-xs font-medium">📷</span>
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{user.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user.department}</p>
            <button onClick={() => photoRef.current?.click()} className="text-xs text-[#1b4fce] hover:underline mt-0.5">
              {profilePhoto ? 'Change photo' : 'Upload photo'}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Staff ID', value: user.id },
            { label: 'Email', value: user.email },
            { label: 'Role', value: user.role.replace('_', ' ').toUpperCase() },
            { label: 'Branch', value: user.branch },
            { label: 'Phone', value: user.phone },
            { label: 'Last Login', value: user.lastLogin },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-[#f0f4f8] last:border-0">
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-sm font-medium text-[#0f172a] font-mono">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-[#f0f4f8]">
          <p className="text-xs text-slate-400 mb-3">To change your password, contact the CTO.</p>
          <button onClick={logout} className="w-full py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HMS />
    </AuthProvider>
  );
}
