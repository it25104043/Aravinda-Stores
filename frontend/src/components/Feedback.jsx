import React from "react";
export default function Feedback({ loading, busy, error, message }) {
  return (
    <>
      {(loading || busy) && (
        <p role="status" className="feedback feedback-loading">
          {busy ? "Saving..." : "Loading..."}
        </p>
      )}
      {error && (
        <p role="alert" className="feedback error-message">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="feedback feedback-success">
          {message}
        </p>
      )}
    </>
  );
}
