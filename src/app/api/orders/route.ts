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
// Cloudflare Pages 适配器通常将 bindings 挂载到全局 Env 对象上。
// 这里我们定义一个 Env 接口来包含我们的 D1 绑定。
interface Env {
  DATABASE: D1Database;
  // 如果还有其他绑定（如 KV, R2），请在此处添加
}

/**
 * 帮助函数，用于安全地从 Cloudflare 运行时（globalThis）获取 Env 对象，
 * 兼容 globalThis.env 和直接挂载到 globalThis 两种模式。
 */
function getEnv(): Env | null {
  // 1. 尝试访问 globalThis.env (更标准的 Worker 模式)
  const globalEnv = (globalThis as unknown as { env?: Env }).env;
  if (globalEnv && globalEnv.DATABASE) {
    return globalEnv;
  }
  
  // 2. 尝试访问 globalThis 本身 (Next.js 适配器有时会这么做)
  // 我们直接依赖 globalThis.DATABASE 的类型断言
  const directAccess = (globalThis as unknown as { DATABASE?: D1Database });
  if (directAccess.DATABASE) {
      return { DATABASE: directAccess.DATABASE } as Env;
  }
  
  return null;
}

// ✅ 使用 `_request` 表示未使用变量，避免 ESLint 报错
export async function GET() {
  try {
    const env = getEnv();

    // 检查绑定是否存在
    if (!env || !env.DATABASE) {
      throw new Error("D1 数据库未绑定。请检查 Cloudflare Pages/Workers 的 'Bindings' 设置，变量名必须是 'DATABASE'。");
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
