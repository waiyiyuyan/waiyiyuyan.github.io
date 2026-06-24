(function() {
    // 1. 注入 CSS 样式
    const css = `
        /* 任务栏：底部固定，全屏宽度 */
        .taskbar {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 45px;
            background: #c0c0c0; border-top: 2px solid #fff;
            z-index: 9999; display: flex; align-items: center; padding: 0 5px;
        }
        /* 任务栏内部容器：与你的主体内容对齐 */
        .taskbar-inner {
            width: 100%; max-width: 850px; margin: 0;
            position: relative; display: flex; align-items: center;
        }
        /* 🏁 开始按钮 */
        .menu-btn {
            height: 32px; padding: 0 12px; display: flex; align-items: center; gap: 6px;
            background: #d4d0c8; border: 2px outset #fff; cursor: pointer;
            font-weight: bold; font-family: "MS Sans Serif", Arial, sans-serif; font-size: 14px;
        }
        .menu-btn:active { border-style: inset; }

        /* 📋 弹出式菜单 (替代了侧边栏) */
        .start-menu {
            position: absolute; bottom: 45px; left: 0; width: 200px;
            background: #d4d0c8; border: 2px outset #fff; padding: 4px;
            display: none; flex-direction: column; z-index: 9998;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        }
        .start-menu.show { display: flex; }
        
        /* 菜单项样式 */
        .start-menu a {
            color: #000; text-decoration: none; padding: 8px 12px;
            font-size: 14px; display: block;
        }
        .start-menu a:hover { background-color: #000080; color: #fff; }
        .start-menu a.active { font-weight: bold; background: #e0e0e0; }

        body { padding-bottom: 50px !important; }
    `;

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
            let isActive = (href === '/' && (currentPath === '/' || currentPath === '/index.html')) || 
                           (href !== '/' && currentPath.includes(href));
            
            linksHtml += `<a href="${href}" class="${isActive ? 'active' : ''}">${link.innerHTML}</a>`;
        });

        // 插入任务栏结构
        const navWrapper = document.createElement('div');
        navWrapper.innerHTML = `
            <div class="taskbar">
                <div class="taskbar-inner">
                    <button class="menu-btn" id="startBtn">🏁 Start</button>
                    <div class="start-menu" id="startMenu">
                        ${linksHtml}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(navWrapper);

        // 3. 逻辑绑定
        const startBtn = document.getElementById('startBtn');
        const startMenu = document.getElementById('startMenu');

        // 点击按钮切换菜单
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('show');
        });

        // 点击页面空白处关闭菜单
        document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target) && e.target !== startBtn) {
                startMenu.classList.remove('show');
            }
        });
    });
})();
