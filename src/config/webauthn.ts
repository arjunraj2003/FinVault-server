const DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:4173",
    "https://finvault-client.onrender.com",
];

export function webAuthnSettings(requestOrigin?: string) {
    const origins = process.env.WEBAUTHN_ORIGIN
        ? process.env.WEBAUTHN_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
        : DEFAULT_ORIGINS;

    const origin = requestOrigin && origins.includes(requestOrigin) ? requestOrigin : origins[0];
    const rpID = process.env.WEBAUTHN_RP_ID || new URL(origin).hostname;
    const expectedRPIDs = process.env.WEBAUTHN_RP_ID
        ? [process.env.WEBAUTHN_RP_ID]
        : [...new Set(origins.map((item) => new URL(item).hostname))];

    return {
        rpName: "FinVault",
        rpID,
        origins,
        expectedRPIDs,
    };
}
