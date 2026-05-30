(function(){
  function isMobile(){
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function syncMobileState(){
    if (!isMobile()) {
      document.body.classList.remove('hd-mobile', 'hd-chat-active');
      var dock = document.getElementById('hdMobileModelDock');
      var chatInputArea = document.getElementById('chatInputArea');
      var dockModelArea = dock && dock.querySelector('.model-area');
      if (chatInputArea && dockModelArea) {
        chatInputArea.insertBefore(dockModelArea, chatInputArea.firstChild);
      }
      if (dock) dock.remove();
      return;
    }

    document.body.classList.add('hd-mobile');

    var emptyState = document.getElementById('emptyState');
    var chatInputArea = document.getElementById('chatInputArea');
    var chatActive = !!(chatInputArea && getComputedStyle(chatInputArea).display !== 'none');
    document.body.classList.toggle('hd-chat-active', chatActive);

    var main = document.querySelector('.main');
    var topbar = document.querySelector('.topbar');
    var chatModelArea = chatInputArea && chatInputArea.querySelector('.model-area');

    if (main && topbar && chatModelArea && !document.getElementById('hdMobileModelDock')) {
      var dock = document.createElement('div');
      dock.id = 'hdMobileModelDock';
      dock.className = 'mobile-model-dock';
      topbar.insertAdjacentElement('afterend', dock);
      dock.appendChild(chatModelArea);
    }

    if (emptyState) {
      var greeting = emptyState.querySelector('.greeting');
      if (greeting) greeting.remove();
      var sub = emptyState.querySelector('.greeting-sub');
      if (sub) sub.remove();
    }
  }

  function cleanMobile(){
    if (!isMobile()) return;
    removeMobileOnlyChrome();
    syncMobileState();
  }

  function removeMobileOnlyChrome(){
    document.querySelectorAll('[title="指令集"], [title="记忆"], #promptPanel, .prompt-panel').forEach(function(el){
      el.classList && el.classList.remove('open', 'active');
      el.style && (el.style.display = 'none');
      el.remove();
    });
    var overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('show');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanMobile);
  } else {
    cleanMobile();
  }
  window.addEventListener('resize', cleanMobile);
  setInterval(function(){
    if (!isMobile()) return;
    removeMobileOnlyChrome();
    syncMobileState();
  }, 250);
  new MutationObserver(function(){
    if (!isMobile()) return;
    removeMobileOnlyChrome();
  }).observe(document.documentElement, {childList:true, subtree:true});
})();
