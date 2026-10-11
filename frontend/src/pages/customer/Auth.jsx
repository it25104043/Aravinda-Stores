import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { UserService } from "../../api/services";
import { useAction } from "../../utils/useApi";
import { safeCustomerReturn } from "../../utils/customerReturn";
import Feedback from "../../components/Feedback";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
export default function Auth() {
  const [register, setRegister] = useState(false),
    [form, setForm] = useState({
      fullName: "",
      email: "",
      phone: "",
      password: "",
    });
  const { login } = useContext(AuthContext),
    action = useAction(),
    navigate = useNavigate(),
    location = useLocation();
  async function submit(e) {
    e.preventDefault();
    const res = await action.run(
      () =>
        register
          ? UserService.register(form)
          : UserService.login({
              email: form.email,
              password: form.password,
            }),
      register ? "Account created. Please sign in." : "Signed in",
    );
    if (!res) return;
    if (register) {
      setRegister(false);
      setForm({
        ...form,
        password: "",
      });
    } else {
      login(res.data);
      navigate(
        res.data.user.role === "CUSTOMER"
          ? safeCustomerReturn(location.state?.returnTo)
          : res.data.user.role === "DELIVERY_STAFF"
            ? "/admin/delivery-reports"
            : "/admin/customers-orders",
        { replace: true },
      );
    }
  }
  return (
    <div className="view active">
      <Navbar />
      <main className="section auth-page">
        <h1>{register ? "Create account" : "Sign in"}</h1>
        {location.state?.message && (
          <p role="status" className="notice success">
            {location.state.message}
          </p>
        )}
        <Feedback {...action} />
        <form className="panel form" onSubmit={submit}>
          {(register
            ? ["fullName", "email", "phone", "password"]
            : ["email", "password"]
          ).map((name) => (
            <label key={name}>
              {
                {
                  fullName: "Full name",
                  email: "Email",
                  phone: "Phone",
                  password: "Password",
                }[name]
              }
              <input
                required
                name={name}
                type={
                  name === "password"
                    ? "password"
                    : name === "email"
                      ? "email"
                      : "text"
                }
                autoComplete={
                  name === "password"
                    ? register
                      ? "new-password"
                      : "current-password"
                    : name === "email"
                      ? "email"
                      : undefined
                }
                minLength={name === "password" && register ? 10 : undefined}
                maxLength={
                  name === "password" ? 72 : name === "phone" ? 20 : 150
                }
                value={form[name]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [name]: e.target.value,
                  })
                }
              />
            </label>
          ))}
          <button disabled={action.busy} className="primary">
            {action.busy ? "Saving…" : register ? "Register" : "Sign in"}
          </button>
        </form>
        <button onClick={() => setRegister(!register)}>
          {register
            ? "Already registered? Sign in"
            : "Create a customer account"}
        </button>
      </main>
      <Footer />
    </div>
  );
}
