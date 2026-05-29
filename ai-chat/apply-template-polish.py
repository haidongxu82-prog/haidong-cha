#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re

TEMPLATE = Path("/opt/ai_chat/template.html")

CSS = r"""
/* Haidong AI chat: Gemini-inspired minimal premium */
:root{
  color-scheme:dark;
  --m-bg:#1b1c1d;
  --m-surface:#242628;
  --m-surface-2:#2d3033;
  --m-line:rgba(255,255,255,.08);
  --m-line-strong:rgba(255,255,255,.14);
  --m-text:#f1f3f4;
  --m-muted:#9aa0a6;
  --m-soft:#c8cdd2;
  --m-accent:#8ab4f8;
  --m-accent-2:#c58af9;
}

[data-theme="light"]{
  color-scheme:light;
  --m-bg:#f8fafd;
  --m-surface:#ffffff;
  --m-surface-2:#edf2f7;
  --m-line:rgba(32,33,36,.08);
  --m-line-strong:rgba(32,33,36,.14);
  --m-text:#202124;
  --m-muted:#6f7782;
  --m-soft:#3c4043;
  --m-accent:#1a73e8;
  --m-accent-2:#9334e6;
}

*{letter-spacing:0!important}
html,body{height:100%;width:100%;overflow:hidden;background:var(--m-bg)!important}
body{color:var(--m-text)!important;background:var(--m-bg)!important;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif!important}
body::before,body::after{display:none!important;content:none!important}

.sidebar{width:60px!important;background:var(--m-bg)!important;border-right:0!important;padding:14px 9px!important;gap:6px!important;box-shadow:none!important;backdrop-filter:none!important}
.logo{width:34px!important;height:34px!important;border-radius:10px!important;box-shadow:none!important;opacity:.92!important}
.sb{position:relative!important;width:40px!important;height:40px!important;border-radius:999px!important;border:1px solid transparent!important;background:transparent!important;color:rgba(241,243,244,.48)!important;box-shadow:none!important;font-size:0!important;transition:background .16s,border-color .16s,color .16s!important}
.sb::after{font-size:16px!important;line-height:1!important}
.sb[title="聊天"]::after{content:"✦"}
.sb[title="历史"]::after{content:"☰"}
.sb[title="指令集"]::after{content:"⌘"}
.sb[title="切换主题"]::after{content:"◐"}
.sb[title="记忆"]::after{content:"◎"}
.sb:hover{background:rgba(255,255,255,.07)!important;color:var(--m-soft)!important;border-color:transparent!important}
.sb.active{background:transparent!important;color:var(--m-text)!important;border-color:transparent!important}
.sb.active::before{content:"";position:absolute;left:-5px;top:13px;bottom:13px;width:2px;border-radius:999px;background:var(--m-accent)}

.main{margin-left:60px!important;height:100svh!important;background:var(--m-bg)!important}
.topbar{min-height:64px!important;padding:0 clamp(22px,3vw,40px)!important;background:rgba(27,28,29,.78)!important;border-bottom:0!important;backdrop-filter:blur(18px)!important}
[data-theme="light"] .topbar{background:rgba(248,250,253,.78)!important}
.topbar h1{font-size:18px!important;line-height:1.2!important;color:var(--m-text)!important;font-weight:650!important}
.topbar h1::after{content:" / 私人工作台";margin-left:8px;color:var(--m-muted);font-size:13px;font-weight:650}
.tb{min-height:38px!important;border-radius:999px!important;padding:7px 14px!important;background:var(--m-surface)!important;color:var(--m-soft)!important;border:0!important;box-shadow:none!important;font-size:14px!important;font-weight:620!important}
.tb:hover{background:var(--m-surface-2)!important;color:var(--m-text)!important}

.chat-wrap{flex:1 1 auto!important;overflow-y:auto!important;padding:0!important;background:var(--m-bg)!important}
.empty-state{min-height:calc(100svh - 64px)!important;height:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;padding:36px clamp(24px,6vw,76px) 58px!important;text-align:left!important}
.empty-state > div[style*="max-width"]{width:100%!important;max-width:880px!important}
.greeting{max-width:880px!important;margin:0 auto 12px!important;color:var(--m-text)!important;background:linear-gradient(90deg,var(--m-accent),var(--m-accent-2) 48%,#fbbc04)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;font-size:clamp(40px,5vw,68px)!important;line-height:1.08!important;font-weight:520!important;text-align:left!important;text-wrap:balance!important}
.greeting-sub{max-width:880px!important;margin:0 auto 24px!important;color:var(--m-muted)!important;font-size:clamp(16px,1.4vw,19px)!important;line-height:1.72!important;font-weight:420!important;text-align:left!important}
.site-tag{display:none!important}

.model-area{width:100%!important;max-width:880px!important;margin:0 auto 12px!important}
.model-tabs,.model-btns{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important}
.model-tabs{margin-bottom:10px!important}
.model-tab,.model-btn{border:0!important;background:var(--m-surface)!important;color:var(--m-muted)!important;box-shadow:none!important;white-space:nowrap!important;font-weight:520!important;transition:background .16s,border-color .16s,color .16s!important}
.model-tab{border-radius:999px!important;padding:7px 13px!important;font-size:13px!important}
.model-btn{border-radius:999px!important;padding:7px 12px!important;font-size:12px!important}
.model-tab:hover,.model-btn:hover{background:var(--m-surface-2)!important;color:var(--m-text)!important;border-color:var(--m-line-strong)!important}
.model-tab.active,.model-btn.active{background:rgba(138,180,248,.18)!important;border-color:transparent!important;color:var(--m-text)!important}

.input-box{width:100%!important;max-width:880px!important;min-height:76px!important;margin:0 auto!important;padding:12px 12px 12px 18px!important;border-radius:28px!important;border:0!important;background:var(--m-surface)!important;box-shadow:none!important}
.input-box:focus-within{box-shadow:inset 0 0 0 1px rgba(138,180,248,.28)!important}
.input-box textarea{min-height:42px!important;max-height:170px!important;color:var(--m-text)!important;font-size:17px!important;line-height:1.55!important}
.input-box textarea::placeholder{color:var(--m-muted)!important}
.send-btn{width:46px!important;height:46px!important;border-radius:50%!important;background:var(--m-accent)!important;color:#101418!important;box-shadow:none!important;font-size:17px!important;font-weight:900!important}
.send-btn:hover{transform:none!important;filter:brightness(1.08)!important}
.input-hint{width:100%!important;max-width:880px!important;margin:10px auto 0!important;color:var(--m-muted)!important;text-align:center!important;font-size:12px!important}
.quick-actions{width:100%!important;max-width:880px!important;margin:14px auto 0!important;justify-content:flex-start!important}
.quick-btn{background:var(--m-surface)!important;border:0!important;color:var(--m-muted)!important;box-shadow:none!important}
.quick-btn:hover{background:var(--m-surface-2)!important;color:var(--m-text)!important;transform:none!important}

.chat-inner{max-width:880px!important;margin:0 auto!important;padding:28px 22px 24px!important}
.msg{margin-bottom:24px!important}
.msg-user .bubble{max-width:min(76%,680px)!important;border-radius:14px!important;background:var(--m-surface-2)!important;color:var(--m-text)!important;border:1px solid var(--m-line)!important;box-shadow:none!important}
.msg-ai .bubble{max-width:820px!important;border-radius:12px!important;background:transparent!important;color:var(--m-text)!important;border:1px solid var(--m-line)!important;box-shadow:none!important}
.msg-ai .model-tag{color:var(--m-accent)!important;font-weight:720!important}

.input-area{border-top:0!important;background:rgba(27,28,29,.88)!important;padding:12px clamp(22px,3vw,40px) max(18px,env(safe-area-inset-bottom))!important;backdrop-filter:blur(18px)!important}
[data-theme="light"] .input-area{background:rgba(248,250,253,.88)!important}
.history-panel,.prompt-panel{background:var(--m-surface)!important;border-color:var(--m-line)!important;box-shadow:none!important}
.history-item:hover,.prompt-item:hover{background:var(--m-surface-2)!important}

@media(max-width:768px){
  html,body{height:100svh!important;overflow:hidden!important}
  body{background:var(--m-bg)!important}
  .sidebar{left:50%!important;right:auto!important;top:auto!important;bottom:10px!important;width:auto!important;height:48px!important;transform:translateX(-50%)!important;flex-direction:row!important;justify-content:center!important;padding:6px 12px!important;gap:14px!important;border-right:0!important;border-top:0!important;border-radius:999px!important;background:rgba(36,38,40,.78)!important;backdrop-filter:blur(18px)!important}
  [data-theme="light"] .sidebar{background:rgba(255,255,255,.82)!important;box-shadow:0 10px 32px rgba(60,64,67,.10)!important}
  .logo,.s-spacer{display:none!important}
  .sb{width:32px!important;height:32px!important;border-radius:50%!important;font-size:0!important;color:rgba(241,243,244,.50)!important}
  .sb::after{font-size:15px!important}
  [data-theme="light"] .sb{color:rgba(60,64,67,.58)!important}
  .sb:hover,.sb.active{background:transparent!important;border-color:transparent!important;color:var(--m-text)!important}
  .sb.active::before{display:none!important}
  .main{margin-left:0!important;height:100svh!important;padding-bottom:68px!important}
  .topbar{min-height:54px!important;padding:0 16px!important;background:rgba(248,250,253,.82)!important;backdrop-filter:blur(16px)!important;border-bottom:0!important}
  [data-theme="dark"] .topbar{background:rgba(27,28,29,.82)!important}
  .topbar h1{font-size:18px!important;font-weight:560!important}
  .topbar h1::after{display:none!important}
  .tb{min-height:34px!important;padding:7px 12px!important;font-size:13px!important}
  .chat-wrap{height:calc(100svh - 122px)!important;overflow-y:auto!important}
  .empty-state{min-height:auto!important;height:auto!important;align-items:stretch!important;justify-content:flex-start!important;padding:14px 14px 18px!important}
  .greeting{order:1;max-width:100%!important;font-size:clamp(26px,7.8vw,34px)!important;line-height:1.1!important;margin:0 0 6px!important;font-weight:520!important}
  .greeting-sub{order:2;max-width:100%!important;font-size:13px!important;line-height:1.5!important;margin:0 0 12px!important}
  .site-tag{margin-bottom:18px!important;font-size:10px!important}
  .empty-state > div[style*="max-width"]{order:3;max-width:none!important;width:100%!important;display:flex!important;flex-direction:column!important}
  .model-area{order:1;max-width:none!important;margin:0 0 12px!important;padding:12px!important;border-radius:26px!important;background:rgba(255,255,255,.52)!important;box-shadow:0 14px 42px rgba(60,64,67,.08)!important}
  [data-theme="dark"] .model-area{background:rgba(36,38,40,.72)!important;box-shadow:none!important}
  .model-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;overflow:visible!important;margin-bottom:10px!important}
  .model-btns{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;overflow:visible!important}
  .model-tab{width:100%!important;min-width:0!important;text-align:center!important;padding:8px 10px!important;font-size:13px!important;border-radius:999px!important;background:var(--m-surface-2)!important}
  .model-btn{width:100%!important;min-width:0!important;max-width:none!important;overflow:hidden!important;text-overflow:ellipsis!important;text-align:center!important;padding:7px 7px!important;font-size:10.5px!important;line-height:1.15!important;border-radius:999px!important;background:rgba(255,255,255,.78)!important;color:var(--m-soft)!important}
  [data-theme="dark"] .model-btn{background:rgba(255,255,255,.07)!important;color:var(--m-soft)!important}
  .model-btn.active{background:rgba(26,115,232,.14)!important;color:var(--m-text)!important}
  [data-theme="dark"] .model-btn.active{background:rgba(138,180,248,.20)!important}
  .input-box{order:2;max-width:none!important;min-height:76px!important;border-radius:26px!important;padding:11px 11px 11px 16px!important}
  .input-box textarea{min-width:0!important;min-height:44px!important;max-height:128px!important;font-size:18px!important}
  .send-btn{width:48px!important;height:48px!important;border-radius:13px!important;flex:0 0 auto!important}
  .input-hint{order:3;margin-top:8px!important}
  .quick-actions{display:none!important}
  .chat-inner{padding:18px 14px 18px!important}
  .msg-user .bubble,.msg-ai .bubble{max-width:92%!important;font-size:15.5px!important;line-height:1.75!important}
  .input-area{position:sticky!important;bottom:0!important;padding:10px 14px 12px!important}
  .history-panel,.prompt-panel{left:0!important;right:0!important;top:auto!important;bottom:68px!important;width:auto!important;height:min(72svh,620px)!important;transform:translateY(105%)!important;border-right:0!important;border-left:0!important;border-top:1px solid var(--m-line)!important;border-radius:24px 24px 0 0!important}
  .history-panel.open,.prompt-panel.open{transform:translateY(0)!important}
}

@media(max-width:430px){
  .empty-state{padding-top:16px!important}
  .greeting{font-size:clamp(31px,9.6vw,40px)!important}
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
    html = html.replace('<html lang="zh-CN" data-theme="dark">', '<html lang="zh-CN" data-theme="light">')
    html = re.sub(r"<title>.*?</title>", "<title>海东 AI 对话</title>", html, count=1, flags=re.S)
    html = re.sub(
        r'<meta name="theme-color" content="[^"]+">',
        '<meta name="theme-color" content="#080908">',
        html,
        count=1,
    )

    replacements = {
        "<h1>海东 AI Chat</h1>": "<h1>海东 AI 对话</h1>",
        '<div class="greeting">你好，海东</div>': '<div class="greeting">你好，海东</div>',
        '<div class="greeting">今天要推进什么？</div>': '<div class="greeting">你好，海东</div>',
        '<div class="greeting">今天想把哪件事交给 AI？</div>': '<div class="greeting">你好，海东</div>',
        '<div class="greeting">今天想让 AI 帮你推进什么？</div>': '<div class="greeting">你好，海东</div>',
        '<div class="greeting-sub">需要我做些什么？</div>': '<div class="greeting-sub">把想法、任务和图片交给 AI，简单开始。</div>',
        '<div class="greeting-sub">这里是海东的私人 AI 工作台，适合写作、整理、拆解任务和生成图片。</div>': '<div class="greeting-sub">把想法、任务和图片交给 AI，简单开始。</div>',
        '<div class="greeting-sub">写作、整理、拆解任务、生成图片，都可以从这里开始。</div>': '<div class="greeting-sub">把想法、任务和图片交给 AI，简单开始。</div>',
        '<div class="greeting-sub">写作、整理、拆解任务、生成图片。保持简单，直接开始。</div>': '<div class="greeting-sub">把想法、任务和图片交给 AI，简单开始。</div>',
        '<div class="site-tag">私有 AI 交互前端</div>': '<div class="site-tag">Private AI Workspace</div>',
        '<div class="site-tag">Hangzhou AI workspace</div>': '<div class="site-tag">Private AI Workspace</div>',
        '<div class="site-tag">Hangzhou AI Workspace</div>': '<div class="site-tag">Private AI Workspace</div>',
        'placeholder="有什么想聊的..."': 'placeholder="输入想法、任务或问题..."',
        'placeholder="继续聊天..."': 'placeholder="继续补充，或者按 Enter 发送..."',
        'src="/icon-40.png"': 'src="https://haidong.chat/assets/logo-hd-rotated.png"',
        'src="/icon-512.png"': 'src="https://haidong.chat/assets/logo-hd-rotated.png"',
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
