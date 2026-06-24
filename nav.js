(function() {
    // 1. 动态注入侧边栏所需的全部 CSS 样式（这样各个子页面就不用重复写样式了）
    const css = `
        /* 🍔 汉堡按钮样式 */
        .menu-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: #007bff;
            border: none;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
            transition: all 0.2s ease;
        }
        .menu-btn:hover {
            background: #0056b3;
            box-shadow: 0 4px 16px rgba(0, 86, 179, 0.4);
        }
        .menu-btn span {
            display: block;
            width: 22px;
            height: 3px;
            background-color: #fff;
            border-radius: 2px;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .menu-btn.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .menu-btn.open span:nth-child(2) { opacity: 0; }
        .menu-btn.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* 🧭 侧边栏竖向导航栏 */
        .sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            width: 280px;
            height: 100%;
            background: #fff;
            box-shadow: 4px 0 15px rgba(0,0,0,0.05);
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            padding: 90px 15px 20px 15px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow-y: auto;
        }
        .sidebar.open { left: 0; }
        .sidebar-title {
            font-size: 1.1rem;
            color: #999;
            font-weight: bold;
            padding: 0 12px 10px 12px;
            border-bottom: 1px solid #eee;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .sidebar a {
            color: #555;
            text-decoration: none;
            font-weight: bold;
            font-size: 1rem;
            padding: 12px 16px;
            border-radius: 6px;
            transition: all 0.2s;
            display: block;
        }
        .sidebar a:hover {
            color: #007bff;
            background-color: #f0f7ff;
        }
        .sidebar a.active {
            color: #007bff;
            background-color: #e6f0ff;
            border-left: 4px solid #007bff;
            border-radius: 0 6px 6px 0;
            padding-left: 12px;
        }

        /* 🖤 背景遮罩层 */
        .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .sidebar-overlay.open { display: block; opacity: 1; }

        /* 📱 移动端/小屏幕适配：给身体加内边距，防止按钮挡住主体内容 */
        @media (max-width: 900px) {
            body { padding-top: 80px !important; }
        }
        
        /* 隐藏原本暴露在外的纯 HTML SEO 导航 */
        .seo-nav-links { display: none !important; }
    `;

    // 将样式插入到页面中
    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 2. 当 DOM 加载完成后，开始构建和绑定导航栏
    document.addEventListener("DOMContentLoaded", function() {
        const seoNav = document.getElementById('common-nav');
        if (!seoNav) return;

        // 提取原先写在 HTML 里的链接
        const links = seoNav.querySelectorAll('a');
        let linksHtml = '';
        
        // 获取当前页面的路径，用来自动高亮对应的菜单
        const currentPath = window.location.pathname;

        links.forEach(link => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target') ? `target="${link.getAttribute('target')}"` : '';
            const rel = link.getAttribute('rel') ? `rel="${link.getAttribute('rel')}"` : '';
            
            // 判断是否是当前激活的页面
            let isActive = false;
            if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
                isActive = true;
            } else if (href !== '/' && currentPath.includes(href)) {
                isActive = true;
            }

            linksHtml += `<a href="${href}" ${target} ${rel} class="${isActive ? 'active' : ''}">${link.innerHTML}</a>`;
        });

        // 动态拼装出华丽的“汉堡菜单”和“侧边栏”完整的 HTML 结构
        const navWrapper = document.createElement('div');
        navWrapper.innerHTML = `
            <button class="menu-btn" id="menuBtn" aria-label="切换导航菜单">
                <span></span><span></span><span></span>
            </button>
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-title">网站导航</div>
                ${linksHtml}
            </nav>
        `;

        // 插入到页面中
        document.body.insertBefore(navWrapper, document.body.firstChild);

        // 3. 绑定核心的点击交互逻辑
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
