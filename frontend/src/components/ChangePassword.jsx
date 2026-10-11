import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { UserService } from "../api/services";
import { useAction } from "../utils/useApi";
import Feedback from "./Feedback";
export default function ChangePassword() {
  const [form, setForm] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }),
    [show, setShow] = useState({}),
    [validation, setValidation] = useState("");
  const { clearSession } = useContext(AuthContext),
    navigate = useNavigate(),
    action = useAction();
  return (
    <form
      className="panel form"
      aria-busy={action.busy}
      onSubmit={async (e) => {
        e.preventDefault();
        setValidation("");
        if (form.newPassword !== form.confirmPassword) {
          setValidation("New passwords must match.");
          return;
        }
        if (
          form.newPassword.length < 12 ||
          new TextEncoder().encode(form.newPassword).length > 72 ||
          !/[a-z]/.test(form.newPassword) ||
          !/[A-Z]/.test(form.newPassword) ||
          !/[0-9]/.test(form.newPassword)
        ) {
          setValidation(
            "Use at least 12 characters with uppercase, lowercase and a number; maximum 72 UTF-8 bytes.",
          );
          return;
        }
        if (await action.run((key) => UserService.changePassword(form, key))) {
          setForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          clearSession();
          navigate("/auth", {
            replace: true,
            state: {
              message: "Password changed. Please sign in again.",
            },
          });
        }
      }}
    >
      <h2>Change password</h2>
      <p className="muted">
        Use at least 12 characters, including uppercase, lowercase and a number.
        Maximum 72 UTF-8 bytes. Changing your password signs out all existing
        sessions.
      </p>
      <Feedback {...action} />
      {validation && (
        <p role="alert" className="notice error">
          {validation}
        </p>
      )}
      {Object.keys(form).map((key) => (
        <div className="password-field" key={key}>
          <label>
            {
              {
                currentPassword: "Current password",
                newPassword: "New password",
                confirmPassword: "Confirm new password",
              }[key]
            }
            <input
              required
              autoComplete={
                key === "currentPassword" ? "current-password" : "new-password"
              }
              type={show[key] ? "text" : "password"}
              value={form[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [key]: e.target.value,
                })
              }
            />
          </label>
          <button
            type="button"
            aria-label={`${show[key] ? "Hide" : "Show"} ${
              {
                currentPassword: "current password",
                newPassword: "new password",
                confirmPassword: "confirmation",
              }[key]
            }`}
            aria-pressed={Boolean(show[key])}
            onClick={() =>
              setShow({
                ...show,
                [key]: !show[key],
              })
            }
          >
            {show[key] ? "Hide" : "Show"}
          </button>
        </div>
      ))}
      <button className="primary" disabled={action.busy}>
        Change password
      </button>
    </form>
  );
}
