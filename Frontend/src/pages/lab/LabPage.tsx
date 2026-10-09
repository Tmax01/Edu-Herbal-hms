import { useState, useRef } from 'react';
import { LabOrder } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLaboratory } from '../../hooks/useLaboratory';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

interface LabPDF {
  labOrderId: string;
  fileName: string;
  uploadedAt: string;
  size: string;
}

export default function LabPage() {
  const { activeBranch, user } = useAuth();
  const [selected, setSelected] = useState<LabOrder | null>(null);
  const [resultText, setResultText] = useState('');
  const [pdfs, setPdfs] = useState<LabPDF[]>([
    { labOrderId: 'LAB-004', fileName: 'LAB-004_FBC_RDT_Abena_Kyei.pdf', uploadedAt: '2026-08-21 15:30', size: '284 KB' },
  ]);
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [viewPdf, setViewPdf] = useState<LabPDF | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { orders, loading, error, submitResults, approveOrder } = useLaboratory(activeBranch);

  const isDoctor = user?.role === 'doctor' || user?.role === 'cto' || user?.role === 'admin';
  const isLab = user?.role === 'lab_tech' || user?.role === 'cto' || user?.role === 'admin';

  const submitResult = async () => {
    if (!selected) return;
    if (!resultText && !uploadedPdf) return;

    const fileName = uploadedPdf ? uploadedPdf.name : undefined;
    const fileSizeKb = uploadedPdf ? Math.round(uploadedPdf.size / 1024) : undefined;

    await submitResults(selected.id, resultText || 'See attached PDF report', fileName, fileSizeKb);

    if (uploadedPdf) {
      setPdfs((prev) => [
        ...prev,
        {
          labOrderId: selected.id,
          fileName: uploadedPdf.name,
          uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          size: `${(uploadedPdf.size / 1024).toFixed(0)} KB`,
        },
      ]);
    }

    setSelected(null);
    setResultText('');
    setUploadedPdf(null);
  };

  const handleApprove = async (id: string) => {
    await approveOrder(id);
  };

  const pending = orders.filter((o) => o.status !== 'Completed');
  const completed = orders.filter((o) => o.status === 'Completed');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Laboratory</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Loading worklist...' : `${pending.length} pending · ${completed.length} completed · ${pdfs.length} PDF reports`}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <DepartmentGuide department="lab" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending orders */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Pending Orders</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-slate-400 py-12 text-sm">Loading lab worklist...</p>
            ) : (
              pending.map((o) => {
                const hasPdf = pdfs.find((p) => p.labOrderId === o.id);
                return (
                  <div key={o.id} className="bg-white rounded-xl border border-[#dbe4ef] p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-[#0f172a]">{o.patientName}</p>
                        <p className="text-xs text-slate-400">{o.id} · {o.orderedDate} · {o.doctorName}</p>
                      </div>
                      <Badge variant={statusBadge(o.status)}>{o.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {o.tests.map((t: string) => <Badge key={t} variant="info">{t}</Badge>)}
                    </div>
                    {hasPdf && (
                      <div
                        className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-2 cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => setViewPdf(hasPdf)}
                      >
                        <span className="text-red-500 text-lg">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-700 truncate">{hasPdf.fileName}</p>
                          <p className="text-[10px] text-red-400">{hasPdf.size} · Uploaded {hasPdf.uploadedAt}</p>
                        </div>
                      </div>
                    )}
                    {o.results && (
                      <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] mb-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Technician Finding</p>
                        <p className="text-xs text-[#0f172a] whitespace-pre-line">{o.results}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f8]">
                      {isLab && o.status === 'Pending' && (
                        <Button size="sm" variant="teal" onClick={() => setSelected(o)}>Enter Results / Attach PDF</Button>
                      )}
                      {isDoctor && o.status === 'Awaiting Approval' && (
                        <Button size="sm" variant="teal" onClick={() => handleApprove(o.id)}>Approve Report</Button>
                      )}
                      {!isLab && !isDoctor && <span className="text-xs text-slate-400">View only</span>}
                    </div>
                  </div>
                );
              })
            )}
            {!loading && pending.length === 0 && (
              <p className="text-center text-slate-400 py-12 text-sm">No pending laboratory orders</p>
            )}
          </div>
        </div>

        {/* Completed orders */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Completed Reports</h3>
          <div className="space-y-3">
            {completed.map((o) => {
              const hasPdf = pdfs.find((p) => p.labOrderId === o.id);
              return (
                <div key={o.id} className="bg-white rounded-xl border border-[#dbe4ef] p-4 opacity-90">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-[#0f172a]">{o.patientName}</p>
                      <p className="text-xs text-slate-400">{o.id} · {o.doctorName}</p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {o.tests.map((t: string) => <Badge key={t} variant="muted">{t}</Badge>)}
                  </div>
                  {hasPdf && (
                    <div
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-2 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => setViewPdf(hasPdf)}
                    >
                      <span className="text-red-500 text-lg">📄</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-700 truncate">{hasPdf.fileName}</p>
                        <p className="text-[10px] text-red-400">{hasPdf.size} · Signed off</p>
                      </div>
                    </div>
                  )}
                  {o.results && (
                    <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                      <p className="text-xs text-slate-700 whitespace-pre-line">{o.results}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && completed.length === 0 && (
              <p className="text-center text-slate-400 py-12 text-sm">No completed lab reports</p>
            )}
          </div>
        </div>
      </div>

      {/* Result Entry Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Enter Results — ${selected.id}`}>
          <div className="p-5 space-y-4">
            <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#dbe4ef]">
              <p className="font-bold text-sm text-[#0f172a]">{selected.patientName}</p>
              <p className="text-xs text-slate-400">Ordered by {selected.doctorName} · Tests: {selected.tests.join(', ')}</p>
            </div>
            <Textarea
              label="Diagnostic Results & Findings *"
              placeholder="Enter numerical values, reference ranges, observations..."
              rows={4}
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
            />
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Attach PDF Report (optional)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setUploadedPdf(e.target.files?.[0] || null)}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                {uploadedPdf ? `✓ ${uploadedPdf.name}` : '📁 Choose PDF File'}
              </Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submitResult}>Submit for Approval</Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View PDF Modal */}
      {viewPdf && (
        <Modal open={!!viewPdf} onClose={() => setViewPdf(null)} title={`PDF Report — ${viewPdf.fileName}`} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-3xl">📄</span>
                <div>
                  <p className="font-semibold text-sm">{viewPdf.fileName}</p>
                  <p className="text-xs text-slate-400">{viewPdf.size} · Uploaded {viewPdf.uploadedAt}</p>
                </div>
              </div>
              <Badge variant="teal">PDF Report</Badge>
            </div>
            <div className="border border-[#dbe4ef] rounded-xl p-8 bg-slate-50 text-center space-y-3">
              <span className="text-5xl">🔬</span>
              <p className="font-bold text-[#0f172a]">EduHMS Laboratory Diagnostic Report</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Official diagnostic lab result document signed off by clinical path lab technician.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewPdf(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
