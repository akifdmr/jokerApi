# paymentManager

## Braintree (PayPal) ödeme entegrasyonu

Bu repo’da `card`, `ach`, `sepa` onramp akışı için **browser-side tokenization** + server-side `transaction.sale` akışı eklendi.

- Server env: `server/.env.example` içindeki `BRAINTREE_*` alanlarını doldur.
- Fraud kuralları: `/fraud` sayfasından `profiles` + `rules` JSON’unu yönet (API: `GET/PUT /api/fraud/rules`).
- Onramp checkout: `/crypto-onramp` sayfası Braintree aktifse card/ACH/SEPA için nonce üretip `/api/onramp/orders`’a gönderir.

Notlar:
- MCC (örn. `7011`) **işlem bazında dinamik set edilemez**; genelde merchant account düzeyinde tanımlıdır. Bu repo’da bunun yerine `fraudProfileId` ile (örn. `default`, `mcc_7011`) daha sıkı risk profili seçebilirsin.
- Yüksek risk işlemler için öneri: `deviceData` + `3DS required` + `review` (settlement’e göndermeden) akışını kullan.
