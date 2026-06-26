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

    // 2. 注入纯白极简自适应 CSS（包含全站手机端绝对对称、强制居中补丁）
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
            z-index: 1000001 !important;
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

        /* ==================== 📱 移动端自适应（强行绝对对称、精准居中） ==================== */
        @media (max-width: 1160px) {
            /* 1. 强制重置全站 body 的内外边距：左右必须绝对对称留白 16px */
            body { 
                padding-top: 60px !important; 
                padding-left: 16px !important;  
                padding-right: 16px !important; 
                margin: 0 !important;
                box-sizing: border-box !important;
                display: block !important;
                width: 100% !important;
                overflow-x: hidden !important; /* 彻底切断内容超宽导致的右侧大留白 */
            }
            
            /* 2. 强制抓取主容器，清除任何不对称的 padding、margin 或浮动，强行对称居中 */
            .tui-screen, #main, .container, main, #wrapper {
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                float: none !important;
                padding: 0 !important; /* 清除子页面可能自带的畸形内边距 */
            }

            /* 3. 彻底改为纯白的手机端全屏折叠菜单 */
            #common-nav {
                display: none !important; 
                position: fixed !important; 
                top: 0 !important; 
                left: 0 !important; 
                width: 100% !important; 
                height: 100% !important;
                box-sizing: border-box !important; 
                background: #ffffff !important; 
                padding: 100px 30px !important; 
                gap: 20px !important; 
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                z-index: 1000001 !important; 
            }
            
            #common-nav.show { 
                display: flex !important; 
            }
            
            #common-nav a {
                width: 200px !important;
                text-align: center !important;
                box-sizing: border-box !important;
                font-size: 16px !important;
                padding: 10px !important;
            }

            /* 4. 钉在左上角的纯白黑边 WebTUI 触发按钮 */
            .mobile-menu-trigger {
                display: block !important; 
                position: fixed !important; 
                top: 10px !important; 
                left: 10px !important; 
                z-index: 1000002 !important; 
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

    // 3. 核心构建与维护逻辑
    function renderNavElements() {
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
        
        if (seoNav.innerHTML !== linksHtml) {
            seoNav.innerHTML = linksHtml;
        }

        let mobileBtn = document.getElementById('menuTriggerBtn');
        if (!mobileBtn) {
            mobileBtn = document.createElement('button');
            mobileBtn.id = 'menuTriggerBtn';
            mobileBtn.className = 'mobile-menu-trigger';
            mobileBtn.innerText = seoNav.classList.contains('show') ? '[ CLOSE ]' : '[ MENU ]';

            const tuiScreen = document.querySelector('.tui-screen');
            if (tuiScreen) {
                tuiScreen.insertBefore(mobileBtn, tuiScreen.firstChild);
            } else {
                document.body.insertBefore(mobileBtn, document.body.firstChild);
            }

            mobileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                seoNav.classList.toggle('show');
                mobileBtn.innerText = seoNav.classList.contains('show') ? '[ CLOSE ]' : '[ MENU ]';
            });

            seoNav.addEventListener('click', () => {
                seoNav.classList.remove('show');
                mobileBtn.innerText = '[ MENU ]';
            });
        }
    }

    // 4. 初始化和自愈看门狗
    function initGuard() {
        // 这一句做动态机型判断：如果是手机端，绝不乱加 padding-left: 0，完全交给 CSS 控制
        if (window.innerWidth > 1160) {
            document.body.style.paddingLeft = "0px";
        }
        renderNavElements();

        const watchdog = new MutationObserver(function() {
            const hasNav = document.getElementById('common-nav');
            const hasBtn = document.getElementById('menuTriggerBtn');
            if (!hasNav || !hasBtn) {
                renderNavElements();
            }
        });
        
        watchdog.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", initGuard);
    } else {
        initGuard();
    }
})();
