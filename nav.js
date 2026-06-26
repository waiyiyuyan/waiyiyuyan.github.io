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

    // 2. 注入侧边栏/手机菜单 CSS 样式（根据 800px 屏宽精准计算）
    const css = `
        /* ==================== 🖥️ PC 端默认样式（紧贴主体左侧） ==================== */
        #common-nav {
            position: fixed; 
            top: 40px; 
            
            /* 🎯 核心精准计算：50% 是屏幕中线，400px 是主体 800px 的一半，180px 是给侧边栏和间距留空 */
            /* 这样无论屏幕多宽，导航永远严丝合缝地挂在 .tui-screen 的左边，绝对不碰、不推主体内容！ */
            left: calc(50% - 400px - 180px); 
            
            width: 150px;
            display: flex; 
            flex-direction: column; 
            gap: 8px; 
            z-index: 10000;
            background: transparent;
        }
        
        /* 兼容你的全局 [ ] 包裹风格，并进行微调免得冲突 */
        #common-nav a {
            color: #111111; text-decoration: none; padding: 6px 10px;
            font-size: 14px; font-family: monospace; border: 1px solid transparent; display: block;
        }
        #common-nav a::before { content: "[ "; color: #777777; }
        #common-nav a::after { content: " ]"; color: #777777; }
        
        #common-nav a:hover { border: 1px dashed #111111; }
        #common-nav a.active { background: #111111 !important; color: #ffffff !important; font-weight: bold; }
        #common-nav a.active::before, #common-nav a.active::after { color: #ffffff !important; }
        
        /* ❌ 彻底废除 padding-left 的干扰，让 body 恢复纯净，回归真正的居中 */
        body { 
            padding-left: 0px !important; 
        }
        
        .mobile-menu-trigger { display: none; }

        /* ==================== 📱 移动端自适应切换（兼容 800px） ==================== */
        @media (max-width: 1160px) {
            /* 当屏幕总宽度小于 1160px 时（800px主体 + 左右两边侧边栏空间放不下时），自动收起侧边栏，避免重叠 */
            body { 
                padding-top: 50px !important; 
            }
            #common-nav {
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%;
                box-sizing: border-box; 
                background: #ffffff; 
                padding: 100px 30px; 
                gap: 20px; 
                display: none;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                z-index: 99999; /* 🎯 确保图层在最前，盖住博文等任何正文元素 */
            }
            #common-nav.show { 
                display: flex !important; 
            }
            #common-nav a { 
                font-size: 16px; 
                text-align: center; 
                padding: 10px; 
                width: 200px; /* 让高亮反色块长短一致，更整齐 */
            }
            
            /* 🎯 固定在手机端左上角的硬核复古菜单按钮 */
            .mobile-menu-trigger {
                display: block !important; 
                position: fixed; 
                top: 10px; 
                left: 10px; 
                z-index: 100000; /* 🎯 比全屏菜单还要高一层，确保随时能点关闭 */
                background: #ffffff; 
                color: #111111; 
                border: 1px solid #111111;
                padding: 5px 12px; 
                font-size: 13px; 
                font-family: monospace; 
                font-weight: bold; 
                cursor: pointer;
                box-shadow: 2px 2px 0px #111111; /* 稍微加点复古阴影，质感更好 */
            }
            .mobile-menu-trigger:active { 
                background: #111111; 
                color: #ffffff; 
            }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 3. 核心逻辑：自动创建、装配并注入
    document.addEventListener("DOMContentLoaded", function() {
        // 强制把 body 的 padding 清零，清洗残留数据
        document.body.style.paddingLeft = "0px";

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

        seoNav.innerHTML = linksHtml;

        // 创建手机/小屏端专属的按钮
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-trigger';
        mobileBtn.id = 'menuTriggerBtn';
        mobileBtn.innerText = '[ MENU ]';
        document.body.appendChild(mobileBtn);

        // 弹窗交互
        mobileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            seoNav.classList.toggle('show');
            mobileBtn.innerText = seoNav.classList.contains('show') ? '[ CLOSE ]' : '[ MENU ]';
        });

        // 点击菜单任何空白处或链接，自动关闭收回
        seoNav.addEventListener('click', function() {
            seoNav.classList.remove('show');
            mobileBtn.innerText = '[ MENU ]';
        });
    });
})();
