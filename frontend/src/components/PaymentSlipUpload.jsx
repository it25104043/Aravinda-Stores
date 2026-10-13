import React, { useEffect, useState } from 'react';
import { PaymentService } from '../api/services';
import { useApi, useAction } from '../utils/useApi';
import Feedback from './Feedback';
import { formatMoney } from '../utils/pricing';
export default function PaymentSlipUpload({
  payment,
  order,
  refresh,
  onClose
}) {
  const policy = useApi('/payments/slip-policy'),
    action = useAction();
  const [file, setFile] = useState(null),
    [preview, setPreview] = useState(''),
    [error, setError] = useState(''),
    [progress, setProgress] = useState(null);
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const limits = policy.data;
  return <form className="form" aria-busy={action.busy} onSubmit={async event => {
    event.preventDefault();
    if (!file || !limits || error) return;
    setProgress(0);
    if (await action.run(key => PaymentService.upload(payment.paymentId, file, key, event => {
      if (event.total) setProgress(Math.round(event.loaded * 100 / event.total));
    }), 'Awaiting Verification')) {
      refresh();
      onClose?.();
    }
    setProgress(null);
  }}><h2>Upload Payment Slip</h2><p>{order?.reference || `Order ${payment.orderId}`} - Amount payable: <strong>{formatMoney(payment.amount)}</strong></p>
    <Feedback {...policy} /><Feedback {...action} />
    {limits && <p>PNG or JPEG. Maximum {(limits.maxBytes / 1024 / 1024).toLocaleString()} MB; up to {limits.maxDimension} pixels per side and {limits.maxPixels.toLocaleString()} pixels in total.</p>}
    <label>Payment slip<input required type="file" disabled={action.busy || !limits} accept={limits?.contentTypes?.join(',')} onChange={event => {
        const selected = event.target.files?.[0];
        setError('');
        setFile(null);
        if (!selected) return;
        if (!limits.contentTypes.includes(selected.type)) {
          setError('Choose a PNG or JPEG image.');
          return;
        }
        if (selected.size > limits.maxBytes || !selected.size) {
          setError('The selected file is empty or exceeds the server upload limit.');
          return;
        }
        setFile(selected);
      }} /></label>
    {error && <p role="alert" className="notice error">{error}</p>}
    {preview && <figure className="slip-preview"><img src={preview} alt="Selected payment slip preview" /><figcaption>{file.name}</figcaption></figure>}
    {action.busy && <p role="status">{progress === null ? 'Uploading...' : progress < 100 ? `Uploading ${progress}%` : 'Processing image...'}</p>}
    <div className="dialog-actions"><button type="button" disabled={action.busy} onClick={onClose}>Cancel</button><button className="primary" disabled={action.busy || !file || !limits || !!error}>Upload slip</button></div>
  </form>;
}
