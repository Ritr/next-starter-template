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
interface Env {
  DATABASE: D1Database;
  // 如果还有其他绑定（如 KV, R2），请在此处添加
}

/**
 * 尝试通过 globalThis 访问 D1 绑定。
 * 检查两种常见的 Cloudflare 注入模式: 
 * 1. globalThis.DATABASE (Next.js 适配器直接注入，如 OpenNext 早期版本)
 * 2. globalThis.env.DATABASE (标准 Cloudflare Worker 模式，更常见)
 */
function getDbBinding(): D1Database | undefined {
    
    // 1. 尝试直接访问 globalThis.DATABASE
    const directAccess = (globalThis as unknown as { DATABASE?: D1Database });
    console.log(directAccess);
    if (directAccess.DATABASE) {
        console.log("D1 Binding found via globalThis.DATABASE");
        return directAccess.DATABASE;
    }

    // 2. 尝试通过 globalThis.env 访问 DATABASE
    const envAccess = (globalThis as unknown as { env?: Env });
    if (envAccess.env && envAccess.env.DATABASE) {
        console.log("D1 Binding found via globalThis.env.DATABASE");
        return envAccess.env.DATABASE;
    }
    
    console.warn("D1 Binding not found in either globalThis.DATABASE or globalThis.env.DATABASE.");
    return undefined;
}


// ✅ 恢复为 Next.js App Router 的标准 GET 函数签名
export async function GET() {
  try {
    // 1. 尝试获取 D1 数据库实例
    const db = getDbBinding();

    // 检查绑定是否存在
    if (!db) {
      // 抛出新的错误，明确指出是通过 globalThis 访问失败
      throw new Error("D1 数据库未找到。请确认 Cloudflare Pages Bindings 的变量名精确为 'DATABASE'，并确保项目已启用 Edge/Serverless Functions。");
    }

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
