// src/authCheck.js

export async function checkAuth() {
    const hostname = window.location.hostname;
    const isLocal =
        hostname.includes("localhost") || hostname.includes("127.");

    // Flask backend
    const apiBase = isLocal
        ? "http://localhost:8000/api"
        : "https://gvfyu/api";

    // Main portal for login
    const portalBase = isLocal
        ? "http://localhost:5173"
        : "https://www.gmnyhm.com";

    // 🔹 If localhost, skip auth check and return dummy admin
    if (isLocal) {
        console.log("⚠️ Localhost detected: Skipping real auth check");
        return {
            authorized: true,
            userId: "999",
            firstName: "Local",
            lastName: "Developer",
            email: "dev@local.host",
            isAdmin: true,
            canUpdateData: true,
            canUploadMaterial: true,
        };
    }

    try {
        const res = await fetch(`${apiBase} / auth / me`, {
            credentials: "include", // include cookies/JWT from master app
        });

        if (!res.ok) {
            const current = encodeURIComponent(window.location.href);
            window.location.href = `${portalBase}/signin?redirect=${current}`;
            return false;
        }

        const user = await res.json();

        console.log("✅ Authenticated user:", user);

        return {
            authorized: true,

            // your backend returns: id
            userId: user.id,

            // backend returns: first_name, last_name
            firstName: user.first_name,
            lastName: user.last_name,

            email: user.email || "",

            // backend returns: is_admin = 1 or 0
            isAdmin: user.is_admin === 1 || user.is_admin === "1",
            canUpdateData: user.can_update_data === 1 || user.can_update_data === "1",
            canUploadMaterial: user.can_upload_material === 1 || user.can_upload_material === "1"
        };

    } catch (err) {
        console.error("❌ Auth check failed:", err);
        const current = encodeURIComponent(window.location.href);
        window.location.href = `${portalBase}/signin?redirect=${current}`;
        return false;
    }
}