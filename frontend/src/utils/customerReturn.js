export function safeCustomerReturn(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    [...value].some((char) => char === "\\" || char.charCodeAt(0) <= 32)
  )
    return "/products";
  try {
    const url = new URL(value, "https://aravinda.invalid");
    if (
      url.origin !== "https://aravinda.invalid" ||
      !/^\/(?:products(?:\/\d+)?|about|contact|how-it-works)?$/.test(
        url.pathname,
      )
    )
      return "/products";
    const path = /^\/products\/\d+$/.test(url.pathname)
      ? "/products"
      : url.pathname;
    return path + url.search + url.hash;
  } catch {
    return "/products";
  }
}
