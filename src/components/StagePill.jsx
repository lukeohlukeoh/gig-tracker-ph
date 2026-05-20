const STYLES = {
  gig:     'bg-gray-100 text-gray-600',
  po:      'bg-blue-100 text-blue-700',
  receipt: 'bg-amber-100 text-amber-700',
  paid:    'bg-green-100 text-green-700',
};

const LABELS = {
  gig:     'Gig Done',
  po:      'PO Received',
  receipt: 'Receipt Sent',
  paid:    'Paid',
};

export default function StagePill({ stage }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STYLES[stage] || 'bg-gray-100 text-gray-500'}`}>
      {LABELS[stage] || stage}
    </span>
  );
}
