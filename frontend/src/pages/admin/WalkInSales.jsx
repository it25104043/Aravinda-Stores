import DataTable from '../../components/DataTable';
import ProductImage from '../../components/ProductImage';
import { formatDate, humanize } from '../../utils/presentation';
import Modal from '../../components/Modal';
import React, { useState } from 'react';
import { SaleService } from '../../api/services';
import { useApi, useAction } from '../../utils/useApi';
import { formatMoney } from '../../utils/pricing';
import Feedback from '../../components/Feedback';
export default function WalkInSales() {
  const products = useApi('/products'),
    zones = useApi('/delivery-zones'),
    a = useAction();
  const [fulfilment, setFulfilment] = useState('PICKUP'),
    [lines, setLines] = useState([{
      productId: '',
      purchaseType: 'EXCHANGE',
      quantity: 1
    }]);
  const [guest, setGuest] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    zoneId: '',
    instructions: ''
  }),
    [quote, setQuote] = useState(null),
    [receipt, setReceipt] = useState(null),
    [confirmed, setConfirmed] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const invalidate = () => {
    setQuote(null);
    setConfirmed(false);
  };
  function changeLine(index, name, value) {
    invalidate();
    setLines(old => old.map((line, i) => i === index ? {
      ...line,
      [name]: value
    } : line));
  }
  function body() {
    return {
      fulfilment,
      paymentMethod: 'CASH',
      ...(fulfilment === 'DELIVERY' ? {
        customer: {
          ...guest,
          zoneId: Number(guest.zoneId)
        }
      } : {}),
      items: lines.map(l => ({
        ...l,
        productId: Number(l.productId),
        quantity: Number(l.quantity)
      }))
    };
  }
  async function record() {
    const res = await a.run(key => SaleService.recordWalkInSale(body(), key), 'Sale recorded');
    if (res) {
      setReceipt(res.data);
      setConfirmation(false);
      setQuote(null);
      setConfirmed(false);
      products.refresh();
    }
  }
  return <><h1>Walk-in cash sale</h1><p>Record payment at the shop, then arrange pickup or home delivery.</p><Feedback {...products} /><Feedback {...zones} /><Feedback {...a} />
    <form className="panel form" onSubmit={async e => {
      e.preventDefault();
      if (!quote) {
        const res = await a.run(() => SaleService.quote(body()), 'Total calculated');
        if (res) setQuote(res.data);
      } else if (confirmed) setConfirmation(true);
    }}>
      <label>Fulfilment<select value={fulfilment} onChange={e => {
        invalidate();
        setFulfilment(e.target.value);
      }}><option value="PICKUP">Pickup at shop</option><option value="DELIVERY">Home delivery</option></select></label>
      {lines.map((l, index) => <fieldset key={index}><legend>Cylinder {index + 1}</legend><label>Cylinder<select required value={l.productId} onChange={e => changeLine(index, 'productId', e.target.value)}><option value="">Choose product</option>{products.data?.map(p => <option key={p.productId} value={p.productId}>{p.brand} {p.sizeKg}kg - available {p.availableQty}</option>)}</select></label><label>Purchase type<select value={l.purchaseType} onChange={e => changeLine(index, 'purchaseType', e.target.value)}><option>EXCHANGE</option><option>NEW</option></select></label><label>Quantity<input required type="number" min="1" max="1000" value={l.quantity} onChange={e => changeLine(index, 'quantity', e.target.value)} /></label>{lines.length > 1 && <button type="button" onClick={() => {
        invalidate();
        setLines(old => old.filter((_, i) => i !== index));
      }}>Remove cylinder</button>}</fieldset>)}
      <button type="button" disabled={lines.length >= 50} onClick={() => {
        invalidate();
        setLines(old => [...old, {
          productId: '',
          purchaseType: 'EXCHANGE',
          quantity: 1
        }]);
      }}>Add cylinder</button>
      {fulfilment === 'DELIVERY' && <fieldset><legend>Guest delivery details</legend>{[['fullName', 'Customer full name'], ['phone', 'Contact number'], ['addressLine', 'Complete delivery address']].map(([name, label]) => <label key={name}>{label}<input required type={name === 'phone' ? 'tel' : 'text'} pattern={name === 'phone' ? '(?:0|\\+94|94)[1-9][0-9]{8}' : undefined} title={name === 'phone' ? 'Use 0771234567 or +94771234567' : undefined} maxLength={name === 'fullName' ? 100 : name === 'phone' ? 13 : 350} value={guest[name]} onChange={e => {
        invalidate();
        setGuest({
          ...guest,
          [name]: e.target.value
        });
      }} /></label>)}<label>Delivery zone<select required value={guest.zoneId} onChange={e => {
        invalidate();
        setGuest({
          ...guest,
          zoneId: e.target.value
        });
      }}><option value="">Choose active zone</option>{zones.data?.map(z => <option key={z.zoneId} value={z.zoneId}>{z.zoneName} | {formatMoney(z.deliveryFee)}</option>)}</select></label><label>Delivery instructions (optional)<textarea maxLength={500} value={guest.instructions} onChange={e => {
        invalidate();
        setGuest({
          ...guest,
          instructions: e.target.value
        });
      }} /></label></fieldset>}
      {quote && <div className="cash-summary"><h3>Server-calculated cash total</h3><p>Subtotal: {formatMoney(quote.subtotal)}</p><p>Delivery fee: {formatMoney(quote.deliveryFee)}</p><strong>Total: {formatMoney(quote.totalAmount)}</strong><label className="checkbox-label"><input required type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{fulfilment === 'DELIVERY' ? 'I have received the complete cash payment at the shop. Cylinders and exchange empties will be recorded at delivery.' : 'I have received the cash and, for exchange, the matching empty cylinders.'}</label></div>}
      <button disabled={a.busy || (quote && !confirmed)} className="primary">{quote ? 'Complete cash sale' : 'Calculate total'}</button>
    </form>
    {confirmation && <Modal label="Confirm cash sale" busy={a.busy} onClose={() => setConfirmation(false)}><h2>Record cash sale?</h2><p>{formatMoney(quote.totalAmount)} | {humanize(fulfilment)}</p><div className="action-group"><button disabled={a.busy} onClick={() => setConfirmation(false)}>Cancel</button><button className="primary" disabled={a.busy} onClick={record}>Record paid sale</button></div></Modal>}
    {receipt && <article className="panel receipt"><h2>Aravinda Stores receipt</h2><p>{receipt.receiptNo}</p><p>{receipt.order.reference} | {formatDate(receipt.soldAt)} - {humanize(receipt.order.status)}</p><DataTable caption="Purchased cylinders" rowKey="orderItemId" rows={receipt.order.items} columns={[{
      key: 'product',
      label: 'Cylinder',
      value: i => `${i.brand} ${i.sizeKg} kg`,
      render: i => <div className="product-cell"><ProductImage product={i} compact />{i.brand} {i.sizeKg} kg</div>
    }, {
      key: 'purchaseType',
      label: 'Purchase',
      render: i => humanize(i.purchaseType)
    }, {
      key: 'quantity',
      label: 'Quantity'
    }, {
      key: 'unitPrice',
      label: 'Unit price',
      money: true,
      value: i => Number(i.unitPrice),
      render: i => formatMoney(i.unitPrice)
    }, {
      key: 'total',
      label: 'Line total',
      money: true,
      value: i => i.quantity * Number(i.unitPrice),
      render: i => formatMoney(i.quantity * Number(i.unitPrice))
    }]} /><p>Delivery fee: {formatMoney(receipt.order.deliveryFee)}</p><p>Cash paid: {formatMoney(receipt.order.totalAmount)}</p>{receipt.delivery && <><p>Delivery: {humanize(receipt.delivery.status)} | {receipt.delivery.assignedStaff?.fullName || 'Unassigned - owner assignment needed'}</p><p>Paid at shop. No cash due at delivery.</p><p>{receipt.order.customerName} | {receipt.order.customerPhone} | {receipt.order.addressSnapshot}</p></>}<button onClick={() => window.print()}>Print receipt</button></article>}
  </>;
}
