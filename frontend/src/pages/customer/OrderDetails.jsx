import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { OrderService } from "../../api/services";
import { useApi, useAction } from "../../utils/useApi";
import { humanize, formatDate } from "../../utils/presentation";
import { formatMoney } from "../../utils/pricing";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Modal from "../../components/Modal";
import Feedback from "../../components/Feedback";
import StatusBadge from "../../components/StatusBadge";
import ProductImage from "../../components/ProductImage";
import DataTable from "../../components/DataTable";
import ActivityTimeline from "../../components/ActivityTimeline";
import PaymentSlipUpload from "../../components/PaymentSlipUpload";
function OwnedOrder({ id }) {
  const details = useApi(`/orders/${id}/details`),
    action = useAction(),
    location = useLocation(),
    navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [upload, setUpload] = useState(false),
    [cancel, setCancel] = useState(false),
    [created] = useState(Boolean(location.state?.newOrder));
  const prompted = useRef(false);
  const {
    order,
    payment,
    delivery,
    orderHistory = [],
    paymentHistory = [],
    deliveryHistory = [],
  } = details.data || {};
  const canUpload =
    user?.role === "CUSTOMER" &&
    payment?.method === "BANK_TRANSFER" &&
    ["PENDING", "REJECTED"].includes(payment.status) &&
    ["PENDING", "CONFIRMED"].includes(order?.status);
  useEffect(() => {
    if (
      location.state?.autoUpload &&
      canUpload &&
      !payment.hasSlip &&
      !prompted.current
    ) {
      prompted.current = true;
      setUpload(true);
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [canUpload, payment, location, navigate]);
  return (
    <>
      <Link to="/profile" className="navigation-back">
        ← My Orders
      </Link>
      <Feedback {...details} />
      <Feedback {...action} />
      {order && (
        <>
          <header className="order-heading">
            <div>
              <h1>{order.reference}</h1>
              <p>
                {created ? "Your order has been received." : "Order details"} ·{" "}
                {formatDate(order.placedAt)}
              </p>
            </div>
            <div className="dialog-actions">
              {canUpload && (
                <button className="primary" onClick={() => setUpload(true)}>
                  Upload Payment Slip
                </button>
              )}
              <button onClick={details.refresh}>Refresh status</button>
            </div>
          </header>
          <div className="order-status-grid">
            <article className="panel">
              <h2>Order</h2>
              <StatusBadge value={order.status} />
              {order.decisionReason && <p>{order.decisionReason}</p>}
            </article>
            <article className="panel">
              <h2>Payment</h2>
              <p>{humanize(payment.method)}</p>
              <StatusBadge value={payment.status} />
              {payment.method === "COD" && (
                <p>
                  Amount payable at delivery:{" "}
                  <strong>
                    {formatMoney(
                      Math.max(
                        0,
                        Number(payment.amount) -
                          Number(payment.collectedAmount || 0),
                      ),
                    )}
                  </strong>
                </p>
              )}
              {payment.status === "REJECTED" && (
                <p>Your slip was rejected. Upload a replacement for review.</p>
              )}
            </article>
            <article className="panel">
              <h2>Delivery</h2>
              {delivery ? (
                <>
                  <StatusBadge value={delivery.status} />
                  <p>
                    Assigned driver:{" "}
                    {delivery.assignedStaff?.fullName || "Awaiting assignment"}
                  </p>
                </>
              ) : (
                <p>Awaiting order confirmation and driver assignment.</p>
              )}
            </article>
          </div>
          <article className="panel">
            <h2>Purchased cylinders</h2>
            <DataTable
              rows={order.items}
              rowKey="orderItemId"
              caption="Purchased cylinders"
              columns={[
                {
                  key: "product",
                  label: "Cylinder",
                  value: (item) => `${item.brand} ${item.sizeKg} kg`,
                  render: (item) => (
                    <div className="product-cell">
                      <ProductImage product={item} compact />
                      {item.brand} {item.sizeKg} kg
                    </div>
                  ),
                },
                {
                  key: "purchaseType",
                  label: "Purchase",
                  render: (item) => humanize(item.purchaseType),
                },
                {
                  key: "quantity",
                  label: "Quantity",
                },
                {
                  key: "unitPrice",
                  label: "Unit price",
                  money: true,
                  render: (item) => formatMoney(item.unitPrice),
                },
                {
                  key: "lineTotal",
                  label: "Amount",
                  money: true,
                  value: (item) => Number(item.unitPrice) * item.quantity,
                  render: (item) =>
                    formatMoney(Number(item.unitPrice) * item.quantity),
                },
              ]}
            />
            <div className="order-summary">
              <p>Delivery address: {order.addressSnapshot || "Store pickup"}</p>
              <p>Delivery fee: {formatMoney(order.deliveryFee)}</p>
              <p className="order-total">
                Total: {formatMoney(order.totalAmount)}
              </p>
            </div>
          </article>
          <article className="panel">
            <h2>Order history and delivery progress</h2>
            <ActivityTimeline
              events={[...orderHistory, ...paymentHistory, ...deliveryHistory]}
            />
          </article>
          {user?.role === "CUSTOMER" && order.status === "PENDING" && (
            <button className="danger-btn" onClick={() => setCancel(true)}>
              Cancel order
            </button>
          )}
          {upload && canUpload && (
            <Modal label="Upload Payment Slip" onClose={() => setUpload(false)}>
              <PaymentSlipUpload
                order={order}
                payment={payment}
                refresh={details.refresh}
                onClose={() => setUpload(false)}
              />
            </Modal>
          )}
          {cancel && (
            <Modal
              label="Cancel order"
              busy={action.busy}
              onClose={() => setCancel(false)}
            >
              <h2>Cancel {order.reference}?</h2>
              <p>
                This releases your reserved cylinders. A new order will be
                needed to purchase them again.
              </p>
              <Feedback {...action} />
              <div className="dialog-actions">
                <button disabled={action.busy} onClick={() => setCancel(false)}>
                  Keep order
                </button>
                <button
                  className="danger-btn"
                  disabled={action.busy}
                  onClick={async () => {
                    if (
                      await action.run(
                        (key) => OrderService.cancelOrder(Number(id), key),
                        "Order cancelled",
                      )
                    ) {
                      setCancel(false);
                      details.refresh();
                    }
                  }}
                >
                  Confirm cancellation
                </button>
              </div>
            </Modal>
          )}
        </>
      )}
    </>
  );
}
export default function OrderDetails() {
  const { id } = useParams();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  return (
    <div className="view active">
      <Navbar />
      <main className="section workflow-page">
        {/^[1-9]\d*$/.test(id || "") ? (
          <OwnedOrder key={id} id={id} />
        ) : (
          <p role="alert">Invalid order reference.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
