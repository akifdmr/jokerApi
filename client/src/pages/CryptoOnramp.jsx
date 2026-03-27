import React from "react";
import { onrampApi } from "../lib/onrampApi";
import { formatCardNumberMasked, monthOptions, normalizeCardNumber, yearOptions } from "../lib/cardFormat";
import { braintreeApi } from "../lib/braintreeApi";
import "./CryptoOnramp.css";

import btClient from "braintree-web/client";
import hostedFields from "braintree-web/hosted-fields";
import threeDSecure from "braintree-web/three-d-secure";
import dataCollector from "braintree-web/data-collector";
import usBankAccount from "braintree-web/us-bank-account";
import sepa from "braintree-web/sepa";

function useBraintree(clientToken) {
  const [state, setState] = React.useState({ ready: false, client: null, deviceData: "", error: "" });

  React.useEffect(() => {
    let isAlive = true;
    let clientInstance = null;
    let collectorInstance = null;

    const run = async () => {
      if (!clientToken) {
        setState({ ready: false, client: null, deviceData: "", error: "" });
        return;
      }

      try {
        clientInstance = await btClient.create({ authorization: clientToken });
        collectorInstance = await dataCollector.create({ client: clientInstance, kount: true });
        if (!isAlive) return;
        setState({
          ready: true,
          client: clientInstance,
          deviceData: collectorInstance?.deviceData ?? "",
          error: "",
        });
      } catch (err) {
        if (!isAlive) return;
        setState({
          ready: false,
          client: null,
          deviceData: "",
          error: err instanceof Error ? err.message : "Braintree init failed",
        });
      }
    };

    run();

    return () => {
      isAlive = false;
      try {
        collectorInstance?.teardown?.();
      } catch {
        // ignore
      }
      try {
        clientInstance?.teardown?.();
      } catch {
        // ignore
      }
    };
  }, [clientToken]);

  return state;
}

const BraintreeCardFields = React.forwardRef(function BraintreeCardFields({ bt, amount }, ref) {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState("");
  const hfRef = React.useRef(null);
  const threeDSRef = React.useRef(null);
  const challengeRef = React.useRef(null);

  React.useEffect(() => {
    let isAlive = true;
    setError("");
    setReady(false);

    if (!bt?.ready || !bt.client) return undefined;

    (async () => {
      try {
        const hf = await hostedFields.create({
          client: bt.client,
          styles: {
            input: {
              color: "rgba(255,255,255,0.92)",
              "font-size": "14px",
              "font-family": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
            },
            ".invalid": { color: "#ff8080" },
            ":focus": { color: "rgba(255,255,255,0.98)" },
          },
          fields: {
            number: { selector: "#bt-card-number", placeholder: "4111 1111 1111 1111" },
            cvv: { selector: "#bt-card-cvv", placeholder: "123" },
            expirationDate: { selector: "#bt-card-exp", placeholder: "MM/YY" },
          },
        });

        const tds = await threeDSecure.create({ client: bt.client, version: 2 });

        if (!isAlive) {
          hf.teardown();
          tds.teardown?.();
          return;
        }

        hfRef.current = hf;
        threeDSRef.current = tds;
        setReady(true);
      } catch (err) {
        if (!isAlive) return;
        setError(err instanceof Error ? err.message : "Hosted fields init failed");
      }
    })();

    return () => {
      isAlive = false;
      try {
        hfRef.current?.teardown?.();
      } catch {
        // ignore
      }
      hfRef.current = null;
      try {
        threeDSRef.current?.teardown?.();
      } catch {
        // ignore
      }
      threeDSRef.current = null;
    };
  }, [bt?.ready, bt?.client]);

  React.useImperativeHandle(ref, () => ({
    async tokenize({ force3ds = false } = {}) {
      setError("");
      if (!hfRef.current) throw new Error("Card fields are not ready");

      const tokenized = await hfRef.current.tokenize();
      const nonce = tokenized?.nonce;
      const details = tokenized?.details;
      if (!nonce) throw new Error("Tokenization failed (missing nonce)");

      if (!force3ds) return { nonce, details, threeDS: null };
      if (!threeDSRef.current) throw new Error("3DS is not ready");

      const threeDSResult = await new Promise((resolve, reject) => {
        threeDSRef.current.verifyCard(
          {
            amount: String(Number(amount || 0).toFixed(2)),
            nonce,
            bin: details?.bin,
            onLookupComplete: (_data, next) => next(),
            addFrame: (err, iframe) => {
              if (err) return reject(err);
              const root = challengeRef.current;
              if (!root) return reject(new Error("3DS challenge container not found"));
              root.innerHTML = "";
              root.appendChild(iframe);
            },
            removeFrame: () => {
              const root = challengeRef.current;
              if (root) root.innerHTML = "";
            },
          },
          (err, verification) => {
            if (err) return reject(err);
            resolve(verification);
          }
        );
      });

      const verifiedNonce = threeDSResult?.nonce;
      if (!verifiedNonce) throw new Error("3DS verification failed (missing nonce)");

      return {
        nonce: verifiedNonce,
        details,
        threeDS: {
          liabilityShifted: Boolean(threeDSResult?.liabilityShifted),
          liabilityShiftPossible: Boolean(threeDSResult?.liabilityShiftPossible),
        },
      };
    },
  }));

  return (
    <div className="bt-section">
      <div className="bt-grid">
        <label>
          Card Number
          <div id="bt-card-number" className="bt-field" />
        </label>
        <label>
          Expiry
          <div id="bt-card-exp" className="bt-field" />
        </label>
        <label>
          CVV
          <div id="bt-card-cvv" className="bt-field" />
        </label>
      </div>
      <div ref={challengeRef} className="bt-challenge" />
      {!bt?.ready ? <div className="bt-note">Braintree not ready.</div> : null}
      {!ready ? <div className="bt-note">Initializing secure fields…</div> : null}
      {error ? <div className="bt-error">{error}</div> : null}
    </div>
  );
});

export default function CryptoOnramp() {
  const months = monthOptions();
  const years = yearOptions();
  const [constants, setConstants] = React.useState({ paymentMethods: [], assets: [], fiatCurrencies: [], cards: [] });
  const [orders, setOrders] = React.useState([]);
  const [quote, setQuote] = React.useState(null);
  const [error, setError] = React.useState("");
  const [btToken, setBtToken] = React.useState("");
  const [btEnabled, setBtEnabled] = React.useState(false);
  const [btStatusError, setBtStatusError] = React.useState("");

  const [form, setForm] = React.useState({
    paymentMethod: "card",
    asset: "USDT",
    fiatCurrency: "USD",
    fiatAmount: "",
    walletAddress: "",
    fraudProfileId: "default",
    sourceCardId: "",
    cardNumber: "",
    expiryMonth: months[0]?.value ?? "01",
    expiryYear: years[0]?.value ?? String(new Date().getFullYear()),
    cvv: "",
    holderName: "",
    achAccountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    achAccountType: "checking",
    achOwnershipType: "personal",
    achFirstName: "",
    achLastName: "",
    achBusinessName: "",
    achBillingStreet: "",
    achBillingLocality: "",
    achBillingRegion: "",
    achBillingPostal: "",
    achBillingCountry: "US",
    sepaAccountHolderName: "",
    iban: "",
    countryCode: "DE",
  });

  const bt = useBraintree(btEnabled ? btToken : "");
  const cardRef = React.useRef(null);

  const load = React.useCallback(async () => {
    const [cons, list] = await Promise.all([onrampApi.constants(), onrampApi.listOrders()]);
    setConstants(cons);
    setOrders(list.items ?? []);

    const enabled = Boolean(cons?.braintree?.enabled);
    setBtEnabled(enabled);
    setBtStatusError("");
    if (enabled) {
      try {
        const tokenResp = await braintreeApi.clientToken();
        setBtToken(tokenResp.clientToken ?? "");
      } catch (err) {
        setBtToken("");
        setBtStatusError(err instanceof Error ? err.message : "Failed to get client token");
      }
    } else {
      setBtToken("");
    }

    setForm((prev) => ({
      ...prev,
      paymentMethod: cons.paymentMethods?.[0] ?? "card",
      asset: cons.assets?.[0] ?? "USDT",
      fiatCurrency: cons.fiatCurrencies?.[0] ?? "USD",
    }));
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const runQuote = async () => {
    setError("");
    try {
      const response = await onrampApi.quote({
        paymentMethod: form.paymentMethod,
        asset: form.asset,
        fiatAmount: Number(form.fiatAmount || 0),
      });
      setQuote(response.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    let paymentDetails = {};
    let paymentMethodNonce = "";
    const amount = Number(form.fiatAmount);

    const useBraintree = btEnabled && bt.ready && bt.client && btToken;

    try {
      if (useBraintree) {
        if (form.paymentMethod === "card") {
          const tokenized = await cardRef.current?.tokenize?.({ force3ds: false });
          paymentMethodNonce = tokenized?.nonce ?? "";
        }

        if (form.paymentMethod === "ach") {
          const usBank = await usBankAccount.create({ client: bt.client });
          const tokenized = await usBank.tokenize({
            mandateText: "I authorize this debit from my bank account.",
            bankDetails: {
              routingNumber: form.routingNumber,
              accountNumber: form.accountNumber,
              accountType: form.achAccountType,
              ownershipType: form.achOwnershipType,
              firstName: form.achOwnershipType === "personal" ? form.achFirstName : undefined,
              lastName: form.achOwnershipType === "personal" ? form.achLastName : undefined,
              businessName: form.achOwnershipType === "business" ? form.achBusinessName : undefined,
              billingAddress: {
                streetAddress: form.achBillingStreet,
                locality: form.achBillingLocality,
                region: form.achBillingRegion,
                postalCode: form.achBillingPostal,
                countryCodeAlpha2: form.achBillingCountry,
              },
            },
          });
          paymentMethodNonce = tokenized?.nonce ?? "";
          await usBank.teardown?.();
        }

        if (form.paymentMethod === "sepa") {
          const sepaInstance = await sepa.create({ client: bt.client });
          const tokenized = await sepaInstance.tokenize({
            accountHolderName: form.sepaAccountHolderName,
            iban: form.iban,
            mandateType: "ONE_OFF",
            countryCode: form.countryCode,
          });
          paymentMethodNonce = tokenized?.nonce ?? "";
          await sepaInstance.teardown?.();
        }

        if (!paymentMethodNonce) throw new Error("Tokenization failed (missing nonce)");
      } else {
        if (form.paymentMethod === "card" && !form.sourceCardId) {
          paymentDetails = {
            cardNumber: normalizeCardNumber(form.cardNumber),
            expiryMonth: form.expiryMonth,
            expiryYear: form.expiryYear,
            cvv: form.cvv,
            holderName: form.holderName,
          };
        }

        if (form.paymentMethod === "ach") {
          paymentDetails = {
            accountHolderName: form.achAccountHolderName,
            routingNumber: form.routingNumber,
            accountNumber: form.accountNumber,
            accountType: form.achAccountType,
          };
        }

        if (form.paymentMethod === "sepa") {
          paymentDetails = {
            accountHolderName: form.sepaAccountHolderName,
            iban: form.iban,
            countryCode: form.countryCode,
          };
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment method setup failed");
      return;
    }

    try {
      const payload = {
        paymentMethod: form.paymentMethod,
        asset: form.asset,
        fiatCurrency: form.fiatCurrency,
        fiatAmount: amount,
        walletAddress: form.walletAddress,
        fraudProfileId: form.fraudProfileId,
        billingCountry: form.paymentMethod === "sepa" ? form.countryCode : form.achBillingCountry,
        sourceCardId: form.paymentMethod === "card" ? form.sourceCardId || undefined : undefined,
        paymentDetails,
        paymentMethodNonce: useBraintree ? paymentMethodNonce : undefined,
        deviceData: useBraintree ? bt.deviceData : undefined,
        threeDSVerified: false,
      };

      try {
        await onrampApi.createOrder(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Create order failed";
        if (useBraintree && form.paymentMethod === "card" && String(msg).includes("require_3ds")) {
          const verified = await cardRef.current?.tokenize?.({ force3ds: true });
          if (!verified?.nonce) throw new Error("3DS flow failed");
          await onrampApi.createOrder({ ...payload, paymentMethodNonce: verified.nonce, threeDSVerified: true });
        } else {
          throw err;
        }
      }

      setForm((prev) => ({
        ...prev,
        fiatAmount: "",
        walletAddress: "",
        fraudProfileId: prev.fraudProfileId,
        sourceCardId: "",
        cardNumber: "",
        expiryMonth: months[0]?.value ?? "01",
        expiryYear: years[0]?.value ?? String(new Date().getFullYear()),
        cvv: "",
        holderName: "",
        achAccountHolderName: "",
        routingNumber: "",
        accountNumber: "",
        sepaAccountHolderName: "",
        iban: "",
      }));
      setQuote(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create order failed");
    }
  };

  return (
    <section className="onramp-page">
      <h2>Crypto Onramp</h2>
      <p className="onramp-note">
        Process: choose payment method and then enter method details, get quote, create order, and receive crypto transfer tx id.
      </p>

      <div className="onramp-grid">
        <div className="onramp-panel">
          <form className="onramp-form" onSubmit={submit}>
            <label>
              Payment Method
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {constants.paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>

            <label>
              Asset
              <select value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })}>
                {constants.assets.map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </label>

            <label>
              Fiat Currency
              <select value={form.fiatCurrency} onChange={(e) => setForm({ ...form, fiatCurrency: e.target.value })}>
                {constants.fiatCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </label>

            <label>
              Fiat Amount
              <input type="number" value={form.fiatAmount} onChange={(e) => setForm({ ...form, fiatAmount: e.target.value })} required />
            </label>

            <label>
              Fraud Profile
              <select value={form.fraudProfileId} onChange={(e) => setForm({ ...form, fraudProfileId: e.target.value })}>
                <option value="default">default</option>
                <option value="mcc_7011">mcc_7011</option>
              </select>
            </label>

            {form.paymentMethod === "card" ? (
              <>
                {btEnabled ? (
                  <div style={{ gridColumn: "span 2" }}>
                    <div className="onramp-note" style={{ margin: 0 }}>
                      Secure card entry (tokenized in browser). Device data: {bt.deviceData ? "yes" : "no"}.
                    </div>
                    {btStatusError ? <div className="onramp-error">{btStatusError}</div> : null}
                    {bt.error ? <div className="onramp-error">{bt.error}</div> : null}
                    <BraintreeCardFields ref={cardRef} bt={bt} amount={Number(form.fiatAmount || 0)} />
                  </div>
                ) : (
                  <>
                    <label>
                      Card Number
                      <input
                        value={form.cardNumber}
                        onChange={(e) => setForm({ ...form, cardNumber: formatCardNumberMasked(e.target.value) })}
                        required
                      />
                    </label>
                    <label>
                      Expiry Month
                      <select value={form.expiryMonth} onChange={(e) => setForm({ ...form, expiryMonth: e.target.value })} required>
                        {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                      </select>
                    </label>
                    <label>
                      Expiry Year
                      <select value={form.expiryYear} onChange={(e) => setForm({ ...form, expiryYear: e.target.value })} required>
                        {years.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
                      </select>
                    </label>
                    <label>CVV<input type="password" value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} required /></label>
                    <label>Holder Name<input value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} required /></label>
                    <div className="onramp-note" style={{ gridColumn: "span 2", margin: 0 }}>
                      Warning: manual card entry sends raw PAN to server (not PCI-safe). Enable Braintree to tokenize in-browser.
                    </div>
                  </>
                )}
              </>
            ) : null}

            {form.paymentMethod === "ach" ? (
              <>
                <label>Account Holder<input value={form.achAccountHolderName} onChange={(e) => setForm({ ...form, achAccountHolderName: e.target.value })} required /></label>
                <label>Routing Number<input value={form.routingNumber} onChange={(e) => setForm({ ...form, routingNumber: e.target.value })} required /></label>
                <label>Account Number<input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required /></label>
                <label>
                  Account Type
                  <select value={form.achAccountType} onChange={(e) => setForm({ ...form, achAccountType: e.target.value })}>
                    <option value="checking">checking</option>
                    <option value="savings">savings</option>
                  </select>
                </label>
                {btEnabled ? (
                  <>
                    <label>
                      Ownership
                      <select value={form.achOwnershipType} onChange={(e) => setForm({ ...form, achOwnershipType: e.target.value })}>
                        <option value="personal">personal</option>
                        <option value="business">business</option>
                      </select>
                    </label>
                    {form.achOwnershipType === "personal" ? (
                      <>
                        <label>First Name<input value={form.achFirstName} onChange={(e) => setForm({ ...form, achFirstName: e.target.value })} required /></label>
                        <label>Last Name<input value={form.achLastName} onChange={(e) => setForm({ ...form, achLastName: e.target.value })} required /></label>
                      </>
                    ) : (
                      <label>Business Name<input value={form.achBusinessName} onChange={(e) => setForm({ ...form, achBusinessName: e.target.value })} required /></label>
                    )}
                    <label>Street<input value={form.achBillingStreet} onChange={(e) => setForm({ ...form, achBillingStreet: e.target.value })} required /></label>
                    <label>City<input value={form.achBillingLocality} onChange={(e) => setForm({ ...form, achBillingLocality: e.target.value })} required /></label>
                    <label>State/Region<input value={form.achBillingRegion} onChange={(e) => setForm({ ...form, achBillingRegion: e.target.value })} required /></label>
                    <label>Postal Code<input value={form.achBillingPostal} onChange={(e) => setForm({ ...form, achBillingPostal: e.target.value })} required /></label>
                    <label>Country<input value={form.achBillingCountry} onChange={(e) => setForm({ ...form, achBillingCountry: e.target.value })} required /></label>
                    <div className="onramp-note" style={{ gridColumn: "span 2", margin: 0 }}>
                      ACH tokenization runs in-browser via Braintree (US bank accounts). Ensure your Braintree account has US Bank Account enabled.
                    </div>
                  </>
                ) : null}
              </>
            ) : null}

            {form.paymentMethod === "sepa" ? (
              <>
                <label>Account Holder<input value={form.sepaAccountHolderName} onChange={(e) => setForm({ ...form, sepaAccountHolderName: e.target.value })} required /></label>
                <label>IBAN<input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} required /></label>
                <label>Country Code<input value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} required /></label>
                {btEnabled ? (
                  <div className="onramp-note" style={{ gridColumn: "span 2", margin: 0 }}>
                    SEPA tokenization runs in-browser via Braintree. Ensure your Braintree account has SEPA Direct Debit enabled for EUR merchant account.
                  </div>
                ) : null}
              </>
            ) : null}

            <label style={{ gridColumn: "span 2" }}>
              Target Wallet Address
              <input value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} required />
            </label>

            <button type="button" onClick={runQuote}>Get Quote</button>
            <button type="submit">Create Buy + Transfer</button>
          </form>

          {quote ? (
            <div className="onramp-kv">
              <div>Rate: {quote.rate}</div>
              <div>Fee %: {quote.feePercent}</div>
              <div>Fee Amount: {quote.feeAmount}</div>
              <div>Net Fiat: {quote.netFiatAmount}</div>
              <div>Estimated Asset: {quote.estimatedAssetAmount}</div>
            </div>
          ) : null}

          {error ? <p className="onramp-error">{error}</p> : null}
        </div>

        <div className="onramp-panel onramp-table-wrap">
          <table className="onramp-table">
            <thead>
              <tr>
                <th>Order</th><th>Method</th><th>Provider</th><th>Asset</th><th>Fiat</th><th>Asset Amount</th><th>Wallet</th><th>Instrument</th><th>Pay Ref</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.paymentMethod}</td>
                  <td>{item.paymentProvider ?? "-"}</td>
                  <td>{item.asset}</td>
                  <td>{item.fiatAmount} {item.fiatCurrency}</td>
                  <td>{item.assetAmount}</td>
                  <td>{item.walletAddress}</td>
                  <td>{item.paymentDetails?.instrument ?? item.sourceCardMasked ?? "-"}</td>
                  <td className="mono">{item.paymentReference ?? "-"}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
