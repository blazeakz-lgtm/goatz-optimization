export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return json(
        {
          success: false,
          message: "Method not allowed"
        },
        405
      );
    }

    try {

      const data = await request.json();

      const {
        name,
        email,
        discord,
        packageName,
        pc,
        games,
        message
      } = data;


      if (
        !name ||
        !email ||
        !discord ||
        !packageName ||
        !pc
      ) {
        return json(
          {
            success: false,
            message: "Please fill in all required fields."
          },
          400
        );
      }


      const resendResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${env.RESEND_API_KEY}`,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            from:
              "GoatzOpt <onboarding@resend.dev>",

            to:
              ["blazeakz@gmail.com"],

            reply_to:
              email,

            subject:
              `New GoatzOpt Order - ${packageName}`,

            html: `

              <div
                style="
                  font-family:Arial;
                  max-width:700px;
                  margin:auto;
                "
              >

                <h1>
                  New GoatzOpt Order
                </h1>

                <hr>

                <h2>
                  Customer
                </h2>

                <p>
                  <strong>Name:</strong>
                  ${escapeHtml(name)}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${escapeHtml(email)}
                </p>

                <p>
                  <strong>Discord:</strong>
                  ${escapeHtml(discord)}
                </p>

                <p>
                  <strong>Package:</strong>
                  ${escapeHtml(packageName)}
                </p>

                <h2>
                  PC Specifications
                </h2>

                <p
                  style="white-space:pre-wrap"
                >
                  ${escapeHtml(pc)}
                </p>

                <h2>
                  Games
                </h2>

                <p
                  style="white-space:pre-wrap"
                >
                  ${escapeHtml(
                    games || "Not provided"
                  )}
                </p>

                <h2>
                  Additional Information
                </h2>

                <p
                  style="white-space:pre-wrap"
                >
                  ${escapeHtml(
                    message || "None"
                  )}
                </p>

                <hr>

                <p>
                  Reply directly to this email
                  to contact the customer.
                </p>

              </div>

            `
          })
        }
      );


      const result =
        await resendResponse.json();


      if (!resendResponse.ok) {

        console.error(
          "Resend error:",
          result
        );

        return json(
          {
            success: false,
            message:
              "Could not send the order."
          },
          500
        );
      }


      return json({
        success: true,
        message:
          "Order successfully sent."
      });


    } catch (error) {

      console.error(error);

      return json(
        {
          success: false,
          message:
            "Server error."
        },
        500
      );
    }
  }
};


function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",

        "Access-Control-Allow-Origin":
          "*",

        "Access-Control-Allow-Methods":
          "POST, OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type"
      }
    }
  );
}


function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}
