import { useAuth } from '../../contexts/AuthContext';
import { Module } from '../../types';
import edhecLogo from '../../assets/logoData';

interface NavItem {
  module: Module;
  label: string;
  icon: React.ReactNode;
  sub?: { label: string; page: string }[];
}

const navItems: NavItem[] = [
  { module: 'dashboard', label: 'Dashboard', icon: <GridIcon /> },
  { module: 'patients', label: 'Patients', icon: <UsersIcon /> },
  { module: 'appointments', label: 'Appointments', icon: <CalendarIcon /> },
  { module: 'consultation', label: 'Consultation', icon: <ClipboardIcon /> },
  { module: 'pharmacy', label: 'Pharmacy', icon: <PillIcon /> },
  { module: 'lab', label: 'Laboratory', icon: <FlaskIcon /> },
  { module: 'billing', label: 'Billing & Accounts', icon: <ReceiptIcon /> },
  { module: 'ward', label: 'Ward / Admissions', icon: <BedIcon /> },
  { module: 'nursing', label: 'Nursing Notes', icon: <NurseIcon /> },
  { module: 'followups', label: 'Follow-ups', icon: <HeartIcon /> },
  { module: 'callcentre', label: 'Call Centre', icon: <PhoneIcon /> },
  { module: 'production', label: 'Production', icon: <FactoryIcon /> },
  { module: 'inventory', label: 'Inventory & Stores', icon: <BoxIcon /> },
  { module: 'suppliers', label: 'Suppliers', icon: <TruckIcon /> },
  { module: 'accounting', label: 'Accounting & Finance', icon: <MoneyIcon /> },
  { module: 'hr', label: 'Human Resources', icon: <PeopleIcon /> },
  { module: 'meetings', label: 'Meetings', icon: <MeetIcon /> },
  { module: 'chat', label: 'Staff Chat', icon: <ChatIcon /> },
  { module: 'daily_reports', label: 'Daily Reports', icon: <ReportIcon /> },
  { module: 'telemedicine', label: 'Telemedicine', icon: <VideoIcon /> },
  { module: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  { module: 'ai_assistant', label: 'AI Assistant', icon: <AIIcon /> },
  { module: 'reports', label: 'Reports', icon: <ChartIcon /> },
  { module: 'user_management', label: 'User Management', icon: <ShieldIcon /> },
  { module: 'access_control', label: 'Access Control', icon: <LockIcon /> },
  { module: 'audit_log', label: 'Audit Log', icon: <LogIcon /> },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentPage, onNavigate, open, onClose }: SidebarProps) {
  const { user, can, isCTO } = useAuth();

  const ctoOnlyModules: Module[] = ['user_management', 'access_control', 'audit_log'];
  const visible = navItems.filter((item) => can(item.module));

  const generalItems = visible.filter((i) => !ctoOnlyModules.includes(i.module));
  const adminItems = visible.filter((i) => ctoOnlyModules.includes(i.module));

  const handleNav = (page: string) => {
    onNavigate(page);
    onClose?.();
  };

  return (
    <aside
      className={`
        fixed md:relative inset-y-0 left-0 z-40 md:z-auto
        flex flex-col w-64 shrink-0 h-full overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      style={{ background: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={edhecLogo}
            alt="Edu Herbal Clinic"
            className="w-11 h-11 rounded-full object-contain shrink-0 ring-2 ring-white/20 bg-white p-0.5"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>EduHMS</p>
            <p className="text-[#0d9488] text-[10px] tracking-wide font-medium truncate">Edu Herbal Clinic</p>
            <p className="text-white/25 text-[9px] truncate">Your Good Health Is Our Concern</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-3 border-b border-white/10 shrink-0">
        <p className="text-white/90 text-sm font-medium truncate">{user?.name}</p>
        <p className="text-[#0d9488] text-[11px] font-medium mt-0.5">{user?.role === 'cto' ? 'Chief Technology Officer' : user?.role === 'admin' ? 'Administrator' : user?.department}</p>
        <p className="text-white/30 text-[10px] font-mono mt-0.5">{user?.id}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {generalItems.map((item) => (
          <NavButton
            key={item.module}
            active={currentPage === item.module}
            onClick={() => handleNav(item.module)}
            icon={item.icon}
            label={item.label}
          />
        ))}

        {adminItems.length > 0 && (
          <>
            <div className="pt-3 pb-1.5 px-2">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                {isCTO() ? 'CTO Controls' : 'Admin Controls'}
              </p>
            </div>
            {adminItems.map((item) => (
              <NavButton
                key={item.module}
                active={currentPage === item.module}
                onClick={() => handleNav(item.module)}
                icon={item.icon}
                label={item.label}
                accent
              />
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <p className="text-white/20 text-[10px] text-center">v2.4.1 · {new Date().toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      </div>
    </aside>
  );
}

function NavButton({ active, onClick, icon, label, accent }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left group ${
        active
          ? accent
            ? 'bg-[#0d9488]/20 text-[#5eead4]'
            : 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white/90 hover:bg-white/5'
      }`}
    >
      <span className={`w-4 h-4 shrink-0 transition-colors ${active ? (accent ? 'text-[#5eead4]' : 'text-[#1b4fce]') : 'text-white/30 group-hover:text-white/60'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {active && (
        <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${accent ? 'bg-[#0d9488]' : 'bg-[#1b4fce]'}`} />
      )}
    </button>
  );
}

// ─── Icons (simple inline SVGs) ─────────────────────────────────────────────

function GridIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function UsersIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 8c1.105 0 2 .895 2 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="13" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function CalendarIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="2.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function ClipboardIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="3" y="2" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M6 2V1.5C6 1.224 6.224 1 6.5 1h3c.276 0 .5.224.5.5V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M5.5 7h5M5.5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function PillIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="6" width="12" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 6v4" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function FlaskIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M6 2v5L2 13h12L10 7V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function ReceiptIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 2h10v13l-1.5-1L10 14l-1.5-1L8 14l-1.5-1L5 14l-1.5-1L2 14V2h1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function BedIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M1 10V6a2 2 0 012-2h10a2 2 0 012 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M1 10h14v2H1z" stroke="currentColor" strokeWidth="1.5" /><path d="M3 13v1M13 13v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="5" cy="7" r="1" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function PhoneIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 2h3l1.5 3.5-2 1.5C6.5 9 7 9.5 8 10.5s1.5 1.5 4 3.5l1.5-2L17 13v3c-7 2-16-7-14-14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function FactoryIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M1 14V7l4-3v3l4-3v3l4-3v10H1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M4 14v-3h2v3M7 14v-3h2v3" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function BoxIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 1L15 5v6L8 15 1 11V5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 1v14M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function ChartIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="8" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="6" y="4" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="2" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 1l6 2.5v5C14 11 11 13.5 8 15c-3-1.5-6-4-6-6.5v-5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LockIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="11" r="1" fill="currentColor" /></svg>; }
function LogIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M2 3h12M2 7h8M2 11h10M2 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function NurseIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 14v-1a5 5 0 0110 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M7 6.5h2M8 5.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function HeartIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 13S2 9 2 5a3 3 0 016-1 3 3 0 016 1c0 4-6 8-6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function TruckIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M11 7h2l2 3v1h-4V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="4" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function MoneyIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 8.5h-1M12.5 8.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function PeopleIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M1 13c0-2.209 1.791-4 4-4M15 13c0-2.209-1.791-4-4-4M5 13c0-2.209 1.343-4 3-4s3 1.791 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function MeetIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="6" r="1" fill="currentColor" /></svg>; }
function ChatIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M2 2h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function ReportIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" /><path d="M5 6h6M5 9h4M5 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function VideoIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="4" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 6l4-2v8l-4-2V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function AnalyticsIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M1 11l4-4 3 2 4-6 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="1" cy="11" r="1.5" fill="currentColor" /><circle cx="5" cy="7" r="1.5" fill="currentColor" /><circle cx="8" cy="9" r="1.5" fill="currentColor" /><circle cx="12" cy="3" r="1.5" fill="currentColor" /><circle cx="15" cy="6" r="1.5" fill="currentColor" /></svg>; }
function AIIcon() { return <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
