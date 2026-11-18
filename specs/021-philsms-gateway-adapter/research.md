# Research: PhilSMS Gateway Adapter & GSM-7 Telecom Encoding

**Feature Key**: `ARL-24`  
**Feature Slug**: `021-philsms-gateway-adapter`  

---

## 1. GSM-7 vs. UCS-2 Telecom Encoding

### 1.1 Technical Background
Mobile telecom networks (Smart, Globe, DITO in the Philippines) route SMS through Short Message Service Centers (SMSC) that bill based on character encoding:
- **GSM 03.38 (GSM-7)**: 7-bit character set representing basic Latin characters, digits, common punctuation, and a limited set of accented characters. Standard payload capacity is 140 octets:
  - 140 octets $\times$ 8 bits / 7 bits = **160 characters** for single messages.
  - Multi-part concatenated SMS requires a 6-octet User Data Header (UDH), leaving 134 octets $\rightarrow$ **153 characters** per segment.
- **UCS-2 (UTF-16)**: 16-bit encoding required when any character in the message is not found in the GSM-7 alphabet or GSM-7 extension table.
  - 140 octets / 2 octets = **70 characters** for single messages.
  - Multi-part concatenated SMS leaves 134 octets $\rightarrow$ **67 characters** per segment.

### 1.2 The Philippine Peso Symbol (`₱`) Problem
- The Unicode character `₱` is `U+20B1` (Philippine Peso Sign).
- Neither `U+20B1` nor common word-processor punctuation (curly double quotes `“ ”`, curly single quotes `‘ ’`, em-dash `—`, en-dash `–`) exist in GSM-7.
- If a message text contains `₱1,250.00`, the SMS gateway automatically encodes the entire message in UCS-2.
- A standard 115-character reminder costs 2 credits instead of 1 credit.
- **Solution**: Normalizing `\u20B1` to `PHP ` ensures GSM-7 compliance and reduces telecom costs by 50% on all currency-bearing reminders.

### 1.3 GSM-7 Character Set Reference
The basic GSM 7-bit character set includes:
- Letters: `A-Z`, `a-z`
- Digits: `0-9`
- Basic punctuation: `! " # $ % & ' ( ) * + , - . / : ; < = > ? @ _`
- Greek capitals: `Δ Φ Γ Λ Ω Π Ψ Σ Θ Ξ`
- Accented Latin: `¡ ¿ £ ¥ § ä ö ñ ü à è é ù ì ò`
- Extension characters (escaped with `\x1B`): `^ { } \ [ ~ ] | €`

Characters outside this set trigger UCS-2 unless sanitized.

---

## 2. PhilSMS REST API v3 Integration

### 2.1 API Endpoint Structure
- Base URL: `https://app.philsms.com/api/v3`
- Endpoint: `POST /sms/send`
- Auth: HTTP Authorization header with `Bearer <token>`
- Content-Type: `application/json`
- Accept: `application/json`

### 2.2 Payload Structure
```json
{
  "recipient": "639171234567",
  "sender_id": "PhilSMS",
  "type": "plain",
  "message": "ARLQ Alert: ..."
}
```

### 2.3 Response Structure
- Success:
```json
{
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "uid": "648a123f4b5c6",
    "to": "639171234567",
    "message": "...",
    "cost": 1,
    "status": "sent"
  }
}
```
- Error:
```json
{
  "status": "error",
  "message": "Insufficient credit balance"
}
```

---

## 3. Philippine Phone Number Canonicalization

### 3.1 Accepted Inputs
- National 11-digit: `09XXXXXXXXX`
- International E.164 with `+`: `+639XXXXXXXXX`
- International without `+`: `639XXXXXXXXX`
- Input with formatting characters: `0917 123 4567`, `(0917) 123-4567`, `+63-917-123-4567`

### 3.2 Canonical Output for PhilSMS
- PhilSMS v3 requires `639XXXXXXXXX` (12 digits, leading `639`).
- Conversion rule:
  1. Strip all `[^\d+]` characters.
  2. If starts with `+639`, strip `+` $\rightarrow$ `639XXXXXXXXX`.
  3. If starts with `09`, replace `0` with `63` $\rightarrow$ `639XXXXXXXXX`.
  4. If starts with `639`, retain $\rightarrow$ `639XXXXXXXXX`.
  5. Validate length is exactly 12 digits and matches `/^639\d{9}$/`.

---

## 4. Environment Secret Management

- Secrets are server-only.
- In Next.js App Router, any environment variable without `NEXT_PUBLIC_` is omitted from client bundles.
- Adapter files must reside in `lib/services/` and must never import or be imported into client components (`'use client'`).
- Development and test runs default to `PHILSMS_MOCK_DISPATCH="true"` or fallback when `PHILSMS_API_TOKEN` is unset.
