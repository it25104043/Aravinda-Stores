import React, { useState } from 'react';
import { DeliveryZoneService } from '../api/services';
import { useApi, useAction } from '../utils/useApi';
import Modal from './Modal';
import Feedback from './Feedback';
import DataTable from './DataTable';
import { formatMoney } from '../utils/pricing';
function ZoneForm({
  zone,
  refresh,
  onClose
}) {
  const [form, setForm] = useState({
      zoneName: zone?.zoneName || '',
      deliveryFee: zone?.deliveryFee || 0,
      active: zone?.active ?? true
    }),
    action = useAction();
  return <form className="form" aria-busy={action.busy} onSubmit={async event => {
    event.preventDefault();
    if (await action.run(key => DeliveryZoneService.save(zone?.zoneId, {
      ...form,
      deliveryFee: Number(form.deliveryFee)
    }, key))) {
      refresh();
      onClose();
    }
  }}><h2>{zone ? 'Edit delivery zone' : 'Add delivery zone'}</h2><Feedback {...action} />
    <label>Zone name<input required maxLength={zone ? 255 : 80} readOnly={!!zone} value={form.zoneName} onChange={event => setForm({
        ...form,
        zoneName: event.target.value
      })} /></label>
    <label>Delivery fee<input required type="number" min="0" max="99999999.99" step="0.01" value={form.deliveryFee} onChange={event => setForm({
        ...form,
        deliveryFee: event.target.value
      })} /></label>
    <label className="checkbox-label"><input type="checkbox" checked={form.active} onChange={event => setForm({
        ...form,
        active: event.target.checked
      })} />Available for new deliveries</label>
    <p>Zone names stay fixed to preserve saved addresses. Disabling a zone blocks new orders and future driver eligibility in that zone; existing delivery records remain intact.</p>
    <div className="dialog-actions"><button type="button" disabled={action.busy} onClick={onClose}>Cancel</button><button className="primary" disabled={action.busy}>Save zone</button></div>
  </form>;
}
export default function ZoneManagement() {
  const zones = useApi('/delivery-zones/manage'),
    [editing, setEditing] = useState(null);
  return <section><header className="section-heading"><h2>Delivery zones</h2><button onClick={() => setEditing({})}>Add delivery zone</button></header><Feedback {...zones} />
    <DataTable caption="Delivery zones" rowKey="zoneId" rows={zones.data || []} columns={[{
      key: 'zoneName',
      label: 'Zone'
    }, {
      key: 'deliveryFee',
      label: 'Fee',
      money: true,
      render: zone => formatMoney(zone.deliveryFee)
    }, {
      key: 'active',
      label: 'Availability',
      value: zone => zone.active ? 'Active' : 'Disabled'
    }, {
      key: 'edit',
      label: 'Action',
      sortable: false,
      render: zone => <button onClick={() => setEditing(zone)}>Edit zone</button>
    }]} />
    {editing && <Modal label={editing.zoneId ? 'Edit delivery zone' : 'Add delivery zone'} onClose={() => setEditing(null)}><ZoneForm zone={editing.zoneId ? editing : null} refresh={zones.refresh} onClose={() => setEditing(null)} /></Modal>}
  </section>;
}
