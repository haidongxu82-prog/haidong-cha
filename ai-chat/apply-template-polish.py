#!/usr/bin/env python3
import os
from datetime import datetime
from pathlib import Path


TEMPLATE = Path(os.environ.get("AI_CHAT_TEMPLATE", "/opt/ai_chat/template.html"))

STYLE = r"""<style>
*{margin:0;padding:0;box-sizing:border-box;letter-spacing:0}
:root{--bg:#f8f9fb;--surface:rgba(255,255,255,.9);--soft:rgba(255,255,255,.68);--line:rgba(32,33,36,.08);--line2:rgba(32,33,36,.18);--text:#202124;--text2:#6f7782;--text3:#9aa0a6;--accent:#1a73e8;--accent2:#9334e6;--input-bg:rgba(255,255,255,.86);--card:rgba(255,255,255,.72);--card2:rgba(32,33,36,.055);--danger:#b3261e;--success:#188038;--shadow:0 18px 48px rgba(60,64,67,.055)}
[data-theme=dark]{--bg:#101211;--surface:rgba(27,31,29,.86);--soft:rgba(255,255,255,.055);--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.16);--text:#f1f3f4;--text2:#9aa0a6;--text3:#6e7378;--accent:#8ab4f8;--accent2:#c58af9;--input-bg:rgba(27,31,29,.86);--card:rgba(27,31,29,.72);--card2:rgba(255,255,255,.055);--danger:#f28b82;--success:#81c995;--shadow:none}
html,body{width:100%;height:100%;overflow:hidden}
body{background:linear-gradient(180deg,#fbfcfe 0%,var(--bg) 44%,#f5f7fa 100%);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
[data-theme=dark] body{background:linear-gradient(180deg,#111312 0%,var(--bg) 46%,#0c0e0d 100%)}
button,textarea,input{font:inherit}button{cursor:pointer}
.sidebar{position:fixed;left:0;top:0;bottom:0;z-index:100;width:64px;padding:16px 10px;display:flex;flex-direction:column;align-items:center;gap:12px;background:var(--bg);border-right:1px solid var(--line)}
.logo{width:40px!important;height:40px!important;border-radius:12px!important;margin:0 0 2px!important;box-shadow:0 8px 22px rgba(26,115,232,.08)}
.sb{width:38px;height:38px;border:0;border-radius:50%;background:transparent;color:var(--text2);display:grid;place-items:center;font-size:16px;transition:background .16s,color .16s,transform .16s}.sb:hover,.sb.active{background:var(--card2);color:var(--text);transform:translateY(-1px)}.s-spacer{flex:1}
.main{margin-left:64px;height:100vh;display:grid;grid-template-rows:76px minmax(0,1fr) auto;position:relative;overflow:hidden}.main::before{content:"海东 AI";position:absolute;right:clamp(28px,5vw,78px);bottom:clamp(64px,9vh,118px);z-index:0;pointer-events:none;color:rgba(32,33,36,.026);font-size:clamp(72px,11vw,176px);line-height:1;font-weight:680;white-space:nowrap}[data-theme=dark] .main::before{color:rgba(255,255,255,.032)}
.topbar{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;padding:20px clamp(20px,4vw,60px) 0}.topbar h1{font-size:clamp(28px,3.2vw,48px);line-height:1.04;font-weight:540;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.topbar-right{position:absolute;right:clamp(20px,4vw,60px);top:22px;display:flex;gap:8px}.tb{height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--text2);font-size:13px}.tb:hover{background:var(--card2);color:var(--text)}
.chat-wrap{position:relative;z-index:1;overflow-y:auto;padding:12px clamp(16px,4vw,60px);scroll-behavior:smooth}.chat-inner{width:min(900px,100%);margin:0 auto}.empty-state{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transform:translateY(-34px)}.greeting{font-size:clamp(38px,6vw,72px);line-height:1.04;font-weight:540;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}.greeting-sub,.site-tag{display:none}.empty-state>div[style]{width:min(900px,100%)!important;max-width:900px!important}
.model-area{width:100%;max-width:900px;margin:0 auto 10px}.model-tabs,.model-btns{display:flex;flex-wrap:wrap;gap:7px;justify-content:center}.model-tabs{margin-bottom:8px}.model-tab,.model-btn{border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.34);color:var(--text2);font-weight:580;transition:background .16s,border-color .16s,color .16s,transform .16s;white-space:nowrap}.model-tab{height:32px;padding:0 16px;font-size:12px}.model-btn{height:32px;padding:0 11px;font-size:11.6px}.model-tab:hover,.model-btn:hover{border-color:var(--line2);background:var(--soft);color:var(--text);transform:translateY(-1px)}.model-tab.active,.model-btn.active{border-color:var(--line2);background:rgba(26,115,232,.06);color:var(--text);box-shadow:inset 0 1px 0 rgba(255,255,255,.34)}[data-theme=dark] .model-tab,[data-theme=dark] .model-btn{background:rgba(255,255,255,.035)}[data-theme=dark] .model-tab.active,[data-theme=dark] .model-btn.active{background:rgba(138,180,248,.1)}
.input-area{position:relative;z-index:1;padding:8px clamp(16px,4vw,60px) 22px;display:flex;flex-direction:column;align-items:center}.input-box{width:min(900px,100%);min-height:72px;padding:12px 12px 12px 18px;display:flex;align-items:center;gap:12px;flex-wrap:nowrap;border:1px solid var(--line);border-radius:30px;background:var(--input-bg);box-shadow:inset 0 1px 0 rgba(255,255,255,.54),0 18px 46px rgba(60,64,67,.055);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.input-box:focus-within{border-color:var(--line2)}.input-box textarea{flex:1;min-width:0;min-height:42px;max-height:160px;border:0;outline:0;resize:none;background:transparent;color:var(--text);font-size:17px;line-height:1.45}.input-box textarea::placeholder{color:var(--text2);opacity:.72}.send-btn{width:46px;height:46px;flex:0 0 auto;border:0;border-radius:50%;background:var(--accent);color:#fff;font-weight:900;font-size:16px;box-shadow:0 10px 24px rgba(26,115,232,.18);transition:transform .16s,box-shadow .16s,opacity .16s}[data-theme=dark] .send-btn{color:#101211}.send-btn:hover{transform:translateY(-1px);box-shadow:0 12px 26px rgba(26,115,232,.2)}.send-btn:disabled{opacity:.5;cursor:not-allowed}.input-hint{color:var(--text3);font-size:11px;margin-top:8px;text-align:center}.quick-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;width:min(900px,100%)}.quick-btn{height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--text2);font-size:13px}.quick-btn:hover{background:var(--card2);color:var(--text)}
.msg{margin-bottom:24px;animation:fadeIn .3s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.msg-user{display:flex;justify-content:flex-end}.msg-user .bubble{max-width:72%;padding:10px 16px;border-radius:20px;background:var(--card2);line-height:1.7;white-space:pre-wrap;word-break:break-word}.msg-ai .bubble{padding:8px 0;line-height:1.85;white-space:pre-wrap;word-break:break-word}.msg-ai .model-tag{font-size:11px;color:var(--accent);margin-bottom:6px;font-weight:500}.msg-ai .bubble code{background:var(--card2);padding:2px 6px;border-radius:4px;font-size:13px;font-family:"SF Mono","Fira Code",monospace}.msg-ai .bubble pre{background:var(--card2);padding:14px;border-radius:12px;overflow-x:auto;margin:8px 0}.error-text{color:var(--danger)}.typing::after{content:" ┃";animation:blink 1s infinite}@keyframes blink{50%{opacity:0}}
.history-panel,.prompt-panel{position:fixed;top:12px;bottom:12px;z-index:99;width:292px;padding:14px;border:1px solid var(--line);border-radius:24px;background:var(--surface);box-shadow:var(--shadow);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;flex-direction:column;transition:transform .2s,opacity .2s;opacity:0;pointer-events:none}.history-panel{left:64px;transform:translateX(-18px)}.prompt-panel{right:12px;transform:translateX(18px)}.history-panel.open,.prompt-panel.open{transform:translateX(0);opacity:1;pointer-events:auto}.history-header,.prompt-header{height:38px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border:0;padding:0;color:var(--text2);font-size:13px}.history-header h3,.prompt-header h3{font-size:13px}.history-list,.prompt-list{flex:1;overflow:auto;padding:0}.history-item,.prompt-item{padding:10px 12px;border-radius:14px;cursor:pointer;color:var(--text);font-size:13px}.history-item:hover,.prompt-item:hover{background:var(--soft)}.history-empty,.prompt-empty{color:var(--text3);font-size:13px;text-align:center;padding:40px 16px}.prompt-add{padding-top:12px;border-top:1px solid var(--line)}.prompt-add input,.prompt-add textarea{width:100%;margin-bottom:6px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--input-bg);color:var(--text);outline:0}.prompt-add button{width:100%;height:34px;border:0;border-radius:999px;background:var(--accent);color:#fff}.overlay{position:fixed;inset:0;z-index:98;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s}.overlay.active{opacity:1;pointer-events:auto}
.stop-btn{position:fixed;bottom:100px;left:50%;z-index:50;display:none;transform:translateX(-50%);padding:8px 20px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);box-shadow:var(--shadow)}.stop-btn.visible{display:flex}.code-wrap{position:relative;margin:8px 0}.copy-btn{position:absolute;top:8px;right:8px;border:1px solid var(--line);border-radius:999px;background:var(--card2);color:var(--text2);padding:3px 10px;font-size:11px;opacity:0}.code-wrap:hover .copy-btn{opacity:1}.retry-btn{display:inline-block;margin-top:8px;padding:4px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card2);color:var(--accent);font-size:12px;cursor:pointer}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--line2);border-radius:3px}
@media(max-width:768px){body{display:block}.sidebar{left:50%;right:auto;top:auto;bottom:10px;z-index:100;width:auto;height:44px;transform:translateX(-50%);flex-direction:row;gap:20px;padding:6px 16px;border:1px solid var(--line);border-radius:999px;background:var(--soft);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.logo{display:none}.sb{width:30px;height:30px;font-size:15px}.main{margin-left:0;height:100svh;grid-template-rows:58px minmax(0,1fr) auto}.main::before{right:12px;bottom:92px;font-size:76px}.topbar{justify-content:space-between;padding:12px 16px 0;text-align:left}.topbar h1{font-size:15px;background:none;-webkit-text-fill-color:var(--text2);color:var(--text2);font-weight:660}.topbar-right{position:static}.tb{width:34px;height:34px;padding:0;font-size:0}.tb::before{content:"+";font-size:20px;color:var(--text2)}.chat-wrap{padding:6px 14px 8px}.empty-state{justify-content:flex-start;transform:none;padding-top:0}.greeting,.greeting-sub,.site-tag{display:none}.model-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.model-btns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}.model-tab,.model-btn{width:100%;min-height:36px;height:auto;padding:7px 6px;font-size:11px;line-height:1.14;overflow:hidden}.input-area{padding:8px 14px 66px}.input-box{min-height:68px;padding:10px 10px 10px 16px;border-radius:30px;box-shadow:none}.send-btn{width:42px;height:42px}.msg-user .bubble{max-width:86%}.history-panel,.prompt-panel{left:0;right:0;top:auto;bottom:64px;width:auto;height:min(68svh,560px);margin:0;border-radius:26px 26px 0 0;transform:translateY(110%)}.history-panel.open,.prompt-panel.open{transform:translateY(0)}.quick-actions{display:none}}
</style>"""

BODY = r"""<body>
<div class="sidebar">
  <img class="logo" src="/icon-40.png" onclick="location.reload()" alt="HD">
  <button class="sb active" title="聊天">💬</button>
  <button class="sb" title="历史" onclick="toggleHistory()">☰</button>
  <button class="sb" title="指令集" onclick="togglePrompts()">📋</button>
  <div class="s-spacer"></div>
  <button class="sb" id="themeBtn2" title="切换主题" onclick="toggleTheme()">🌙</button>
  <button class="sb" title="记忆" onclick="showMemo()">🧠</button>
</div>
<button class="stop-btn" id="stopBtn" onclick="stopGen()">■ 停止生成</button>
<div class="overlay" id="overlay" onclick="closeAllPanels()"></div>
<div class="history-panel" id="historyPanel">
  <div class="history-header"><h3>对话历史</h3><span style="cursor:pointer;font-size:18px" onclick="toggleHistory()">×</span></div>
  <div class="history-list" id="historyList"><div class="history-empty">暂无历史对话</div></div>
</div>
<div class="prompt-panel" id="promptPanel">
  <div class="prompt-header"><h3>指令集</h3><span style="cursor:pointer;font-size:18px" onclick="togglePrompts()">×</span></div>
  <div class="prompt-list" id="promptList"><div class="prompt-empty">暂无指令</div></div>
  <div class="prompt-add">
    <input id="pCat" placeholder="分类">
    <input id="pTitle" placeholder="标题">
    <textarea id="pContent" placeholder="指令内容..."></textarea>
    <button onclick="addPrompt()">添加指令</button>
  </div>
</div>
<div class="main">
  <div class="topbar">
    <h1>海东 AI</h1>
    <div class="topbar-right"><button class="tb" onclick="newChat()">＋ 新对话</button></div>
  </div>
  <div class="chat-wrap" id="chatWrap">
    <div class="empty-state" id="emptyState">
      <div class="greeting">今天想把哪件事交给 AI？</div>
      <div style="width:100%;max-width:900px">
        <div class="model-area">
          <div class="model-tabs" id="modelTabsEmpty"><div class="model-tab active" data-group="chat">💬 对话</div><div class="model-tab" data-group="image">🎨 生图</div></div>
          <div class="model-btns" id="modelSelectWrap"></div>
        </div>
        <div class="input-box"><textarea id="userInput" placeholder="输入想法、任务或问题..." rows="1"></textarea><button class="send-btn" id="sendBtnEmpty" onclick="sendMessage()">➤</button></div>
        <div class="input-hint">AI 可能会出错，请核实重要信息</div>
        <div class="quick-actions" id="quickActionsEmpty"></div>
      </div>
    </div>
    <div class="chat-inner" id="chatInner" style="display:none"></div>
  </div>
  <div class="input-area" id="chatInputArea" style="display:none">
    <div class="model-area">
      <div class="model-tabs" id="modelTabsChat"><div class="model-tab active" data-group="chat">💬 对话</div><div class="model-tab" data-group="image">🎨 生图</div></div>
      <div class="model-btns" id="modelSelectWrap2"></div>
    </div>
    <div class="input-box"><textarea id="userInput2" placeholder="继续聊天..." rows="1"></textarea><button class="send-btn" id="sendBtnChat" onclick="sendMessage()">➤</button></div>
    <div class="input-hint">输入 /memo 内容 可写入记忆库</div>
  </div>
</div>
"""


SCRIPT = r"""<script>
let modelData=MODEL_DATA_PLACEHOLDER;
let currentGroup='chat',currentModel='',messages=[],streaming=false,convId=genId(),abortCtrl=null,lastUserMsg='';

const qaData={
  chat:[
    {icon:'深',label:'深度推理',prompt:'请帮我深度分析以下问题，给出清晰结论和推理过程：'},
    {icon:'文',label:'写文案',prompt:'帮我写一段简洁有力、有场景感的产品文案：'},
    {icon:'码',label:'写代码',prompt:'请实现以下功能，代码简洁、可直接运行，并说明关键点：'},
    {icon:'析',label:'数据分析',prompt:'请帮我分析以下数据，找出关键趋势和洞察：'}
  ],
  image:[
    {icon:'图',label:'电商主图',prompt:'生成一张电商产品白底主图，产品居中，高端质感，专业摄影风格'},
    {icon:'景',label:'场景图',prompt:'生成一张产品场景图，自然光线，温暖真实，产品融入生活场景'},
    {icon:'简',label:'极简高级',prompt:'生成一张极简高级感图片，大量留白，精致排版，黑白灰为主'},
    {icon:'海',label:'创意海报',prompt:'生成一张现代创意海报，排版克制，视觉中心明确'}
  ]
};

function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function $(id){return document.getElementById(id)}
function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function autoScroll(id){const el=$(id); if(el) el.scrollTop=el.scrollHeight}

function toggleTheme(){
  const h=document.documentElement,t=h.getAttribute('data-theme'),n=t==='dark'?'light':'dark';
  h.setAttribute('data-theme',n);localStorage.setItem('ai_chat_theme',n);
  const b=$('themeBtn2'); if(b)b.textContent=n==='dark'?'🌙':'☀️';
}

function applySavedTheme(){
  const s=localStorage.getItem('ai_chat_theme')||'light';
  document.documentElement.setAttribute('data-theme',s);
  const b=$('themeBtn2'); if(b)b.textContent=s==='dark'?'🌙':'☀️';
}

async function ensureAuth(){
  try{
    const r=await fetch('/api/auth/check');
    const d=await r.json();
    if(d.authed)return true;
  }catch(e){}
  const password=prompt('请输入访问密码');
  if(!password)return false;
  const login=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}).then(r=>r.json()).catch(()=>({error:'登录失败'}));
  if(login.ok)return true;
  alert(login.error||'密码错误');
  return false;
}

function loadModels(){
  if(modelData&&modelData.chat){
    if(modelData.chat.length&&!currentModel)currentModel=modelData.chat[0].id;
    initModelTabs('modelTabsEmpty','modelSelectWrap');
    initModelTabs('modelTabsChat','modelSelectWrap2');
    renderQuickActions(currentGroup);
    return;
  }
  fetch('/api/models').then(r=>r.json()).then(d=>{
    modelData=d;
    if(d.chat&&d.chat.length&&!currentModel)currentModel=d.chat[0].id;
    initModelTabs('modelTabsEmpty','modelSelectWrap');
    initModelTabs('modelTabsChat','modelSelectWrap2');
    renderQuickActions(currentGroup);
  });
}

function initModelTabs(tabsId,wrapId){
  const tabs=$(tabsId),wrap=$(wrapId);
  if(!tabs||!wrap)return;
  tabs.querySelectorAll('.model-tab').forEach(tab=>{
    tab.onclick=()=>switchModelGroup(tab.dataset.group);
    tab.classList.toggle('active',tab.dataset.group===currentGroup);
  });
  renderModelButtons(wrapId,currentGroup);
}

function switchModelGroup(group){
  currentGroup=group;
  if(modelData[group]&&modelData[group].length&&!modelData[group].some(m=>m.id===currentModel)){
    currentModel=modelData[group][0].id;
  }
  ['modelTabsEmpty','modelTabsChat'].forEach(tid=>{
    const tabs=$(tid); if(!tabs)return;
    tabs.querySelectorAll('.model-tab').forEach(t=>t.classList.toggle('active',t.dataset.group===group));
  });
  renderModelButtons('modelSelectWrap',group);
  renderModelButtons('modelSelectWrap2',group);
  renderQuickActions(group);
}

function renderModelButtons(wrapId,group){
  const wrap=$(wrapId); if(!wrap)return;
  const list=(modelData&&modelData[group])||[];
  if(!list.length){wrap.innerHTML='';return}
  wrap.style.display='';
  wrap.innerHTML=list.map(m=>`<button class="model-btn ${m.id===currentModel?'active':''}" data-model="${esc(m.id)}" onclick="selectModel('${String(m.id).replace(/'/g,"\\'")}')">${esc(m.name)}</button>`).join('');
}

function selectModel(id){
  currentModel=id;
  ['modelSelectWrap','modelSelectWrap2'].forEach(wid=>{
    const wrap=$(wid); if(!wrap)return;
    wrap.querySelectorAll('.model-btn').forEach(b=>b.classList.toggle('active',b.dataset.model===id));
  });
}

function getActiveModel(){return currentModel||((modelData.chat||[])[0]||{}).id||'GPT-4o'}
function getActiveInput(){return $('chatInputArea').style.display!=='none'?'userInput2':'userInput'}

function setupTextarea(el){
  if(!el)return;
  el.addEventListener('input',()=>{el.style.height='auto';el.style.height=Math.min(el.scrollHeight,160)+'px'});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});
}

function renderMd(t){
  let txt=String(t??'');
  const imgM=txt.match(/!\[[^\]]*\]\((data:image\/[^)]+)\)/);
  let img='';
  if(imgM){img=`<img src="${imgM[1]}" style="max-width:100%;border-radius:14px;margin:8px 0"><br>`;txt=txt.replace(/!\[[^\]]*\]\(data:image\/[^)]+\)/,'');}
  let s=esc(txt);
  s=s.replace(/```(\w*)\n?([\s\S]*?)```/g,(m,lang,code)=>{
    const id='cb'+Math.random().toString(36).slice(2,8);
    return `<div class="code-wrap"><button class="copy-btn" onclick="copyCode('${id}')">复制</button><pre><code id="${id}">${esc(code)}</code></pre></div>`;
  });
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  return img+s;
}

function appendMsg(role,content,modelTag){
  $('emptyState').style.display='none';
  $('chatInputArea').style.display='flex';
  const ci=$('chatInner');ci.style.display='block';
  const d=document.createElement('div');d.className='msg '+(role==='user'?'msg-user':'msg-ai');
  d.innerHTML=(modelTag?`<div class="model-tag">${esc(modelTag)}</div>`:'')+`<div class="bubble">${renderMd(content)}</div>`;
  ci.appendChild(d);autoScroll('chatWrap');return d;
}

function copyCode(id){
  const el=$(id); if(!el)return;
  navigator.clipboard.writeText(el.textContent||'');
}

async function ensureConversation(){
  const title=(messages.find(m=>m.role==='user')?.content||'新对话').slice(0,60);
  await fetch('/api/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:convId,title,model:getActiveModel()})}).catch(()=>{});
}

async function saveMsg(role,content){
  await ensureConversation();
  return fetch(`/api/conversations/${convId}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,content})}).catch(()=>{});
}

function handleMemoCommand(text){
  const m=text.match(/^\/memo\s+(.+)/i);
  if(!m)return false;
  fetch('/api/memo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'append',text:m[1]})})
    .then(r=>r.json()).then(d=>appendMsg('ai',d.ok?'已写入记忆库':'写入失败：'+(d.error||'未知错误'),'')); 
  return true;
}

async function sendMessage(){
  if(streaming)return;
  const input=$(getActiveInput());
  const text=input.value.trim();
  if(!text)return;
  input.value='';input.style.height='auto';lastUserMsg=text;
  appendMsg('user',text);messages.push({role:'user',content:text});saveMsg('user',text);
  if(handleMemoCommand(text))return;
  const ai=appendMsg('ai','',getActiveModel());
  const bubble=ai.querySelector('.bubble');
  let acc='';streaming=true;abortCtrl=new AbortController();
  setSending(true);$('stopBtn').classList.add('visible');
  try{
    const resp=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:getActiveModel(),messages}),signal:abortCtrl.signal});
    const ct=resp.headers.get('content-type')||'';
    if(!ct.includes('text/event-stream')){
      const d=await resp.json().catch(()=>({error:'请求失败'}));
      throw new Error(d.error||'请求失败');
    }
    const reader=resp.body.getReader();const dec=new TextDecoder();let buf='';
    while(true){
      const {value,done}=await reader.read(); if(done)break;
      buf+=dec.decode(value,{stream:true});
      const parts=buf.split('\n\n');buf=parts.pop();
      for(const part of parts){
        const line=part.split('\n').find(x=>x.startsWith('data: ')); if(!line)continue;
        const data=line.slice(6); if(data==='[DONE]')continue;
        const j=JSON.parse(data);
        if(j.error)throw new Error(j.error);
        const delta=j.choices?.[0]?.delta?.content||'';
        if(delta){acc+=delta;bubble.innerHTML=renderMd(acc)+'<span class="typing"></span>';autoScroll('chatWrap');}
      }
    }
    bubble.innerHTML=renderMd(acc||'完成');
    messages.push({role:'assistant',content:acc||'完成'});
    saveMsg('assistant',acc||'完成');
  }catch(e){
    if(e.name!=='AbortError'){
      bubble.innerHTML=`<span class="error-text">${esc(e.message||'请求失败')}</span><br><button class="retry-btn" onclick="retryLast()">重试</button>`;
    }
  }finally{
    streaming=false;setSending(false);$('stopBtn').classList.remove('visible');abortCtrl=null;loadHistory();
  }
}

function setSending(on){
  ['sendBtnEmpty','sendBtnChat'].forEach(id=>{const b=$(id); if(b)b.disabled=on});
}
function stopGen(){if(abortCtrl)abortCtrl.abort()}
function retryLast(){const id=getActiveInput();$(id).value=lastUserMsg;sendMessage()}

function newChat(){
  messages=[];convId=genId();
  $('emptyState').style.display='flex';$('chatInner').style.display='none';$('chatInner').innerHTML='';
  $('chatInputArea').style.display='none';$('userInput').value='';$('userInput2').value='';
  closeAllPanels();
}

function toggleHistory(){const p=$('historyPanel'),o=$('overlay'),open=p.classList.contains('open');closeAllPanels();if(!open){p.classList.add('open');o.classList.add('active');loadHistory();}}
function togglePrompts(){const p=$('promptPanel'),o=$('overlay'),open=p.classList.contains('open');closeAllPanels();if(!open){p.classList.add('open');o.classList.add('active');loadPrompts();}}
function closeAllPanels(){$('historyPanel').classList.remove('open');$('promptPanel').classList.remove('open');$('overlay').classList.remove('active')}

function loadHistory(){
  fetch('/api/conversations').then(r=>r.json()).then(list=>{
    const el=$('historyList');
    if(!Array.isArray(list)||!list.length){el.innerHTML='<div class="history-empty">暂无历史对话</div>';return}
    el.innerHTML=list.map(c=>`<div class="history-item ${c.pinned?'pinned':''}" onclick="loadConv('${c.id}')">
      <span class="pin-btn ${c.pinned?'active':''}" onclick="event.stopPropagation();togglePin('${c.id}')" title="${c.pinned?'取消置顶':'置顶'}">${c.pinned?'置顶':'固定'}</span>
      <span class="hi-title" ondblclick="event.stopPropagation();renameConv('${c.id}',this)">${esc(c.title)}</span>
      <span class="hi-del" onclick="event.stopPropagation();delConv('${c.id}')">×</span>
    </div>`).join('');
  }).catch(()=>{$('historyList').innerHTML='<div class="history-empty">无法读取历史</div>'});
}

function loadConv(id){
  fetch(`/api/conversations/${id}/messages`).then(r=>r.json()).then(list=>{
    if(!Array.isArray(list))return;
    convId=id;messages=[];$('emptyState').style.display='none';$('chatInputArea').style.display='flex';
    const ci=$('chatInner');ci.style.display='block';ci.innerHTML='';
    list.forEach(m=>{messages.push({role:m.role,content:m.content});appendMsg(m.role,m.content,m.role==='assistant'?getActiveModel():'')});
    closeAllPanels();
  });
}

function delConv(id){if(!confirm('删除这条对话？'))return;fetch(`/api/conversations/${id}`,{method:'DELETE'}).then(()=>loadHistory())}
function togglePin(id){fetch(`/api/conversations/${id}/pin`,{method:'POST'}).then(()=>loadHistory())}
function renameConv(id,titleEl){
  const title=prompt('新标题',titleEl.textContent.trim()); if(!title)return;
  fetch(`/api/conversations/${id}/rename`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title})}).then(()=>loadHistory());
}

function loadPrompts(){
  fetch('/api/prompts').then(r=>r.json()).then(list=>{
    const el=$('promptList');
    if(!Array.isArray(list)||!list.length){el.innerHTML='<div class="prompt-empty">暂无指令</div>';return}
    el.innerHTML=list.map(p=>`<div class="prompt-item" onclick="fillPrompt('${String(p.content).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n')}')">
      <div class="pi-title">${esc(p.title||'未命名')}</div><div class="pi-content">${esc(p.category||'指令')} · ${esc(p.content||'')}</div>
      <div class="pi-actions"><span onclick="event.stopPropagation();deletePrompt(${p.id})">删除</span></div>
    </div>`).join('');
  }).catch(()=>{$('promptList').innerHTML='<div class="prompt-empty">无法读取指令</div>'});
}

function addPrompt(){
  const category=$('pCat').value.trim(),title=$('pTitle').value.trim(),content=$('pContent').value.trim();
  if(!content)return;
  fetch('/api/prompts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category,title,content})}).then(()=>{$('pCat').value='';$('pTitle').value='';$('pContent').value='';loadPrompts();});
}
function deletePrompt(id){fetch(`/api/prompts/${id}`,{method:'DELETE'}).then(()=>loadPrompts())}
function fillPrompt(text){const input=$(getActiveInput());input.value=text;input.focus();input.dispatchEvent(new Event('input'));closeAllPanels()}

function renderQuickActions(group){
  const el=$('quickActionsEmpty'); if(!el)return;
  const items=qaData[group]||qaData.chat;
  el.innerHTML=items.map(a=>`<button class="quick-btn" onclick="fillPrompt('${a.prompt.replace(/'/g,"\\'")}')">${a.icon} ${a.label}</button>`).join('');
}

function showMemo(){
  fetch('/api/memo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'read'})})
    .then(r=>r.json()).then(d=>alert(d.content||'暂无记忆'));
}

window.addEventListener('load',async()=>{
  applySavedTheme();
  setupTextarea($('userInput'));setupTextarea($('userInput2'));
  loadModels();
  await ensureAuth();
});
</script>"""


def build_template() -> str:
    head = """<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>海东 AI</title>
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#f8f9fb">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
"""
    return f"{head}{STYLE}\n</head>\n{BODY}\n{SCRIPT}\n</body>\n</html>\n"


def main() -> None:
    if TEMPLATE.exists():
        backup = TEMPLATE.with_name(f"template.v2-full-backup.{datetime.now():%Y%m%d%H%M%S}.html")
        backup.write_text(TEMPLATE.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        backup = None
    TEMPLATE.write_text(build_template(), encoding="utf-8")
    print("ai.haidong.chat full V2 template written")
    if backup:
        print(f"backup: {backup}")


if __name__ == "__main__":
    main()
