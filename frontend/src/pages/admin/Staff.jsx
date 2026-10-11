import Modal from "../../components/Modal";
import ZoneManagement from "../../components/ZoneManagement";
import DataTable from "../../components/DataTable";
import { humanize } from "../../utils/presentation";
import React, { useState } from "react";
import { UserService } from "../../api/services";
import { useApi, useAction } from "../../utils/useApi";
import Feedback from "../../components/Feedback";
import DriverCoverage from "../../components/DriverCoverage";
export default function Staff() {
  const list = useApi("/users/staff"),
    a = useAction(),
    [form, setForm] = useState({
      fullName: "",
      email: "",
      phone: "",
      password: "",
    }),
    [role, setRole] = useState("STORE_STAFF"),
    [create, setCreate] = useState(false),
    [editing, setEditing] = useState(null);
  async function access(u, nextRole, active) {
    if (
      await a.run(() =>
        UserService.updateStaff(u.userId, {
          role: nextRole,
          active,
          fullName: u.fullName,
          phone: u.phone,
        }),
      )
    ) {
      list.refresh();
      setEditing(null);
    }
  }
  return (
    <>
      <h1>Staff accounts</h1>
      <Feedback {...list} />
      <Feedback {...a} />
      <button className="primary" onClick={() => setCreate(true)}>
        New staff account
      </button>
      {create && (
        <Modal
          label="Create staff account"
          busy={a.busy}
          onClose={() => setCreate(false)}
        >
          <Feedback {...a} />
          <form
            className="panel form"
            aria-busy={a.busy}
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await a.run(() =>
                  UserService.createStaff({
                    account: form,
                    role,
                  }),
                )
              ) {
                setForm({
                  fullName: "",
                  email: "",
                  phone: "",
                  password: "",
                });
                list.refresh();
                setCreate(false);
              }
            }}
          >
            <h2>Create staff account</h2>
            {["fullName", "email", "phone", "password"].map((n) => (
              <label key={n}>
                {
                  {
                    fullName: "Full name",
                    email: "Email",
                    phone: "Phone",
                    password: "Initial password",
                  }[n]
                }
                <input
                  required
                  type={
                    n === "email"
                      ? "email"
                      : n === "password"
                        ? "password"
                        : "text"
                  }
                  minLength={n === "password" ? 10 : undefined}
                  maxLength={n === "password" ? 72 : 150}
                  value={form[n]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [n]: e.target.value,
                    })
                  }
                />
              </label>
            ))}
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>STORE_STAFF</option>
                <option>DELIVERY_STAFF</option>
              </select>
            </label>
            <button className="primary" disabled={a.busy}>
              Create staff
            </button>
          </form>
        </Modal>
      )}
      {list.data?.length === 0 && <p>No staff accounts.</p>}
      <DataTable
        caption="Staff accounts"
        rowKey="userId"
        rows={list.data || []}
        loading={list.loading}
        error={list.error}
        columns={[
          {
            key: "fullName",
            label: "Name",
          },
          {
            key: "email",
            label: "Email",
          },
          {
            key: "phone",
            label: "Phone",
          },
          {
            key: "active",
            label: "Status",
            value: (u) => (u.active ? "Active" : "Disabled"),
          },
          {
            key: "role",
            label: "Assigned role",
            value: (u) => humanize(u.role),
          },
          {
            key: "action",
            label: "Action",
            sortable: false,
            render: (u) => (
              <button
                aria-label={`Edit ${u.fullName}`}
                onClick={() =>
                  setEditing({
                    ...u,
                  })
                }
              >
                Edit staff
              </button>
            ),
          },
        ]}
      />
      {editing && (
        <Modal
          label="Edit staff access"
          busy={a.busy}
          onClose={() => setEditing(null)}
        >
          <form
            className="form"
            aria-busy={a.busy}
            onSubmit={(event) => {
              event.preventDefault();
              access(editing, editing.role, editing.active);
            }}
          >
            <h2>Edit {editing.fullName}</h2>
            <p>
              {editing.email} - {editing.phone}
            </p>
            <p>
              Changing role or availability signs out existing sessions. Email
              remains the account login address.
            </p>
            <Feedback {...a} />
            <label>
              Full name
              <input
                required
                maxLength={100}
                value={editing.fullName}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    fullName: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Phone
              <input
                required
                pattern="[+0-9 ()-]{7,20}"
                value={editing.phone}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    phone: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Assigned role
              <select
                value={editing.role}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    role: event.target.value,
                  })
                }
              >
                <option value="STORE_STAFF">Store staff</option>
                <option value="DELIVERY_STAFF">Delivery staff</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    active: event.target.checked,
                  })
                }
              />
              Account active
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                disabled={a.busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="primary" disabled={a.busy}>
                Confirm staff changes
              </button>
            </div>
          </form>
        </Modal>
      )}
      <DriverCoverage key={list.data?.length} />
      <ZoneManagement />
    </>
  );
}
