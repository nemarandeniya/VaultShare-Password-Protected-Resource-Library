// src/authCheck.js

// export async function checkAuth() {

//     const hostname = window.location.hostname;

//     const isLocal =
//         hostname.includes("localhost") || hostname.includes("127.");


//     const apiBase = isLocal
//         ? "http://localhost:8000/api"
//         : "https://gvfyu/api";


//     const portalBase = isLocal
//         ? "http://localhost:5173"
//         : "https://www.gmnyhm.com";


//     try {

//         const res = await fetch(`${apiBase}/auth/me`, {
//             credentials: "include",
//         });


//         if (!res.ok) {

//             const current = encodeURIComponent(window.location.href);

//             window.location.href =
//                 `${portalBase}/?redirect=${current}`;

//             return false;
//         }


//         const user = await res.json();


//         console.log("✅ Authenticated user:", user);


//         return {

//             authorized: true,

//             userId: user.id,

//             firstName: user.first_name,

//             lastName: user.last_name,

//             email: user.email || "",


//             // Admin privilege from backend
//             isAdmin:
//                 user.is_admin === 1 ||
//                 user.is_admin === "1" ||
//                 user.is_admin === true,


//             canUpdateData:
//                 user.can_update_data === 1 ||
//                 user.can_update_data === "1" ||
//                 user.can_update_data === true,


//             canUploadMaterial:
//                 user.can_upload_material === 1 ||
//                 user.can_upload_material === "1" ||
//                 user.can_upload_material === true

//         };


//     } catch (err) {

//         console.error("❌ Auth check failed:", err);

//         const current = encodeURIComponent(window.location.href);

//         window.location.href =
//             `${portalBase}/?redirect=${current}`;

//         return false;
//     }
// }
export async function checkAuth() {

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("No token found");
            return null;
        }
        const res = await fetch("http://localhost:8000/auth/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });


        if (!res.ok) {
            console.log("Auth failed");
            return null;
        }


        const user = await res.json();

        console.log("CHECK AUTH RESPONSE:", user);


        return {
            authorized: true,

            userId: user.id,

            username: user.username,

            isAdmin: user.is_admin === 1,

            canUpdateData: true,

            canUploadMaterial: true
        };
        // return {
        //     authorized: true,

        //     userId: user.id,

        //     firstName: user.first_name,
        //     lastName: user.last_name,

        //     email: user.email,

        //     isAdmin: user.is_admin === 1,

        //     canUpdateData: user.can_update_data === 1,

        //     canUploadMaterial: user.can_upload_material === 1
        // };


    } catch (error) {

        console.log("AUTH ERROR:", error);
        return null;

    }
}

export async function logout() {

    const hostname = window.location.hostname;

    const isLocal =
        hostname.includes("localhost") || hostname.includes("127.");


    const apiBase = isLocal
        ? "http://localhost:8000/api"
        : "https://gvfyu/api";


    const portalBase = isLocal
        ? "http://localhost:5173"
        : "https://www.gmnyhm.com";


    try {

        await fetch(`${apiBase}/auth/logout`, {

            method: "POST",

            credentials: "include",

        });


    } catch (err) {

        console.error("❌ Logout request failed:", err);

    }
    finally {

        window.location.href = portalBase;

    }
}