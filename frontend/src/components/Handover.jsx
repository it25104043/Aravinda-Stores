import React, { useState } from "react";
import { useAction } from "../utils/useApi";
import { formatMoney } from "../utils/pricing";
import Feedback from "./Feedback";
export default function Handover({
  order,
  onSubmit,
  onSaved,
  bankTransfer = false,
  prepaid = false,
  confirmCollection = false,
}) {
  const [items, setItems] = useState(
      order.items.map((i) => ({
        orderItemId: i.orderItemId,
        deliveredQty: "",
        emptyCollected: "",
      })),
    ),
    [cash, setCash] = useState(""),
    a = useAction();
  function change(id, field, value) {
    setItems((old) =>
      old.map((i) =>
        i.orderItemId === id
          ? {
              ...i,
              [field]: value,
            }
          : i,
      ),
    );
  }
  return (
    <form
      className="panel form"
      aria-busy={a.busy}
      onSubmit={async (e) => {
        e.preventDefault();
        const body = {
          items: items.map((i) => ({
            ...i,
            deliveredQty: Number(i.deliveredQty),
            emptyCollected: Number(i.emptyCollected),
          })),
          cashReceived: prepaid || bankTransfer ? 0 : Number(cash),
        };
        if (await a.run((key) => onSubmit(body, key), "Handover completed"))
          onSaved();
      }}
    >
      <h3>Record actual handover</h3>
      <p>
        {order.reference} - {order.customerName || "Walk-in customer"}
      </p>
      <p>
        Complete only after the full order is handed over. For an incomplete
        delivery, retain the goods and record failure.
      </p>
      <Feedback {...a} />
      {items.map((i, idx) => (
        <fieldset key={i.orderItemId}>
          <legend>
            {order.items[idx].brand} {order.items[idx].sizeKg}kg ·{" "}
            {order.items[idx].purchaseType} · ordered{" "}
            {order.items[idx].quantity}
          </legend>
          <label>
            Full cylinders handed over
            <input
              required
              type="number"
              min="0"
              max={order.items[idx].quantity}
              value={i.deliveredQty}
              onChange={(e) =>
                change(i.orderItemId, "deliveredQty", e.target.value)
              }
            />
          </label>
          <label>
            Empty cylinders collected
            <input
              required
              type="number"
              min="0"
              max={order.items[idx].quantity}
              value={i.emptyCollected}
              onChange={(e) =>
                change(i.orderItemId, "emptyCollected", e.target.value)
              }
            />
          </label>
        </fieldset>
      ))}
      <p>
        {prepaid
          ? "Paid at shop: no cash due at handover."
          : bankTransfer
            ? "Verified bank transfer: enter zero cash."
            : `Cash due: ${formatMoney(order.totalAmount)}`}
      </p>
      {!prepaid && !bankTransfer && (
        <label>
          Actual cash received
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>
      )}
      {confirmCollection && !prepaid && !bankTransfer && (
        <label className="checkbox-label">
          <input required type="checkbox" />I confirm the recorded COD cash was
          collected.
        </label>
      )}
      <button className="primary" disabled={a.busy}>
        Complete handover
      </button>
    </form>
  );
}
