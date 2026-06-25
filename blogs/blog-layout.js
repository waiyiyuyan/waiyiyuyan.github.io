// ==========================================================================
// 🚀 优先注入Win95全局CSS，再渲染页面，杜绝样式延迟失效
// ==========================================================================
(function() {
    // 1. 最先执行：注入复古Win95样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/retro-theme.css';
    // CSS加载完成后再渲染，保证样式不闪烁
    link.onload = () => {
        initArticleRender();
    };
    link.onerror = () => {
        console.error('retro-theme.css 加载失败，请检查文件路径');
        initArticleRender();
    };
    document.head.appendChild(link);

    // 2. 自动清理旧的冲突样式（如果有blog-style.css自动删掉，避免覆盖）
    document.querySelectorAll('link[href*="blog-style.css"]').forEach(el => el.remove());

    // 3. 注入导航JS（任务栏/开始菜单）
    const script = document.createElement('script');
    script.src = '/nav.js';
    script.async = true;
    document.body.appendChild(script);
})();

// 页面渲染主逻辑：自动提取博文内容，生成Win95窗口
function initArticleRender() {
    // ========== 智能提取博文内容：兼容两种结构 ==========
    let title = document.title;
    let date = "";
    let tag = "";
    let cat = "";
    let bodyContent = "";

    // 优先识别 #post-data 结构（兼容旧格式）
    const postData = document.getElementById("post-data");
    if (postData) {
        title = postData.querySelector("h1")?.innerHTML || document.title;
        date = postData.getAttribute("data-date") || "";
        tag = postData.getAttribute("data-tag") || "";
        cat = postData.getAttribute("data-cat") || "";
        bodyContent = postData.querySelector(".content")?.innerHTML || "";
    } 
    // 自动识别你现在的手写结构：.article-container
    else {
        const articleBox = document.querySelector(".article-container");
        if (!articleBox) return; // 找不到正文容器直接退出

        title = articleBox.querySelector("h1")?.innerHTML || document.title;
        // 从meta行里提取日期、标签、分类
        const metaEl = articleBox.querySelector(".meta");
        if (metaEl) {
            const dateText = metaEl.querySelector("span:nth-child(1)")?.innerText || "";
            date = dateText.replace(/📅.*时间：/, "").trim();
            const tagText = metaEl.querySelector(".tag-badge")?.innerText || "";
            tag = tagText;
            const catText = metaEl.querySelector(".cat-badge")?.innerText || "";
            cat = catText;
        }
        bodyContent = articleBox.querySelector(".content")?.innerHTML || "";
    }

    // ========== 清空页面原有内容，只保留脚本 ==========
    Array.from(document.body.children).forEach(el => {
        if (el.tagName !== 'SCRIPT') el.remove();
    });

    // ========== 生成标准Win95 TEXT_VIEWER窗口 ==========
    const finalLayout = `
        <div class="back-btn-wrap">
            <a href="/blogs/" class="btn back-btn">返回文章列表(B)</a>
        </div>
        
        <div class="article-container retro-card">
            <div class="retro-title-bar">
                <h1>📄 TEXT_VIEWER.EXE - ${title}</h1>
            </div>
            
            <div class="meta">
                <span>📅 属性时间: ${date}</span>
                <span>🏷️ 标记: <span class="tag-badge">${tag}</span></span>
                <span>📂 路径: <span class="cat-badge">${cat}</span></span>
            </div>
            
            <div class="content retro-list-container">
                ${bodyContent}
            </div>
        </div>
    `;

    // 插入渲染容器
    const articleWrapper = document.createElement("div");
    articleWrapper.id = "article-wrapper";
    document.body.appendChild(articleWrapper);
    articleWrapper.innerHTML = finalLayout;

    // ========== 附加功能：代码块复制按钮 ==========
    const contentDiv = articleWrapper.querySelector(".content");
    if (!contentDiv) return;
    const preBlocks = contentDiv.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
        pre.style.position = "relative";
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn copy-code-btn";
        copyBtn.innerText = "复制(C)";
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
                setTimeout(() => copyBtn.innerText = "复制(C)", 2000);
            }).catch(err => {
                copyBtn.innerText = "失败";
            });
        });
    });

    // ========== 附加功能：图片复古边框 ==========
    const images = contentDiv.querySelectorAll("img");
    images.forEach((img) => {
        img.style.cursor = "zoom-in";
        img.style.border = "2px inset #fff";
        img.style.padding = "4px";
        img.style.background = "#d4d0c8";
        img.addEventListener("click", () => window.open(img.src, "_blank"));
    });
}
