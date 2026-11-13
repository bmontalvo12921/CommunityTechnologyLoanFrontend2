const isLocalFrontend = ["localhost", "127.0.0.1"].includes(
    window.location.hostname
);

const API_BASE_URL = isLocalFrontend
    ? "http://127.0.0.1:3020"
    : "https://inventory-api-1-lj9t.onrender.com";

const API_TENANT_ID = "eigen-it";
