// src/app/api/order/route.ts
// 强制动态渲染，确保此路由不会被静态优化，并依赖部署环境配置运行为 Edge Function。
export const dynamic = "force-dynamic";
// export const runtime = 'edge'; // 根据您的要求移除

// --- D1 接口类型定义 (为了避免依赖 @cloudflare/workers-types) ---
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  // all() 包含了 results 数组
  all<T = unknown>(): Promise<{ results: T[], success: boolean, count: number }>; 
  run<T = unknown>(): Promise<{ success: boolean, changes: number, lastRowId: number, rows?: T[] }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// --- Cloudflare 运行时环境全局类型声明 ---
// Cloudflare Pages 适配器通常将 bindings 挂载到 Env 对象上。
// 这里我们定义一个 Env 接口来包含我们的 D1 绑定。
interface Env {
  DATABASE: D1Database;
  // 如果还有其他绑定（如 KV, R2），请在此处添加
}

/**
 * Cloudflare 注入的运行时上下文对象，包含 env 属性
 */
interface CloudflareContext {
    env: Env;
    // 其他可能的属性如 waitUntil, passThroughOnException 等
}

// ✅ 使用 `_request` 表示未使用变量，避免 ESLint 报错
// 修正：直接通过 App Router 的第二个参数访问 Cloudflare 注入的上下文
export async function GET(
    _request: Request,
    context: CloudflareContext // 适配器注入的运行时上下文
) {
  try {
    console.log(_request)
    // 1. 直接从 context.env 访问 D1 绑定
    const env = context.env;

    // 检查绑定是否存在
    if (!env || !env.DATABASE) {
      // 抛出新的错误，帮助区分是全局访问失败还是 context 访问失败
      throw new Error("D1 数据库未通过 Context 访问成功。请再次检查 Cloudflare Pages 的 Bindings。");
    }

    const db = env.DATABASE;

    // 建议使用 all() 来获取查询结果
    // 注意：请将 'table1' 替换为您实际的表名
    const { results: rows } = await db.prepare("SELECT * FROM table1").all();
    
    // 返回 JSON 响应
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
