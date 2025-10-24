// ✅ src/app/api/orders/route.ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

// 内联类型定义，避免依赖 @cloudflare/workers-types
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<{ rows?: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// ✅ 使用 `_request` 表示未使用变量，避免 ESLint 报错
export async function GET() {
  try {
    // ✅ 明确指定类型，不用 any
    const db = (globalThis as unknown as { DATABASE?: D1Database }).DATABASE;

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
