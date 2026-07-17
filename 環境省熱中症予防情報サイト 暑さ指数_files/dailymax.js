function switchTab(el, src, target) {

  // --- タブの active 切替 ---
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
  });
  el.classList.add('active');

  // --- iframe 切替 ---
  document.getElementById('wbgt_map_frame').src = src;

  // --- 下部コンテンツ切替 ---
  document.querySelectorAll('.content').forEach(c => {
    c.classList.remove('active');
  });
  document.getElementById(target).classList.add('active');
}
