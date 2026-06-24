(function() {
    // 1. 动态注入复古微机风格的侧边栏样式（对齐 Win95 经典视窗质感）
    const css = `
        /* ⌨️ 复古命令式汉堡按钮 */
        .menu-btn {
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: #d4d0c8;
            /* 经典的像素级物理凸起边框 */
            border-top: 2px solid #fff;
            border-left: 2px solid #fff;
            border-right: 2px solid #808080;
            border-bottom: 2px solid #808080;
            padding: 10px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 1px 1px 0px #000000;
        }
        .menu-btn:active {
            /* 按下时物理内凹反转 */
            border-top: 2px solid #808080;
            border-left: 2px solid #808080;
            border-right: 2px solid #fff;
            border-bottom: 2px solid #fff;
        }
        .menu-btn span {
            display: block;
            width: 20px;
            height: 3px;
            background-color: #000000; /* 回归纯黑高对比色 */
            transition: transform 0.2s, opacity 0.2s;
        }
        /* 三色旗式的像素开关动作 */
        .menu-btn.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); background-color: #000080; }
        .menu-btn.open span:nth-child(2) { opacity: 0; }
        .menu-btn.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); background-color: #000080; }

        /* 🧭 经典视窗系统侧边栏 */
        .sidebar {
            position: fixed;
            top: 0;
            left: -260px;
            width: 260px;
            height: 100%;
            background: #d4d0c8; /* 标志性的外壳灰 */
            /* 侧边栏右侧厚重阴影边框 */
            border-right: 3px solid #808080;
            box-shadow: 2px 0px 5px rgba(0,0,0,0.2);
            transition: left 0.25s steps(8, end); /* 略带像素帧感的过渡效果 */
            z-index: 1000;
            padding: 75px 12px 20px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 6px;
            overflow-y: auto;
            font-family: "Consolas", "Courier New", "SimSun", monospace;
        }
        .sidebar.open { left: 0; }
        
        /* 侧边栏标题栏：高仿系统标头 */
        .sidebar-title {
            font-size: 14px;
            background: linear-gradient(90deg, #000080, #1084d0);
            color: #ffffff;
            font-weight: bold;
            padding: 4px 8px;
            margin-bottom: 12px;
            border: 1px inset #fff;
            letter-spacing: 1px;
        }
        
        /* 菜单项：未激活时表现为普通的列表项 */
        .sidebar a {
            color: #000000;
            text-decoration: none;
            font-size: 14px;
            padding: 8px 12px;
            border: 1px solid transparent;
            display: block;
        }
        .sidebar a:hover {
            color: #ffffff;
            background-color: #000080; /* 悬停时蓝屏经典蓝高亮 */
        }
        
        /* 当前页面激活态：呈凹陷文本框质感 */
        .sidebar a.active {
            color: #000000;
            background-color: #ffffff;
            border-top: 2px solid #808080;
            border-left: 2px solid #808080;
            border-right: 2px solid #dfdfdf;
            border-bottom: 2px solid #dfdfdf;
            padding-left: 14px;
            font-weight: bold;
        }
        /* 在激活项前面加一个经典控制台指示符 */
        .sidebar a.active::before {
            content: '>';
            margin-right: 6px;
            color: #000080;
        }

        /* 🖤 遮罩层（调成带有一点复古颗粒感的纯黑半透明） */
        .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: 999;
            display: none;
            opacity: 0;
            transition: opacity 0.25s ease;
        }
        .sidebar-overlay.open { display: block; opacity: 1; }

        /* 📱 移动端小屏幕适配 */
        @media (max-width: 900px) {
            body { padding-top: 75px !important; }
        }
        
        /* 隐藏原本暴露在外的纯 HTML SEO 导航 */
        .seo-nav-links { display: none !important; }
    `;

    // 将复古样式插入页面head
    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 2. DOM 准备就绪后，提取并装配复古视窗菜单
    document.addEventListener("DOMContentLoaded", function() {
        const seoNav = document.getElementById('common-nav');
        if (!seoNav) return;

        const links = seoNav.querySelectorAll('a');
        let linksHtml = '';
        const currentPath = window.location.pathname;

        links.forEach(link => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target') ? `target="${link.getAttribute('target')}"` : '';
            const rel = link.getAttribute('rel') ? `rel="${link.getAttribute('rel')}"` : '';
            
            // 精确计算激活态
            let isActive = false;
            if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
                isActive = true;
            } else if (href !== '/' && currentPath.includes(href)) {
                isActive = true;
            }

            linksHtml += `<a href="${href}" ${target} ${rel} class="${isActive ? 'active' : ''}">${link.innerHTML}</a>`;
        });

        // 拼装出复古风格的按钮和侧边栏
        const navWrapper = document.createElement('div');
        navWrapper.innerHTML = `
            <button class="menu-btn" id="menuBtn" aria-label="SYSTEM_MENU">
                <span></span><span></span><span></span>
            </button>
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-title">📁 SYS_NAV_MENU</div>
                ${linksHtml}
            </nav>
        `;

        // 插入至最前行
        document.body.insertBefore(navWrapper, document.body.firstChild);

        // 3. 极简的开关逻辑绑定
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        function toggleMenu() {
            menuBtn.classList.toggle('open');
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('open');
        }

        menuBtn.addEventListener('click', toggleMenu);
        sidebarOverlay.addEventListener('click', toggleMenu);
    });
})();
