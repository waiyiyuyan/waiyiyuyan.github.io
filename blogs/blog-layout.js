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

    // ==========================================================================
    // 4. 【新功能追加】在页面重写(innerHTML)完成后，立刻为图片和代码块注入交互逻辑
    // ==========================================================================
    
    // 获取刚刚渲染出来的最新内容区域
    const contentDiv = document.querySelector(".content");
    if (!contentDiv) return;

    // --- 功能 A：为代码块(pre)动态注入“复制”按钮 ---
    const preBlocks = contentDiv.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
        // 让 pre 拥有相对定位，方便复制按钮绝对定位在右上角
        pre.style.position = "relative";

        // 创建复制按钮
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-code-btn";
        copyBtn.innerText = "复制";
        pre.appendChild(copyBtn);

        // 点击复制的逻辑
        copyBtn.addEventListener("click", () => {
            const codeBlock = pre.querySelector("code");
            if (!codeBlock) return;

            // 提取代码纯文本并写入剪贴板
            navigator.clipboard.writeText(codeBlock.innerText).then(() => {
                copyBtn.innerText = "已复制！";
                copyBtn.classList.add("copied"); // 触发变绿的 CSS 样式
                
                // 2秒后恢复成初始状态
                setTimeout(() => {
                    copyBtn.innerText = "复制";
                    copyBtn.classList.remove("copied");
                }, 2000);
            }).catch(err => {
                console.error("复制失败: ", err);
                copyBtn.innerText = "失败";
            });
        });
    });

    // --- 功能 B：为正文图片注入“点击直接新标签页看原图” ---
    const images = contentDiv.querySelectorAll("img");
    images.forEach((img) => {
        // 让指针变成放大镜状态，提示用户此图可点
        img.style.cursor = "zoom-in";
        
        // 点击时，直接用新标签页调起图片的真实 URL 路径
        img.addEventListener("click", () => {
            window.open(img.src, "_blank");
        });
    });
});
