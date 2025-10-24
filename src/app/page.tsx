// app/page.js（Next.js 13+ app 目录，默认是服务器组件，可直接查数据库）
import Image from "next/image";

// 1. 定义订单数据类型
type OrderRow = {
  Id: string;
  CustomerName: string;
  OrderDate: number;
};

// 2. 页面组件（直接在服务端查询数据，再渲染到页面）
export default async function Home({ env }) { // 注意：组件要加 async，且接收 env 参数
  try {
    // 3. 服务端查询 D1 数据库（直接调用 env.MY_DB，无需额外 API）
    const result = await env.DATABASE.prepare(
      "SELECT * FROM [table]"
    ).run();

    // 4. 提取数据库返回的行数据（D1 结果的 rows 属性是实际数据数组）
    const orders = result.rows;

    // 5. 直接渲染数据到页面
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ color: "#333" }}>Recent Orders</h1>
        
        {/* 无数据提示 */}
        {orders.length === 0 ? (
          <p style={{ color: "#666" }}>No orders found in the database.</p>
        ) : (
          // 表格展示数据
          <div>{orders.toString()}<div/>
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
