import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/client";
import { operationKey } from "../api/services";
export const errorMessage = (error) =>
  typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "The request could not be completed. Check your connection and retry.";
export function useApi(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: "",
  });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((x) => x + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({
      data: null,
      loading: true,
      error: "",
    });
    api
      .get(path, {
        signal: controller.signal,
      })
      .then((res) =>
        setState({
          data: res.data,
          loading: false,
          error: "",
        }),
      )
      .catch((err) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error: errorMessage(err),
          });
      });
    return () => controller.abort();
  }, [path, revision]);
  return {
    ...state,
    refresh,
  };
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const running = useRef(false),
    key = useRef(null);
  async function run(action, success = "Saved successfully") {
    if (running.current) return null;
    running.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      key.current ||= operationKey();
      const result = await action(key.current);
      key.current = null;
      setMessage(success);
      return result || true;
    } catch (err) {
      if (err.response && err.response.status < 500) key.current = null;
      setError(errorMessage(err));
      return null;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    busy,
    message,
    error,
    run,
  };
}
