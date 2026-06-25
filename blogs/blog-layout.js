// ==========================================================================
// 🚀 优先注入Win95全局CSS，再渲染页面，杜绝样式延迟失效
// ==========================================================================
(function() {
    // 1. 最先执行：注入复古Win95样式，优先加载，不等待DOM加载
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/retro-theme.css';
    // 等待CSS加载完成再执行页面渲染逻辑
    link.onload = () => {
        initArticleRender();
    };
    document.head.appendChild(link);

    // 2. 注入导航JS（任务栏/开始菜单）
    const script = document.createElement('script');
    script.src = '/nav.js';
    script.async = true;
    document.body.appendChild(script);
})();

// 页面渲染主逻辑，CSS加载完毕后执行
function initArticleRender() {
    const postData = document.getElementById("post-data");
    if (!postData) return;

    // 清空页面所有 #post-data 以外的元素，杜绝原生DOM冲突
    Array.from(document.body.children).forEach(el => {
        if(el.id !== 'post-data') el.remove();
    });

    // 隐藏原生博文内容，不闪烁
    postData.style.display = "none";

    // 提取博文基础数据（仅读取#post-data内部内容，无需手动写布局）
    const title = postData.querySelector("h1")?.innerHTML || document.title;
    const date = postData.getAttribute("data-date") || "";
    const tag = postData.getAttribute("data-tag") || "";
    const cat = postData.getAttribute("data-cat") || "";
    const bodyContent = postData.querySelector(".content")?.innerHTML || "";

    // 全自动生成标准Win95 TEXT_VIEWER窗口完整结构
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

    // 创建唯一渲染容器，页面只保留这一套Win95窗口
    let articleWrapper = document.getElementById("article-wrapper");
    if (!articleWrapper) {
        articleWrapper = document.createElement("div");
        articleWrapper.id = "article-wrapper";
        document.body.appendChild(articleWrapper);
    }
    articleWrapper.innerHTML = finalLayout;

    // 代码块自动添加复制按钮（Win95同款btn样式）
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

    // 图片自动添加Win95内嵌复古边框
    const images = contentDiv.querySelectorAll("img");
    images.forEach((img) => {
        img.style.cursor = "zoom-in";
        img.style.border = "2px inset #fff";
        img.style.padding = "4px";
        img.style.background = "#d4d0c8";
        img.addEventListener("click", () => window.open(img.src, "_blank"));
    });
}
