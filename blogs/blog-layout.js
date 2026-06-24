// ==========================================================================
// 🚀 自动注入复古组件：无需修改每个 HTML 文件
// ==========================================================================
(function() {
    // 1. 注入 CSS 样式表 (确保页面有皮肤)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/retro-theme.css'; // 确保路径正确
    document.head.appendChild(link);

    // 2. 注入导航 JS (确保页面有任务栏)
    const script = document.createElement('script');
    script.src = '/nav.js'; // 确保路径正确
    script.async = true; // 异步加载，不阻塞渲染
    document.body.appendChild(script);
})();

document.addEventListener("DOMContentLoaded", () => {
    // 找到具体的原始博文数据节点
    const postData = document.getElementById("post-data");
    if (!postData) return;

    // 1. 自动提取博文特有数据
    const title = postData.querySelector("h1")?.innerHTML || document.title;
    const date = postData.getAttribute("data-date") || "";
    const tag = postData.getAttribute("data-tag") || "";
    const cat = postData.getAttribute("data-cat") || "";
    const bodyContent = postData.querySelector(".content")?.innerHTML || "";

    // 2. 🛠️ 动态拼装精美渲染外壳（全面融入 Windows 95 质感组件）
    const finalLayout = `
        <a href="/blogs/" class="btn back-btn" style="text-decoration: none; margin-bottom: 15px; margin-top: 60px; display: inline-block;">
            ⬅️ 返回文章列表(B)
        </a>
        
        <div class="article-container retro-card" style="padding: 24px; margin-top: 10px;">
            
            <div class="retro-title-bar" style="margin: -24px -24px 20px -24px; padding: 4px 8px;">
                <h1 style="font-size: 1.3rem; margin: 0; font-weight: bold;">📄 TEXT_VIEWER.EXE - ${title}</h1>
            </div>
            
            <div class="meta" style="color: #222; font-size: 0.85rem; border-bottom: 2px inset #fff; padding-bottom: 12px; margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; font-weight: bold;">
                <span>📅 属性时间: ${date}</span>
                <span>🏷️ 标记: <span class="tag-badge" style="background: #e0e0e0; color: #000; padding: 2px 6px; border: 1px inset #fff; font-size: 11px;">${tag}</span></span>
                <span>📂 路径: <span class="cat-badge" style="background: #e0e0e0; color: #000; padding: 2px 6px; border: 1px inset #fff; font-size: 11px;">${cat}</span></span>
            </div>
            
            <div class="content retro-list-container" style="padding: 16px; background: #ffffff; text-align: left;">
                ${bodyContent}
            </div>
        </div>
    `;

    // 3. ✨ 优雅替代：创建一个专属容器放置文章，绝不粗暴覆盖整个 body
    let articleWrapper = document.getElementById("article-wrapper");
    if (!articleWrapper) {
        articleWrapper = document.createElement("div");
        articleWrapper.id = "article-wrapper";
        document.body.appendChild(articleWrapper);
    }
    
    // 渲染文章，并隐藏原本的原始数据节点
    articleWrapper.innerHTML = finalLayout;
    postData.style.display = "none";

    // ==========================================================================
    // 4. 为新生成的图片和代码块注入交互逻辑
    // ==========================================================================
    const contentDiv = articleWrapper.querySelector(".content");
    if (!contentDiv) return;

    // --- 功能 A：为代码块(pre)动态注入“复制”按钮 ---
    const preBlocks = contentDiv.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
        pre.style.position = "relative";

        const copyBtn = document.createElement("button");
        // 🛠️ 这里的复制按钮同样穿上复古按钮的衣服 class="btn copy-code-btn"
        copyBtn.className = "btn copy-code-btn";
        copyBtn.innerText = "复制(C)";
        // 微调其在代码块右上方悬浮的位置与字体大小
        copyBtn.style.position = "absolute";
        copyBtn.style.top = "6px";
        copyBtn.style.right = "6px";
        copyBtn.style.padding = "2px 8px";
        copyBtn.style.fontSize = "11px";
        copyBtn.style.zIndex = "10";
        pre.appendChild(copyBtn);

        copyBtn.addEventListener("click", () => {
            const codeBlock = pre.querySelector("code");
            if (!codeBlock) return;

            navigator.clipboard.writeText(codeBlock.innerText).then(() => {
                copyBtn.innerText = "已复制！";
                
                setTimeout(() => {
                    copyBtn.innerText = "复制(C)";
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
        img.style.cursor = "zoom-in";
        // 🛠️ 给图片加一个像素风浅色内凹边框，使其融入文章页
        img.style.border = "2px inset #fff";
        img.style.padding = "4px";
        img.style.background = "#d4d0c8";
        
        img.addEventListener("click", () => {
            window.open(img.src, "_blank");
        });
    });
});
