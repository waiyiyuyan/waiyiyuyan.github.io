// 页面DOM元素
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
 * 备用接口：搜狐JSONP，demo访问失败降级
 */
function getFallbackInfo() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://pv.sohu.com/cityjson?ie=utf-8';
        script.onload = () => {
            document.body.removeChild(script);
            if (window.returnCitySN && window.returnCitySN.cip) {
                resolve({
                    query: window.returnCitySN.cip,
                    country: "未知",
                    regionName: "",
                    city: window.returnCitySN.cname,
                    lat: "",
                    lon: "",
                    timezone: "无",
                    isp: "接口获取失败",
                    org: "无",
                    as: "无",
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
 * JSONP 请求 demo.ip-api
 * @param {string|null} targetIp 要查询的IP，null=查本机
 */
function jsonpDemoApi(targetIp = null) {
    return new Promise((resolve) => {
        const cbName = 'ipApiCb_' + Date.now();
        window[cbName] = (res) => resolve(res);
        let url = 'https://demo.ip-api.com/json';
        if (targetIp) url += '/' + targetIp;
        url += `?lang=zh-CN&callback=${cbName}`;

        const script = document.createElement('script');
        script.src = url;
        script.onerror = async () => {
            document.body.removeChild(script);
            // demo失败，调用备用搜狐接口
            const fb = await getFallbackInfo();
            resolve(fb);
        };
        script.onload = () => document.body.removeChild(script);
        document.body.appendChild(script);
    });
}

/**
 * IP格式校验 IPv4 / IPv6
 */
function isValidIp(ipStr) {
    const v4Reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    const v6Reg = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|:((:[0-9a-fA-F]{1,4}){1,7})$/;
    // 拦截内网本地IP
    const privateReg = /^(127\.|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|::1|fd)/;
    if (privateReg.test(ipStr)) return false;
    return v4Reg.test(ipStr) || v6Reg.test(ipStr);
}

/**
 * 代理/VPN判定
 */
function judgeProxy(data) {
    const result = { isProxy: false, reason: "普通家用/企业宽带", level: "ok" };
    const text = (data.isp + ' ' + data.org).toLowerCase();
    const hit = cloudKeywords.some(k => text.includes(k.toLowerCase()));
    if (hit) {
        result.isProxy = true;
        result.reason = "机房IP，疑似代理/VPN";
        result.level = "warn";
    }
    return result;
}

/**
 * 页面全部置为加载状态
 */
function setLoading() {
    const allVal = [el.queryIp, el.area, el.locationCoord, el.timezone, el.isp, el.org, el.asInfo, el.proxyCheck];
    allVal.forEach(item => item.innerHTML = '<span class="loading"></span>查询中...');
}

/**
 * 渲染接口数据到页面
 */
function renderData(data) {
    if (!data || data.status !== "success") {
        el.queryIp.textContent = "查询失败/无效IP";
        el.area.textContent = "-";
        el.locationCoord.textContent = "-";
        el.timezone.textContent = "-";
        el.isp.textContent = "-";
        el.org.textContent = "-";
        el.asInfo.textContent = "-";
        el.proxyCheck.className = "badge badge-gray";
        el.proxyCheck.textContent = "无数据";
        return;
    }
    el.queryIp.textContent = data.query;
    el.area.textContent = [data.country, data.regionName, data.city].filter(Boolean).join(" · ");
    el.locationCoord.textContent = data.lat + " , " + data.lon;
    el.timezone.textContent = data.timezone;
    el.isp.textContent = data.isp;
    el.org.textContent = data.org;
    el.asInfo.textContent = data.as;

    const proxyRes = judgeProxy(data);
    el.proxyCheck.className = `badge badge-${proxyRes.level}`;
    el.proxyCheck.textContent = proxyRes.isProxy ? `⚠️ ${proxyRes.reason}` : `✅ ${proxyRes.reason}`;
}

/**
 * 核心查询入口
 * @param {string|null} ip 目标IP，null=本机
 */
async function runQuery(ip = null) {
    setLoading();
    const res = await jsonpDemoApi(ip);
    renderData(res);
}

// 页面加载自动查询本机
document.addEventListener('DOMContentLoaded', () => {
    runQuery(null);

    // 查询按钮
    el.searchBtn.addEventListener('click', () => {
        const inputVal = el.ipInput.value.trim();
        if (!inputVal) return alert("请输入IP地址");
        if (!isValidIp(inputVal)) return alert("IP格式错误或为内网地址");
        runQuery(inputVal);
    });

    // 重置按钮 切回本机
    el.resetBtn.addEventListener('click', () => {
        el.ipInput.value = "";
        runQuery(null);
    });

    // 回车快捷查询
    el.ipInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') el.searchBtn.click();
    });
});