import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/presentation';
import Modal from './Modal';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PaymentService } from '../api/services';
import { useAction } from '../utils/useApi';
import { formatMoney } from '../utils/pricing';
import Feedback from './Feedback';
export default function PaymentReview({
  payment: p,
  refresh
}) {
  const {
      user
    } = useContext(AuthContext),
    a = useAction();
  const [reason, setReason] = useState(''),
    [slip, setSlip] = useState(null),
    [decision, setDecision] = useState(null);
  useEffect(() => () => {
    if (slip) URL.revokeObjectURL(slip);
  }, [slip]);
  async function view() {
    await a.run(async () => {
      const result = await PaymentService.slip(p.paymentId);
      setSlip(URL.createObjectURL(result.data));
    }, 'Private slip loaded');
  }
  async function confirm() {
    const saved = await a.run(key => decision === 'reconcile' ? PaymentService.reconcile(p.paymentId, reason.trim(), key) : PaymentService.review(p.paymentId, {
      approve: decision === 'accept',
      reason: reason.trim() || 'Matched bank credit'
    }, key));
    if (saved) {
      setDecision(null);
      refresh();
    }
  }
  return <section className="payment-review"><h3>Payment #{p.paymentId}</h3><p><StatusBadge value={p.method} /> <StatusBadge value={p.status} /> | Collected {formatMoney(p.collectedAmount)}</p>
    <p>Outstanding: {formatMoney(Math.max(0, Number(p.amount) - Number(p.collectedAmount)))}</p>{p.verifiedAt && <p>Verified {formatDate(p.verifiedAt)}{p.verifiedBy && ` by ${p.verifiedBy}`}</p>}
    {p.method === 'COD' && <p>{p.status === 'PAID' ? 'Cash collected at successful handover.' : 'Cash outstanding until successful handover.'}</p>}
    {p.method === 'CASH' && <p>{p.status === 'PAID' ? 'Cash already collected at shop.' : 'Cash due at pickup.'}</p>}<Feedback {...a} />
    {p.hasSlip && <button disabled={a.busy} onClick={view}>View Payment Slip</button>}
    {p.method === 'BANK_TRANSFER' && p.status === 'UNDER_REVIEW' && <div className="form"><div className="action-group"><button className="primary" disabled={a.busy} onClick={() => setDecision('accept')}>Accept Payment</button><button className="danger-btn" disabled={a.busy} onClick={() => setDecision('reject')}>Reject Payment</button></div></div>}
    {p.reconciliationStatus === 'REQUIRED' && <div className="notice"><p>Reconciliation required: {p.reconciliationReason}. Original payment remains recorded.</p>{user?.role === 'OWNER' && <div className="form"><button disabled={a.busy} onClick={() => setDecision('reconcile')}>Record reconciliation</button></div>}</div>}
    {p.reconciliationStatus === 'RESOLVED' && <p>Reconciliation recorded: {p.reconciliationReason}</p>}
    {decision && <Modal label="Confirm payment action" busy={a.busy} onClose={() => setDecision(null)}><h3>Confirm {decision === 'accept' ? 'payment approval' : decision === 'reject' ? 'payment rejection' : 'reconciliation outcome'}</h3><p>Order {p.orderId} - {formatMoney(p.amount)}</p><Feedback {...a} /><label>{decision === 'reconcile' ? 'Reconciliation outcome' : 'Rejection Reason / review note'}<input required={decision !== 'accept'} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><div className="action-group"><button disabled={a.busy} onClick={() => setDecision(null)}>Cancel</button><button className="primary" disabled={a.busy || (decision !== 'accept' && !reason.trim())} onClick={confirm}>Confirm payment action</button></div></Modal>}
    {slip && <Modal label="Private payment slip" busy={a.busy} onClose={() => setSlip(null)}><h3>Private payment slip</h3><img className="payment-slip" src={slip} alt={`Payment slip for order ${p.orderId}`} /><div className="action-group"><a className="btn" href={slip} download={`payment-${p.paymentId}.png`}>Download slip</a><button onClick={() => setSlip(null)}>Close slip</button></div></Modal>}
  </section>;
}
