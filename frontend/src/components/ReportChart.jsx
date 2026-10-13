import React from 'react';
export default function ReportChart({
  title,
  data,
  money = false
}) {
  const maximum = Math.max(1, ...data.map(d => Number(d.value))),
    height = Math.max(90, data.length * 40 + 20);
  return <section className="panel chart"><h2>{title}</h2>{!data.length ? <p className="empty-state">No data for this report.</p> : <svg viewBox={`0 0 560 ${height}`} role="img" aria-label={title}><title>{title}</title>{data.map((item, index) => <g key={item.label}><title>{`${item.label}: ${money ? 'LKR ' : ''}${Number(item.value).toLocaleString('en-LK')}`}</title><text x="0" y={index * 40 + 25}>{item.label.length > 20 ? item.label.slice(0, 19) + '…' : item.label}</text><rect className="chart-bar" x="155" y={index * 40 + 8} height="24" rx="4" width={Number(item.value) / maximum * 290} /><text x="455" y={index * 40 + 25}>{Number(item.value).toLocaleString('en-LK', {
            maximumFractionDigits: money ? 2 : 0
          })}</text></g>)}</svg>}</section>;
}
