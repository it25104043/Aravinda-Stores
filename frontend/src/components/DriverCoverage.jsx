import Modal from './Modal';
import React, { useState } from 'react';
import { DriverService } from '../api/services';
import { useApi, useAction } from '../utils/useApi';
import Feedback from './Feedback';
function Coverage({
  driver,
  zones,
  refresh
}) {
  const [available, setAvailable] = useState(driver.available),
    [zoneIds, setZoneIds] = useState(driver.zones.map(z => z.zoneId)),
    a = useAction();
  return <form className="panel form" aria-busy={a.busy} onSubmit={async e => {
    e.preventDefault();
    if (await a.run(key => DriverService.update(driver.user.userId, {
      available,
      zoneIds
    }, key))) refresh();
  }}><h3>{driver.user.fullName}</h3><p>Active deliveries: {driver.activeDeliveries} | Account {driver.user.active ? 'active' : 'disabled'}</p><Feedback {...a} /><label className="checkbox-label"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} />Available for assignment</label><fieldset><legend>Delivery-zone eligibility</legend>{zones.map(z => <label className="checkbox-label" key={z.zoneId}><input type="checkbox" checked={zoneIds.includes(z.zoneId)} onChange={e => setZoneIds(old => e.target.checked ? [...old, z.zoneId] : old.filter(id => id !== z.zoneId))} />{z.zoneName}</label>)}</fieldset><button className="primary" disabled={a.busy}>Save coverage</button></form>;
}
export default function DriverCoverage() {
  const drivers = useApi('/drivers'),
    zones = useApi('/delivery-zones'),
    [selected, setSelected] = useState(null);
  return <section><header className="section-heading"><h2>Driver availability and zone coverage</h2><button onClick={() => {
        drivers.refresh();
        zones.refresh();
      }}>Refresh zones and drivers</button></header><Feedback {...drivers} /><Feedback {...zones} />{drivers.data?.length === 0 && <p>Create a delivery staff account to configure coverage.</p>}{drivers.data && zones.data && drivers.data.map(d => <article className="panel" key={d.user.userId}><h3>{d.user.fullName}</h3><p>{d.activeDeliveries} active deliveries</p><button onClick={() => setSelected(d)}>Configure coverage</button></article>)}{selected && <Modal label="Configure driver coverage" onClose={() => setSelected(null)}><Coverage driver={selected} zones={zones.data || []} refresh={() => {
        drivers.refresh();
        setSelected(null);
      }} /></Modal>}</section>;
}
