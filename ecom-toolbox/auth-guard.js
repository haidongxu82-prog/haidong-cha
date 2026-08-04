(function () {
  "use strict";
  var COPY_KEYS = {
    "hd_ecom_ds_key": "copy.key",
    "hd_ecom_api_url": "copy.url",
    "hd_ecom_api_model": "copy.model",
    "ecom-deepseek-key-local": "copy.key",
    "ecom-deepseek-key-session": "copy.key"
  };
  var accountId = "";
  var nativeGet = Storage.prototype.getItem;
  var nativeSet = Storage.prototype.setItem;
  var nativeRemove = Storage.prototype.removeItem;
  function mapped(key) {
    var field = COPY_KEYS[String(key || "")];
    return field && accountId ? "hd.user." + accountId + "." + field : field ? "__hd_guest_" + field : String(key);
  }
  Storage.prototype.getItem = function (key) { return nativeGet.call(this, mapped(key)); };
  Storage.prototype.setItem = function (key, value) { return nativeSet.call(this, mapped(key), value); };
  Storage.prototype.removeItem = function (key) { return nativeRemove.call(this, mapped(key)); };
  function migrate(id) {
    var prefix = "hd.user." + id + ".";
    ["copy.key", "copy.url", "copy.model"].forEach(function (field) {
      var names = Object.keys(COPY_KEYS).filter(function (k) { return COPY_KEYS[k] === field; });
      var target = nativeGet.call(localStorage, prefix + field);
      if (!target) for (var s = 0; s < 2 && !target; s++) {
        var source = s ? sessionStorage : localStorage;
        for (var i = 0; i < names.length; i++) {
          var old = nativeGet.call(source, names[i]);
          if (old) { target = old; nativeSet.call(localStorage, prefix + field, old); break; }
        }
      }
      for (var r = 0; r < 2; r++) {
        var rawSource = r ? sessionStorage : localStorage;
        names.forEach(function (name) { nativeRemove.call(rawSource, name); });
      }
    });
    nativeSet.call(localStorage, prefix + "migrated", "1");
  }
  function goLogin() {
    var next = location.pathname + location.search + location.hash;
    location.replace("/?login=1&next=" + encodeURIComponent(next));
  }
  function hydrate() {
    var key = localStorage.getItem("hd_ecom_ds_key") || "";
    var url = localStorage.getItem("hd_ecom_api_url") || "";
    var model = localStorage.getItem("hd_ecom_api_model") || "";
    [["apiKey", key], ["apiUrl", url], ["apiModel", model]].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el && pair[1] && !el.value) el.value = pair[1];
    });
    document.dispatchEvent(new CustomEvent("hd-account-ready"));
  }
  window.hdAccount = null;
  window.hdAccountReady = fetch("/api/me", { credentials: "same-origin", cache: "no-store" }).then(function (r) {
    if (!r.ok) throw new Error("账号状态获取失败");
    return r.json();
  }).then(function (data) {
    if (!data || !data.user) { goLogin(); throw new Error("请先登录统一账号"); }
    accountId = String(data.user.id);
    window.hdAccount = data.user;
    if (!nativeGet.call(localStorage, "hd.user." + accountId + ".migrated")) migrate(accountId);
    hydrate();
    return data.user;
  }).catch(function (e) {
    if (e && e.message === "请先登录统一账号") throw e;
    goLogin();
    throw e;
  });
  document.addEventListener("click", function (event) {
    var btn = event.target && event.target.closest && event.target.closest("button");
    if (!btn || !/生成|拓展|重写|优化|分析|回复|换一批|Listing|脚本|文案|标题|话术|提交/i.test(btn.textContent || "")) return;
    if (!window.hdAccount) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert("请先登录一级页的统一账号");
    }
  }, true);
}());
