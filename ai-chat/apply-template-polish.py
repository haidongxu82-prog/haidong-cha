#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import os
import re

TEMPLATE = Path(os.environ.get("AI_CHAT_TEMPLATE", "/opt/ai_chat/template.html"))
BASE_DIR = Path(__file__).resolve().parent
STYLE_FILE = BASE_DIR / "styles.css"
MOBILE_SCRIPT_FILE = BASE_DIR / "mobile-cleanup.js"


def read_asset(path: Path) -> str:
    if not path.exists():
        raise SystemExit(f"asset not found: {path}")
    return path.read_text(encoding="utf-8").strip()


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

    css = read_asset(STYLE_FILE)
    mobile_cleanup_js = read_asset(MOBILE_SCRIPT_FILE)
    mobile_cleanup = f'''
<script id="hd-mobile-cleanup">
{mobile_cleanup_js}
</script>
'''
    html = re.sub(r"\n?<script id=\"hd-mobile-cleanup\">.*?</script>\n?", "\n", html, flags=re.S)

    html = html.replace(
        "</head>",
        f'\n<style id="hd-ai-minimal-premium">\n{css}\n</style>\n</head>',
        1,
    )
    html = html.replace("</body>", mobile_cleanup + "\n</body>", 1)

    TEMPLATE.write_text(html, encoding="utf-8")
    print("ai.haidong.chat template updated")
    print(f"backup: {backup}")


if __name__ == "__main__":
    main()
