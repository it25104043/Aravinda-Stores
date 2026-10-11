import ActionDialog from "../../components/ActionDialog";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import ActivityTimeline from "../../components/ActivityTimeline";
import ProductImage from "../../components/ProductImage";
import { humanize, formatDate } from "../../utils/presentation";
import Modal from "../../components/Modal";
import React, { useState } from "react";
import { OrderService, SaleService } from "../../api/services";
import { useApi, useAction } from "../../utils/useApi";
import { formatMoney } from "../../utils/pricing";
import Feedback from "../../components/Feedback";
import Handover from "../../components/Handover";
import PaymentReview from "../../components/PaymentReview";
function Decision({ order, payment, refresh }) {
  const [reason, setReason] = useState(""),
    [status, setStatus] = useState(null),
    a = useAction();
  const awaiting =
    payment.method === "BANK_TRANSFER" && payment.status !== "VERIFIED";
  async function confirm() {
    if (
      await a.run((key) =>
        OrderService.decision(
          order.orderId,
          {
            status,
            reason,
          },
          key,
        ),
      )
    ) {
      setStatus(null);
      refresh();
    }
  }
  return (
    <div className="form">
      <Feedback {...a} />
      {awaiting && (
        <p>Verify the bank transfer before confirming this order.</p>
      )}
      <div className="action-group">
        <button
          className="primary"
          disabled={a.busy || awaiting}
          onClick={() => setStatus("CONFIRMED")}
        >
          Confirm Order
        </button>
        <button
          className="danger-btn"
          disabled={a.busy}
          onClick={() => setStatus("REJECTED")}
        >
          Reject order
        </button>
      </div>
      {status && (
        <Modal
          label="Confirm order decision"
          busy={a.busy}
          onClose={() => setStatus(null)}
        >
          <h3>
            {status === "CONFIRMED"
              ? "Confirm this order?"
              : "Reject this order?"}
          </h3>
          <p>
            {order.reference} | {formatMoney(order.totalAmount)}
          </p>
          <Feedback {...a} />
          {status === "REJECTED" && (
            <label>
              Order rejection reason
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
          <div className="action-group">
            <button disabled={a.busy} onClick={() => setStatus(null)}>
              Cancel
            </button>
            <button
              className="primary"
              disabled={a.busy || (status === "REJECTED" && !reason.trim())}
              onClick={confirm}
            >
              Save order decision
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function OrderCard({ initial, refreshList }) {
  const details = useApi(`/orders/${initial.orderId}/details`),
    o = details.data?.order || initial;
  const refresh = () => {
    details.refresh();
    refreshList();
  };
  return (
    <article className="panel order-card">
      <div className="card-heading">
        <h2>
          {o.reference} <small>#{o.orderId}</small>
        </h2>
        <StatusBadge value={o.status} />
      </div>
      <p>
        {o.customerName || "Walk-in customer"} |{" "}
        {o.customerPhone || "Shop pickup"}
      </p>
      <h3>Order summary</h3>
      <div className="order-facts">
        <p>
          <strong>Placed</strong>
          {formatDate(o.placedAt)}
        </p>
        <p>
          <strong>Source</strong> {humanize(o.channel)}
        </p>
        <p>
          <strong>Fulfilment</strong> {humanize(o.fulfilment)}
        </p>
        <p>
          <strong>Total</strong> {formatMoney(o.totalAmount)}
        </p>
        <p>
          <strong>Zone</strong> {o.deliveryZone || "Pickup"}
        </p>
        <p>
          <strong>Delivery fee</strong> {formatMoney(o.deliveryFee)}
        </p>
        <p>
          <strong>Driver</strong>{" "}
          {details.data?.delivery?.assignedStaff?.fullName ||
            (o.fulfilment === "DELIVERY" ? "Unassigned" : "Not required")}
        </p>
      </div>
      {o.addressSnapshot && <p>{o.addressSnapshot}</p>}
      {o.deliveryInstructions && <p>Instructions: {o.deliveryInstructions}</p>}
      <DataTable
        caption="Purchased cylinders"
        rowKey="orderItemId"
        rows={o.items}
        columns={[
          {
            key: "product",
            label: "Cylinder",
            value: (i) => `${i.brand} ${i.sizeKg} kg`,
            render: (i) => (
              <div className="product-cell">
                <ProductImage product={i} compact />
                <span>
                  {i.brand} {i.sizeKg} kg
                </span>
              </div>
            ),
          },
          {
            key: "purchaseType",
            label: "Purchase",
            render: (i) => humanize(i.purchaseType),
          },
          {
            key: "quantity",
            label: "Quantity",
          },
          {
            key: "unitPrice",
            label: "Unit price",
            money: true,
            value: (i) => Number(i.unitPrice),
            render: (i) => formatMoney(i.unitPrice),
          },
          {
            key: "lineTotal",
            label: "Line total",
            money: true,
            value: (i) => Number(i.unitPrice) * i.quantity,
            render: (i) => formatMoney(Number(i.unitPrice) * i.quantity),
          },
        ]}
      />

      {o.decisionReason && <p>{o.decisionReason}</p>}
      <Feedback {...details} />
      {details.data && (
        <>
          <PaymentReview payment={details.data.payment} refresh={refresh} />
          {o.status === "PENDING" && (
            <Decision
              order={o}
              payment={details.data.payment}
              refresh={refresh}
            />
          )}
          <section>
            <h3>Delivery</h3>
            <p>
              <StatusBadge
                value={
                  details.data.delivery?.status ||
                  (o.fulfilment === "PICKUP" ? "PICKUP" : "UNASSIGNED")
                }
              />
            </p>
          </section>
          <details>
            <summary>Activity history</summary>
            <ActivityTimeline
              events={[
                ...(details.data.orderHistory || []),
                ...(details.data.paymentHistory || []),
                ...(details.data.deliveryHistory || []),
              ]}
            />
          </details>
        </>
      )}
      {o.status === "CONFIRMED" && o.fulfilment === "PICKUP" && (
        <ActionDialog label="Record pickup handover">
          {(close) => (
            <Handover
              order={o}
              onSubmit={(r, key) => SaleService.pickup(o.orderId, r, key)}
              onSaved={() => {
                close();
                refresh();
              }}
            />
          )}
        </ActionDialog>
      )}
    </article>
  );
}
export default function Orders() {
  const [page, setPage] = useState(0),
    list = useApi(`/orders?page=${page}`),
    [selectedOrder, setSelectedOrder] = useState(null);
  const selected =
    selectedOrder &&
    (list.data?.find((o) => o.orderId === selectedOrder.orderId) ||
      selectedOrder);
  return (
    <>
      <h1>Orders and payments</h1>
      <p>Review online orders, shop sales and payment verification together.</p>
      <button onClick={list.refresh}>Refresh</button>
      <Feedback {...list} />
      {list.data?.length === 0 && <p>No orders on this page.</p>}
      <DataTable
        caption="Orders"
        searchLabel="Search this page"
        rows={list.data || []}
        loading={list.loading}
        error={list.error}
        rowKey="orderId"
        columns={[
          {
            key: "reference",
            label: "Order",
          },
          {
            key: "customerName",
            label: "Customer",
          },
          {
            key: "status",
            label: "Status",
            render: (o) => <StatusBadge value={o.status} />,
          },
          {
            key: "fulfilment",
            label: "Fulfilment",
            render: (o) => humanize(o.fulfilment),
          },
          {
            key: "totalAmount",
            label: "Total",
            money: true,
            value: (o) => Number(o.totalAmount),
            render: (o) => formatMoney(o.totalAmount),
          },
          {
            key: "details",
            label: "Action",
            sortable: false,
            render: (o) => (
              <button
                aria-label={`View order ${o.reference}`}
                onClick={() => setSelectedOrder(o)}
              >
                View details
              </button>
            ),
          },
        ]}
      />
      {selected && (
        <Modal
          label={`Order details ${selected.reference}`}
          onClose={() => setSelectedOrder(null)}
        >
          <OrderCard
            key={selected.orderId}
            initial={selected}
            refreshList={list.refresh}
          />
        </Modal>
      )}
      <div className="action-group">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <button
          disabled={!list.data || list.data.length < 100}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
