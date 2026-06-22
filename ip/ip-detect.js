const el = {
    ipv4: document.getElementById('ipv4'),
    ipv6: document.getElementById('ipv6'),
    location: document.getElementById('location'),
    isp: document.getElementById('isp'),
    proxyCheck: document.getElementById('proxyCheck')
};

// 云服务商/机房关键词库
const cloudKeywords = [
    "Cloudflare", "DigitalOcean", "Vultr", "Linode", "AWS", "Amazon",
    "Azure", "GCP", "Google Cloud", "OVH", "Contabo", "Hetzner",
    "Bandwagon", "搬瓦工", "VPS", "Datacenter", "数据中心",
    "腾讯云", "阿里云", "华为云", "百度云", "UCloud", "青云"
];

/**
 * 带超时的 fetch 封装
 */
function fetchWithTimeout(url, timeout = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * 主接口1：seeip.org 强制IPv4，支持CORS
 */
function getIPv4Info() {
    return fetchWithTimeout('https://ipv4.seeip.org/geoip')
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);
}

/**
 * 主接口2：seeip.org 强制IPv6，支持CORS
 */
function getIPv6Info() {
    return fetchWithTimeout('https://ipv6.seeip.org/geoip')
        .then(res => res.ok ? res.json() : null)
        .catch(() => null);
}

/**
 * 备用接口：搜狐公共IP接口，国内超稳定，JSONP无跨域
 * 只能获取当前连接的IP和城市，无法区分双栈
 */
function getFallbackInfo() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://pv.sohu.com/cityjson?ie=utf-8';
        script.onload = () => {
            if (window.returnCitySN && window.returnCitySN.cip) {
                resolve({
                    ip: window.returnCitySN.cip,
                    city: window.returnCitySN.cname,
                    isp: '暂无数据'
                });
            } else {
                resolve(null);
            }
        };
        script.onerror = () => resolve(null);
        document.body.appendChild(script);
    });
}

/**
 * 代理判断逻辑
 */
function judgeProxy(data) {
    const result = { isProxy: false, reason: "普通家用/企业宽带", level: "ok" };
    const isp = (data.isp || data.organization || "").toString().toLowerCase();

    const hit = cloudKeywords.some(keyword =>
        isp.includes(keyword.toLowerCase())
    );

    if (hit) {
        result.isProxy = true;
        result.reason = "机房IP，疑似代理/VPN";
        result.level = "warn";
    }

    return result;
}

/**
 * 填充页面数据
 */
function fillData(data) {
    const loc = [data.country, data.region, data.city].filter(Boolean).join(" · ");
    el.location.textContent = loc || data.city || "未知";
    el.isp.textContent = data.isp || "未知";

    const proxyRes = judgeProxy(data);
    el.proxyCheck.className = `badge badge-${proxyRes.level}`;
    el.proxyCheck.textContent = proxyRes.isProxy
        ? `⚠️ ${proxyRes.reason}`
        : `✅ ${proxyRes.reason}`;
}

/**
 * 主执行函数
 */
async function runDetect() {
    // 并行请求双栈主接口
    const [v4Data, v6Data] = await Promise.all([getIPv4Info(), getIPv6Info()]);

    // 主接口有一个成功即可正常展示
    if (v4Data || v6Data) {
        // 填充IPv4
        if (v4Data && v4Data.ip) {
            el.ipv4.textContent = v4Data.ip;
            fillData(v4Data); // 用IPv4的归属地信息作为展示基准
        } else {
            el.ipv4.textContent = "无可用IPv4出口";
            el.ipv4.style.color = "#999";
        }

        // 填充IPv6
        if (v6Data && v6Data.ip) {
            el.ipv6.textContent = v6Data.ip;
            // 如果IPv4失败，用IPv6的归属地信息
            if (!v4Data) fillData(v6Data);
        } else {
            el.ipv6.textContent = "未启用IPv6";
            el.ipv6.style.color = "#999";
        }
        return;
    }

    // 主接口全部失败，走国内备用搜狐接口
    const fallbackData = await getFallbackInfo();
    if (fallbackData) {
        // 备用接口无法区分双栈，统一显示在IPv4栏
        el.ipv4.textContent = fallbackData.ip;
        el.ipv6.textContent = "未检测（单IP模式）";
        el.ipv6.style.color = "#999";
        fillData(fallbackData);
    } else {
        // 全部接口失败
        el.ipv4.textContent = "获取失败";
        el.ipv6.textContent = "获取失败";
        el.location.textContent = "获取失败";
        el.isp.textContent = "获取失败";
        el.proxyCheck.className = "badge badge-gray";
        el.proxyCheck.textContent = "网络异常，检测失败";
    }
}

// 页面加载完成后执行检测
document.addEventListener('DOMContentLoaded', runDetect);