// app/page.js（注意：若使用type关键字，文件需改为.page.tsx，或移除类型定义）
import Image from "next/image";

// 移除TypeScript类型定义（若文件为.js，不支持type关键字）
// 若要保留类型，需将文件重命名为page.tsx，并确保项目支持TypeScript

// 页面组件（直接在服务端查询数据，再渲染到页面）
export default async function Home({ env }) { // 注意：组件要加 async，且接收 env 参数
  try {
    // 服务端查询 D1 数据库
    const result = await env.DATABASE.prepare(
      "SELECT * FROM [table]" // 注意：[table]需替换为你的实际表名，避免SQL语法错误
    ).run();

    // 提取数据库返回的行数据
    const orders = result.rows;

    // 直接渲染数据到页面（修复JSX闭合标签错误）
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ color: "#333" }}>Recent Orders</h1>
        
        {/* 无数据提示 */}
        {orders.length === 0 ? (
          <p style={{ color: "#666" }}>No orders found in the database.</p>
        ) : (
          // 修复闭合标签：将<div/>改为</div>
          <div>{JSON.stringify(orders)}</div> 
          // 建议用JSON.stringify()显示数组，toString()会显示[object Object]
        )}
      </div>
    );
  } catch (error) {
    // 捕获数据库查询错误，在页面显示错误信息
    return (
      <div style={{ padding: "20px", color: "#dc3545" }}>
        <h1>Error Loading Orders</h1>
        <p>Failed to fetch data: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }
}
