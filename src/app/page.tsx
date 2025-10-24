// src/app/page.tsx
// ✅ 适配 Next.js 15 + Cloudflare Pages + D1 数据库
// 运行环境：Edge（必须）
// 部署前确保 Pages 项目绑定了 D1 数据库变量名 DATABASE

export const runtime = "edge"; // 告诉 Next.js 使用 Edge Runtime（Cloudflare 可访问 env）

// 可选：简化 D1 类型声明（避免安装 @cloudflare/workers-types）
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<{ rows: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// Cloudflare Pages 会将绑定的 D1 注入 env
export default async function Home() {
  try {
    // ✅ 正确方式：通过 globalThis.env 获取 Cloudflare 环境（Edge runtime 提供）
    const env = (globalThis as any).env as { DATABASE: D1Database } | undefined;

    if (!env?.DATABASE) {
      throw new Error("D1 数据库未绑定，请在 Cloudflare Pages 设置中绑定 DATABASE。");
    }

    const db = env.DATABASE;

    // 执行 SQL 查询（替换 table1 为你的实际表名）
    const result = await db.prepare("SELECT * FROM table1").run();
    const rows = result.rows ?? [];

    // 页面渲染部分
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
    // 错误处理（防止 Cloudflare 页面崩溃）
    return (
      <div style={{ padding: "20px", color: "#dc3545", fontFamily: "sans-serif" }}>
        <h1>Error Loading Data</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
}
