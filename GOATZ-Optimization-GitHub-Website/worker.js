// Cloudflare Worker backend for PayPal.
// IMPORTANT: never put PAYPAL_CLIENT_SECRET in GitHub.
// Add it as a Cloudflare Worker Secret named PAYPAL_CLIENT_SECRET.

const PAYPAL_API = "https://api-m.paypal.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

async function getAccessToken(env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "PayPal authentication failed.");
  return data.access_token;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {headers: corsHeaders()});
    }

    const url = new URL(request.url);

    try {
      const token = await getAccessToken(env);

      if (request.method === "POST" && url.pathname === "/create-order") {
        const body = await request.json();

        const allowedPrices = {
          Basic: "10.00",
          Gaming: "30.00",
          Pro: "50.00"
        };

        const amount = allowedPrices[body.plan];
        if (!amount || amount !== Number(body.amount).toFixed(2)) {
          return json({error: "Invalid plan or amount."}, 400);
        }

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [{
              description: `GOATZ Optimization - ${body.plan}`,
              amount: {
                currency_code: "EUR",
                value: amount
              }
            }]
          })
        });

        const data = await response.json();
        return json(data, response.status);
      }

      if (request.method === "POST" && url.pathname === "/capture-order") {
        const body = await request.json();

        if (!body.orderID || !/^[A-Z0-9-]+$/i.test(body.orderID)) {
          return json({error: "Invalid order ID."}, 400);
        }

        const response = await fetch(
          `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(body.orderID)}/capture`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        const data = await response.json();
        return json(data, response.status);
      }

      return json({error: "Not found."}, 404);
    } catch (error) {
      return json({error: error.message || "Server error."}, 500);
    }
  }
};
