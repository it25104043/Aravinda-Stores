import Modal from '../../components/Modal';
import ActionDialog from '../../components/ActionDialog';
import { formatMoney } from '../../utils/pricing';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ActivityTimeline from '../../components/ActivityTimeline';
import { humanize } from '../../utils/presentation';
import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { DeliveryService } from '../../api/services';
import { useApi, useAction } from '../../utils/useApi';
import Feedback from '../../components/Feedback';
import Handover from '../../components/Handover';
function Assignment({
  d,
  refresh
}) {
  const workers = useApi(`/deliveries/${d.deliveryId}/eligible-drivers`),
    [id, setId] = useState(''),
    [reason, setReason] = useState(''),
    a = useAction();
  return <form className="form form-inline" aria-busy={a.busy} onSubmit={async e => {
    e.preventDefault();
    if (await a.run(key => DeliveryService.assignStaff(d.deliveryId, Number(id), reason.trim(), key))) refresh();
  }}><Feedback {...workers} /><Feedback {...a} /><label>Delivery worker<select required value={id} onChange={e => setId(e.target.value)}><option value="">Choose worker</option>{workers.data?.filter(x => x.user.userId !== d.assignedStaff?.userId).map(x => <option key={x.user.userId} value={x.user.userId}>{x.user.fullName} - active {x.activeDeliveries}</option>)}</select></label><label>Assignment reason<input required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><button className="primary" disabled={a.busy || !reason.trim()}>Assign worker</button></form>;
}
function Delivery({
  d,
  worker,
  owner,
  refresh
}) {
  const a = useAction(),
    [reason, setReason] = useState(''),
    [dispatch, setDispatch] = useState(false),
    [failure, setFailure] = useState(false),
    timeline = useApi(`/deliveries/${d.deliveryId}/timeline`),
    payment = useApi(`/deliveries/${d.deliveryId}/payment`);
  return <article className="panel"><h2>Delivery #{d.deliveryId} · {d.order.reference}</h2><p><StatusBadge value={d.status} /> · {d.assignedStaff?.fullName || 'Unassigned'}</p><p>{d.order.customerName} · {d.order.customerPhone}</p><p>{d.order.addressSnapshot}</p><p>Source: {humanize(d.order.channel)} - Zone: {d.order.deliveryZone} - Delivery fee: {formatMoney(d.order.deliveryFee)}</p>{d.order.deliveryInstructions && <p>Instructions: {d.order.deliveryInstructions}</p>}<Feedback {...payment} />{payment.data && <p>{payment.data.method === 'CASH' && payment.data.status === 'PAID' ? 'Paid at shop - no cash due at delivery.' : payment.data.method === 'BANK_TRANSFER' ? 'Bank transfer: ' + humanize(payment.data.status) : 'Cash due at handover: ' + formatMoney(d.order.totalAmount)} - Payment: {humanize(payment.data.status)}</p>}<Feedback {...a} />
        {owner && ['UNASSIGNED', 'ASSIGNED', 'DISPATCHED'].includes(d.status) && <ActionDialog label={d.assignedStaff ? "Reassign driver" : "Assign driver"}>{close => <><h2>Assign driver - {d.order.reference}</h2><Assignment d={d} refresh={() => {
          close();
          refresh();
        }} /></>}</ActionDialog>}
        {worker && d.status === 'ASSIGNED' && <button onClick={() => setDispatch(true)}>Mark dispatched</button>}
        {dispatch && <Modal label="Dispatch confirmation" busy={a.busy} onClose={() => setDispatch(false)}><h2>Dispatch {d.order.reference}?</h2><p>{d.order.customerName} - {d.order.addressSnapshot}</p><Feedback {...a} /><div className="dialog-actions"><button disabled={a.busy} onClick={() => setDispatch(false)}>Cancel</button><button className="primary" disabled={a.busy} onClick={async () => {
          if (await a.run(key => DeliveryService.dispatch(d.deliveryId, key))) {
            setDispatch(false);
            refresh();
          }
        }}>Confirm dispatch</button></div></Modal>}
        {worker && d.status === 'DISPATCHED' && <><Feedback {...payment} />{payment.data && <ActionDialog label="Complete delivery">{close => <Handover confirmCollection order={d.order} bankTransfer={payment.data.method === 'BANK_TRANSFER'} prepaid={payment.data.method === 'CASH' && payment.data.status === 'PAID'} onSubmit={(r, key) => DeliveryService.complete(d.deliveryId, r, key)} onSaved={() => {
          close();
          refresh();
        }} />}</ActionDialog>}<button className="danger-btn" onClick={() => setFailure(true)}>Record failed delivery</button>{failure && <Modal label="Failed delivery" busy={a.busy} onClose={() => setFailure(false)}><h2>Failed delivery - {d.order.reference}</h2><Feedback {...a} /><form className="form" aria-busy={a.busy} onSubmit={async e => {
          e.preventDefault();
          if (await a.run(key => DeliveryService.fail(d.deliveryId, reason.trim(), key))) {
            setFailure(false);
            refresh();
          }
        }}><label>Failure reason<input required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><label className="checkbox-label"><input required type="checkbox" /> No cylinders handed over and no cash collected.</label><button className="danger-btn" disabled={a.busy}>Mark failed</button></form></Modal>}</>}
        <details><summary>Delivery events</summary><Feedback {...timeline} /><ActivityTimeline events={timeline.data || []} /></details></article>;
}
function Workloads() {
  const drivers = useApi('/drivers');
  return <section className="panel"><h2>Driver workload and coverage</h2><Feedback {...drivers} />{drivers.data?.length === 0 && <p>No delivery drivers configured.</p>}<DataTable caption="Driver coverage" rowKey={d => d.user.userId} rows={drivers.data || []} loading={drivers.loading} columns={[{
      key: 'name',
      label: 'Driver',
      value: d => d.user.fullName
    }, {
      key: 'available',
      label: 'Availability',
      value: d => d.available && d.user.active ? 'Available' : 'Unavailable'
    }, {
      key: 'activeDeliveries',
      label: 'Active deliveries'
    }, {
      key: 'zones',
      label: 'Zone coverage',
      value: d => d.zones.map(z => z.zoneName).join(', ') || 'No zone coverage'
    }]} /></section>;
}
export default function Deliveries() {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const list = useApi('/deliveries'),
    {
      user
    } = useContext(AuthContext);
  const selected = selectedDelivery && (list.data?.find(d => d.deliveryId === selectedDelivery.deliveryId) || selectedDelivery);
  return <><h1>Deliveries</h1>{user.role === 'OWNER' && <Workloads key={list.data?.map(d => `${d.deliveryId}-${d.status}-${d.assignedStaff?.userId}`).join(',')} />}<button onClick={list.refresh}>Refresh</button><Feedback {...list} />{list.data?.length === 0 && <p>No deliveries available.</p>}<DataTable caption="Delivery overview" rowKey="deliveryId" rows={list.data || []} loading={list.loading} error={list.error} columns={[{
      key: 'reference',
      label: 'Order',
      value: d => d.order.reference
    }, {
      key: 'customer',
      label: 'Customer',
      value: d => d.order.customerName
    }, {
      key: 'status',
      label: 'Status',
      render: d => <StatusBadge value={d.status} />
    }, {
      key: 'driver',
      label: 'Driver',
      value: d => d.assignedStaff?.fullName || 'Unassigned'
    }, {
      key: 'details',
      label: 'Action',
      sortable: false,
      render: d => <button aria-label={`View delivery ${d.deliveryId}`} onClick={() => setSelectedDelivery(d)}>View details</button>
    }]} />{selected && <Modal label={`Delivery details ${selected.order.reference}`} onClose={() => setSelectedDelivery(null)}><Delivery key={`${selected.deliveryId}-${selected.status}-${selected.assignedStaff?.userId}`} d={selected} worker={user.role === 'DELIVERY_STAFF'} owner={user.role === 'OWNER'} refresh={list.refresh} /></Modal>}</>;
}
