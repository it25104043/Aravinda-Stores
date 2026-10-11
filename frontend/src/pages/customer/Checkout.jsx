import ProductImage from "../../components/ProductImage";
import React, { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { OrderService } from "../../api/services";
import { useApi, useAction } from "../../utils/useApi";
import Feedback from "../../components/Feedback";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
export default function Checkout() {
  const { cart, clearCart, cartSubtotal, formatMoney, fetchProducts } =
      useContext(StoreContext),
    navigate = useNavigate(),
    zones = useApi("/delivery-zones"),
    profile = useApi("/customers/me"),
    action = useAction();
  const completed = useRef(false);
  const [method, setMethod] = useState("COD"),
    [saved, setSaved] = useState(""),
    [address, setAddress] = useState({
      addressLine: "",
      city: "",
      deliveryZone: "",
      label: "",
    });
  const selected = profile.data?.addresses?.find(
      (a) => String(a.addressId) === saved,
    ),
    zoneName = selected?.deliveryZone || address.deliveryZone;
  const zone = zones.data?.find(
    (z) => z.zoneName.toLowerCase() === zoneName.toLowerCase(),
  );
  async function submit(e) {
    e.preventDefault();
    if (
      !cart.length ||
      completed.current ||
      !zone ||
      profile.loading ||
      profile.error
    )
      return;
    const body = {
      fulfilment: "DELIVERY",
      paymentMethod: method,
      items: cart.map((i) => ({
        productId: i.productId,
        purchaseType: i.purchaseType,
        quantity: i.qty,
      })),
    };
    if (saved) body.addressId = Number(saved);
    else body.address = address;
    const res = await action.run(async (key) => {
      const result = await OrderService.createOrder(body, key);
      if (
        !Number.isSafeInteger(result?.data?.orderId) ||
        result.data.orderId < 1
      ) {
        const message =
          "The order response was incomplete. Check My Orders before retrying; your cart has been preserved.";
        const error = new Error(message);
        error.response = {
          status: 502,
          data: {
            message,
          },
        };
        throw error;
      }
      completed.current = true;
      return result;
    }, "Order placed");
    if (res) {
      clearCart();
      if (fetchProducts) fetchProducts();
      navigate(`/profile/orders/${res.data.orderId}`, {
        replace: true,
        state: {
          newOrder: true,
          autoUpload: method === "BANK_TRANSFER",
        },
      });
    }
  }
  return (
    <div className="view active">
      <Navbar />
      <main className="section workflow-page">
        <h1>Checkout</h1>
        <Feedback {...zones} />
        <Feedback {...profile} />
        <Feedback {...action} />
        {!cart.length ? (
          <p>Your cart is empty.</p>
        ) : (
          <form
            className="panel form"
            aria-busy={action.busy}
            onSubmit={submit}
          >
            <p>
              Contact: {profile.data?.user.fullName} ·{" "}
              {profile.data?.user.phone}. Update these in My account if
              necessary.
            </p>
            <p className="notice">
              Home delivery - select an address in a supported zone.
            </p>
            <>
              <label>
                Payment
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="COD">Cash on delivery</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                </select>
              </label>
              <label>
                Delivery address
                <select
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                >
                  <option value="">Enter a new address</option>
                  {profile.data?.addresses.map((a) => (
                    <option key={a.addressId} value={a.addressId}>
                      {a.addressLine}, {a.city} ({a.deliveryZone})
                    </option>
                  ))}
                </select>
              </label>
              {!saved && (
                <>
                  <label>
                    Street address
                    <input
                      required
                      maxLength={250}
                      value={address.addressLine}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          addressLine: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    City
                    <input
                      required
                      maxLength={100}
                      value={address.city}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          city: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Delivery zone
                    <select
                      required
                      value={address.deliveryZone}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          deliveryZone: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose your actual delivery zone</option>
                      {zones.data?.map((z) => (
                        <option key={z.zoneId}>{z.zoneName}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {!zone && (
                <p role="alert">Choose an address in a supported zone.</p>
              )}
            </>
            <section>
              <h2>Review cylinders</h2>
              {cart.map((i) => (
                <div
                  className="product-cell"
                  key={`${i.productId}-${i.purchaseType}`}
                >
                  <ProductImage product={i} compact />
                  <p>
                    {i.brand} {i.sizeKg} kg - {i.qty}{" "}
                    {i.purchaseType === "NEW" ? "new" : "exchange"}
                  </p>
                </div>
              ))}
            </section>
            <p>
              Estimated total:{" "}
              {formatMoney(cartSubtotal + Number(zone?.deliveryFee || 0))}
            </p>
            <p>
              The server confirms current prices and the final total when
              placing your order.
            </p>
            <button
              className="primary"
              disabled={
                action.busy ||
                profile.loading ||
                !!profile.error ||
                zones.loading ||
                !zone
              }
            >
              {action.busy ? "Creating order..." : "Confirm Order"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
