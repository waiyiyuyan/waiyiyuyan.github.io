// ========== 全局配置（后续维护只改这里） ==========
const CONFIG = {
    API_BASE: 'https://api.ip.sb/geoip',
    FALLBACK_API: 'https://pv.sohu.com/cityjson?ie=utf-8',
    TIMEOUT: 10000, // 接口超时时间，单位毫秒
    // 内网/保留地址正则
    PRIVATE_IP_REG: /^(127\.|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|::1|fd)/,
    // 云服务商/机房关键词库
    CLOUD_KEYWORDS: [
        "Cloudflare", "DigitalOcean", "Vultr", "Linode", "AWS", "Amazon",
        "Azure", "GCP", "Google Cloud", "OVH", "Contabo", "Hetzner",
        "Bandwagon", "搬瓦工", "VPS", "Datacenter", "数据中心",
        "腾讯云", "阿里云", "华为云", "百度云", "UCloud", "青云"
    ],
    ERROR_MSG: {
        EMPTY_INPUT: '请输入IPv4/IPv6地址',
        INVALID_IP: 'IP格式错误或为内网地址，无法查询',
        REQUEST_FAIL: '接口访问受限'
    }
};

// 预编译小写关键词，提升匹配效率
const CLOUD_KEYWORDS_LOWER = CONFIG.CLOUD_KEYWORDS.map(k => k.toLowerCase());

// ========== DOM元素 ==========
const el = {
    queryIp: document.getElementById('queryIp'),
    area: document.getElementById('area'),
    locationCoord: document.getElementById('locationCoord'),
    timezone: document.getElementById('timezone'),
    isp: document.getElementById('isp'),
    org: document.getElementById('org'),
    asInfo: document.getElementById('asInfo'),
    proxyCheck: document.getElementById('proxyCheck'),
    ipInput: document.getElementById('ipInput'),
    searchBtn: document.getElementById('searchBtn'),
    resetBtn: document.getElementById('resetBtn')
};

// 请求锁：防止重复提交
let isRequesting = false;

// ========== 备用接口：搜狐HTTPS JSONP ==========
function getFallbackInfo() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = CONFIG.FALLBACK_API;

        script.onload = () => {
            if (document.body.contains(script)) document.body.removeChild(script);
            if (window.returnCitySN && window.returnCitySN.cip) {
                resolve({
                    ip: window.returnCitySN.cip,
                    country: "未知",
                    region: "",
                    city: window.returnCitySN.cname,
                    latitude: "",
                    longitude: "",
                    timezone: "无",
                    organization: CONFIG.ERROR_MSG.REQUEST_FAIL,
                    asn: "无"
                });
            } else resolve(null);
        };

        script.onerror = () => {
            if (document.body.contains(script)) document.body.removeChild(script);
            resolve(null);
        };

        document.body.appendChild(script);
    });
}

// ========== 核心：带超时的JSONP请求 ==========
function jsonpIpSb(targetIp = null) {
    return new Promise((resolve) => {
        const cbName = 'ipSbCb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        let timer = null;
        let settled = false;

        // 成功回调
        window[cbName] = (res) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            delete window[cbName];
            resolve(res);
        };

        // 超时逻辑
        timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            delete window[cbName];
            // 超时走兜底接口
            getFallbackInfo().then(resolve);
        }, CONFIG.TIMEOUT);

        // 拼接URL
        let url = CONFIG.API_BASE;
        if (targetIp) url += '/' + targetIp;
        url += `?callback=${cbName}`;

        const script = document.createElement('script');
        script.src = url;

        // 加载失败
        script.onerror = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (document.body.contains(script)) document.body.removeChild(script);
            delete window[cbName];
            getFallbackInfo().then(resolve);
        };

        // 加载完成移除节点
        script.onload = () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };

        document.body.appendChild(script);
    });
}

// ========== IP格式校验 ==========
function isValidIp(ipStr) {
    const v4Reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    const v6Reg = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,6})|(:([0-9a-fA-F]{1,4}){1,7}))$/;
    
    if (CONFIG.PRIVATE_IP_REG.test(ipStr)) return false;
    return v4Reg.test(ipStr) || v6Reg.test(ipStr);
}

// ========== 机房/代理判定 ==========
function judgeProxy(data) {
    const result = { isProxy: false, reason: "普通家用/企业宽带", level: "ok" };
    const text = ((data.isp || '') + ' ' + (data.organization || '')).toLowerCase();
    
    const hit = CLOUD_KEYWORDS_LOWER.some(k => text.includes(k));
    if (hit) {
        result.isProxy = true;
        result.reason = "机房IP，疑似代理/VPN";
        result.level = "warn";
    }
    return result;
}

// ========== 加载状态控制 ==========
function setLoading(loading) {
    const allVal = [el.queryIp, el.area, el.locationCoord, el.timezone, el.isp, el.org, el.asInfo, el.proxyCheck];
    allVal.forEach(item => {
        if (item && loading) item.innerHTML = '<span class="loading"></span>查询中...';
    });

    // 禁用/启用交互
    el.ipInput.disabled = loading;
    el.searchBtn.disabled = loading;
    el.resetBtn.disabled = loading;
}

// ========== 页面渲染 ==========
function renderData(data) {
    // 统一内网拦截
    if (data && data.ip && CONFIG.PRIVATE_IP_REG.test(data.ip)) {
        data = null;
    }

    if (!data) {
        el.queryIp.textContent = "查询失败";
        el.area.textContent = "-";
        el.locationCoord.textContent = "-";
        el.timezone.textContent = "-";
        el.isp.textContent = "-";
        el.org.textContent = "-";
        el.asInfo.textContent = "-";
        el.proxyCheck.className = "badge badge-gray";
        el.proxyCheck.textContent = CONFIG.ERROR_MSG.REQUEST_FAIL;
        return;
    }

    // 字段映射
    el.queryIp.textContent = data.ip || "-";
    el.area.textContent = [data.country, data.region, data.city].filter(Boolean).join(" · ") || "未知";
    el.locationCoord.textContent = (data.latitude && data.longitude) ? `${data.latitude} , ${data.longitude}` : "-";
    el.timezone.textContent = data.timezone || "-";
    el.isp.textContent = data.organization || "-";
    el.org.textContent = data.asn_organization || "-";
    el.asInfo.textContent = data.asn ? `AS${data.asn}` : "-";

    const proxyRes = judgeProxy(data);
    el.proxyCheck.className = `badge badge-${proxyRes.level}`;
    el.proxyCheck.textContent = proxyRes.isProxy ? `⚠️ ${proxyRes.reason}` : `✅ ${proxyRes.reason}`;
}

// ========== 统一查询入口 ==========
async function runQuery(ip = null) {
    if (isRequesting) return;
    isRequesting = true;

    try {
        setLoading(true);
        const res = await jsonpIpSb(ip);
        renderData(res);
    } catch (e) {
        renderData(null);
    } finally {
        setLoading(false);
        isRequesting = false;
    }
}

// ========== 页面初始化（已加安全防护，防止非IP页面崩溃） ==========
document.addEventListener('DOMContentLoaded', () => {
    // 只有当页面确实存在 queryIp 元素时（说明在IP检测页），才执行核心逻辑
    if (el.queryIp) {
        // 自动查询本机
        runQuery(null);
        // 输入框自动聚焦
        if (el.ipInput) {
            el.ipInput.focus();
            // 回车快捷查询
            el.ipInput.addEventListener('keydown', e => {
                if (e.key === 'Enter' && el.searchBtn) el.searchBtn.click();
            });
        }
        // 查询按钮
        if (el.searchBtn) {
            el.searchBtn.addEventListener('click', () => {
                const inputVal = el.ipInput.value.trim();
                if (!inputVal) return alert(CONFIG.ERROR_MSG.EMPTY_INPUT);
                if (!isValidIp(inputVal)) return alert(CONFIG.ERROR_MSG.INVALID_IP);
                runQuery(inputVal);
            });
        }
        // 重置本机
        if (el.resetBtn) {
            el.resetBtn.addEventListener('click', () => {
                el.ipInput.value = "";
                runQuery(null);
            });
        }
        // IP地址一键复制
        el.queryIp.addEventListener('click', () => {
            const ip = el.queryIp.textContent.trim();
            if (!ip || ip === '查询中...' || ip === '查询失败') return;
            
            navigator.clipboard.writeText(ip).then(() => {
                const originalText = el.proxyCheck.textContent;
                el.proxyCheck.textContent = "✅ IP已复制到剪贴板";
                setTimeout(() => el.proxyCheck.textContent = originalText, 1500);
            }).catch(() => {
                alert("复制失败，请手动复制");
            });
        });
        el.queryIp.style.cursor = 'pointer';
        el.queryIp.title = '点击复制IP';
    }
});
