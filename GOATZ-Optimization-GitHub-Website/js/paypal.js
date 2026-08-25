// Your Cloudflare Worker URL.
// Example: https://goatz-payments.your-subdomain.workers.dev
const API_URL = "https://YOUR-WORKER-URL.workers.dev";

let selectedPlan = null;
let selectedPrice = null;

const message = (text) => {
  document.getElementById("message").textContent = text;
};

document.querySelectorAll(".plan").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPlan = button.dataset.plan;
    selectedPrice = button.dataset.price;
    document.getElementById("selected").textContent =
      `Selected: ${selectedPlan} — €${selectedPrice}`;
  });
});

paypal.Buttons({
  createOrder: async () => {
    if (!selectedPrice) throw new Error("Select a plan first.");

    const response = await fetch(`${API_URL}/create-order`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        plan: selectedPlan,
        amount: selectedPrice
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create order.");
    return data.id;
  },

  onApprove: async (data) => {
    const response = await fetch(`${API_URL}/capture-order`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ orderID: data.orderID })
    });

    const result = await response.json();

    if (!response.ok) {
      message(result.error || "Payment could not be completed.");
      return;
    }

    window.location.href = "success.html";
  },

  onError: (err) => {
    console.error(err);
    message("Payment error. Please try again.");
  }
}).render("#paypal-button-container");

// PayPal Card Fields: these appear only when PayPal makes card payments
// eligible for your account/region.
if (paypal.CardFields && paypal.CardFields.isEligible()) {
  document.getElementById("card-fields-container").hidden = false;

  const cardFields = paypal.CardFields({
    createOrder: async () => {
      if (!selectedPrice) throw new Error("Select a plan first.");

      const response = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          plan: selectedPlan,
          amount: selectedPrice
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create order.");
      return data.id;
    },

    onApprove: async (data) => {
      const response = await fetch(`${API_URL}/capture-order`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ orderID: data.orderID })
      });

      const result = await response.json();
      if (!response.ok) {
        message(result.error || "Card payment could not be completed.");
        return;
      }

      window.location.href = "success.html";
    },

    onError: (err) => {
      console.error(err);
      message("Card payment error. Please try again.");
    }
  });

  if (cardFields.isEligible()) {
    cardFields.NameField().render("#card-name-field-container");
    cardFields.NumberField().render("#card-number-field-container");
    cardFields.ExpiryField().render("#card-expiry-field-container");
    cardFields.CVVField().render("#card-cvv-field-container");

    document.getElementById("card-submit").addEventListener("click", async () => {
      try {
        await cardFields.submit();
      } catch (err) {
        console.error(err);
        message("Please check your card details and try again.");
      }
    });
  }
}
