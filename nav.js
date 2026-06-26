(function() {
    // 1. 集中管理全站的所有菜单项
    const menuConfig = [
        { name: "首页节点", url: "/" },
        { name: "IP环境检测", url: "/ip/" },
        { name: "留言板", url: "https://mb.lovefree.de5.net", target: "_blank" },
        { name: "图床", url: "https://imgur-frontend.lovefree.de5.net/", target: "_blank" },
        { name: "视频下载", url: "/videoDownloader/" },
        { name: "优质博文", url: "/blogs/" }
    ];

    // 2. 注入侧边栏/手机菜单 CSS 样式（带 !important 绝对防御级别）
    const css = `
        /* ==================== 🖥️ PC 端默认样式 ==================== */
        #common-nav {
            position: fixed; 
            top: 40px; 
            left: calc(50% - 400px - 180px); 
            width: 150px;
            display: flex; 
            flex-direction: column; 
            gap: 8px; 
            z-index: 999998 !important;
            background: transparent;
        }
        
        #common-nav a {
            color: #111111; text-decoration: none; padding: 6px 10px;
            font-size: 14px; font-family: monospace; border: 1px solid transparent; display: block;
        }
        #common-nav a::before { content: "[ "; color: #777777; }
        #common-nav a::after { content: " ]"; color: #777777; }
        
        #common-nav a:hover { border: 1px dashed #111111; }
        #common-nav a.active { background: #111111 !important; color: #ffffff !important; font-weight: bold; }
        #common-nav a.active::before, #common-nav a.active::after { color: #ffffff !important; }
        
        body { padding-left: 0px !important; }
        .mobile-menu-trigger { display: none !important; }

        /* ==================== 📱 移动端自适应切换（全面强固） ==================== */
        @media (max-width: 1160px) {
            body { 
                padding-top: 50px !important; 
            }
            #common-nav {
                position: fixed !important; 
                top: 0 !important; 
                left: 0 !important; 
                width: 100% !important; 
                height: 100% !important;
                box-sizing: border-box !important; 
                background: #ffffff !important; 
                padding: 100px 30px !important; 
                gap: 20px !important; 
                display: none;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                z-index: 999998 !important; /* 确保盖住手机端一切动态内容 */
            }
            #common-nav.show { 
                display: flex !important; 
            }
            #common-nav a { 
                font-size: 16px !important; 
                text-align: center !important; 
                padding: 10px !important; 
                width: 200px !important; 
            }
            
            /* 钉在手机左上角的复古按钮，加满级别属性防御 */
            .mobile-menu-trigger {
                display: block !important; 
                position: fixed !important; 
                top: 10px !important; 
                left: 10px !important; 
                z-index: 999999 !important; /* 全局最顶层，防踩防盖 */
                background: #ffffff !important; 
                color: #111111 !important; 
                border: 1px solid #111111 !important;
                padding: 5px 12px !important; 
                font-size: 13px !important; 
                font-family: monospace !important; 
                font-weight: bold !important; 
                cursor: pointer !important;
                box-shadow: 2px 2px 0px #111111 !important;
            }
            .mobile-menu-trigger:active { 
                background: #111111 !important; 
                color: #ffffff !important; 
            }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 3. 构建/重构组件节点的函数（可被重复安全调用）
    function renderNavElements() {
        // A. 检测并维护导航本体
        let seoNav = document.getElementById('common-nav');
        if (!seoNav) {
            seoNav = document.createElement('div');
            seoNav.id = 'common-nav';
            document.body.insertBefore(seoNav, document.body.firstChild);
        }

        let linksHtml = '';
        const currentPath = window.location.pathname;

        menuConfig.forEach(item => {
            let isActive = (item.url === '/' && (currentPath === '/' || currentPath === '/index.html')) || 
                           (item.url !== '/' && item.url !== '#' && currentPath.includes(item.url));
            
            const targetAttr = item.target ? ` target="${item.target}"` : '';
            const relAttr = item.target ? ' rel="noopener noreferrer"' : '';
            
            linksHtml += `<a href="${item.url}" class="${isActive ? 'active' : ''}"${targetAttr}${relAttr}>${item.name}</a>`;
        });
        
        // 只有在内容对不上时才重写，防止影响点击
        if (seoNav.innerHTML !== linksHtml) {
            seoNav.innerHTML = linksHtml;
        }

        // B. 检测并维护触发按钮
        let mobileBtn = document.getElementById('menuTriggerBtn');
        if (!mobileBtn) {
            mobileBtn = document.createElement('button');
            mobileBtn.className = 'mobile-menu-trigger';
            mobileBtn.id = 'menuTriggerBtn';
            mobileBtn.innerText = '[ MENU ]';
            document.body.appendChild(mobileBtn);

            // 重新绑定弹窗交互
            mobileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const menu = document.getElementById('common-nav');
                if (menu) {
                    menu.classList.toggle('show');
                    mobileBtn.innerText = menu.classList.contains('show') ? '[ CLOSE ]' : '[ MENU ]';
                }
            });

            seoNav.addEventListener('click', function() {
                seoNav.classList.remove('show');
                mobileBtn.innerText = '[ MENU ]';
            });
        }
    }

    // 4. 初始化和强大的自愈看门狗
    function initGuard() {
        document.body.style.paddingLeft = "0px";
        renderNavElements();

        // 🚀 核心看门狗逻辑：监听整个 body 的子节点变化
        // 如果别的脚本在“卡一下”时强行抹去了菜单组件，这里会瞬间察觉并秒级重新长出来！
        const watchdog = new MutationObserver(function() {
            const hasNav = document.getElementById('common-nav');
            const hasBtn = document.getElementById('menuTriggerBtn');
            if (!hasNav || !hasBtn) {
                renderNavElements();
            }
        });
        
        watchdog.observe(document.body, { childList: true });
    }

    // 适配各种加载时机
    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", initGuard);
    } else {
        initGuard();
    }
})();
