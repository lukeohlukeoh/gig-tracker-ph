import { useState, useEffect, useRef } from 'react';
import StagePill from './StagePill.jsx';
import GigForm from './GigForm.jsx';
import { peso, wht, formatDate, isFollowUpDue, daysInReceipt } from '../utils/format.js';
import { saveAttachment, getAttachment, deleteAttachment } from '../utils/attachments.js';

const STAGES = ['gig', 'po', 'receipt', 'paid'];
const STAGE_LABELS = { gig: 'Gig Done', po: 'PO Received', receipt: 'Receipt Sent', paid: 'Paid' };

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}

export default function GigDetail({ gig, onUpdate, onDelete, onBack }) {
  const [mode, setMode] = useState('view'); // 'view' | 'advance' | 'edit'

  const stageIdx = STAGES.indexOf(gig.stage);
  const isLast = stageIdx === STAGES.length - 1;
  const { amount: whtAmount, rate: whtRate } = wht(gig.gross, gig.net);
  const missing2303 = gig.stage === 'paid' && !gig.ref2303;
  const followUp = isFollowUpDue(gig);
  const days = daysInReceipt(gig);

  const [attachment, setAttachment] = useState(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getAttachment(gig.id).then(setAttachment).catch(() => {});
  }, [gig.id]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachLoading(true);
    try {
      const record = await saveAttachment(gig.id, file);
      setAttachment(record);
    } finally {
      setAttachLoading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteAttachment() {
    if (!confirm('Remove this 2307 attachment?')) return;
    await deleteAttachment(gig.id);
    setAttachment(null);
  }

  function handleViewAttachment() {
    if (!attachment) return;
    if (attachment.type === 'application/pdf') {
      const blob = dataURLToBlob(attachment.data);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }

  function dataURLToBlob(dataURL) {
    const [header, base64] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function handleSave(data) {
    onUpdate({ ...gig, ...data });
    setMode('view');
  }

  if (mode === 'advance' || mode === 'edit') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <button onClick={() => setMode('view')} className="text-gray-400 hover:text-gray-600 text-xl leading-none min-w-[44px] min-h-[44px] flex items-center">←</button>
          <h2 className="text-base font-bold text-gray-800">
            {mode === 'advance' ? `Advance: ${gig.client}` : `Edit: ${gig.client}`}
          </h2>
        </div>
        <div className="p-4 overflow-y-auto">
          <GigForm
            initial={gig}
            onSave={handleSave}
            onCancel={() => setMode('view')}
            advanceFrom={mode === 'advance' ? gig.stage : null}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xl leading-none min-w-[44px] min-h-[44px] flex items-center">←</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-800 truncate">{gig.client}</h2>
          <p className="text-xs text-gray-500 truncate">{gig.venue} · {formatDate(gig.date)}</p>
        </div>
        <StagePill stage={gig.stage} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Missing 2303 warning */}
        {missing2303 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium flex items-center gap-2">
            <span>⚠️</span> Missing BIR 2303 certificate
          </div>
        )}

        {/* Follow-up reminder */}
        {followUp && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 font-medium flex items-center gap-2">
            <span>📬</span> No payment after {days} days — time to follow up
          </div>
        )}

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Pipeline Progress</p>
          <div className="flex items-center gap-1">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-2 w-full rounded-full ${i <= stageIdx ? 'bg-[#1D9E75]' : 'bg-gray-100'}`} />
                <span className={`text-[10px] font-medium ${i <= stageIdx ? 'text-[#1D9E75]' : 'text-gray-300'}`}>
                  {STAGE_LABELS[s].split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Details</p>
          <Field label="Client" value={gig.client} />
          <Field label="Venue" value={gig.venue} />
          <Field label="Gig Date" value={formatDate(gig.date)} />
          <Field label="Quarter" value={gig.quarter} />
          <Field label="Notes" value={gig.notes} />
        </div>

        {/* Financials */}
        {(gig.gross || gig.net || gig.poNumber) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Financials</p>
            <Field label="PO Number" value={gig.poNumber} />
            <Field label="Gross Amount" value={peso(gig.gross)} />
            <Field label="Net on PO" value={peso(gig.net)} />
            {gig.gross && gig.net && (
              <>
                <Field label="WHT Withheld" value={`${peso(whtAmount)} (${whtRate.toFixed(2)}%)`} />
              </>
            )}
          </div>
        )}

        {/* Receipt */}
        {(gig.receiptNumber || gig.receiptDate) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Receipt</p>
            <Field label="OR Number" value={gig.receiptNumber} />
            <Field label="Date Sent" value={formatDate(gig.receiptDate)} />
          </div>
        )}

        {/* Payment */}
        {(gig.paymentDate || gig.ref2303 || gig.actualNet) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Payment</p>
            <Field label="Payment Date" value={formatDate(gig.paymentDate)} />
            <Field label="BIR 2303 Ref" value={gig.ref2303} />
            <Field label="Actual Net Received" value={peso(gig.actualNet)} />
          </div>
        )}

        {/* BIR 2307 Attachment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">BIR Form 2307</p>
          {attachment ? (
            <div className="flex flex-col gap-3">
              {attachment.type.startsWith('image/') ? (
                <img src={attachment.data} alt="BIR 2307" className="w-full rounded-xl border border-gray-100 object-contain max-h-64" />
              ) : (
                <button
                  onClick={handleViewAttachment}
                  className="w-full py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 active:opacity-70"
                >
                  <span>📄</span> View PDF — {attachment.name}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 min-h-[44px]"
                >
                  Replace
                </button>
                <button
                  onClick={handleDeleteAttachment}
                  className="flex-1 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-500 min-h-[44px]"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={attachLoading}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 flex items-center justify-center gap-2 min-h-[44px] active:opacity-70"
            >
              {attachLoading ? 'Saving…' : '+ Attach 2307 (photo or PDF)'}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-4">
          {!isLast && (
            <button
              onClick={() => setMode('advance')}
              className="w-full py-3 rounded-xl bg-[#1D9E75] text-white font-semibold text-sm min-h-[44px] active:opacity-90"
            >
              Advance to {STAGE_LABELS[STAGES[stageIdx + 1]]} →
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('edit')}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 min-h-[44px]"
            >
              Edit
            </button>
            <button
              onClick={() => { if (confirm('Delete this gig?')) onDelete(gig.id); }}
              className="flex-1 py-3 rounded-xl border border-red-200 text-sm font-semibold text-red-500 min-h-[44px]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
