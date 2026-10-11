import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { UserService, CustomerService } from "../../api/services";
import { useApi, useAction } from "../../utils/useApi";
import { humanize, formatDate } from "../../utils/presentation";
import { formatMoney } from "../../utils/pricing";
import ChangePassword from "../../components/ChangePassword";
import Feedback from "../../components/Feedback";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import ProductImage from "../../components/ProductImage";
function Contact({ user, refresh, onClose }) {
  const [name, setName] = useState(user.fullName),
    [phone, setPhone] = useState(user.phone),
    action = useAction();
  return (
    <form
      className="form"
      aria-busy={action.busy}
      onSubmit={async (event) => {
        event.preventDefault();
        if (
          await action.run(async () => {
            const result = await UserService.updateProfile({
              fullName: name,
              phone,
            });
            await refresh();
            return result;
          })
        )
          onClose();
      }}
    >
      <h2>Edit Profile</h2>
      <p>{user.email}</p>
      <Feedback {...action} />
      <label>
        Full name
        <input
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Phone
        <input
          required
          pattern="[+0-9 ()-]{7,20}"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>
      <div className="dialog-actions">
        <button type="button" disabled={action.busy} onClick={onClose}>
          Cancel
        </button>
        <button className="primary" disabled={action.busy}>
          Save contact
        </button>
      </div>
    </form>
  );
}
function MyOrders() {
  const [page, setPage] = useState(0),
    [filter, setFilter] = useState("current"),
    orders = useApi(`/orders/mine?page=${page}`);
  const rows = (orders.data || []).filter(
    ({ order }) =>
      filter === "all" ||
      (["COMPLETED", "CANCELLED", "REJECTED", "FAILED"].includes(order.status)
        ? filter === "previous"
        : filter === "current"),
  );
  return (
    <section className="profile-section">
      <header className="section-heading">
        <div>
          <h2>My Orders</h2>
          <p>Order history, payments and delivery progress in one place.</p>
        </div>
        <button onClick={orders.refresh}>Refresh orders</button>
      </header>
      <div className="profile-tabs" aria-label="Order filters">
        {["current", "previous", "all"].map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {humanize(value)} orders
          </button>
        ))}
      </div>
      <Feedback {...orders} />
      {!orders.loading && !orders.error && !rows.length && (
        <p className="empty-state">
          No {filter === "all" ? "" : filter} orders on this page.
        </p>
      )}
      <div className="customer-orders">
        {rows.map(({ order, payment, delivery }) => (
          <article className="panel customer-order" key={order.orderId}>
            <header className="section-heading">
              <div>
                <h3>{order.reference}</h3>
                <time>{formatDate(order.placedAt)}</time>
              </div>
              <strong>{formatMoney(order.totalAmount)}</strong>
            </header>
            <div className="order-products">
              {order.items.map((item) => (
                <div className="product-cell" key={item.orderItemId}>
                  <ProductImage product={item} compact />
                  <span>
                    {item.brand} {item.sizeKg} kg
                    <br />
                    {item.quantity} {humanize(item.purchaseType)}
                  </span>
                </div>
              ))}
            </div>
            <dl className="order-meta">
              <div>
                <dt>Order</dt>
                <dd>
                  <StatusBadge value={order.status} />
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  <StatusBadge value={payment.status} />
                </dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {delivery ? (
                    <StatusBadge value={delivery.status} />
                  ) : (
                    "Awaiting confirmation"
                  )}
                </dd>
              </div>
              {delivery?.assignedStaff && (
                <div>
                  <dt>Driver</dt>
                  <dd>{delivery.assignedStaff.fullName}</dd>
                </div>
              )}
            </dl>
            <Link
              className="primary order-link"
              to={`/profile/orders/${order.orderId}`}
            >
              View Details
            </Link>
          </article>
        ))}
      </div>
      <div className="dialog-actions">
        <button
          disabled={page === 0 || orders.loading}
          onClick={() => setPage(page - 1)}
        >
          Previous page
        </button>
        <span>Page {page + 1}</span>
        <button
          disabled={orders.loading || !orders.data || orders.data.length < 100}
          onClick={() => setPage(page + 1)}
        >
          Next page
        </button>
      </div>
    </section>
  );
}
function AddressForm({ existing, zones, refresh, onClose }) {
  const [address, setAddress] = useState(
    existing
      ? {
          addressLine: existing.addressLine,
          city: existing.city,
          deliveryZone: existing.deliveryZone,
          label: existing.label || "",
        }
      : {
          addressLine: "",
          city: "",
          deliveryZone: "",
          label: "",
        },
  );
  const action = useAction();
  return (
    <form
      className="form"
      aria-busy={action.busy}
      onSubmit={async (event) => {
        event.preventDefault();
        if (
          await action.run(() =>
            existing
              ? CustomerService.updateAddress(existing.addressId, address)
              : CustomerService.addAddress(address),
          )
        ) {
          refresh();
          onClose();
        }
      }}
    >
      <h2>{existing ? "Edit delivery address" : "Add delivery address"}</h2>
      <Feedback {...action} />
      <Feedback {...zones} />
      {["addressLine", "city", "label"].map((key) => (
        <label key={key}>
          {
            {
              addressLine: "Street address",
              city: "City",
              label: "Label (optional)",
            }[key]
          }
          <input
            required={key !== "label"}
            maxLength={key === "addressLine" ? 250 : 100}
            value={address[key]}
            onChange={(event) =>
              setAddress({
                ...address,
                [key]: event.target.value,
              })
            }
          />
        </label>
      ))}
      <label>
        Delivery zone
        <select
          required
          value={address.deliveryZone}
          onChange={(event) =>
            setAddress({
              ...address,
              deliveryZone: event.target.value,
            })
          }
        >
          <option value="">Choose zone</option>
          {zones.data?.map((zone) => (
            <option key={zone.zoneId}>{zone.zoneName}</option>
          ))}
        </select>
      </label>
      <div className="dialog-actions">
        <button type="button" disabled={action.busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="primary"
          disabled={action.busy || zones.loading || !!zones.error}
        >
          Save address
        </button>
      </div>
    </form>
  );
}
function Addresses() {
  const profile = useApi("/customers/me"),
    zones = useApi("/delivery-zones"),
    action = useAction();
  const [editing, setEditing] = useState(null),
    [remove, setRemove] = useState(null);
  return (
    <section className="profile-section">
      <header className="section-heading">
        <h2>Delivery Addresses</h2>
        <button className="primary" onClick={() => setEditing({})}>
          Add address
        </button>
      </header>
      <Feedback {...profile} />
      <div className="address-grid">
        {profile.data?.addresses.map((address) => (
          <article className="panel" key={address.addressId}>
            <h3>{address.label || "Delivery address"}</h3>
            <p>
              {address.addressLine}
              <br />
              {address.city}
              <br />
              {address.deliveryZone}
            </p>
            {!address.eligible && (
              <p className="notice">
                This address is outside the currently supported delivery area.
              </p>
            )}
            <div className="dialog-actions">
              <button onClick={() => setEditing(address)}>Edit address</button>
              <button className="danger-btn" onClick={() => setRemove(address)}>
                Remove address
              </button>
            </div>
          </article>
        ))}
      </div>
      {profile.data && !profile.data.addresses.length && (
        <p className="empty-state">Save your first delivery address.</p>
      )}
      {editing && (
        <Modal
          label={
            editing.addressId ? "Edit delivery address" : "Add delivery address"
          }
          onClose={() => setEditing(null)}
        >
          <AddressForm
            existing={editing.addressId ? editing : null}
            zones={zones}
            refresh={profile.refresh}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
      {remove && (
        <Modal
          label="Remove address"
          busy={action.busy}
          onClose={() => setRemove(null)}
        >
          <h2>Remove this saved address?</h2>
          <p>
            {remove.addressLine}, {remove.city}
          </p>
          <p>Existing order delivery records are preserved.</p>
          <Feedback {...action} />
          <div className="dialog-actions">
            <button disabled={action.busy} onClick={() => setRemove(null)}>
              Cancel
            </button>
            <button
              className="danger-btn"
              disabled={action.busy}
              onClick={async () => {
                if (
                  await action.run(() =>
                    CustomerService.deleteAddress(remove.addressId),
                  )
                ) {
                  setRemove(null);
                  profile.refresh();
                }
              }}
            >
              Confirm removal
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
export default function Profile() {
  const { user, refreshUser, logout } = useContext(AuthContext),
    navigate = useNavigate(),
    profile = useApi("/users/me"),
    action = useAction();
  const customer = user?.role === "CUSTOMER";
  const [section, setSection] = useState(customer ? "orders" : "security"),
    [dialog, setDialog] = useState(null);
  const person = profile.data;
  const sections = [
    ...(customer ? [["orders", "My Orders"]] : []),
    ...(customer ? [["addresses", "Delivery Addresses"]] : []),
    ["security", "Security"],
    ["account", "Account"],
  ];
  return (
    <div className="view active">
      <Navbar />
      <main className="section workflow-page profile-page">
        <h1>My Profile</h1>
        <Feedback {...profile} />
        {person && (
          <header className="panel profile-overview">
            <span className="profile-avatar" aria-hidden="true">
              {person.fullName
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <h2>{person.fullName}</h2>
              <p>{person.email}</p>
              <p>{person.phone}</p>
              <StatusBadge value={person.role} />
            </div>
            <button className="primary" onClick={() => setDialog("edit")}>
              Edit Profile
            </button>
          </header>
        )}
        <div className="profile-dashboard">
          <nav className="profile-navigation" aria-label="Profile sections">
            {sections.map(([key, title]) => (
              <button
                key={key}
                aria-current={section === key ? "page" : undefined}
                onClick={() => setSection(key)}
              >
                {title}
              </button>
            ))}
          </nav>
          <div className="profile-content">
            {section === "orders" && customer && <MyOrders />}
            {section === "addresses" && customer && <Addresses />}
            {section === "security" && (
              <section className="panel">
                <h2>Security</h2>
                <p>
                  You will need to sign in again after a successful change of
                  password .
                </p>
                <button
                  className="primary"
                  onClick={() => setDialog("password")}
                >
                  Change password
                </button>
              </section>
            )}
            {section === "account" && (
              <section className="panel">
                <h2>Account</h2>
                <p>Sign out to end this session</p>
                <Feedback {...action} />
                <button
                  className="danger-btn"
                  disabled={action.busy}
                  onClick={async () => {
                    await action.run(async () => {
                      try {
                        await logout();
                      } finally {
                        navigate("/auth", {
                          replace: true,
                        });
                      }
                    });
                  }}
                >
                  Sign Out
                </button>
              </section>
            )}
          </div>
        </div>
        {dialog === "edit" && person && (
          <Modal label="Edit Profile" onClose={() => setDialog(null)}>
            <Contact
              user={person}
              onClose={() => setDialog(null)}
              refresh={async () => {
                await refreshUser();
                profile.refresh();
              }}
            />
          </Modal>
        )}
        {dialog === "password" && (
          <Modal label="Change password" onClose={() => setDialog(null)}>
            <ChangePassword />
          </Modal>
        )}
      </main>
      <Footer />
    </div>
  );
}
