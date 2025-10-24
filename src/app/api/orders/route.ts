// src/app/api/order/route.ts
// 强制动态渲染，确保此路由不会被静态优化，并依赖部署环境配置运行为 Edge Function。
export const dynamic = "force-dynamic";

// --- D1 接口类型定义 (为了避免依赖 @cloudflare/workers-types) ---
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[], success: boolean, count: number }>; 
  run<T = unknown>(): Promise<{ success: boolean, changes: number, lastRowId: number, rows?: T[] }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// --- Cloudflare Worker Env 类型声明 ---
// 这是 Cloudflare Worker 运行时注入的 'env' 参数类型
interface Env {
  DATABASE: D1Database;
  // 如果还有其他绑定（如 KV, R2），请在此处添加
}

/**
 * 【最终修正】使用 Cloudflare Worker 标准签名。
 * 在 Cloudflare Pages/Workers 环境中，绑定（Bindings）通常作为第二个参数 'env' 注入。
 * 尽管 Next.js App Router 官方只定义了 request 参数，Cloudflare 适配器会注入 env。
 * 这是访问 D1 数据库最可靠的方式。
 */
export async function GET(_request: Request, env: Env) {
  console.log(_request);
  console.log(env);
  try {
    // 1. 直接从注入的 'env' 参数中访问 D1 数据库实例
    const db = env.DATABASE;

    // 检查绑定是否存在（虽然在 TypeScript 中 env.DATABASE 保证存在，
    // 但在运行时如果未配置，它可能为 undefined 或 null）
    if (!db) {
      // 抛出新的错误，明确指出是通过 env 参数访问失败
      throw new Error("D1 数据库未找到。请确认 Cloudflare Pages Bindings 的变量名精确为 'DATABASE'，并确保项目已正确部署为 Edge Function。");
    }

    // 2. 执行查询
    // 注意：请将 'table1' 替换为您实际的表名
    const { results: rows } = await db.prepare("SELECT * FROM table1").all();
    
    // 3. 返回 JSON 响应
    return Response.json({ success: true, rows });
  } catch (error) {
    console.error("D1 数据库查询错误:", error);
    
    return Response.json(
      {
        success: false,
        error: "Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
