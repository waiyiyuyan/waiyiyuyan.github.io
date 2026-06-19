---
title: Imgur 图床双 Cloudflare Worker 部署教学文档
date: 2026-06-15 23:17:14
tags: 图床
categories: Cloudflare Worker
---

- 前端：纯静态 HTML/CSS/JS，托管 GitHub + Cloudflare Pages，仅做交互界面；**彻底移除浏览器localStorage本地存储，图片记录全部云端持久化**；
- 后端：2 套独立 Cloudflare Worker，分别负责「图片上传至 Imgur + D1云端入库」「图片/视频代理回显（解决国内访问、跨域、视频强制下载问题）」；
- 产出：一键复制标准 Hexo Markdown 图片链接，直接粘贴博客使用。

<!-- more -->

## 一、整体架构说明
### 1. 三大模块分工
1. **前端静态站点（客户端，无后端逻辑）**
   存放地址：GitHub 仓库 `imgur-bed`，Cloudflare Pages 自动构建托管。[github 仓库地址](https://github.com/waiyiyuyan/imgur-bed)
   功能：图片拖拽/选择上传、**云端分页瀑布流（每次加载10张，无限滚动加载更多）**、大图预览、下载图片、复制 Markdown 外链。
   无密钥、无跨域配置，仅填写两个 Worker 访问域名即可完成联通；**不再读写浏览器本地缓存，所有历史图片从D1数据库拉取**。

2. **上传 Worker（后端接口服务，新增D1数据库存储能力）**
   功能：接收前端二进制图片文件，转发 Imgur 官方上传 API，返回 Imgur 原图直链；**上传成功自动将文件名、原图链接写入Cloudflare D1数据库持久保存**；新增 `/listMedia` 分页接口，供前端拉取云端全部图片记录；
   内置全局跨域放行，任意前端域名均可调用；
   唯一需要手动配置：Imgur 官方 `Client ID`；**需要绑定Cloudflare D1数据库**。

3. **资源代理回显 Worker（后端资源中转服务）**
   功能：中转 Imgur 图片/视频资源，解决国内加载慢、跨域报错、MP4 视频强制下载弹窗；
   自带 24h 浏览器缓存，减轻 Imgur 访问压力；
   无需密钥、无需绑定D1，开箱即用，自动区分图片/视频处理头部信息。

### 2. 完整数据流
1. 用户在前端页面上传图片 → 前端 POST 请求**上传 Worker**；
2. 上传 Worker 携带 Imgur ClientID 调用 Imgur API，上传图片并获取原图直链 `https://i.imgur.com/xxx.jpg`；
3. **上传Worker自动将文件名、原图链接存入D1云端数据库**；
4. 前端拿到原图链接，拼接**代理回显 Worker** 地址生成可正常访问的外链，直接追加到页面顶部展示；
5. 页面初始化/滚动到底部：前端 GET 请求上传Worker `/listMedia` 分页接口，从D1数据库拉取图片列表；
6. 列表展示：拼接 `xxxm.jpg` 中等缩略图代理地址，加快列表渲染；
7. 大图预览、下载、Markdown 复制：使用原图完整代理地址；
8. Markdown 格式：`![图片名](https://你的代理域名/?url=https://i.imgur.com/xxx.jpg)`，直接粘贴 Hexo 博客。

## 二、部署前置准备
1. Cloudflare 账号（用于创建 Worker、Pages、绑定自定义域名、**创建D1 SQL数据库**）；
2. Imgur 账号，创建应用获取 `Client ID`（上传 Worker 必备, imgur 账号不是必须的，去imgur 上传一张照片，通过抓包，获取上传地址，地址内自带 Client ID）；
3. GitHub 账号（存放前端静态代码仓库）；
4. 自有域名（用于给 Worker、Pages 绑定自定义二级域名）。

## 三、后端 Cloudflare Worker 部署教程
### 模块 1：上传 Worker（Imgur 文件上传接口 + D1数据库读写）
#### 前置额外操作：创建并绑定D1数据库
1. Cloudflare后台 → 计算&网络 → D1 SQL数据库 → 创建数据库，自定义库名（如`img-bed-storage`）；
2. 进入数据库「控制台」页面，执行建表SQL：
```sql
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rawUrl TEXT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_time ON media(create_time DESC);
```
3. 返回上传Worker详情页 → 设置 → D1数据库绑定：
   - 变量名称固定填写：`DB`
   - 下拉选中刚刚创建的D1数据库，保存并部署Worker。

#### 1. Worker 完整源码（改造后，新增入库逻辑 + 分页接口）
```javascript
export default {
  async fetch(request, env) {
    // ==========【必须手动修改配置项】=============
    const CLIENT_ID = "此处替换为你自己的Imgur Client ID";
    // ============================================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // 处理跨域预检 OPTIONS 请求
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const urlObj = new URL(request.url);
    // 新增接口：GET /listMedia 分页读取云端图片列表
    if (request.method === "GET" && urlObj.pathname === "/listMedia") {
      try {
        const cursor = urlObj.searchParams.get("cursor") || "";
        let sql, stmt;
        if (!cursor) {
          sql = "SELECT * FROM media ORDER BY id DESC LIMIT 10";
          stmt = env.DB.prepare(sql);
        } else {
          sql = "SELECT * FROM media WHERE id < ? ORDER BY id DESC LIMIT 10";
          stmt = env.DB.prepare(sql).bind(cursor);
        }
        const { results } = await stmt.all();
        const lastCursor = results.length > 0 ? results[results.length - 1].id : "";
        return new Response(
          JSON.stringify({
            list: results,
            lastCursor,
            hasMore: results.length === 10
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, msg: "读取列表失败：" + err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 仅允许 POST 上传请求
    if (request.method !== "POST") {
      return new Response("Only POST / GET allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const filename = urlObj.searchParams.get("filename") || `file_${Date.now()}`;
      const blob = await request.blob();
      const mimeType = blob.type;

      const formData = new FormData();
      // 区分图片/视频字段上传 Imgur
      if (mimeType.startsWith("image/")) {
        formData.append("image", blob, filename);
      } else if (mimeType.startsWith("video/")) {
        formData.append("video", blob, filename);
      } else {
        formData.append("image", blob, filename);
      }
      formData.append("type", "file");

      // 请求 Imgur 上传接口
      const res = await fetch(`https://api.imgur.com/3/upload?client_id=${CLIENT_ID}`, {
        method: "POST",
        body: formData
      });
      const resData = await res.json();

      if (!resData.success) {
        return new Response(
          JSON.stringify({ success: false, msg: resData.data?.error || "上传失败" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rawLink = resData.data.link;
      // 新增逻辑：上传成功自动写入D1数据库持久保存
      await env.DB.prepare(`
        INSERT INTO media(name, rawUrl) VALUES(?,?)
      `).bind(filename, rawLink).run();

      // 返回原图直链、视频转码状态
      return new Response(
        JSON.stringify({
          success: true,
          link: rawLink,
          isProcessing: resData.data.processing?.status === "pending"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, msg: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
};
```
#### 2. 手动修改标注
1. 仅一处必须替换：代码顶部 `CLIENT_ID`，填入自己 Imgur 应用密钥；
2. **必须完成D1数据库绑定操作**，否则调用接口会报运行时错误；
3. 接口新增 `GET` 请求支持，用于分页拉取图片列表。

#### 3. 接口访问规范
1. 上传文件：`https://你的上传Worker域名/?filename=自定义文件名`，POST请求，请求体为图片二进制 Blob。
2. 分页拉取图片列表：`https://你的上传Worker域名/listMedia?cursor=游标值`，GET请求；不传cursor读取最新10条。

#### 4. 跨域说明
内置 `Access-Control-Allow-Origin: *`，所有前端域名均可跨域调用，无需额外配置。

### 模块 2：资源代理回显 Worker（图片/视频中转）
#### 1. Worker 完整源码
```javascript
export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400" // 资源缓存24小时
    };

    // 跨域预检处理
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    // 仅允许 GET 资源加载
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const mediaUrl = url.searchParams.get("url");
    // 仅允许代理 Imgur 官方资源
    if (!mediaUrl || !mediaUrl.startsWith("https://i.imgur.com/")) {
      return new Response("Invalid URL", { status: 400, headers: corsHeaders });
    }

    try {
      const res = await fetch(mediaUrl, {
        headers: {
          "User-Agent": request.headers.get("User-Agent") || ""
        }
      });

      const newHeaders = new Headers(res.headers);
      const lowerUrl = mediaUrl.toLowerCase();

      // 视频专属修复：移除强制下载头、修正MIME、支持拖拽进度条
      if (lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".webm")) {
        newHeaders.delete("Content-Disposition");
        newHeaders.delete("content-disposition");
        newHeaders.set("Content-Type", lowerUrl.endsWith(".mp4") ? "video/mp4" : "video/webm");
        newHeaders.set("Accept-Ranges", "bytes");
      }

      // 注入跨域响应头
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

      return new Response(res.body, {
        status: res.status,
        headers: newHeaders
      });
    } catch (err) {
      return new Response("Media load failed", { status: 502, headers: corsHeaders });
    }
  }
};
```
#### 2. 手动修改标注
无任何密钥、配置需要手动修改，直接复制使用；**无需绑定D1数据库**。
#### 3. 资源访问规范
```
# 原图（预览/下载/Markdown外链）
https://你的代理域名/?url=https://i.imgur.com/xxxx.jpg
# 中等缩略图（前端列表渲染，体积更小）
https://你的代理域名/?url=https://i.imgur.com/xxxxm.jpg
```
#### 4. 核心功能
1. 全局跨域放行，前端图片无跨域报错；
2. 24 小时静态资源缓存，重复访问加速；
3. MP4/WebM 视频修复：取消强制下载、支持播放器拖拽进度；
4. 仅中转 Imgur 官方域名资源，防止恶意代理外部链接。

### 3. Worker 自定义域名绑定（后端 Cloudflare 操作）
1. 进入 Cloudflare 后台 → Workers & Pages；
2. 分别打开两个 Worker → 设置 → 自定义域；
3. 分别绑定二级域名：
   - 上传 Worker：`imgurup.你的域名.com` 这个域名自定义，我这么写是举例
   - 代理回显 Worker：`imgvideop.你的域名.com` 这个域名自定义，我这么写是举例
> 域名配置属于**后端 Worker 操作**，前端页面无域名解析配置权限，仅填写访问地址。

## 四、前端静态页面部署（GitHub + Cloudflare Pages）
### 1. 前端代码存放仓库
仓库名：`imgur-bed`，托管 GitHub，文件结构：
```
imgur-bed/
├─ index.html   # 主页面布局
├─ style.css    # 样式
└─ main.js      # 交互逻辑（核心配置在此文件）
```
### 2. 前端联通核心配置（唯一手动修改处）
打开 `main.js`，顶部域名常量替换为你部署好的两个 Worker 域名：
```javascript
// =====================【前端必须手动修改】Worker访问域名=====================
const UPLOAD_WORKER = "https://imgurup.你的域名.com";
const PROXY_WORKER = "https://imgvideop.你的域名.com";
// ==========================================================================
```
#### 关键区分
1. 密钥、跨域、缓存全部在后端 Worker 代码内，**前端不存放任何隐私密钥**；
2. 前端仅填写两个访问域名，即可完成上传、预览全流程联通；
3. **完全移除localStorage读写逻辑，页面加载自动请求后端分页接口拉取云端数据**；
4. 内置无限滚动分页加载逻辑，每次加载10张图片，无本地存储80张上限限制。

### 3. Cloudflare Pages 部署配置参数（对应你截图）
关联 GitHub 仓库 `imgur-bed` 后，按以下填写：
| 配置项 | 填写内容 | 说明 |
|--------|----------|------|
| Git 帐户 | 你的 GitHub 用户名 | 自动识别无需修改 |
| 存储库 | imgur-bed | 自动识别无需修改 |
| 生产分支 | main | 默认主分支 |
| 框架预设 | 无 | 纯静态 HTML，无打包框架 |
| 构建命令 | exit 0 | 无需编译打包，直接跳过构建 |
| 构建输出目录 | / | 仓库根目录为网站入口 |

### 4. Pages 自定义域名配置（前端站点访问域名）
Cloudflare Pages → 项目设置 → 自定义域，绑定图床网页访问域名，例如 `img-bed.你的域名.com`。
> 此为前端站点域名，和两个 Worker 后端域名相互独立，分开配置。

## 五、前后端配置修改区分总表（教学重点）
| 配置项目 | 修改位置 | 是否手动修改 | 归属端 |
|----------|----------|--------------|--------|
| Imgur Client ID | 上传 Worker 代码顶部 | ✅ 必须修改 | 后端 Worker |
| D1数据库绑定 | 上传Worker设置页面 | ✅ 必须绑定 | 后端 Worker |
| CORS 跨域放行规则 | 两套 Worker 内置代码 | ❌ 无需修改 | 后端 Worker |
| 图片缓存时长 max-age | 代理回显 Worker | ❌ 默认24h，按需调整 | 后端 Worker |
| 上传 Worker 访问域名 | 前端 main.js 常量 | ✅ 替换自有域名 | 前端静态页面 |
| 代理回显 Worker 访问域名 | 前端 main.js 常量 | ✅ 替换自有域名 | 前端静态页面 |
| 图床网页访问域名 | Cloudflare Pages 自定义域 | ✅ 部署绑定 | 前端静态页面 |
| Worker 二级访问域名 | Cloudflare Workers 自定义域 | ✅ 部署绑定 | 后端 Worker |

## 六、完整部署操作顺序（标准教学流程）
1. Cloudflare后台创建D1数据库，执行建表SQL；
2. Cloudflare Workers 创建两个独立 Worker，分别粘贴上传、代理两段改造后源码；
3. 修改上传 Worker 内 `CLIENT_ID` 为自己 Imgur 密钥，**绑定D1数据库**，保存部署；
4. 为两个 Worker 绑定自定义二级域名（后端操作）；
5. GitHub 创建 `imgur-bed` 仓库，上传 `index.html` / `style.css` / **改造后无localStorage的main.js**；
6. 修改前端 `main.js` 内两个 Worker 域名常量，提交代码至 GitHub；
7. Cloudflare Pages 关联 GitHub `imgur-bed` 仓库，按表格填写构建参数，完成部署；
8. 为 Pages 项目绑定前端站点域名；
9. 访问前端图床页面，测试图片上传、云端分页瀑布流预览、下载、复制 Markdown；
10. 复制 Markdown 链接粘贴至 Hexo `.md` 博客文章，验证图片正常加载。

## 七、旧本地历史数据迁移说明
改造后前端不再读取浏览器localStorage，旧域名本地缓存数据无法直接导入新页面，两种迁移方案：
1. **方案1（推荐，零代码前端操作）**
   Cloudflare后台进入D1数据库查询页面，执行批量INSERT SQL，将旧本地数组一次性写入云端，刷新页面即可全部加载；
2. **方案2（前端控制台批量导入）**
   给上传Worker新增 `/insertMedia` 单条插入接口，在前端控制台循环请求接口逐条写入D1。

## 八、性能优化说明（内置全部优化，无需额外改动）
1. 前端瀑布流：
   - `loading="lazy"` 原生图片懒加载，视口外图片不发起网络请求；
   - 分页加载，每次仅渲染10张DOM，上万张图片滚动无卡顿；
   - 列表使用 Imgur `m` 中等缩略图，大幅降低图片体积，提升加载速度；
   - **移除本地存储容量限制，所有数据永久保存在云端D1，换域名/换设备/清缓存不会丢失图片记录**。
2. 后端上传Worker：
   - 游标分页查询，搭配数据库时间索引，海量图片查询秒返回；
   - 上传同步入库，无需前端额外提交存储请求。
3. 后端代理 Worker：
   - 24h 静态资源缓存，重复访问直接读取浏览器本地缓存；
   - 自动修复视频资源响应头，兼容网页播放器。

## 九、常见故障排查（教学答疑）
1. 上传图片报错
   - 排查：上传 Worker `CLIENT_ID` 是否填写正确，Imgur 应用是否开启上传权限；D1数据库是否完成绑定；
2. 前端页面打开显示「暂无文件」
   - 排查：
     ① D1数据库为空，无任何上传记录；
     ② 前端`UPLOAD_WORKER`域名填写错误，接口请求404；
     ③ 上传Worker跨域头缺少`GET`方法；
3. 前端图片空白无法加载
   - 排查：前端 `main.js` 代理域名填写错误、Worker 自定义域名未正确绑定；
4. 控制台跨域报错
   - 排查：两套 Worker 源码完整复制，不可删除 `corsHeaders` 跨域配置；
5. MP4 视频点开直接下载，无法网页预览
   - 排查：确认使用代理 Worker 中转链接，而非直接使用 Imgur 原图地址；
6. 更换前端自定义域名后历史图片消失
   - 排查：改造后数据存在云端D1，不会消失；若空白说明接口请求失败，检查上传Worker域名配置。

## 十、补充说明
1. 前端页面完全开源存放 GitHub，可自由修改样式、交互逻辑；
2. **上传Worker新增D1持久化存储，所有上传图片记录云端永久留存**；资源代理Worker无状态，仅做转发、代理中转；
3. 所有跨域、安全、缓存规则均封装在后端，前端无敏感配置，分发、分享前端仓库不会泄露 Imgur 密钥；
4. 旧版本地存储架构存在5MB容量上限、换域名丢数据、多设备不同步缺陷，改造D1云端存储后彻底根治全部问题。