export const API_URL =
    typeof window !== "undefined"
        ? (process.env.NEXT_PUBLIC_API_URL || "https://apps-fsm.undip.ac.id/persuratan-pengantar-pkl-api")
        : (process.env.VITE_API_URL || "http://10.137.58.124:20062");
