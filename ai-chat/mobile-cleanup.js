(function(){
  function cleanMobile(){
    if (!window.matchMedia || !window.matchMedia('(max-width: 768px)').matches) return;
    document.querySelectorAll('[title="指令集"], [title="记忆"]').forEach(function(el){ el.remove(); });
    var promptPanel = document.getElementById('promptPanel');
    if (promptPanel) {
      promptPanel.classList.remove('open');
      promptPanel.style.display = 'none';
      promptPanel.remove();
    }
    var overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('show');
    var greeting = document.getElementById('emptyState')?.querySelector('.greeting');
    if (greeting) greeting.remove();
    var sub = document.getElementById('emptyState')?.querySelector('.greeting-sub');
    if (sub) sub.remove();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanMobile);
  } else {
    cleanMobile();
  }
  window.addEventListener('resize', cleanMobile);
})();
