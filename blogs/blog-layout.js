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

    // 2. 动态拼装精美渲染外壳
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

    // 3. ✨ 优雅替代：创建一个专属容器放置文章，绝不粗暴覆盖整个 body
    // 这样能够保证页面上的全局公共导航（nav.js 生成的内容）安全存活！
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
        copyBtn.className = "copy-code-btn";
        copyBtn.innerText = "复制";
        pre.appendChild(copyBtn);

        copyBtn.addEventListener("click", () => {
            const codeBlock = pre.querySelector("code");
            if (!codeBlock) return;

            navigator.clipboard.writeText(codeBlock.innerText).then(() => {
                copyBtn.innerText = "已复制！";
                copyBtn.classList.add("copied");
                
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
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => {
            window.open(img.src, "_blank");
        });
    });
});
