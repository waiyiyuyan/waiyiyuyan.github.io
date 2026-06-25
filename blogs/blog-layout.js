// ==========================================================================
// 🚀 自动注入复古组件：无需修改每个 HTML 文件
// ==========================================================================
(function() {
    // 1. 注入全局复古CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/retro-theme.css';
    document.head.appendChild(link);

    // 2. 注入任务栏/开始菜单导航JS
    const script = document.createElement('script');
    script.src = '/nav.js';
    script.async = true;
    document.body.appendChild(script);
})();

document.addEventListener("DOMContentLoaded", () => {
    const postData = document.getElementById("post-data");
    if (!postData) return;

    // 先隐藏原生内容，避免页面闪烁
    postData.style.display = "none";

    // 提取文章数据（正文bodyContent完整提取，一字不改）
    const title = postData.querySelector("h1")?.innerHTML || document.title;
    const date = postData.getAttribute("data-date") || "";
    const tag = postData.getAttribute("data-tag") || "";
    const cat = postData.getAttribute("data-cat") || "";
    const bodyContent = postData.querySelector(".content")?.innerHTML || "";

    // 组装Win95窗口外壳，所有尺寸、间距、边框全部交给retro-theme.css控制
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

    // 创建外层容器渲染窗口
    let articleWrapper = document.getElementById("article-wrapper");
    if (!articleWrapper) {
        articleWrapper = document.createElement("div");
        articleWrapper.id = "article-wrapper";
        document.body.appendChild(articleWrapper);
    }
    articleWrapper.innerHTML = finalLayout;

    // --------------------------
    // 交互逻辑完全保留，不改动正文渲染
    // --------------------------
    const contentDiv = articleWrapper.querySelector(".content");
    if (!contentDiv) return;

    // 代码块复制按钮逻辑不变
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
                console.error("复制失败: ", err);
                copyBtn.innerText = "失败";
            });
        });
    });

    // 图片复古边框+新标签打开逻辑不变
    const images = contentDiv.querySelectorAll("img");
    images.forEach((img) => {
        img.style.cursor = "zoom-in";
        img.style.border = "2px inset #fff";
        img.style.padding = "4px";
        img.style.background = "#d4d0c8";
        img.addEventListener("click", () => window.open(img.src, "_blank"));
    });
});
