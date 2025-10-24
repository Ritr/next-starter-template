// @ts-nocheck
export default async function Home() {
  try {
    // 调用 Cloudflare 上的 Edge API
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/orders`, {
      cache: "no-store", // 禁用缓存
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to load data");
    }

    const rows = data.rows as Record<string, unknown>[];

    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#333" }}>Recent Orders</h1>

        {rows.length === 0 ? (
          <p style={{ color: "#666" }}>No data found in the D1 database.</p>
        ) : (
          <pre style={{ background: "#f7f7f7", padding: "12px", borderRadius: "8px" }}>
            {JSON.stringify(rows, null, 2)}
          </pre>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div style={{ padding: "20px", color: "#dc3545", fontFamily: "sans-serif" }}>
        <h1>Error Loading Data</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
}
