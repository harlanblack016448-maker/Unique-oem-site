// Require a confirmed provider receipt; the deadline covers headers and body.
(function(root){
  async function sendInquiry(url, data, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
    try {
      const response = await (options.fetch || fetch)(url, {
        method: "POST", body: data, headers: {Accept: "application/json"}, signal: controller.signal
      });
      if (!response.ok) throw new Error("Inquiry HTTP error");
      const receipt = await response.json();
      if (!receipt || ![true, "true"].includes(receipt.success)) throw new Error("Unconfirmed inquiry receipt");
      return receipt;
    } finally {
      clearTimeout(timeout);
    }
  }
  if (typeof module !== "undefined" && module.exports) module.exports = sendInquiry;
  else root.__us_sendInquiry = sendInquiry;
})(typeof window !== "undefined" ? window : globalThis);
