// 页面DOM元素（修复：补全 area 节点）
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

// 云服务商/机房关键词库
const cloudKeywords = [
    "Cloudflare", "DigitalOcean", "Vultr", "Linode", "AWS", "Amazon",
    "Azure", "GCP", "Google Cloud", "OVH", "Contabo", "Hetzner",
    "Bandwagon", "搬瓦工", "VPS", "Datacenter", "数据中心",
    "腾讯云", "阿里云", "华为云", "百度云", "UCloud", "青云"
];

/**
 * 备用接口：搜狐HTTPS JSONP
 */
function getFallbackInfo() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://pv.sohu.com/cityjson?ie=utf-8';
        script.onload = () => {
            document.body.removeChild(script);
            if (window.returnCitySN && window.returnCitySN.cip) {
                resolve({
                    ip: window.returnCitySN.cip,
                    country: "未知",
                    region: "",
                    city: window.returnCitySN.cname,
                    latitude: "",
                    longitude: "",
                    timezone: "无",
                    organization: "接口获取失败",
                    asn: "无",
                    status: "success"
                });
            } else resolve(null);
        };
        script.onerror = () => {
            document.body.removeChild(script);
            resolve(null);
        };
        document.body.appendChild(script);
    });
}

/**
 * JSONP 请求 api.ip.sb
 */
function jsonpIpSb(targetIp = null) {
    return new Promise((resolve) => {
        const cbName = 'ipSbCb_' + Date.now();
        window[cbName] = (res) => {
			resolve(res);
			delete window[cbName]; // 执行后删除全局函数
		};
        let url = 'https://api.ip.sb/geoip';
        if (targetIp) url += '/' + targetIp;
        url += `?callback=${cbName}`;

        const script = document.createElement('script');
        script.src = url;
        script.onerror = async () => {
            document.body.removeChild(script);
            const fb = await getFallbackInfo();
            resolve(fb);
        };
        script.onload = () => document.body.removeChild(script);
        document.body.appendChild(script);
    });
}

/**
 * IP格式校验
 */
function isValidIp(ipStr) {
    const v4Reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    const v6Reg = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,6})|(:([0-9a-fA-F]{1,4}){1,7}))$/;
    const privateReg = /^(127\.|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|::1|fd)/;
    if (privateReg.test(ipStr)) return false;
    return v4Reg.test(ipStr) || v6Reg.test(ipStr);
}

/**
 * 机房/代理判定
 */
function judgeProxy(data) {
    const result = { isProxy: false, reason: "普通家用/企业宽带", level: "ok" };
    const text = ((data.isp || '') + ' ' + (data.organization || '')).toLowerCase();
    const hit = cloudKeywords.some(k => text.includes(k.toLowerCase()));
    if (hit) {
        result.isProxy = true;
        result.reason = "机房IP，疑似代理/VPN";
        result.level = "warn";
    }
    return result;
}

/**
 * 全部条目置加载状态
 */
function setLoading() {
    const allVal = [el.queryIp, el.area, el.locationCoord, el.timezone, el.isp, el.org, el.asInfo, el.proxyCheck];
    allVal.forEach(item => {
        if (item) item.innerHTML = '<span class="loading"></span>查询中...';
    });
}

/**
 * 渲染页面（修复el.query → el.queryIp）
 */
function renderData(data) {
    // 兜底内网拦截
    if (data && data.ip && /^(127\.|192\.168\.|10\.|172\.1[6-9]\.|::1)/.test(data.ip)) {
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
        el.proxyCheck.textContent = "接口访问受限";
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

/**
 * 统一查询入口
 */
async function runQuery(ip = null) {
    setLoading();
    const res = await jsonpIpSb(ip);
    renderData(res);
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    runQuery(null);

    // 查询按钮
    el.searchBtn.addEventListener('click', () => {
        const inputVal = el.ipInput.value.trim();
        if (!inputVal) return alert("请输入IPv4/IPv6地址");
        if (!isValidIp(inputVal)) return alert("IP格式错误或为内网地址，无法查询");
        runQuery(inputVal);
    });

    // 重置本机
    el.resetBtn.addEventListener('click', () => {
        el.ipInput.value = "";
        runQuery(null);
    });

    // 回车查询
    el.ipInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') el.searchBtn.click();
    });
});