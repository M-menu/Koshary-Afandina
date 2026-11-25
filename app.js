(() => {
  const d = window.MENU_DATA;
  const $ = id => document.getElementById(id);
  const cart = new Map();
  let activeCat = "الكل";
  let query = "";

  const nf = v => Number(v).toLocaleString("ar-EG");
  const money = v => nf(v) + " " + d.currency;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };

  document.title = d.restaurantName + " | المنيو";
  $("tagline").textContent = d.tagline;

  const topCall = $("top-call");
  topCall.href = "tel:" + d.primaryPhone;
  const phoneIcon = document.createElement("img");
  phoneIcon.className = "call-icon";
  phoneIcon.src = "assets/phone.svg";
  phoneIcon.alt = "";
  phoneIcon.setAttribute("aria-hidden", "true");
  topCall.replaceChildren(phoneIcon, document.createTextNode(" " + d.primaryPhone));

  d.branches.forEach(b => $("branches").appendChild(el("li", "", b)));
  d.phones.forEach(p => {
    const a = el("a", "", p);
    a.href = "tel:" + p;
    $("phones").appendChild(a);
  });

  const fb = el("a", "", "صفحة فيسبوك - كشري وحلواني أفندينا");
  fb.href = d.facebook;
  fb.target = "_blank";
  fb.rel = "noopener";
  $("socials").appendChild(fb);

  const allCats = ["الكل", ...new Set(d.items.map(i => i.category))];
  const nav = $("cat-nav");
  function renderNav() {
    nav.replaceChildren();
    allCats.forEach(cat => {
      const b = el("button", cat === activeCat ? "active" : "", cat);
      b.type = "button";
      b.addEventListener("click", () => {
        activeCat = cat;
        renderNav();
        renderMenu();
      });
      nav.appendChild(b);
    });
  }

  function buildControl(item, optIdx, box) {
    const key = `${item.id}:${optIdx}`;
    const n = cart.get(key) || 0;
    const set = v => {
      v > 0 ? cart.set(key, v) : cart.delete(key);
      buildControl(item, optIdx, box);
      updateBar();
    };
    box.replaceChildren();
    const plus = el("button", "plus", "+");
    plus.type = "button";
    plus.addEventListener("click", () => set(n + 1));
    box.appendChild(plus);

    if (n > 0) {
      box.appendChild(el("b", "n", nf(n)));
      const minus = el("button", "minus", "−");
      minus.type = "button";
      minus.addEventListener("click", () => set(n - 1));
      box.appendChild(minus);
    }
  }

  function renderMenu() {
    const container = $("menu");
    container.replaceChildren();
    const q = query.trim().toLowerCase();

    const visibleCats = allCats.filter(c => c !== "الكل" && (activeCat === "الكل" || c === activeCat));

    visibleCats.forEach((cat, idx) => {
      const catItems = d.items.filter(item =>
        item.category === cat &&
        (!q || item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)))
      );
      if (!catItems.length) return;

      const sec = el("section", idx % 2 === 1 ? "panel yellow-panel" : "panel");
      const header = el("div", "panel-header");
      header.appendChild(el("h2", "", cat));
      if (cat === "وايت صوص") header.appendChild(el("span", "panel-note", "الجديد 🔥"));
      sec.appendChild(header);

      const ul = el("ul", "dishes");
      catItems.forEach(item => {
        const li = el("li", "dish");
        const mainRow = el("div", "dish-main");
        const nameEl = el("span", "name", item.name);
        if (item.description) nameEl.appendChild(el("small", "", item.description));
        mainRow.appendChild(nameEl);
        li.appendChild(mainRow);

        const optsGrid = el("div", "options-grid");
        item.options.forEach((opt, optIdx) => {
          const chip = el("div", "opt-chip");
          const info = el("div", "opt-info");
          if (opt.label && opt.label !== "السعر") {
            info.appendChild(el("span", "opt-label", opt.label));
          }
          info.appendChild(el("span", "price", money(opt.price)));

          const ctl = el("div", "ctl");
          buildControl(item, optIdx, ctl);

          chip.append(info, ctl);
          optsGrid.appendChild(chip);
        });

        li.appendChild(optsGrid);
        ul.appendChild(li);
      });

      sec.appendChild(ul);
      container.appendChild(sec);
    });
  }

  function updateBar() {
    let count = 0, total = 0;
    cart.forEach((qty, key) => {
      const [id, optIdx] = key.split(":").map(Number);
      const item = d.items.find(i => i.id === id);
      if (item) {
        count += qty;
        total += qty * item.options[optIdx].price;
      }
    });
    $("order-count").textContent = nf(count);
    $("order-total").textContent = money(total);
    $("order-bar").hidden = count === 0;
  }

  $("search").addEventListener("input", e => {
    query = e.target.value;
    renderMenu();
  });

  $("checkout").addEventListener("click", () => {
    const lines = ["السلام عليكم، عايز أطلب من " + d.restaurantName + ":", ""];
    let total = 0;
    cart.forEach((qty, key) => {
      const [id, optIdx] = key.split(":").map(Number);
      const item = d.items.find(i => i.id === id);
      const opt = item.options[optIdx];
      const label = opt.label && opt.label !== "السعر" ? ` (${opt.label})` : "";
      const sub = opt.price * qty;
      lines.push(`• ${item.name}${label} × ${qty} = ${money(sub)}`);
      total += sub;
    });
    lines.push("", "الإجمالي: " + money(total), "", "الاسم:", "العنوان:");
    window.open("https://wa.me/" + d.whatsappNumber + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  });

  renderNav();
  renderMenu();
})();
