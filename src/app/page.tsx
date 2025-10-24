// src/app/page.tsx
export const runtime = "edge"; // 必须在 Cloudflare 环境下使用 Edge Runtime

// ✅ 简化 D1 类型定义（无需安装 @cloudflare/workers-types）
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<{ rows: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// ✅ 定义 Cloudflare 环境类型（安全访问 globalThis.env）
interface CloudflareEnv {
  DATABASE: D1Database;
}

// 让 TypeScript 知道 globalThis 上可能存在 env
declare global {
  // eslint-disable-next-line no-var
  var env: CloudflareEnv | undefined;
}

export default async function Home() {
  try {
    // ✅ 不再使用 any，而是显式类型检查
    const env: CloudflareEnv | undefined = globalThis.env;

    if (!env?.DATABASE) {
      throw new Error("D1 数据库未绑定，请在 Cloudflare Pages 设置中绑定 DATABASE。");
    }

    const db = env.DATABASE;
    const result = await db.prepare("SELECT * FROM table1").run();
    const rows = result.rows ?? [];

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
