(function() {
    // 1. 动态注入复古微机风格样式
    const css = `
        /* 🖥️ 底部任务栏容器 */
        .taskbar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 45px;
            background: #c0c0c0;
            border-top: 2px solid #fff;
            z-index: 9999;
            display: flex;
            align-items: center;
            padding: 0 5px;
            padding-bottom: env(safe-area-inset-bottom);
            box-sizing: border-box;
        }

        /* ⌨️ “开始”按钮 */
        .menu-btn {
            height: 32px;
            padding: 0 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            background: #d4d0c8;
            border: 2px outset #fff;
            cursor: pointer;
            font-weight: bold;
            font-family: "MS Sans Serif", Arial, sans-serif;
            font-size: 14px;
            color: #000;
        }
        .menu-btn:active { border-style: inset; }
        
        /* 调整内容区，防止底部被遮挡 */
        body { padding-bottom: calc(55px + env(safe-area-inset-bottom)) !important; }

        /* 🧭 经典视窗系统侧边栏 */
        .sidebar {
            position: fixed;
            top: 0;
            left: -260px;
            width: 260px;
            height: calc(100% - 45px); /* 扣掉任务栏高度 */
            background: #d4d0c8;
            border-right: 3px solid #808080;
            box-shadow: 2px 0px 5px rgba(0,0,0,0.2);
            transition: left 0.25s steps(8, end);
            z-index: 1000;
            padding: 20px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 6px;
            overflow-y: auto;
            font-family: "Consolas", "Courier New", "SimSun", monospace;
        }
        .sidebar.open { left: 0; }
        
        /* 侧边栏标题栏 */
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
        
        /* 菜单项 */
        .sidebar a {
            color: #000000;
            text-decoration: none;
            font-size: 14px;
            padding: 8px 12px;
            border: 1px solid transparent;
            display: block;
        }
        .sidebar a:hover { color: #ffffff; background-color: #000080; }
        
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
        .sidebar a.active::before { content: '>'; margin-right: 6px; color: #000080; }

        /* 🖤 遮罩层 */
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
        
        .seo-nav-links { display: none !important; }
    `;

    // 插入 CSS
    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 2. DOM 准备就绪后装配结构
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
            
            let isActive = false;
            if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
                isActive = true;
            } else if (href !== '/' && currentPath.includes(href)) {
                isActive = true;
            }

            linksHtml += `<a href="${href}" ${target} ${rel} class="${isActive ? 'active' : ''}">${link.innerHTML}</a>`;
        });

        // 插入任务栏和侧边栏
        const navWrapper = document.createElement('div');
        navWrapper.innerHTML = `
            <div class="taskbar">
                <button class="menu-btn" id="menuBtn">
                    <span>🏁 Start</span>
                </button>
            </div>
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-title">📁 SYS_NAV_MENU</div>
                ${linksHtml}
            </nav>
        `;

        document.body.insertBefore(navWrapper, document.body.firstChild);

        // 3. 逻辑绑定
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        function toggleMenu() {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('open');
        }

        menuBtn.addEventListener('click', toggleMenu);
        sidebarOverlay.addEventListener('click', toggleMenu);
    });
})();
