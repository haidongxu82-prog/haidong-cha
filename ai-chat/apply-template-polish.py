#!/usr/bin/env python3
import re
from datetime import datetime
from pathlib import Path


TEMPLATE = Path("/opt/ai_chat/template.html")
ORIGINAL_TEMPLATE = Path(__file__).resolve().parent / "original-template.html"

STYLE = r"""<style>
*{margin:0;padding:0;box-sizing:border-box;letter-spacing:0}
:root{
  --bg:#f8f9fb;--surface:rgba(255,255,255,.9);--soft:rgba(255,255,255,.68);
  --line:rgba(32,33,36,.08);--line2:rgba(32,33,36,.18);
  --text:#202124;--text2:#6f7782;--text3:#9aa0a6;
  --accent:#1a73e8;--accent2:#9334e6;--input-bg:rgba(255,255,255,.86);
  --card:rgba(255,255,255,.72);--card2:rgba(32,33,36,.055);
  --danger:#b3261e;--success:#188038;--shadow:0 18px 48px rgba(60,64,67,.055);
}
[data-theme="dark"]{
  --bg:#101211;--surface:rgba(27,31,29,.86);--soft:rgba(255,255,255,.055);
  --line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.16);
  --text:#f1f3f4;--text2:#9aa0a6;--text3:#6e7378;
  --accent:#8ab4f8;--accent2:#c58af9;--input-bg:rgba(27,31,29,.86);
  --card:rgba(27,31,29,.72);--card2:rgba(255,255,255,.055);
  --danger:#f28b82;--success:#81c995;--shadow:none;
}
html,body{width:100%;height:100%;overflow:hidden}
body{background:linear-gradient(180deg,#fbfcfe 0%,var(--bg) 44%,#f5f7fa 100%);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
[data-theme="dark"] body{background:linear-gradient(180deg,#111312 0%,var(--bg) 46%,#0c0e0d 100%)}
button,textarea,input{font:inherit}button{cursor:pointer}

.sidebar{position:fixed;left:0;top:0;bottom:0;z-index:100;width:64px;padding:16px 10px;display:flex;flex-direction:column;align-items:center;gap:12px;background:var(--bg);border-right:1px solid var(--line)}
.logo{width:40px!important;height:40px!important;border-radius:12px!important;margin:0 0 2px!important;box-shadow:0 8px 22px rgba(26,115,232,.08)}
.sb{width:38px;height:38px;border:0;border-radius:50%;background:transparent;color:var(--text2);display:grid;place-items:center;font-size:16px;transition:background .16s,color .16s,transform .16s}
.sb:hover,.sb.active{background:var(--card2);color:var(--text);transform:translateY(-1px)}
.s-spacer{flex:1}

.main{margin-left:64px;height:100vh;display:grid;grid-template-rows:76px minmax(0,1fr) auto;position:relative;overflow:hidden}
.main::before{content:"海东 AI";position:absolute;right:clamp(28px,5vw,78px);bottom:clamp(64px,9vh,118px);z-index:0;pointer-events:none;color:rgba(32,33,36,.026);font-size:clamp(72px,11vw,176px);line-height:1;font-weight:680;white-space:nowrap}
[data-theme="dark"] .main::before{color:rgba(255,255,255,.032)}
.topbar{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;padding:20px clamp(20px,4vw,60px) 0}
.topbar h1{font-size:clamp(28px,3.2vw,48px);line-height:1.04;font-weight:540;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.topbar-right{position:absolute;right:clamp(20px,4vw,60px);top:22px;display:flex;gap:8px}
.tb{height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--text2);font-size:13px}
.tb:hover{background:var(--card2);color:var(--text)}

.chat-wrap{position:relative;z-index:1;overflow-y:auto;padding:12px clamp(16px,4vw,60px);scroll-behavior:smooth}
.chat-inner{width:min(900px,100%);margin:0 auto}
.empty-state{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transform:translateY(-34px)}
.greeting{font-size:clamp(38px,6vw,72px);line-height:1.04;font-weight:540;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}
.greeting-sub{display:none}.site-tag{display:none}
.empty-state>div[style]{width:min(900px,100%)!important;max-width:900px!important}

.model-area{width:100%;max-width:900px;margin:0 auto 10px}
.model-tabs,.model-btns{display:flex;flex-wrap:wrap;gap:7px;justify-content:center}
.model-tabs{margin-bottom:8px}
.model-tab,.model-btn{border:1px solid transparent;border-radius:999px;background:transparent;color:var(--text2);font-weight:580;transition:background .16s,border-color .16s,color .16s,transform .16s;white-space:nowrap}
.model-tab{height:32px;padding:0 16px;font-size:12px}
.model-btn{height:32px;padding:0 11px;font-size:11.6px}
.model-tab:hover,.model-btn:hover{border-color:var(--line);background:var(--soft);color:var(--text);transform:translateY(-1px)}
.model-tab.active,.model-btn.active{border-color:var(--line2);background:rgba(26,115,232,.06);color:var(--text);box-shadow:inset 0 1px 0 rgba(255,255,255,.34)}
[data-theme="dark"] .model-tab.active,[data-theme="dark"] .model-btn.active{background:rgba(138,180,248,.1)}

.input-area{position:relative;z-index:1;padding:8px clamp(16px,4vw,60px) 22px;display:flex;flex-direction:column;align-items:center}
.input-box{width:min(900px,100%);min-height:72px;padding:12px 12px 12px 18px;display:flex;align-items:center;gap:12px;flex-wrap:nowrap;border:1px solid var(--line);border-radius:30px;background:var(--input-bg);box-shadow:inset 0 1px 0 rgba(255,255,255,.54),0 18px 46px rgba(60,64,67,.055);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.input-box:focus-within{border-color:var(--line2)}
.input-box textarea{flex:1;min-width:0;min-height:42px;max-height:160px;border:0;outline:0;resize:none;background:transparent;color:var(--text);font-size:17px;line-height:1.45}
.input-box textarea::placeholder{color:var(--text2);opacity:.72}
.send-btn{width:46px;height:46px;flex:0 0 auto;border:0;border-radius:50%;background:var(--accent);color:#fff;font-weight:900;font-size:16px;box-shadow:0 10px 24px rgba(26,115,232,.18);transition:transform .16s,box-shadow .16s,opacity .16s}
[data-theme="dark"] .send-btn{color:#101211}
.send-btn:hover{transform:translateY(-1px);box-shadow:0 12px 26px rgba(26,115,232,.2)}
.send-btn:disabled{opacity:.5;cursor:not-allowed}
.input-hint{color:var(--text3);font-size:11px;margin-top:8px;text-align:center}
.quick-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;width:min(900px,100%)}
.quick-btn{height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--text2);font-size:13px}
.quick-btn:hover{background:var(--card2);color:var(--text)}

.msg{margin-bottom:24px;animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg-user{display:flex;justify-content:flex-end}.msg-user .bubble{max-width:72%;padding:10px 16px;border-radius:20px;background:var(--card2);line-height:1.7;white-space:pre-wrap;word-break:break-word}
.msg-ai .bubble{padding:8px 0;line-height:1.85;white-space:pre-wrap;word-break:break-word}
.msg-ai .model-tag{font-size:11px;color:var(--accent);margin-bottom:6px;font-weight:500}
.msg-ai .bubble code{background:var(--card2);padding:2px 6px;border-radius:4px;font-size:13px;font-family:"SF Mono","Fira Code",monospace}
.msg-ai .bubble pre{background:var(--card2);padding:14px;border-radius:12px;overflow-x:auto;margin:8px 0}.error-text{color:var(--danger)}.typing::after{content:" ┃";animation:blink 1s infinite}@keyframes blink{50%{opacity:0}}

.history-panel,.prompt-panel{position:fixed;top:12px;bottom:12px;z-index:99;width:292px;padding:14px;border:1px solid var(--line);border-radius:24px;background:var(--surface);box-shadow:var(--shadow);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;flex-direction:column;transition:transform .2s,opacity .2s;opacity:0;pointer-events:none}
.history-panel{left:64px;transform:translateX(-18px)}.prompt-panel{right:12px;transform:translateX(18px)}
.history-panel.open,.prompt-panel.open{transform:translateX(0);opacity:1;pointer-events:auto}
.history-header,.prompt-header{height:38px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border:0;padding:0;color:var(--text2);font-size:13px}.history-header h3,.prompt-header h3{font-size:13px}
.history-list,.prompt-list{flex:1;overflow:auto;padding:0}.history-item,.prompt-item{padding:10px 12px;border-radius:14px;cursor:pointer;color:var(--text);font-size:13px}.history-item:hover,.prompt-item:hover{background:var(--soft)}
.history-empty,.prompt-empty{color:var(--text3);font-size:13px;text-align:center;padding:40px 16px}
.prompt-add{padding-top:12px;border-top:1px solid var(--line)}.prompt-add input,.prompt-add textarea{width:100%;margin-bottom:6px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--input-bg);color:var(--text);outline:0}.prompt-add button{width:100%;height:34px;border:0;border-radius:999px;background:var(--accent);color:#fff}
.overlay{position:fixed;inset:0;z-index:98;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s}.overlay.active{opacity:1;pointer-events:auto}
.stop-btn{position:fixed;bottom:100px;left:50%;z-index:50;display:none;transform:translateX(-50%);padding:8px 20px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);box-shadow:var(--shadow)}.stop-btn.visible{display:flex}
.code-wrap{position:relative;margin:8px 0}.copy-btn{position:absolute;top:8px;right:8px;border:1px solid var(--line);border-radius:999px;background:var(--card2);color:var(--text2);padding:3px 10px;font-size:11px;opacity:0}.code-wrap:hover .copy-btn{opacity:1}.retry-btn{display:inline-block;margin-top:8px;padding:4px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card2);color:var(--accent);font-size:12px;cursor:pointer}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--line2);border-radius:3px}

@media(max-width:768px){
  body{display:block}.sidebar{left:50%;right:auto;top:auto;bottom:10px;z-index:100;width:auto;height:44px;transform:translateX(-50%);flex-direction:row;gap:20px;padding:6px 16px;border:1px solid var(--line);border-radius:999px;background:var(--soft);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.logo{display:none}.sb{width:30px;height:30px;font-size:15px}.main{margin-left:0;height:100svh;grid-template-rows:58px minmax(0,1fr) auto}.main::before{right:12px;bottom:92px;font-size:76px}.topbar{justify-content:space-between;padding:12px 16px 0;text-align:left}.topbar h1{font-size:15px;background:none;-webkit-text-fill-color:var(--text2);color:var(--text2);font-weight:660}.topbar-right{position:static}.tb{width:34px;height:34px;padding:0;font-size:0}.tb::before{content:"+";font-size:20px;color:var(--text2)}.chat-wrap{padding:6px 14px 8px}.empty-state{justify-content:flex-start;transform:none;padding-top:0}.greeting,.greeting-sub,.site-tag{display:none}.model-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.model-btns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}.model-tab,.model-btn{width:100%;min-height:36px;height:auto;padding:7px 6px;font-size:11px;line-height:1.14;overflow:hidden}.input-area{padding:8px 14px 66px}.input-box{min-height:68px;padding:10px 10px 10px 16px;border-radius:30px;box-shadow:none}.send-btn{width:42px;height:42px}.msg-user .bubble{max-width:86%}.history-panel,.prompt-panel{left:0;right:0;top:auto;bottom:64px;width:auto;height:min(68svh,560px);margin:0;border-radius:26px 26px 0 0;transform:translateY(110%)}.history-panel.open,.prompt-panel.open{transform:translateY(0)}.quick-actions{display:none}
}
</style>"""


def main() -> None:
    if not ORIGINAL_TEMPLATE.exists():
        raise SystemExit(f"original template not found: {ORIGINAL_TEMPLATE}")

    text = ORIGINAL_TEMPLATE.read_text(encoding="utf-8")
    text = re.sub(r"<style>.*?</style>", STYLE, text, count=1, flags=re.S)
    text = text.replace("<title>海东 AI Chat</title>", "<title>海东 AI</title>")
    text = text.replace("<h1>海东 AI Chat</h1>", "<h1>海东 AI</h1>")
    text = text.replace('<div class="greeting">你好，海东</div>', '<div class="greeting">今天想把哪件事交给 AI？</div>')
    text = text.replace('<div class="greeting-sub">需要我做些什么？</div>', '<div class="greeting-sub"></div>')
    text = text.replace('<div class="site-tag">私有 AI 交互前端</div>', '<div class="site-tag">Haidong AI Workspace</div>')
    duplicate = '    <textarea id="pContent" placeholder="指令内容..."></textarea>\n    <textarea id="pContent" placeholder="指令内容..."></textarea>'
    text = text.replace(duplicate, '    <textarea id="pContent" placeholder="指令内容..."></textarea>')

    if TEMPLATE.exists():
        backup = TEMPLATE.with_name(f"template.v2-backup.{datetime.now():%Y%m%d%H%M%S}.html")
        backup.write_text(TEMPLATE.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        backup = None

    TEMPLATE.write_text(text, encoding="utf-8")
    print("ai.haidong.chat template updated to quiet V2 style")
    if backup:
        print(f"backup: {backup}")


if __name__ == "__main__":
    main()
