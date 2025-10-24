// src/app/api/orders/route.ts
export const runtime = "edge"; // ✅ 在这里才能使用 Edge runtime
export const dynamic = "force-dynamic"; // 确保 Cloudflare 重新拉取数据

// 内联 D1 类型定义（可省略 @cloudflare/workers-types）
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<{ rows: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DATABASE: D1Database;
}

// ✅ Cloudflare Pages Edge Function 入口（req + env）
export async function GET(_req: Request, env: Env) {
  try {
    const result = await env.DATABASE.prepare("SELECT * FROM table1").run();
    const rows = result.rows ?? [];

    return Response.json({ success: true, rows });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
