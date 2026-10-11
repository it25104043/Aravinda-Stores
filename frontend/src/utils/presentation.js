export function humanize(value) {
  const labels = {
    COD: "Cash on delivery",
    CASH: "Cash",
    BANK_TRANSFER: "Bank transfer",
    STORE_STAFF: "Store staff",
    DELIVERY_STAFF: "Delivery staff",
    OWNER: "Owner",
    CUSTOMER: "Customer",
    EXCHANGE: "Exchange / refill",
    NEW: "New cylinder",
    ONLINE: "Online",
    WALK_IN: "Walk-in",
    DISPATCHED: "Out for delivery",
    UNDER_REVIEW: "Awaiting Verification",
  };
  return (
    labels[value] ||
    String(value || "Not available")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^./, (c) => c.toUpperCase())
  );
}
export function utcDate(value) {
  if (!value) return null;
  const date = new Date(
    /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
export function formatDate(value) {
  const date = utcDate(value);
  return date
    ? new Intl.DateTimeFormat("en-LK", {
        timeZone: "Asia/Colombo",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "Date unavailable";
}
export function eventPresentation(event) {
  let type = event.action || event.type;
  if (type === "PAYMENT_REVIEW")
    type = (event.detail || "").startsWith("APPROVED")
      ? "PAYMENT_VERIFIED"
      : "PAYMENT_REJECTED";
  if (type === "PAYMENT_UPLOAD") type = "PAYMENT_SLIP_UPLOADED";
  if (type?.startsWith("DELIVERY_")) type = type.slice(9);
  if (type === "NOTE" && (event.note || "").startsWith("Owner reassignment"))
    type = "REASSIGNED";
  if (type === "SALE_COMPLETED") type = "PICKUP_COMPLETED";
  const titles = {
    ORDER_PLACED: "Order placed",
    ORDER_CONFIRMED: "Order confirmed",
    ORDER_REJECTED: "Order rejected",
    ORDER_CANCELLED: "Order cancelled",
    PAYMENT_SHOP_CASH: "Payment received at shop",
    PAYMENT_VERIFIED: "Bank transfer verified",
    PAYMENT_REJECTED: "Payment rejected",
    PAYMENT_SLIP: "Payment slip uploaded",
    PAYMENT_SLIP_UPLOADED: "Payment slip uploaded",
    ASSIGNED: "Delivery assigned",
    REASSIGNED: "Delivery reassigned",
    DISPATCHED: "Out for delivery",
    DELIVERED: "Delivery completed",
    COMPLETED: "Delivery completed",
    FAILED: "Delivery failed",
    PICKUP_COMPLETED: "Collected at shop",
    PASSWORD_CHANGED: "Password changed",
    PROFILE_UPDATED: "Profile updated",
  };
  const descriptions = {
    ORDER_PLACED: "The order was received.",
    ORDER_CONFIRMED: "The order was approved for fulfilment.",
    PAYMENT_SHOP_CASH: "Cash payment was received before fulfilment.",
    ASSIGNED: "A delivery team member was assigned.",
    REASSIGNED: "The delivery assignment was updated.",
    DISPATCHED: "The cylinders are on their way.",
    DELIVERED: "The cylinders were handed over.",
    COMPLETED: "The handover was completed.",
  };
  // Audit detail strings contain internal identifiers/keys. Never render them verbatim.
  const raw = event.detail || event.note || "";
  const reason = raw.match(/(?:^|[|;,])\s*reason=([^|;]+)/i)?.[1]?.trim();
  return {
    title: titles[type] || humanize(type),
    description: reason
      ? `Reason: ${reason}`
      : descriptions[type] || "This activity was recorded.",
    actor:
      event.actorName ||
      humanize(
        event.actorRole ||
          ([
            "ASSIGNED",
            "REASSIGNED",
            "DISPATCHED",
            "DELIVERED",
            "FAILED",
          ].includes(type)
            ? "DELIVERY_STAFF"
            : ""),
      ),
    date: event.occurredAt || event.eventAt,
  };
}
