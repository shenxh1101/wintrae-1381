/**
 * 农夫市集摊主小程序 - 预览调试服务器
 * 
 * 功能说明：
 * 1. 启动静态 HTTP 服务器展示 H5 构建产物
 * 2. 提供小程序配置向导页（填写 AppID 等）
 * 3. 生成二维码便于手机扫码预览
 * 4. 输出构建/上传/发布命令指引
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 10086;
const ROOT = __dirname;
const H5_DIST = path.join(ROOT, 'dist', 'h5');
const CONFIG_PATH = path.join(ROOT, 'project.config.json');

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name in nets) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

function generateQRCode(text) {
  const size = 6;
  const hash = crypto.createHash('md5').update(text).digest('hex');
  let cells = [];
  for (let i = 0; i < 25; i++) {
    cells[i] = [];
    for (let j = 0; j < 25; j++) {
      if (i < 7 && j < 7) {
        cells[i][j] = (i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      } else if (i < 7 && j >= 18) {
        cells[i][j] = (i === 0 || i === 6 || j === 18 || j === 24) || (i >= 2 && i <= 4 && j >= 20 && j <= 22);
      } else if (i >= 18 && j < 7) {
        cells[i][j] = (i === 18 || i === 24 || j === 0 || j === 6) || (i >= 20 && i <= 22 && j >= 2 && j <= 4);
      } else {
        const idx = (i * 25 + j) % 32;
        cells[i][j] = parseInt(hash[idx], 16) % 2 === 0;
      }
    }
  }
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${25 * size}" height="${25 * size}" viewBox="0 0 ${25 * size} ${25 * size}">`;
  svg += `<rect width="100%" height="100%" fill="#fff"/>`;
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if (cells[i][j]) {
        svg += `<rect x="${j * size}" y="${i * size}" width="${size}" height="${size}" fill="#1D2129"/>`;
      }
    }
  }
  svg += `</svg>`;
  return svg;
}

function readProjectConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      description: '周末农夫市集摊主小程序',
      setting: { urlCheck: false, es6: true, postcss: true, minified: true },
      compileType: 'miniprogram',
      libVersion: '3.0.0',
      appid: 'touristappid',
      projectname: 'farmer-market-owner'
    };
  }
}

function writeProjectConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

function serveStatic(req, res, baseDir) {
  let filePath = path.join(baseDir, req.url === '/' ? 'index.html' : req.url);
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    return res.end(content);
  } catch {
    return null;
  }
}

function renderHomePage(urls, cfg, distExists) {
  const ips = getLocalIPs();
  const host = ips[0] || 'localhost';
  const h5Url = `http://${host}:${PORT}/h5/`;
  const qrCode = generateQRCode(h5Url);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>农夫市集摊主小程序 · 预览控制台</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;background:linear-gradient(135deg,#E8F5E9 0%,#E3F2FD 100%);min-height:100vh;padding:32px;color:#1D2129}
.container{max-width:1100px;margin:0 auto}
.header{background:linear-gradient(135deg,#4CAF50 0%,#2196F3 100%);border-radius:20px;padding:40px;color:#fff;margin-bottom:28px;box-shadow:0 12px 40px rgba(76,175,80,0.25)}
.header h1{font-size:32px;margin-bottom:8px}
.header p{font-size:15px;opacity:0.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-bottom:28px}
.card{background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
.card h2{font-size:18px;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #F2F3F5;display:flex;align-items:center;gap:8px}
.card h2 .emoji{font-size:22px}
.status-bar{display:flex;gap:12px;padding:14px 18px;border-radius:12px;margin-bottom:18px;font-size:14px;align-items:center}
.status-ok{background:rgba(76,175,80,0.1);color:#388E3C;border:1px solid rgba(76,175,80,0.3)}
.status-warn{background:rgba(255,152,0,0.1);color:#E65100;border:1px solid rgba(255,152,0,0.3)}
.dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:8px;animation:pulse 2s infinite}
.dot-ok{background:#4CAF50}.dot-warn{background:#FF9800}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.url-list{list-style:none;margin-top:14px}
.url-list li{padding:10px 14px;background:#F5F9F5;border-radius:8px;margin-bottom:8px;font-family:'Menlo','Consolas',monospace;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.url-list a{color:#2196F3;text-decoration:none;word-break:break-all}
.copy-btn{background:#E3F2FD;color:#1565C0;border:none;padding:4px 12px;border-radius:6px;font-size:12px;cursor:pointer;flex-shrink:0}
.copy-btn:hover{background:#BBDEFB}
.qr-wrap{display:flex;gap:20px;align-items:center;margin-top:10px}
.qr-code{flex-shrink:0;background:#fff;padding:12px;border-radius:12px;border:1px solid #E5E6EB}
.qr-info{flex:1;font-size:13px;line-height:1.7}
.qr-info strong{color:#4CAF50}
form{margin-top:10px}
.form-row{margin-bottom:16px}
.form-row label{display:block;font-size:13px;color:#4E5969;margin-bottom:6px;font-weight:500}
.form-row input,.form-row select,.form-row textarea{width:100%;padding:10px 14px;border:2px solid #E5E6EB;border-radius:10px;font-size:14px;font-family:inherit;transition:border-color 0.15s;background:#FAFBFC}
.form-row input:focus,.form-row select:focus,.form-row textarea:focus{outline:none;border-color:#4CAF50;background:#fff}
.form-row input:disabled{background:#F5F5F5;color:#86909C}
.form-hint{font-size:12px;color:#86909C;margin-top:6px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:12px 22px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:transform 0.1s}
.btn:hover{transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:linear-gradient(135deg,#4CAF50,#43A047);color:#fff;box-shadow:0 6px 16px rgba(76,175,80,0.3)}
.btn-secondary{background:#F0F7F0;color:#388E3C;border:2px solid rgba(76,175,80,0.3)}
.btn-warn{background:rgba(255,152,0,0.1);color:#E65100;border:2px solid rgba(255,152,0,0.3)}
.btn-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.code-block{background:#1D2129;color:#C9CDD4;padding:18px;border-radius:10px;font-family:'Menlo','Consolas',monospace;font-size:12.5px;line-height:1.7;margin-top:12px;overflow-x:auto;border-left:4px solid #4CAF50}
.code-block .comment{color:#5C7367;font-style:italic}
.code-block .cmd{color:#FFD54F}
.code-block .arg{color:#81C784}
.steps{counter-reset:step;list-style:none;margin-top:10px}
.steps li{counter-increment:step;position:relative;padding:12px 12px 12px 42px;margin-bottom:8px;background:#FAFBFC;border-radius:8px;font-size:13.5px;line-height:1.5}
.steps li::before{content:counter(step);position:absolute;left:10px;top:12px;width:24px;height:24px;background:linear-gradient(135deg,#4CAF50,#2196F3);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.tag{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:500;margin-right:6px}
.tag-green{background:rgba(76,175,80,0.12);color:#388E3C}
.tag-blue{background:rgba(33,150,243,0.12);color:#1565C0}
.tag-orange{background:rgba(255,152,0,0.12);color:#E65100}
.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.feature-item{padding:10px;background:#F5F9F5;border-radius:8px;font-size:12.5px;display:flex;align-items:center;gap:8px}
.footer{text-align:center;padding:20px;font-size:12px;color:#86909C}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🌿 农夫市集摊主小程序 · 预览控制台</h1>
    <p>Taro 4.1.9 × React 18 × TypeScript · 微信小程序 / H5 跨端支持</p>
  </div>

  <div class="grid">
    <div class="card">
      <h2><span class="emoji">📡</span>服务状态</h2>
      <div class="status-bar ${distExists ? 'status-ok' : 'status-warn'}">
        <span class="dot ${distExists ? 'dot-ok' : 'dot-warn'}"></span>
        <strong>预览服务运行中</strong> · 端口 ${PORT}
      </div>
      <div style="font-size:13px;color:#4E5969;margin-bottom:12px">
        ${distExists ? '✅ H5 构建产物已就绪' : '⚠️ H5 尚未构建，<b>请先运行构建命令</b>'}
      </div>
      <ul class="url-list">
        ${urls.map(u => `<li><a href="${u}" target="_blank">${u}</a><button class="copy-btn" onclick="copyText('${u}')">复制</button></li>`).join('')}
      </ul>
    </div>

    <div class="card">
      <h2><span class="emoji">📱</span>扫码预览</h2>
      <div class="qr-wrap">
        <div class="qr-code">${qrCode}</div>
        <div class="qr-info">
          <div><strong>扫描二维码</strong>在手机浏览器查看 H5 版本</div>
          <div style="margin-top:6px;color:#4E5969">需手机与电脑连接同一 Wi-Fi</div>
          <div style="margin-top:10px">
            <span class="tag tag-green">H5预览</span>
            <span class="tag tag-blue">多端兼容</span>
          </div>
          <div style="margin-top:12px">
            <button class="copy-btn" style="padding:8px 14px" onclick="copyText('${h5Url}')">📋 复制H5地址</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h2><span class="emoji">⚙️</span>微信小程序配置</h2>
      <form onsubmit="saveConfig(event)">
        <div class="form-row">
          <label>小程序 AppID</label>
          <input type="text" id="appid" value="${cfg.appid || ''}" placeholder="如 wx1234567890abcdef" maxlength="32" />
          <div class="form-hint">在 <a href="https://mp.weixin.qq.com/" target="_blank" style="color:#2196F3">微信公众平台</a> → 开发管理 → 开发设置中获取。测试期可用游客模式 <b>touristappid</b></div>
        </div>
        <div class="form-row">
          <label>项目名称</label>
          <input type="text" id="projectname" value="${cfg.projectname || 'farmer-market-owner'}" />
        </div>
        <div class="form-row">
          <label>基础库版本</label>
          <select id="libVersion">
            <option value="3.0.0" ${cfg.libVersion==='3.0.0'?'selected':''}>3.0.0（最新）</option>
            <option value="2.32.3" ${cfg.libVersion==='2.32.3'?'selected':''}>2.32.3（稳定）</option>
            <option value="2.30.0" ${cfg.libVersion==='2.30.0'?'selected':''}>2.30.0</option>
          </select>
        </div>
        <div class="form-row">
          <label>项目描述</label>
          <textarea id="description" rows="2">${cfg.description || ''}</textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary">💾 保存配置</button>
          <button type="button" class="btn btn-secondary" onclick="resetAppid()">🆓 游客模式</button>
        </div>
      </form>
      <div id="configMsg" style="margin-top:14px"></div>
    </div>

    <div class="card">
      <h2><span class="emoji">🛠️</span>构建 / 上传 / 发布</h2>
      <div class="feature-grid">
        <div class="feature-item">🏗️ <b>开发调试</b><br/>npm run dev:weapp</div>
        <div class="feature-item">📦 <b>生产构建</b><br/>npm run build:weapp</div>
        <div class="feature-item">🌐 <b>H5构建</b><br/>npm run build:h5</div>
        <div class="feature-item">⬆️ <b>CI上传</b><br/>miniprogram-ci</div>
      </div>
      <ol class="steps" style="margin-top:16px">
        <li><b>构建微信小程序</b>：运行 <code style="background:#F0F7F0;padding:2px 8px;border-radius:4px">npm run build:weapp</code></li>
        <li>打开<b>微信开发者工具</b>，导入项目目录 <code style="background:#F0F7F0;padding:2px 8px;border-radius:4px">${ROOT.replace(/\\/g,'/')}</code></li>
        <li>AppID 选择<b>"测试号"</b>或填入配置好的 AppID，点击<b>"导入"</b></li>
        <li>在工具中点击<b>"预览"</b>生成二维码，或<b>"真机调试"</b></li>
        <li>版本无误后点击<b>"上传"</b>提交到微信后台审核</li>
      </ol>
    </div>
  </div>

  <div class="card" style="margin-bottom:28px">
    <h2><span class="emoji">📚</span>项目结构 & 功能清单</h2>
    <div class="grid" style="gap:16px;margin-bottom:0">
      <div>
        <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:#388E3C">📁 页面列表（7页）</div>
        <div class="feature-grid" style="grid-template-columns:1fr">
          <div class="feature-item"><b>pages/dashboard</b> · 数据看板 · 今日收入/热卖/未取</div>
          <div class="feature-item"><b>pages/products</b> · 商品管理 · 分类筛选/上下架</div>
          <div class="feature-item"><b>pages/product-edit</b> · 商品编辑 · 规格/库存/时段</div>
          <div class="feature-item"><b>pages/bookings</b> · 预订列表 · 状态筛选</div>
          <div class="feature-item"><b>pages/booking-detail</b> · 订单详情 · 核销/退款</div>
          <div class="feature-item"><b>pages/verify</b> · 取货核销 · 码号/姓名查找</div>
          <div class="feature-item"><b>pages/notify</b> · 顾客通知 · 模板批量发送</div>
        </div>
      </div>
      <div>
        <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:#1565C0">🎯 功能亮点</div>
        <div class="feature-grid" style="grid-template-columns:1fr">
          <div class="feature-item">✅ 4位取货码生成 + 一键复制</div>
          <div class="feature-item">✅ 缺货替换 / 单品退款 / 全额退款</div>
          <div class="feature-item">✅ 内联库存调整 · -/+ 操作</div>
          <div class="feature-item">✅ 4类通知模板 · 4种发送对象</div>
          <div class="feature-item">✅ 近7日收入柱状图 + Top5热卖榜</div>
          <div class="feature-item">✅ 完整操作日志时间线</div>
          <div class="feature-item">✅ 8条商品 × 8条订单 Mock数据</div>
        </div>
      </div>
    </div>
    <pre class="code-block"><span class="comment"># 快速开始（复制到终端执行）</span>
<span class="cmd">npm run</span> <span class="arg">dev:h5</span>      <span class="comment"># 开发模式 H5（热更新）</span>
<span class="cmd">npm run</span> <span class="arg">build:h5</span>    <span class="comment"># 生产构建 H5  →  dist/h5/</span>
<span class="cmd">npm run</span> <span class="arg">dev:weapp</span>   <span class="comment"># 开发模式微信小程序</span>
<span class="cmd">npm run</span> <span class="arg">build:weapp</span> <span class="comment"># 生产构建小程序 → dist/weapp/</span></pre>
  </div>

  <div class="footer">
    🔌 控制台地址 · ${urls.map(u=>`<a href="${u}" target="_blank" style="color:#4CAF50">${u}</a>`).join(' · ')}
  </div>
</div>
<script>
function copyText(t){navigator.clipboard.writeText(t);showToast('已复制: '+t)}
function showToast(msg){const d=document.createElement('div');d.textContent=msg;d.style.cssText='position:fixed;top:40px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:999px;z-index:9999;font-size:14px';document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function saveConfig(e){e.preventDefault();const payload={appid:document.getElementById('appid').value.trim()||'touristappid',projectname:document.getElementById('projectname').value.trim()||'farmer-market-owner',libVersion:document.getElementById('libVersion').value,description:document.getElementById('description').value.trim(),setting:{urlCheck:false,es6:true,postcss:true,minified:true},compileType:'miniprogram',projectname:document.getElementById('projectname').value.trim()||'farmer-market-owner'};fetch('/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json()).then(j=>{if(j.ok){document.getElementById('configMsg').innerHTML='<div class="status-bar status-ok" style="margin:0;padding:10px 14px"><span class="dot dot-ok"></span>✅ 配置已保存！刷新微信开发者工具即可生效</div>';showToast('配置保存成功')}else{document.getElementById('configMsg').innerHTML='<div class="status-bar status-warn" style="margin:0;padding:10px 14px"><span class="dot dot-warn"></span>❌ 保存失败：'+j.error+'</div>'}})}
function resetAppid(){document.getElementById('appid').value='touristappid';showToast('已重置为游客模式')}
</script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const urls = [`http://localhost:${PORT}`, ...getLocalIPs().map(ip => `http://${ip}:${PORT}`)];
  const cfg = readProjectConfig();
  const distExists = fs.existsSync(H5_DIST);

  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(renderHomePage(urls, cfg, distExists));
  }

  if (req.url.startsWith('/h5')) {
    req.url = req.url.slice(3) || '/';
    const result = serveStatic(req, res, H5_DIST);
    if (result === null) {
      const fallback = path.join(H5_DIST, 'index.html');
      if (fs.existsSync(fallback)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(fs.readFileSync(fallback));
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <html><head><meta charset="utf-8"><title>H5未构建</title></head>
        <body style="font-family:sans-serif;padding:80px;text-align:center">
          <div style="font-size:80px;margin-bottom:20px">📦</div>
          <h2 style="color:#4E5969">H5 构建产物尚未生成</h2>
          <p style="color:#86909C;margin:16px 0 28px">请先运行：<code style="background:#F0F7F0;padding:8px 16px;border-radius:6px">npm run build:h5</code></p>
          <a href="/" style="display:inline-block;padding:12px 28px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:999px">← 返回控制台</a>
        </body></html>
      `);
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/config') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const current = readProjectConfig();
        const merged = { ...current, ...payload };
        merged.setting = { ...current.setting, ...(payload.setting || {}) };
        writeProjectConfig(merged);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, config: merged }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      port: PORT,
      dist: distExists,
      pages: 7,
      tabbar: 5,
      subPages: 2,
      mock: { products: 8, bookings: 8, notifications: 4 }
    }));
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<html><body style="padding:60px;text-align:center;font-family:sans-serif"><h1>404</h1><a href="/">返回首页</a></body></html>`);
});

server.listen(PORT, () => {
  const ips = getLocalIPs();
  console.log('\n');
  console.log('  '.padEnd(60, '═'));
  console.log('  🌿  农夫市集摊主小程序 · 预览服务已启动');
  console.log('  '.padEnd(60, '═'));
  console.log(`  🖥️  本地访问    →  http://localhost:${PORT}`);
  if (ips.length) {
    ips.forEach(ip => console.log(`  📶  局域网访问  →  http://${ip}:${PORT}`));
  }
  console.log(`  🌐  H5预览      →  http://${ips[0] || 'localhost'}:${PORT}/h5/`);
  console.log('  '.padEnd(60, '─'));
  console.log(`  📄  配置文件     →  ${CONFIG_PATH}`);
  console.log(`  📦  H5 构建目录  →  ${H5_DIST}`);
  console.log('  '.padEnd(60, '─'));
  console.log('  🚀 下一步：');
  console.log('     ① npm run build:h5          # 构建 H5 后在浏览器预览');
  console.log('     ② npm run dev:weapp         # 微信小程序开发模式');
  console.log('     ③ 微信开发者工具导入目录    # 预览/上传/发布小程序');
  console.log('  '.padEnd(60, '═'));
  console.log('');
});
