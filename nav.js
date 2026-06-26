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

    // 2. 注入侧边栏/手机菜单 CSS 样式
    const css = `
        #common-nav {
            position: fixed; top: 20px; left: calc(50% - 325px - 200px); width: 180px;
            display: flex; flex-direction: column; gap: 8px; z-index: 10000;
            background: transparent;
        }
        #common-nav a {
            color: #111111; text-decoration: none; padding: 6px 10px;
            font-size: 14px; font-family: monospace; border: 1px solid transparent; display: block;
        }
        #common-nav a::before { content: "[ "; }
        #common-nav a::after { content: " ]"; }
        #common-nav a:hover { border: 1px dashed #111111; }
        #common-nav a.active { background: #111111 !important; color: #ffffff !important; font-weight: bold; }
        body { padding-left: 230px !important; }
        .mobile-menu-trigger { display: none; }

        @media (max-width: 800px) {
            body { padding-left: 20px !important; padding-top: 50px !important; }
            #common-nav {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                box-sizing: border-box; background: #ffffff; padding: 60px 30px; gap: 16px; display: none;
            }
            #common-nav.show { display: flex; }
            #common-nav a { font-size: 16px; text-align: center; padding: 10px; }
            .mobile-menu-trigger {
                display: block; position: fixed; top: 10px; left: 10px; z-index: 10001;
                background: #ffffff; color: #111111; border: 1px solid #111111;
                padding: 4px 10px; font-size: 13px; font-family: monospace; font-weight: bold; cursor: pointer;
            }
            .mobile-menu-trigger:active { background: #111111; color: #ffffff; }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 3. 核心逻辑：自动创建、装配并注入
    document.addEventListener("DOMContentLoaded", function() {
        // 先检查页面上有没有这个容器，如果没有，我们自己建一个！
        let seoNav = document.getElementById('common-nav');
        if (!seoNav) {
            seoNav = document.createElement('div');
            seoNav.id = 'common-nav';
            // 把导航条强行塞到 <body> 的最开始位置
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

        seoNav.innerHTML = linksHtml;

        // 创建手机端专属的按钮
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-trigger';
        mobileBtn.id = 'menuTriggerBtn';
        mobileBtn.innerText = '[ MENU ]';
        document.body.appendChild(mobileBtn);

        // 移动端全屏弹窗交互
        mobileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            seoNav.classList.toggle('show');
            mobileBtn.innerText = seoNav.classList.contains('show') ? '[ CLOSE ]' : '[ MENU ]';
        });

        seoNav.addEventListener('click', function() {
            seoNav.classList.remove('show');
            mobileBtn.innerText = '[ MENU ]';
        });
    });
})();
