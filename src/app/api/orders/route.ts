// ✅ src/app/api/orders/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

// 内联类型定义，避免依赖 @cloudflare/workers-types
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<{ rows: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// ✅ 正确函数签名：Next.js 提供 context 参数
export async function GET(
  request: Request,
  context: { env: { DATABASE: D1Database } }
) {
  try {
    const db = context.env.DATABASE;
    if (!db) {
      throw new Error("D1 数据库未绑定（Cloudflare Pages 未设置 DATABASE）");
    }

    const result = await db.prepare("SELECT * FROM table1").run();
    const rows = result.rows ?? [];

    return Response.json({ success: true, rows });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
