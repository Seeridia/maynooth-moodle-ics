(() => {
  const form = document.getElementById('subscription-form');
  const token = document.getElementById('token');
  const leadTime = document.getElementById('lead-time');
  const toggle = document.getElementById('toggle-token');
  const result = document.getElementById('subscription-result');
  const urlInput = document.getElementById('subscription-url');
  const copyButton = document.getElementById('copy-url');
  const appleLink = document.getElementById('apple-subscribe');
  const status = document.getElementById('form-status');
  let subscriptionUrl = '';
  let copyAttempt = 0;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('error', error);
  };
  const resetResult = () => {
    copyAttempt += 1;
    subscriptionUrl = '';
    urlInput.value = '';
    urlInput.type = 'password';
    result.hidden = true;
    appleLink.href = '#import';
    copyButton.textContent = '复制链接';
    setStatus('');
  };

  toggle.addEventListener('click', () => {
    const show = token.type === 'password';
    token.type = show ? 'text' : 'password';
    toggle.textContent = show ? '隐藏' : '显示';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', show ? '隐藏 API key' : '显示 API key');
  });
  token.addEventListener('input', resetResult);
  leadTime.addEventListener('change', resetResult);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    resetResult();
    const key = token.value.trim();
    if (!key || key.length > 512 || /\s/.test(key) || /^https?:\/\//i.test(key)) {
      setStatus('请粘贴密钥本身，不要包含网址或空格。', true);
      token.focus();
      return;
    }
    const url = new URL('/calendar', 'https://moodle.seeridia.top');
    url.searchParams.set('token', key);
    url.searchParams.set('leadTime', leadTime.value);
    subscriptionUrl = url.toString();
    urlInput.value = subscriptionUrl;
    // No network request is made here. The calendar app fetches the feed on subscription.
    appleLink.href = subscriptionUrl.replace(/^https:/, 'webcal:');
    result.hidden = false;
    setStatus('已生成。复制链接后添加到日历。');
  });

  copyButton.addEventListener('click', async () => {
    if (!subscriptionUrl) return;
    const attempt = ++copyAttempt;
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      if (attempt !== copyAttempt) return;
      copyButton.textContent = '已复制 ✓';
      setStatus('已复制。');
    } catch {
      if (attempt !== copyAttempt) return;
      urlInput.type = 'text';
      urlInput.focus();
      urlInput.select();
      setStatus('无法自动复制，请手动复制已选中的链接。');
    }
  });
  urlInput.addEventListener('blur', () => { urlInput.type = 'password'; });
  // Clear credentials on navigation, including pages restored from the back-forward cache.
  window.addEventListener('pagehide', () => {
    token.value = '';
    token.type = 'password';
    toggle.textContent = '显示';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', '显示 API key');
    resetResult();
  });

  const tabList = document.querySelector('.calendar-tabs');
  const tabs = [...tabList.querySelectorAll('button')];
  tabList.setAttribute('role', 'tablist');
  const selectTab = (selected) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.dataset.panel).hidden = !active;
    });
  };
  tabs.forEach((tab, index) => {
    const panel = document.getElementById(tab.dataset.panel);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next]);
        tabs[next].focus();
      }
    });
  });
  selectTab(tabs[0]);
})();
