/* ==========================================================================
   WENDY BEAUTY & SPA — front-end logic
   No fabricated prices, stock levels, or reviews. Cart/wishlist are stored
   locally in the browser (localStorage) — there is no backend yet, so this
   is a request/enquiry flow, not a payment flow. See README for how to wire
   this up to a real CMS + database later.
   ========================================================================== */

(function(){
  "use strict";

  const WA1 = "2348137609506";
  const WA2 = "2349012314878";

  // ---------------------------------------------------------------------
  // SAMPLE CATALOGUE — replace/extend via the admin dashboard once built.
  // price: null  -> "PRICE ON REQUEST"
  // available: null -> "AVAILABILITY TO BE CONFIRMED"
  // ---------------------------------------------------------------------
  const PRODUCTS = [
    { id:"p1", name:"Straight Lace Front Wig", category:"Hair & Wigs", desc:"Human hair lace front, natural hairline.", price:null, available:null, badge:"NEW" },
    { id:"p2", name:"Body Wave Closure Wig", category:"Hair & Wigs", desc:"4x4 closure, bouncy body wave texture.", price:null, available:null, badge:null },
    { id:"p3", name:"Bone Straight Frontal Wig", category:"Hair & Wigs", desc:"13x4 HD frontal, silky bone-straight finish.", price:null, available:null, badge:"TRENDING" },
    { id:"p4", name:"Curly Hair Extensions", category:"Hair & Wigs", desc:"Clip-in extensions, defined curl pattern.", price:null, available:null, badge:null },
    { id:"p5", name:"Matte Foundation", category:"Cosmetics", desc:"Long-wear, buildable coverage.", price:null, available:null, badge:null },
    { id:"p6", name:"Signature Lipstick", category:"Cosmetics", desc:"Creamy finish, everyday shade range.", price:null, available:null, badge:"POPULAR" },
    { id:"p7", name:"Eyeshadow Palette", category:"Cosmetics", desc:"Neutral-to-bold everyday palette.", price:null, available:null, badge:null },
    { id:"p8", name:"Makeup Brush Set", category:"Cosmetics", desc:"Complete face &amp; eye brush collection.", price:null, available:null, badge:null },
    { id:"p9", name:"Occasion Dress", category:"Women's Fashion", desc:"Tailored fit, evening-ready silhouette.", price:null, available:null, badge:"LIMITED" },
    { id:"p10", name:"Two-Piece Outfit", category:"Women's Fashion", desc:"Coordinated top and skirt set.", price:null, available:null, badge:null },
    { id:"p11", name:"Casual Wide-Leg Trousers", category:"Women's Fashion", desc:"Everyday comfort, elevated cut.", price:null, available:null, badge:null },
    { id:"p12", name:"Statement Heels", category:"Shoes", desc:"Elegant heels for every outfit.", price:null, available:null, badge:null },
    { id:"p13", name:"Platform Sandals", category:"Shoes", desc:"Chic, comfortable everyday sandals.", price:null, available:null, badge:"NEW" },
    { id:"p14", name:"Street Sneakers", category:"Shoes", desc:"Bold sole, versatile street style.", price:null, available:null, badge:null },
    { id:"p15", name:"Hydrating Facial Cleanser", category:"Skincare & Personal Care", desc:"Gentle daily cleanse, all skin types.", price:null, available:null, badge:null },
    { id:"p16", name:"Body Lotion", category:"Skincare & Personal Care", desc:"Lightweight, fast-absorbing formula.", price:null, available:null, badge:null },
    { id:"p17", name:"Signature Fragrance", category:"Skincare & Personal Care", desc:"Warm, long-lasting scent.", price:null, available:null, badge:"POPULAR" },
    { id:"p18", name:"Structured Handbag", category:"Accessories", desc:"Everyday structured silhouette.", price:null, available:null, badge:null },
    { id:"p19", name:"Layered Jewelry Set", category:"Accessories", desc:"Necklace &amp; earring pairing.", price:null, available:null, badge:null },
    { id:"p20", name:"Classic Sunglasses", category:"Accessories", desc:"UV-protective, everyday shape.", price:null, available:null, badge:"NEW" },
  ];

  const SERVICES = [
    ["Hair Styling","SALON"],["Wig Installation","SALON"],["Wig Customization","SALON"],
    ["Hair Treatment","SALON"],["Makeup","BEAUTY"],["Facials","SPA"],
    ["Manicure","SPA"],["Pedicure","SPA"],["Spa Treatment","SPA"],["Beauty Consultation","BEAUTY"]
  ];

  // ---------------------------------------------------------------------
  // STATE (persisted to localStorage — per-device only)
  // ---------------------------------------------------------------------
  const store = {
    get(key){ try{ return JSON.parse(localStorage.getItem(key) || "[]"); }catch(e){ return []; } },
    set(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  };
  let cart = store.get("wbs_cart");
  let wishlist = store.get("wbs_wishlist");

  function saveCart(){ store.set("wbs_cart", cart); renderCounts(); renderCartDrawer(); }
  function saveWishlist(){ store.set("wbs_wishlist", wishlist); renderCounts(); renderWishlistDrawer(); }

  // ---------------------------------------------------------------------
  // TOAST
  // ---------------------------------------------------------------------
  let toastTimer;
  function toast(msg){
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.classList.remove("show"), 2400);
  }

  // ---------------------------------------------------------------------
  // WHATSAPP HELPERS
  // ---------------------------------------------------------------------
  function waLink(number, message){
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
  function productEnquiryMessage(p){
    return `Hello Wendy Beauty & Spa,\nI am interested in:\n${p.name}\n${p.category}\nPlease provide the current price, available options and ordering information.`;
  }

  // ---------------------------------------------------------------------
  // PRODUCT GRID
  // ---------------------------------------------------------------------
  const grid = document.getElementById("productGrid");

  function priceLabel(p){ return p.price ? `₦${p.price.toLocaleString()}` : "PRICE ON REQUEST"; }
  function availLabel(p){ return p.available === false ? "OUT OF STOCK" : (p.available === true ? "IN STOCK" : "AVAILABILITY TO BE CONFIRMED"); }

  function renderProducts(filter){
    grid.innerHTML = "";
    const list = PRODUCTS.filter(p => filter === "all" || p.category === filter);
    list.forEach(p => {
      const inWishlist = wishlist.includes(p.id);
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-media" style="background:linear-gradient(135deg, rgba(198,161,91,0.18), rgba(92,31,42,0.12));">
          <button class="wishlist-toggle ${inWishlist ? 'active' : ''}" data-id="${p.id}" aria-label="Toggle wishlist">
            <svg viewBox="0 0 24 24" stroke-width="1.6"><path d="M12 21s-7.5-4.6-10-9.2C.5 8.2 2.4 4 6.6 4c2.1 0 3.7 1.2 5.4 3 1.7-1.8 3.3-3 5.4-3 4.2 0 6.1 4.2 4.6 7.8C19.5 16.4 12 21 12 21z"/></svg>
          </button>
          <span class="ph-label">${p.name}<br>photo space</span>
        </div>
        <div class="product-info">
          <span class="product-cat">${p.category.toUpperCase()}${p.badge ? " · " + p.badge : ""}</span>
          <h4 class="product-name">${p.name}</h4>
          <p class="product-desc">${p.desc}</p>
          <p class="product-price">${priceLabel(p)} &middot; <span style="color:rgba(250,247,242,0.5);font-weight:400;">${availLabel(p)}</span></p>
          <div class="product-actions">
            <button class="btn btn-gold btn-sm add-to-bag" data-id="${p.id}">Add To Bag</button>
            <a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="${waLink(WA1, productEnquiryMessage(p))}">Enquire On WhatsApp</a>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  }

  document.getElementById("filterRow").addEventListener("click", (e)=>{
    const chip = e.target.closest(".filter-chip");
    if(!chip) return;
    document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    renderProducts(chip.dataset.filter);
  });

  grid.addEventListener("click", (e)=>{
    const wl = e.target.closest(".wishlist-toggle");
    const add = e.target.closest(".add-to-bag");
    if(wl){
      const id = wl.dataset.id;
      if(wishlist.includes(id)){ wishlist = wishlist.filter(x=>x!==id); }
      else { wishlist.push(id); toast("Added to wishlist"); }
      saveWishlist();
      renderProducts(document.querySelector(".filter-chip.active").dataset.filter);
    }
    if(add){
      const id = add.dataset.id;
      const existing = cart.find(c=>c.id===id);
      if(existing){ existing.qty += 1; } else { cart.push({id, qty:1}); }
      saveCart();
      toast("Added to bag");
    }
  });

  // ---------------------------------------------------------------------
  // CART DRAWER
  // ---------------------------------------------------------------------
  const cartBody = document.getElementById("cartBody");
  function renderCartDrawer(){
    if(cart.length === 0){
      cartBody.innerHTML = `<div class="drawer-empty">Your bag is empty.<br>Browse the collection and add something you love.</div>`;
      document.getElementById("cartWaBtn").href = waLink(WA1, "Hello Wendy Beauty & Spa, I would like to make an enquiry.");
      return;
    }
    let lines = [];
    cartBody.innerHTML = cart.map(item=>{
      const p = PRODUCTS.find(x=>x.id===item.id);
      if(!p) return "";
      lines.push(`${p.name} (x${item.qty}) — ${p.category}`);
      return `
        <div class="cart-item">
          <div class="thumb"></div>
          <div class="info">
            <h5>${p.name}</h5>
            <span>Qty ${item.qty} &middot; ${priceLabel(p)}</span>
            <br><button class="remove" data-id="${item.id}">Remove</button>
          </div>
        </div>`;
    }).join("");
    const msg = `Hello Wendy Beauty & Spa,\n\nI would like to make an enquiry about:\n\n${lines.join("\n")}\n\nPlease provide the current price, availability and further information.\n\nThank you.`;
    document.getElementById("cartWaBtn").href = waLink(WA1, msg);
  }
  cartBody.addEventListener("click", (e)=>{
    const btn = e.target.closest(".remove");
    if(!btn) return;
    cart = cart.filter(c=>c.id !== btn.dataset.id);
    saveCart();
  });

  // ---------------------------------------------------------------------
  // WISHLIST DRAWER
  // ---------------------------------------------------------------------
  const wishlistBody = document.getElementById("wishlistBody");
  function renderWishlistDrawer(){
    if(wishlist.length === 0){
      wishlistBody.innerHTML = `<div class="drawer-empty">Nothing saved yet.<br>Tap the heart on any product to save it here.</div>`;
      return;
    }
    wishlistBody.innerHTML = wishlist.map(id=>{
      const p = PRODUCTS.find(x=>x.id===id);
      if(!p) return "";
      return `
        <div class="cart-item">
          <div class="thumb"></div>
          <div class="info">
            <h5>${p.name}</h5>
            <span>${priceLabel(p)}</span>
            <br><a class="btn btn-whatsapp btn-sm" style="margin-top:8px;" target="_blank" rel="noopener" href="${waLink(WA1, productEnquiryMessage(p))}">Enquire</a>
          </div>
        </div>`;
    }).join("");
  }

  // ---------------------------------------------------------------------
  // HEADER COUNTS
  // ---------------------------------------------------------------------
  function renderCounts(){
    const cartQty = cart.reduce((n,c)=>n+c.qty, 0);
    document.getElementById("cartCount").textContent = cartQty;
    document.getElementById("fabCartCount").textContent = cartQty;
    document.getElementById("wishlistCount").textContent = wishlist.length;
  }

  // ---------------------------------------------------------------------
  // DRAWER OPEN/CLOSE
  // ---------------------------------------------------------------------
  const overlay = document.getElementById("drawerOverlay");
  const cartDrawer = document.getElementById("cartDrawer");
  const wishlistDrawer = document.getElementById("wishlistDrawer");

  function openDrawer(which){
    overlay.classList.add("open");
    (which === "cart" ? cartDrawer : wishlistDrawer).classList.add("open");
  }
  function closeDrawers(){
    overlay.classList.remove("open");
    cartDrawer.classList.remove("open");
    wishlistDrawer.classList.remove("open");
  }
  document.getElementById("openCart").addEventListener("click", ()=>openDrawer("cart"));
  document.getElementById("fabCart").addEventListener("click", ()=>openDrawer("cart"));
  document.getElementById("openWishlist").addEventListener("click", ()=>openDrawer("wishlist"));
  overlay.addEventListener("click", closeDrawers);
  document.querySelectorAll("[data-close-drawer]").forEach(b=>b.addEventListener("click", closeDrawers));

  // ---------------------------------------------------------------------
  // MOBILE NAV
  // ---------------------------------------------------------------------
  const mobileNav = document.getElementById("mobileNav");
  document.getElementById("openMobileNav").addEventListener("click", ()=>mobileNav.classList.add("open"));
  document.getElementById("closeMobileNav").addEventListener("click", ()=>mobileNav.classList.remove("open"));
  mobileNav.querySelectorAll("a").forEach(a=>a.addEventListener("click", ()=>mobileNav.classList.remove("open")));

  // ---------------------------------------------------------------------
  // WHATSAPP FLOATING MENU
  // ---------------------------------------------------------------------
  const waMenu = document.getElementById("waMenu");
  document.getElementById("fabWa").addEventListener("click", ()=>waMenu.classList.toggle("open"));
  document.addEventListener("click",(e)=>{
    if(!waMenu.contains(e.target) && e.target.id !== "fabWa"){ waMenu.classList.remove("open"); }
  });

  // ---------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  document.getElementById("openSearch").addEventListener("click", ()=>{
    searchOverlay.classList.add("open");
    setTimeout(()=>searchInput.focus(), 150);
  });
  document.getElementById("closeSearch").addEventListener("click", ()=>searchOverlay.classList.remove("open"));
  searchInput.addEventListener("input", ()=>{
    const q = searchInput.value.trim().toLowerCase();
    if(!q){ searchResults.innerHTML = ""; return; }
    const matches = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );
    searchResults.innerHTML = matches.length
      ? matches.map(p=>`<a href="#shop">${p.name}<span>${p.category}</span></a>`).join("")
      : `<p class="search-empty">No products match "${searchInput.value}". Try a different term, or ask us on WhatsApp.</p>`;
  });

  // ---------------------------------------------------------------------
  // SERVICES LIST
  // ---------------------------------------------------------------------
  document.getElementById("serviceList").innerHTML = SERVICES.map(([name,tag])=>
    `<li>${name}<span class="tag">${tag}</span></li>`
  ).join("");

  // ---------------------------------------------------------------------
  // BOOKING FORM (client-side enquiry — wire to backend/CMS later)
  // ---------------------------------------------------------------------
  document.getElementById("bookingForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("bName").value.trim();
    const phone = document.getElementById("bPhone").value.trim();
    const service = document.getElementById("bService").value;
    const date = document.getElementById("bDate").value;
    const time = document.getElementById("bTime").value;
    const msg = document.getElementById("bMsg").value.trim();

    const waText = `Hello Wendy Beauty & Spa,\nI would like to book:\nService: ${service}\nName: ${name}\nPhone: ${phone}\nPreferred date: ${date || "Not specified"}\nPreferred time: ${time || "Not specified"}\nMessage: ${msg || "None"}`;
    document.getElementById("bookingNote").querySelector("a").href = waLink(WA2, waText);
    document.getElementById("bookingNote").classList.add("show");
    e.target.reset();
  });

  // ---------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------
  document.getElementById("year").textContent = new Date().getFullYear();
  renderProducts("all");
  renderCounts();
  renderCartDrawer();
  renderWishlistDrawer();

})();
