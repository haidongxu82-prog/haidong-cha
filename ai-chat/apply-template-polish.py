#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re

TEMPLATE = Path("/opt/ai_chat/template.html")

CSS = r"""
/* Haidong AI chat: minimal premium */
:root{
  color-scheme:dark;
  --m-bg:#080908;
  --m-surface:#0f110f;
  --m-surface-2:#171917;
  --m-line:rgba(255,255,255,.10);
  --m-line-strong:rgba(255,255,255,.18);
  --m-text:#f7f4ec;
  --m-muted:#8f958b;
  --m-soft:#c6c8bd;
  --m-accent:#c59a3b;
}

[data-theme="light"]{
  color-scheme:light;
  --m-bg:#f5f5f1;
  --m-surface:#ffffff;
  --m-surface-2:#eceee8;
  --m-line:rgba(18,21,17,.10);
  --m-line-strong:rgba(18,21,17,.18);
  --m-text:#151713;
  --m-muted:#747a70;
  --m-soft:#40463d;
  --m-accent:#9d7628;
}

*{letter-spacing:0!important}
html,body{height:100%;width:100%;overflow:hidden;background:var(--m-bg)!important}
body{color:var(--m-text)!important;background:var(--m-bg)!important;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif!important}
body::before,body::after{display:none!important;content:none!important}

.sidebar{width:58px!important;background:var(--m-bg)!important;border-right:1px solid var(--m-line)!important;padding:13px 8px!important;gap:6px!important;box-shadow:none!important;backdrop-filter:none!important}
.logo{width:34px!important;height:34px!important;border-radius:9px!important;box-shadow:none!important;opacity:.92!important}
.sb{position:relative!important;width:38px!important;height:38px!important;border-radius:9px!important;border:1px solid transparent!important;background:transparent!important;color:rgba(247,244,236,.48)!important;box-shadow:none!important;font-size:17px!important;transition:background .16s,border-color .16s,color .16s!important}
.sb:hover{background:rgba(255,255,255,.045)!important;color:var(--m-soft)!important;border-color:transparent!important}
.sb.active{background:transparent!important;color:var(--m-text)!important;border-color:transparent!important}
.sb.active::before{content:"";position:absolute;left:-8px;top:11px;bottom:11px;width:2px;border-radius:999px;background:var(--m-accent)}

.main{margin-left:58px!important;height:100svh!important;background:var(--m-bg)!important}
.topbar{min-height:64px!important;padding:0 clamp(22px,3vw,40px)!important;background:rgba(8,9,8,.88)!important;border-bottom:1px solid var(--m-line)!important;backdrop-filter:blur(14px)!important}
[data-theme="light"] .topbar{background:rgba(245,245,241,.88)!important}
.topbar h1{font-size:18px!important;line-height:1.2!important;color:var(--m-text)!important;font-weight:780!important}
.topbar h1::after{content:" / 私人工作台";margin-left:8px;color:var(--m-muted);font-size:13px;font-weight:650}
.tb{min-height:38px!important;border-radius:9px!important;padding:7px 13px!important;background:transparent!important;color:var(--m-soft)!important;border:1px solid var(--m-line-strong)!important;box-shadow:none!important;font-size:14px!important;font-weight:720!important}
.tb:hover{background:var(--m-surface-2)!important;color:var(--m-text)!important}

.chat-wrap{flex:1 1 auto!important;overflow-y:auto!important;padding:0!important;background:var(--m-bg)!important}
.empty-state{min-height:calc(100svh - 64px)!important;height:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:44px clamp(24px,6vw,76px) 58px!important;text-align:left!important}
.empty-state > div[style*="max-width"]{width:100%!important;max-width:820px!important}
.greeting{max-width:820px!important;margin:0 auto 14px!important;color:var(--m-text)!important;background:none!important;-webkit-text-fill-color:currentColor!important;font-size:clamp(36px,4.8vw,64px)!important;line-height:1.08!important;font-weight:820!important;text-align:left!important;text-wrap:balance!important}
.greeting-sub{max-width:820px!important;margin:0 auto 18px!important;color:var(--m-muted)!important;font-size:clamp(15px,1.4vw,18px)!important;line-height:1.75!important;font-weight:520!important;text-align:left!important}
.site-tag{display:inline-flex!important;margin:0 0 30px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:var(--m-accent)!important;font-size:12px!important;line-height:1.2!important;letter-spacing:.12em!important;text-transform:uppercase!important;font-weight:760!important}

.model-area{width:100%!important;max-width:820px!important;margin:0 auto 12px!important}
.model-tabs,.model-btns{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important}
.model-tabs{margin-bottom:10px!important}
.model-tab,.model-btn{border:1px solid var(--m-line)!important;background:transparent!important;color:var(--m-muted)!important;box-shadow:none!important;white-space:nowrap!important;font-weight:680!important;transition:background .16s,border-color .16s,color .16s!important}
.model-tab{border-radius:999px!important;padding:7px 13px!important;font-size:13px!important}
.model-btn{border-radius:9px!important;padding:7px 11px!important;font-size:12px!important}
.model-tab:hover,.model-btn:hover{background:var(--m-surface-2)!important;color:var(--m-text)!important;border-color:var(--m-line-strong)!important}
.model-tab.active,.model-btn.active{background:var(--m-text)!important;border-color:var(--m-text)!important;color:var(--m-bg)!important}

.input-box{width:100%!important;max-width:820px!important;min-height:72px!important;margin:0 auto!important;padding:12px!important;border-radius:16px!important;border:1px solid var(--m-line-strong)!important;background:var(--m-surface)!important;box-shadow:none!important}
.input-box:focus-within{border-color:rgba(197,154,59,.75)!important;box-shadow:0 0 0 1px rgba(197,154,59,.18)!important}
.input-box textarea{min-height:42px!important;max-height:170px!important;color:var(--m-text)!important;font-size:17px!important;line-height:1.55!important}
.input-box textarea::placeholder{color:var(--m-muted)!important}
.send-btn{width:46px!important;height:46px!important;border-radius:12px!important;background:var(--m-accent)!important;color:#090908!important;box-shadow:none!important;font-size:17px!important;font-weight:900!important}
.send-btn:hover{transform:none!important;filter:brightness(1.08)!important}
.input-hint{width:100%!important;max-width:820px!important;margin:9px auto 0!important;color:var(--m-muted)!important;text-align:center!important;font-size:12px!important}
.quick-actions{width:100%!important;max-width:820px!important;margin:14px auto 0!important;justify-content:flex-start!important}
.quick-btn{background:transparent!important;border:1px solid var(--m-line)!important;color:var(--m-muted)!important;box-shadow:none!important}
.quick-btn:hover{background:var(--m-surface-2)!important;color:var(--m-text)!important;transform:none!important}

.chat-inner{max-width:860px!important;margin:0 auto!important;padding:28px 22px 24px!important}
.msg{margin-bottom:24px!important}
.msg-user .bubble{max-width:min(76%,680px)!important;border-radius:14px!important;background:var(--m-surface-2)!important;color:var(--m-text)!important;border:1px solid var(--m-line)!important;box-shadow:none!important}
.msg-ai .bubble{max-width:820px!important;border-radius:12px!important;background:transparent!important;color:var(--m-text)!important;border:1px solid var(--m-line)!important;box-shadow:none!important}
.msg-ai .model-tag{color:var(--m-accent)!important;font-weight:720!important}

.input-area{border-top:1px solid var(--m-line)!important;background:rgba(8,9,8,.92)!important;padding:12px clamp(22px,3vw,40px) max(18px,env(safe-area-inset-bottom))!important;backdrop-filter:blur(14px)!important}
[data-theme="light"] .input-area{background:rgba(245,245,241,.92)!important}
.history-panel,.prompt-panel{background:var(--m-surface)!important;border-color:var(--m-line)!important;box-shadow:none!important}
.history-item:hover,.prompt-item:hover{background:var(--m-surface-2)!important}

@media(max-width:768px){
  html,body{height:100svh!important;overflow:hidden!important}
  .sidebar{left:0!important;right:0!important;top:auto!important;bottom:0!important;width:auto!important;height:58px!important;flex-direction:row!important;justify-content:center!important;padding:6px max(18px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left))!important;gap:clamp(18px,8vw,42px)!important;border-right:0!important;border-top:1px solid var(--m-line)!important;background:rgba(8,9,8,.94)!important;backdrop-filter:blur(16px)!important}
  .logo,.s-spacer{display:none!important}
  .sb{width:34px!important;height:34px!important;border-radius:8px!important;font-size:17px!important;color:rgba(247,244,236,.46)!important}
  .sb:hover,.sb.active{background:transparent!important;border-color:transparent!important;color:var(--m-text)!important}
  .sb.active::before{left:9px;right:9px;top:auto;bottom:-7px;width:auto;height:2px}
  .main{margin-left:0!important;height:100svh!important;padding-bottom:58px!important}
  .topbar{min-height:58px!important;padding:0 16px!important}
  .topbar h1{font-size:18px!important}
  .topbar h1::after{display:none!important}
  .tb{min-height:36px!important;padding:7px 11px!important;font-size:14px!important}
  .empty-state{min-height:calc(100svh - 116px)!important;align-items:stretch!important;justify-content:flex-start!important;padding:30px 16px 18px!important}
  .greeting{max-width:100%!important;font-size:clamp(28px,8.6vw,36px)!important;line-height:1.12!important;margin-bottom:10px!important}
  .greeting-sub{max-width:100%!important;font-size:14px!important;line-height:1.58!important;margin-bottom:14px!important}
  .site-tag{margin-bottom:18px!important;font-size:10px!important}
  .empty-state > div[style*="max-width"]{max-width:none!important;width:100%!important}
  .model-area{max-width:none!important;margin-bottom:12px!important}
  .model-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;overflow:visible!important}
  .model-btns{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;overflow:visible!important}
  .model-tab{width:100%!important;min-width:0!important;text-align:center!important;padding:8px 10px!important;font-size:13px!important}
  .model-btn{width:100%!important;min-width:0!important;max-width:none!important;overflow:hidden!important;text-overflow:ellipsis!important;text-align:left!important;padding:8px 10px!important;font-size:12px!important}
  .input-box{max-width:none!important;min-height:74px!important;border-radius:16px!important;padding:11px!important}
  .input-box textarea{min-width:0!important;min-height:44px!important;max-height:128px!important;font-size:18px!important}
  .send-btn{width:48px!important;height:48px!important;border-radius:13px!important;flex:0 0 auto!important}
  .quick-actions{display:none!important}
  .chat-inner{padding:18px 14px 18px!important}
  .msg-user .bubble,.msg-ai .bubble{max-width:92%!important;font-size:15.5px!important;line-height:1.75!important}
  .input-area{position:sticky!important;bottom:0!important;padding:10px 14px 12px!important}
  .history-panel,.prompt-panel{left:0!important;right:0!important;top:auto!important;bottom:58px!important;width:auto!important;height:min(72svh,620px)!important;transform:translateY(105%)!important;border-right:0!important;border-left:0!important;border-top:1px solid var(--m-line)!important;border-radius:16px 16px 0 0!important}
  .history-panel.open,.prompt-panel.open{transform:translateY(0)!important}
}

@media(max-width:430px){
  .empty-state{padding-top:26px!important}
  .greeting{font-size:clamp(27px,8.8vw,34px)!important}
}
"""


def remove_blocks(html: str) -> str:
    ids = [
        "hd-polish-v2",
        "hd-mobile-v3",
        "hd-ai-workbench-v4",
        "hd-ai-minimal-premium-v5",
        "hd-ai-minimal-premium",
    ]
    for block_id in ids:
        html = re.sub(
            rf"\n?<style\s+id=[\"']{re.escape(block_id)}[\"'][^>]*>.*?</style>\n?",
            "\n",
            html,
            flags=re.S,
        )
    return html


def main() -> None:
    if not TEMPLATE.exists():
        raise SystemExit(f"template not found: {TEMPLATE}")

    html = TEMPLATE.read_text(encoding="utf-8")
    backup = TEMPLATE.with_name(f"template.git-deploy-backup.{datetime.now():%Y%m%d%H%M%S}.html")
    backup.write_text(html, encoding="utf-8")

    html = remove_blocks(html)
    html = re.sub(r"<title>.*?</title>", "<title>海东 AI 对话</title>", html, count=1, flags=re.S)
    html = re.sub(
        r'<meta name="theme-color" content="[^"]+">',
        '<meta name="theme-color" content="#080908">',
        html,
        count=1,
    )

    replacements = {
        "<h1>海东 AI Chat</h1>": "<h1>海东 AI 对话</h1>",
        '<div class="greeting">你好，海东</div>': '<div class="greeting">今天要推进什么？</div>',
        '<div class="greeting">今天想把哪件事交给 AI？</div>': '<div class="greeting">今天要推进什么？</div>',
        '<div class="greeting">今天想让 AI 帮你推进什么？</div>': '<div class="greeting">今天要推进什么？</div>',
        '<div class="greeting-sub">需要我做些什么？</div>': '<div class="greeting-sub">写作、整理、拆解任务、生成图片。保持简单，直接开始。</div>',
        '<div class="greeting-sub">这里是海东的私人 AI 工作台，适合写作、整理、拆解任务和生成图片。</div>': '<div class="greeting-sub">写作、整理、拆解任务、生成图片。保持简单，直接开始。</div>',
        '<div class="greeting-sub">写作、整理、拆解任务、生成图片，都可以从这里开始。</div>': '<div class="greeting-sub">写作、整理、拆解任务、生成图片。保持简单，直接开始。</div>',
        '<div class="site-tag">私有 AI 交互前端</div>': '<div class="site-tag">Private AI Workspace</div>',
        '<div class="site-tag">Hangzhou AI workspace</div>': '<div class="site-tag">Private AI Workspace</div>',
        '<div class="site-tag">Hangzhou AI Workspace</div>': '<div class="site-tag">Private AI Workspace</div>',
        'placeholder="有什么想聊的..."': 'placeholder="输入想法、任务或问题..."',
        'placeholder="继续聊天..."': 'placeholder="继续补充，或者按 Enter 发送..."',
    }
    for old, new in replacements.items():
        html = html.replace(old, new)

    html = html.replace(
        '<textarea id="pContent" placeholder="指令内容..."></textarea>\n    <textarea id="pContent" placeholder="指令内容..."></textarea>',
        '<textarea id="pContent" placeholder="指令内容..."></textarea>',
    )
    html = html.replace(
        "  if(!isOpen){p.classList.add('open');o.classList.add('active');loadPrompts();}\n  if(!isOpen){p.classList.add('open');o.classList.add('active');loadPrompts();}",
        "  if(!isOpen){p.classList.add('open');o.classList.add('active');loadPrompts();}",
    )

    html = html.replace(
        "</head>",
        f'\n<style id="hd-ai-minimal-premium">\n{CSS}\n</style>\n</head>',
        1,
    )

    TEMPLATE.write_text(html, encoding="utf-8")
    print("ai.haidong.chat template updated")
    print(f"backup: {backup}")


if __name__ == "__main__":
    main()
