// PayPal integration - blueprint:javascript_paypal
// Gracefully handles missing credentials
import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

let ordersController: any = null;
let oAuthAuthorizationController: any = null;
let isInitialized = false;

async function initPayPal() {
  if (isInitialized) return;
  isInitialized = true;

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.warn("PayPal credentials not configured. PayPal routes will return 503.");
    return;
  }

  try {
    const sdk = await import("@paypal/paypal-server-sdk");
    const ClientClass = sdk.Client || (sdk as any).default?.Client;
    const EnvironmentEnum = sdk.Environment || (sdk as any).default?.Environment;
    const LogLevelEnum = sdk.LogLevel || (sdk as any).default?.LogLevel;
    const OrdersCtrl = sdk.OrdersController || (sdk as any).default?.OrdersController;
    const OAuthCtrl = sdk.OAuthAuthorizationController || (sdk as any).default?.OAuthAuthorizationController;

    if (!ClientClass) {
      console.error("PayPal SDK Client export not found");
      return;
    }

    const client = new ClientClass({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment:
        process.env.NODE_ENV === "production"
          ? EnvironmentEnum?.Production
          : EnvironmentEnum?.Sandbox,
      logging: {
        logLevel: LogLevelEnum?.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
      },
    });
    ordersController = new OrdersCtrl(client);
    oAuthAuthorizationController = new OAuthCtrl(client);
    console.log("PayPal SDK initialized successfully");
  } catch (e) {
    console.error("Failed to initialize PayPal SDK:", e);
  }
}

export async function getClientToken() {
  await initPayPal();
  if (!oAuthAuthorizationController) throw new Error("PayPal not configured");

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    { authorization: `Basic ${auth}` },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    await initPayPal();
    if (!ordersController) return res.status(503).json({ error: "PayPal not configured" });

    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount." });
    }
    if (!currency) {
      return res.status(400).json({ error: "Currency is required." });
    }
    if (!intent) {
      return res.status(400).json({ error: "Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    res.status(httpResponse.statusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    await initPayPal();
    if (!ordersController) return res.status(503).json({ error: "PayPal not configured" });

    const { orderID } = req.params;
    const collect = {
      id: orderID as string,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    res.status(httpResponse.statusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    const clientToken = await getClientToken();
    res.json({ clientToken });
  } catch (error) {
    console.error("Failed to load PayPal setup:", error);
    res.status(503).json({ error: "PayPal not configured" });
  }
}
