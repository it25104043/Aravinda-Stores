import React, { useState } from 'react';
import { useApi } from '../../utils/useApi';
import { formatMoney } from '../../utils/pricing';
import { humanize, formatDate, utcDate, eventPresentation } from '../../utils/presentation';
import Feedback from '../../components/Feedback';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ReportChart from '../../components/ReportChart';
function Ledger({
  type,
  title
}) {
  const [page, setPage] = useState(0),
    list = useApi(`/reports/${type}?page=${page}`);
  const columns = type === 'audit' ? [{
    key: 'action',
    label: 'Activity',
    value: e => eventPresentation(e).title
  }, {
    key: 'detail',
    label: 'Description',
    value: e => eventPresentation(e).description
  }, {
    key: 'actor',
    label: 'Recorded by',
    value: e => e.actorName || humanize(e.actorRole)
  }, {
    key: 'occurredAt',
    label: 'Recorded',
    render: e => formatDate(e.occurredAt)
  }] : [{
    key: 'productId',
    label: 'Product ID'
  }, {
    key: 'fullDelta',
    label: 'Full change'
  }, {
    key: 'emptyDelta',
    label: 'Empty change'
  }, {
    key: 'reason',
    label: 'Reason',
    render: e => humanize(e.reason)
  }, {
    key: 'note',
    label: 'Explanation'
  }, {
    key: 'actor',
    label: 'Recorded by',
    value: e => e.actorName || humanize(e.actorRole)
  }, {
    key: 'recordedAt',
    label: 'Recorded',
    render: e => formatDate(e.recordedAt)
  }];
  return <section className="panel"><h2>{title}</h2><DataTable caption={title} searchLabel="Search this page" rowKey={type === 'audit' ? 'auditId' : 'movementId'} rows={list.data || []} loading={list.loading} error={list.error} columns={columns} /><div className="action-group"><button disabled={page === 0 || list.loading} onClick={() => setPage(page - 1)}>Previous server page</button><button disabled={!list.data || list.data.length < 100 || list.loading} onClick={() => setPage(page + 1)}>Next server page</button></div></section>;
}
function exportSales(rows) {
  const safe = value => {
    let text = String(value ?? '');
    if (/^[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const csv = [['Receipt', 'Order', 'Sold at (Asia/Colombo)', 'Total LKR'], ...rows.map(s => [s.receiptNo, s.order.reference, formatDate(s.soldAt), s.order.totalAmount])].map(row => row.map(safe).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8'
    })),
    link = document.createElement('a');
  link.href = url;
  link.download = 'aravinda-sales.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function OwnerReports() {
  const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()),
    [start, setStart] = useState(today),
    [end, setEnd] = useState(today),
    [range, setRange] = useState({
      start: today,
      end: today
    });
  const summary = useApi('/reports/summary'),
    stock = useApi('/reports/stock'),
    payments = useApi('/reports/payments'),
    sales = useApi(`/reports/sales?start=${range.start}&end=${range.end}`);
  const s = summary.data,
    salesRows = sales.data?.sales || [],
    daily = {};
  salesRows.forEach(sale => {
    const date = utcDate(sale.soldAt);
    if (!date) return;
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
    daily[day] ||= {
      revenue: 0,
      count: 0
    };
    daily[day].revenue += Number(sale.order.totalAmount);
    daily[day].count += 1;
  });
  const methods = {};
  (payments.data || []).forEach(p => {
    methods[p.method] = (methods[p.method] || 0) + 1;
  });
  const pending = s ? s.totalDeliveries - s.delivered - s.failed : null;
  const metrics = [['Total revenue', sales.data ? formatMoney(sales.data.totalRevenue) : null, 'Selected dates'], ['Total sales', sales.data?.totalSales, 'Selected dates'], ['Total orders', s ? Object.values(s.ordersByStatus).reduce((a, b) => a + Number(b), 0) : null, 'All time'], ['Completed deliveries', s?.delivered, 'All time'], ['Pending deliveries', pending, 'Current'], ['Outstanding COD', s ? formatMoney(s.outstandingCod) : null, 'Current'], ['Pending bank transfer verification', s?.transfersAwaitingReview, 'Current'], ['Low-stock products', stock.data ? stock.data.filter(i => i.fullQty < i.lowStockLevel).length : null, 'Current']];
  return <><h1>Owner reports</h1><p className="muted">Sales use the selected Colombo dates. Order, payment and delivery summaries cover all records; inventory reflects current stock.</p>
    <form className="panel form-inline" onSubmit={e => {
      e.preventDefault();
      if (start <= end) setRange({
        start,
        end
      });
    }}><label>Start date<input required type="date" value={start} onChange={e => setStart(e.target.value)} /></label><label>End date<input required type="date" min={start} value={end} onChange={e => setEnd(e.target.value)} /></label><button className="primary" disabled={sales.loading}>Run report</button><button type="button" disabled={!sales.data || sales.loading} onClick={() => exportSales(salesRows)}>Export sales CSV</button></form>
    <Feedback {...summary} /><Feedback {...sales} /><Feedback {...stock} /><Feedback {...payments} />
    <div className="kpi-grid">{metrics.map(([title, value, period]) => <article className="kpi" key={title}><h2>{title}</h2><strong>{value ?? '\u2014'}</strong><small>{period}</small></article>)}</div>
    <div className="chart-grid">{sales.data && <><ReportChart title="Revenue trend (LKR, selected dates)" money data={Object.entries(daily).sort().map(([label, d]) => ({
          label,
          value: d.revenue
        }))} /><ReportChart title="Sales by day (selected dates)" data={Object.entries(daily).sort().map(([label, d]) => ({
          label,
          value: d.count
        }))} /></>}{s && <><ReportChart title="Orders by status (all time)" data={Object.entries(s.ordersByStatus).map(([label, value]) => ({
          label: humanize(label),
          value
        }))} /><ReportChart title="Delivery performance (all time)" data={[{
          label: 'Completed',
          value: s.delivered
        }, {
          label: 'Pending',
          value: pending
        }, {
          label: 'Failed',
          value: s.failed
        }]} /></>}{payments.data && <ReportChart title="Payment methods (all time)" data={Object.entries(methods).map(([label, value]) => ({
        label: humanize(label),
        value
      }))} />} {stock.data && <ReportChart title="Available inventory (current)" data={stock.data.map(i => ({
        label: `${i.product.brand} ${i.product.sizeKg} kg`,
        value: i.availableQty
      }))} />}</div>
    <DataTable caption="Paid sales in selected date range" rowKey="saleId" rows={salesRows} loading={sales.loading} error={sales.error} columns={[{
      key: 'receiptNo',
      label: 'Receipt'
    }, {
      key: 'order',
      label: 'Order',
      value: s => s.order.reference
    }, {
      key: 'soldAt',
      label: 'Sold at',
      render: s => formatDate(s.soldAt)
    }, {
      key: 'amount',
      label: 'Total',
      money: true,
      value: s => Number(s.order.totalAmount),
      render: s => formatMoney(s.order.totalAmount)
    }]} />
    <DataTable caption="Stock and low-stock alerts" rowKey="inventoryId" rows={stock.data || []} loading={stock.loading} columns={[{
      key: 'product',
      label: 'Product',
      value: i => `${i.product.brand} ${i.product.sizeKg} kg`
    }, ...['fullQty', 'emptyQty', 'reservedQty', 'availableQty', 'lowStockLevel'].map((key, index) => ({
      key,
      label: ['Full', 'Empty', 'Reserved', 'Available', 'Threshold'][index]
    })), {
      key: 'alert',
      label: 'Stock level',
      value: i => i.fullQty < i.lowStockLevel ? 'Low stock' : 'Normal'
    }]} />
    <DataTable caption="Payment status" rowKey="paymentId" rows={payments.data || []} loading={payments.loading} columns={[{
      key: 'orderId',
      label: 'Order ID'
    }, {
      key: 'method',
      label: 'Method',
      render: p => humanize(p.method)
    }, {
      key: 'status',
      label: 'Status',
      render: p => <StatusBadge value={p.status} />
    }, {
      key: 'amount',
      label: 'Amount',
      money: true,
      value: p => Number(p.amount),
      render: p => formatMoney(p.amount)
    }, {
      key: 'collectedAmount',
      label: 'Received',
      money: true,
      value: p => Number(p.collectedAmount),
      render: p => formatMoney(p.collectedAmount)
    }, {
      key: 'reconciliationStatus',
      label: 'Reconciliation',
      render: p => <><StatusBadge value={p.reconciliationStatus} />{p.reconciliationStatus !== 'NONE' && <p>{p.reconciliationReason}</p>}</>
    }]} />
    <Ledger type="movements" title="Complete stock movement history" /><Ledger type="audit" title="Audit history" /></>;
}
