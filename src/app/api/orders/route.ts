// src/app/api/order/route.ts
// 强制动态渲染，确保此路由不会被静态优化，并依赖部署环境配置运行为 Edge Function。
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    // 1. 直接从注入的 'env' 参数中访问 D1 数据库实例
    const db = process.env.DATABASE;
    // 检查绑定是否存在（虽然在 TypeScript 中 env.DATABASE 保证存在，
    // 但在运行时如果未配置，它可能为 undefined 或 null）
    if (!db) {
      throw new Error(JSON.stringify(process));
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
