document.addEventListener('DOMContentLoaded', () => {
    // 1. 在 DOM 就绪后获取所有元素，避免空指针
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

    const cloudKeywords = [
        "Cloudflare", "DigitalOcean", "Vultr", "Linode", "AWS", "Amazon",
        "Azure", "GCP", "Google Cloud", "OVH", "Contabo", "Hetzner",
        "Bandwagon", "搬瓦工", "VPS", "Datacenter", "数据中心",
        "腾讯云", "阿里云", "华为云", "百度云", "UCloud", "青云"
    ];

    /**
     * 备用接口：使用 jsonip.com（支持 HTTPS JSONP，仅返回 IP）
     * 返回带 _fallback 标记的对象，UI 上将显示备用提示
     */
    function getFallbackInfo() {
        return new Promise((resolve) => {
            const cbName = 'jsonipCb_' + Date.now();
            const script = document.createElement('script');
            window[cbName] = (data) => {
                document.body.removeChild(script);
                delete window[cbName];
                if (data && data.ip) {
                    resolve({
                        ip: data.ip,
                        country: "未知",
                        region: "",
                        city: "未知",
                        latitude: "",
                        longitude: "",
                        timezone: "无",
                        organization: "",
                        asn: "无",
                        _fallback: true          // 标记为备用接口数据
                    });
                } else {
                    resolve(null);
                }
            };
            script.src = `https://jsonip.com/?callback=${cbName}`;
            script.onerror = () => {
                document.body.removeChild(script);
                delete window[cbName];
                resolve(null);
            };
            document.body.appendChild(script);
        });
    }

    /**
     * 主接口 JSONP 请求（api.ip.sb）
     * 增加 10 秒超时，超时或加载失败自动降级到备用接口
     */
    function jsonpIpSb(targetIp = null) {
        return new Promise((resolve) => {
            let settled = false;
            const cbName = 'ipSbCb_' + Date.now();
            const script = document.createElement('script');
            let url = 'https://api.ip.sb/geoip';
            if (targetIp) url += '/' + targetIp;
            url += `?callback=${cbName}`;

            // 超时定时器
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    getFallbackInfo().then(resolve);
                }
            }, 10000);

            function cleanup() {
                if (script && script.parentNode) {
                    document.body.removeChild(script);
                }
                delete window[cbName];
            }

            window[cbName] = (res) => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    cleanup();
                    resolve(res);
                }
            };

            script.onerror = () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    cleanup();
                    getFallbackInfo().then(resolve);
                }
            };

            script.onload = () => {
                // 脚本成功加载，但回调可能未调用（极小概率），超时会兜底
                if (script) document.body.removeChild(script);
            };

            document.body.appendChild(script);
        });
    }

    /**
     * IP 格式与内网/保留地址校验（增强 IPv6 过滤）
     */
    function isValidIp(ipStr) {
        const lower = ipStr.toLowerCase();
        // IPv4 私有/回环
        if (/^(127\.|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.)/.test(lower)) return false;
        // IPv6 特殊地址
        if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fd') || lower.startsWith('fc00:')) {
            return false;
        }
        const v4Reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
        const v6Reg = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,6})|(:([0-9a-fA-F]{1,4}){1,7}))$/;
        return v4Reg.test(lower) || v6Reg.test(lower);
    }

    /**
     * 机房/代理判定（备用接口时不检测）
     */
    function judgeProxy(data) {
        if (data._fallback) return null;  // 备用接口无法检测
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

    function setLoading() {
        const fields = [el.queryIp, el.area, el.locationCoord, el.timezone, el.isp, el.org, el.asInfo, el.proxyCheck];
        fields.forEach(item => {
            if (item) item.innerHTML = '<span class="loading"></span>查询中...';
        });
    }

    /**
     * 渲染页面，支持错误消息和备用接口提示
     */
    function renderData(data, errorMsg = null) {
        // 再次过滤内网地址（兜底）
        if (data && data.ip && /^(127\.|192\.168\.|10\.|172\.1[6-9]\.|::1|fe80:)/i.test(data.ip)) {
            data = null;
        }

        // 完全无数据
        if (!data) {
            el.queryIp.textContent = errorMsg || "网络连接失败，请稍后重试";
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

        // 填充基本信息
        el.queryIp.textContent = data.ip || "-";
        el.area.textContent = [data.country, data.region, data.city].filter(Boolean).join(" · ") || "未知";
        el.locationCoord.textContent = (data.latitude && data.longitude)
            ? `${data.latitude} , ${data.longitude}`
            : "-";
        el.timezone.textContent = data.timezone || "-";
        el.isp.textContent = data.organization || (data._fallback ? "备用接口未提供" : "-");
        el.org.textContent = data.asn_organization || "-";
        el.asInfo.textContent = data.asn ? `AS${data.asn}` : "-";

        // 代理检测（备用接口特殊处理）
        const proxyRes = judgeProxy(data);
        if (data._fallback) {
            el.proxyCheck.className = "badge badge-gray";
            el.proxyCheck.textContent = "⚠️ 备用接口，无法检测";
        } else if (proxyRes) {
            el.proxyCheck.className = `badge badge-${proxyRes.level}`;
            el.proxyCheck.textContent = proxyRes.isProxy
                ? `⚠️ ${proxyRes.reason}`
                : `✅ ${proxyRes.reason}`;
        } else {
            el.proxyCheck.className = "badge badge-gray";
            el.proxyCheck.textContent = "检测异常";
        }
    }

    /**
     * 统一查询入口，8 秒超时控制
     */
    async function runQuery(ip = null) {
        setLoading();
        try {
            const timeoutPromise = new Promise(resolve => {
                setTimeout(() => resolve({ __timeout: true }), 8000);
            });
            const result = await Promise.race([jsonpIpSb(ip), timeoutPromise]);

            if (result && result.__timeout) {
                renderData(null, "请求超时，请检查网络或稍后重试");
            } else {
                renderData(result);
            }
        } catch (err) {
            // 极端异常（如脚本加载阻断），兜底提示
            renderData(null, "查询异常，请刷新重试");
        }
    }

    // ========== 事件绑定 ==========
    el.searchBtn.addEventListener('click', () => {
        const inputVal = el.ipInput.value.trim();
        if (!inputVal) {
            alert("请输入 IPv4 或 IPv6 地址");
            return;
        }
        if (!isValidIp(inputVal)) {
            alert("IP 格式错误或为内网/保留地址，无法查询");
            return;
        }
        runQuery(inputVal);
    });

    el.resetBtn.addEventListener('click', () => {
        el.ipInput.value = "";
        runQuery(null);
    });

    el.ipInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') el.searchBtn.click();
    });

    // 页面初始自动查询本机 IP
    runQuery(null);
});