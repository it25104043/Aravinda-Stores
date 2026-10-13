import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import ProductImage from '../../components/ProductImage';
import ProductImageEditor from '../../components/ProductImageEditor';
import { formatDate, humanize } from '../../utils/presentation';
import React, { useState } from 'react';
import { InventoryService, ProductService } from '../../api/services';
import { useApi, useAction } from '../../utils/useApi';
import Feedback from '../../components/Feedback';
function ProductForm({
  stock,
  refresh
}) {
  const p = stock?.product,
    [form, setForm] = useState({
      brand: p?.brand || '',
      sizeKg: p?.sizeKg || '',
      exchangePrice: p?.exchangePrice || '',
      newPrice: p?.newPrice || ''
    }),
    [threshold, setThreshold] = useState(stock?.lowStockLevel ?? 5),
    a = useAction();
  return <form className="panel form" aria-busy={a.busy} onSubmit={async e => {
    e.preventDefault();
    const body = {
      ...form,
      sizeKg: Number(form.sizeKg),
      exchangePrice: Number(form.exchangePrice),
      newPrice: Number(form.newPrice),
      lowStockLevel: Number(threshold)
    };
    const ok = await a.run(async () => {
      return p ? ProductService.updateProduct(p.productId, body) : ProductService.createProduct(body);
    });
    if (ok) refresh(ok.data);
  }}><h3>{p ? `Edit ${p.brand} ${p.sizeKg}kg` : 'Create product'}</h3><Feedback {...a} />{!p && <p>Save the product first, then upload its individual photograph in the image editor.</p>}{['brand', 'sizeKg', 'exchangePrice', 'newPrice'].map(n => <label key={n}>{{
    brand: 'Brand',
    sizeKg: 'Size (kg)',
    exchangePrice: 'Exchange price',
    newPrice: 'New-cylinder price'
  }[n]}<input required type={n === 'brand' ? 'text' : 'number'} min={n === 'brand' ? undefined : '0.01'} step={n === 'brand' ? undefined : '0.01'} value={form[n]} onChange={e => setForm({
    ...form,
    [n]: e.target.value
  })} /></label>)}<label>Low-stock threshold<input required type="number" min="0" max="100000" value={threshold} onChange={e => setThreshold(e.target.value)} /></label><button disabled={a.busy}>Save product and threshold</button></form>;
}
export default function Inventory() {
  const list = useApi('/inventory'),
    [page, setPage] = useState(0),
    history = useApi(`/inventory/movements?page=${page}`),
    a = useAction(),
    [edit, setEdit] = useState(null),
    [movement, setMovement] = useState(false),
    [form, setForm] = useState({
      productId: '',
      fullDelta: 0,
      emptyDelta: 0,
      reason: 'RECEIPT',
      note: ''
    });
  function refresh(created) {
    list.refresh();
    history.refresh();
    setEdit(created?.productId ? {
      inventoryId: `new-${created.productId}`,
      product: created,
      lowStockLevel: created.lowStockLevel
    } : null);
  }
  return <><h1>Products and inventory</h1><Feedback {...list} /><Feedback {...a} /><div className="dialog-actions"><button className="primary" onClick={() => setEdit({})}>New product</button><button onClick={() => setMovement(true)}>Record stock movement</button></div>{edit && <Modal label={edit.product ? 'Edit product and image' : 'New product'} onClose={() => setEdit(null)}>{edit.product && <ProductImageEditor product={edit.product} refresh={() => list.refresh()} />}<ProductForm key={edit.inventoryId || 'new'} stock={edit.inventoryId ? edit : null} refresh={refresh} /></Modal>}
    <DataTable caption="Products and inventory" rowKey="inventoryId" rows={list.data || []} loading={list.loading} error={list.error} columns={[{
      key: 'product',
      label: 'Product',
      value: i => `${i.product.brand} ${i.product.sizeKg} kg`,
      render: i => <div className="product-cell"><ProductImage product={i.product} compact /><span>{i.product.brand} {i.product.sizeKg} kg {i.fullQty < i.lowStockLevel && <strong>Low stock</strong>}</span></div>
    }, ...['fullQty', 'reservedQty', 'availableQty', 'emptyQty', 'lowStockLevel'].map((key, index) => ({
      key,
      label: ['Full', 'Reserved', 'Available', 'Empty', 'Threshold'][index]
    })), {
      key: 'action',
      label: 'Action',
      sortable: false,
      render: i => <button aria-label={`Edit ${i.product.brand} ${i.product.sizeKg} kg`} onClick={() => setEdit(i)}>Edit</button>
    }]} />{list.data?.length === 0 && <p>No inventory yet. Create a product.</p>}
    {movement && <Modal label="Record stock movement" busy={a.busy} onClose={() => setMovement(false)}><Feedback {...a} /><form className="panel form" aria-busy={a.busy} onSubmit={async e => {
      e.preventDefault();
      if (await a.run(key => InventoryService.recordMovement({
        ...form,
        productId: Number(form.productId),
        fullDelta: Number(form.fullDelta),
        emptyDelta: Number(form.emptyDelta)
      }, key))) {
        refresh();
        setMovement(false);
      }
    }}><h2>Record stock movement</h2><label>Product<select required value={form.productId} onChange={e => setForm({
      ...form,
      productId: e.target.value
    })}><option value="">Choose</option>{list.data?.map(i => <option key={i.inventoryId} value={i.product.productId}>{i.product.brand} {i.product.sizeKg}kg</option>)}</select></label>{['fullDelta', 'emptyDelta'].map(n => <label key={n}>{n === 'fullDelta' ? 'Full quantity change' : 'Empty quantity change'}<input required type="number" min="-100000" max="100000" value={form[n]} onChange={e => setForm({
      ...form,
      [n]: e.target.value
    })} /></label>)}<label>Reason<select value={form.reason} onChange={e => setForm({
      ...form,
      reason: e.target.value
    })}>{['RECEIPT', 'RETURN', 'CORRECTION', 'OPENING'].map(r => <option key={r}>{r}</option>)}</select></label><label>Explanation<input required maxLength={500} value={form.note} onChange={e => setForm({
      ...form,
      note: e.target.value
    })} /></label><button disabled={a.busy}>Record movement</button></form></Modal>}
    <h2>Movement history</h2><Feedback {...history} />{history.data?.length === 0 && <p>No movements on this page.</p>}<DataTable caption="Stock movements" searchLabel="Search this page" rowKey="movementId" rows={history.data || []} loading={history.loading} error={history.error} columns={[{
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
      render: m => humanize(m.reason)
    }, {
      key: 'note',
      label: 'Explanation'
    }, {
      key: 'actor',
      label: 'Recorded by',
      value: m => m.actorName || humanize(m.actorRole)
    }, {
      key: 'recordedAt',
      label: 'Recorded',
      render: m => formatDate(m.recordedAt)
    }]} /><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button disabled={!history.data || history.data.length < 100} onClick={() => setPage(page + 1)}>Next</button></>;
}
