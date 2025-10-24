// src/app/page.tsx（适配 Next.js 15，正确获取 D1 数据库绑定）

import type { D1Database } from "@cloudflare/workers-types";

// 2. 页面组件（async 保留，通过 runtime() 获取 env，而非直接传参）
export default async function Home() { 
  try {
       const db = process.env.DATABASE as D1Database | undefined;

    if (!db) {
      throw new Error("D1 数据库未绑定，请检查 Cloudflare 配置（变量名：DATABASE）");
    }


    // 4. 执行数据库查询（和之前逻辑一致，用 env.DATABASE 调用）
    const result = await db.prepare(
      "SELECT * FROM table1" // 注意：替换 [table] 为你的实际表名（如 orders）
    ).run();

    // 5. 提取数据（D1 的 run() 结果中，rows 是实际数据数组）
    const orders = result.rows; // 类型断言，确保 TypeScript 不报错

    // 6. 渲染页面（和之前一致，修复后可正常显示）
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ color: "#333" }}>Recent Orders</h1>
        
        {orders.length === 0 ? (
          <p style={{ color: "#666" }}>No orders found in the database.</p>
        ) : (
          <div style={{ whiteSpace: "pre-wrap" }}>
            {/* 用 JSON.stringify 格式化显示，方便查看数据结构 */}
            {JSON.stringify(orders, null, 2)}
          </div>
        )}
      </div>
    );
  } catch (error) {
    // 捕获所有错误并显示（方便排查问题）
    return (
      <div style={{ padding: "20px", color: "#dc3545" }}>
        <h1>Error Loading Orders</h1>
        <p>Failed to fetch data: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }
}
