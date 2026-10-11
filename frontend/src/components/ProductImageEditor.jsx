import Modal from "./Modal";
import React, { useEffect, useState } from "react";
import { ProductService } from "../api/services";
import { useAction } from "../utils/useApi";
import ProductImage from "./ProductImage";
import Feedback from "./Feedback";
export default function ProductImageEditor({ product, refresh }) {
  const [file, setFile] = useState(null),
    [removing, setRemoving] = useState(false),
    [preview, setPreview] = useState(""),
    [current, setCurrent] = useState(product),
    action = useAction();
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <form
      className="panel form"
      aria-busy={action.busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        const response = await action.run(
          (key) => ProductService.uploadImage(current.productId, file, key),
          "Product image uploaded",
        );
        if (response) {
          setCurrent(response.data);
          setFile(null);
          e.target.reset();
          refresh();
        }
      }}
    >
      <h2>Product photograph</h2>
      <ProductImage product={current} />
      <Feedback {...action} />
      <p className="muted">
        PNG or JPEG. Upload limits are enforced by the server. Save product
        details separately.
      </p>
      <label>
        Upload or replace image
        <input
          required
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
      {preview && file && (
        <figure className="slip-preview">
          <img src={preview} alt="Selected product photograph preview" />
          <figcaption>{file.name}</figcaption>
        </figure>
      )}
      <div className="action-group">
        <button className="primary" disabled={action.busy || !file}>
          Upload image
        </button>
        {current.imageUrl && (
          <button
            className="danger-btn"
            type="button"
            disabled={action.busy}
            onClick={() => setRemoving(true)}
          >
            Remove image
          </button>
        )}
      </div>
      {removing && (
        <Modal
          label="Remove product image"
          busy={action.busy}
          onClose={() => setRemoving(false)}
        >
          <h2>Remove this photograph?</h2>
          <p>
            {current.brand} {current.sizeKg} kg
          </p>
          <Feedback {...action} />
          <div className="dialog-actions">
            <button
              type="button"
              disabled={action.busy}
              onClick={() => setRemoving(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger-btn"
              disabled={action.busy}
              onClick={async () => {
                if (
                  await action.run((key) =>
                    ProductService.removeImage(current.productId, key),
                  )
                ) {
                  setCurrent({
                    ...current,
                    imageUrl: null,
                  });
                  setRemoving(false);
                  refresh();
                }
              }}
            >
              Confirm removal
            </button>
          </div>
        </Modal>
      )}
    </form>
  );
}
