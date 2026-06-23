// blog-layout.js
document.addEventListener("DOMContentLoaded", () => {
    // 找到文章的核心数据容器
    const postData = document.getElementById("post-data");
    if (!postData) return;

    // 1. 自动提取这篇博文特有的“变化数据”
    const title = postData.querySelector("h1")?.innerHTML || document.title;
    const date = postData.getAttribute("data-date") || "";
    const tag = postData.getAttribute("data-tag") || "";
    const cat = postData.getAttribute("data-cat") || "";
    const bodyContent = postData.querySelector(".content")?.innerHTML || "";

    // 2. 动态拼装原本那些“固定死”的 HTML 外壳结构
    const finalLayout = `
        <a href="/blogs/" class="back-btn">← 返回文章列表</a>
        <div class="article-container">
            <h1>${title}</h1>
            <div class="meta">
                <span>📅 发布时间：${date}</span>
                <span>🏷️ 标签：<span class="tag-badge">${tag}</span></span>
                <span>📂 分类：<span class="cat-badge">${cat}</span></span>
            </div>
            <div class="content">
                ${bodyContent}
            </div>
        </div>
    `;

    // 3. 将拼装好的完整精美渲染替换到页面上
    document.body.innerHTML = finalLayout;
});
