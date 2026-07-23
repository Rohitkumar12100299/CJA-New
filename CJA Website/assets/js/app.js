/* app.js - shared utilities, header, toasts, cart helpers */
(function(){
  // Toasts
  function toast(message, opts={timeout:3000}){
    let container = document.getElementById('toast-container');
    if(!container){container = document.createElement('div');container.id='toast-container';document.body.appendChild(container)}
    const t = document.createElement('div');t.className='toast';t.textContent=message;container.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300)},opts.timeout);
  }

  // Loader
  function showLoader(){
    if(document.getElementById('loader-overlay')) return;
    const d = document.createElement('div');d.id='loader-overlay';d.className='loader-overlay';d.innerHTML='<div class="spinner"></div>';
    document.body.appendChild(d);
  }
  function hideLoader(){const el=document.getElementById('loader-overlay');if(el)el.remove();}

  // Adobe Data Layer utils
  window.adobeDataLayer = window.adobeDataLayer || [];
  function pushADL(obj){window.adobeDataLayer.push(obj);console.info('adobeDataLayer push:',obj)}

  function getCustData(){
    return {loginStatus:'Guest',platform:navigator.platform,language:navigator.language,email:localStorage.getItem('user_email')||undefined};
  }

  function webDetails(){
    return {webPageDetails:{siteName:'ModernShop',pageName:document.title,pageType:location.pathname.replace('/','')||'home',channel:'ecommerce',pageURL:location.href}};
  }
  function getHydratestSegment() {

  const path = location.pathname.split('/').pop() || 'index.html';

  const segmentMap = {
    'index.html': 'r1145',
    'products.html': 'r1148',
    'product-details.html': 'r1200',
    'cart.html': 'r1300',
    'checkout.html': 'r1400',
    'order-success.html': 'r1500',
    'order-failure.html': 'r1600'
  };

  return segmentMap[path] || 'r0000';
}


function getHydratestSegmentHistory() {

  let segments = JSON.parse(
    sessionStorage.getItem('Hydratestsegment')
  ) || [];

  segments.push(getHydratestSegment());

  sessionStorage.setItem(
    'Hydratestsegment',
    JSON.stringify(segments)
  );

  return segments;
}

  function buildProductXdm(p,qty=1){
    return {productID:p.id,productName:p.name,SKU:p.id,price:p.price,quantity:qty,productImageUrl:p.image,currencyCode:'USD'};
  }

 function pushPageLoaded(extra={}){

 const base = {
   event:'pageLoaded',
   xdmPageLoad:{
      custData:getCustData()
   },
   web:webDetails().webPageDetails,
   Hydratestsegment:getHydratestSegmentHistory()
 };

 const payload = Object.assign({},base,extra);

 pushADL(payload);
}

  function pushLinkClicked(meta){
    const obj = {event:'linkClicked',xdmActionDetails:{web:{webInteraction:meta}}}; pushADL(obj);
    // store local click log
    try{const log=JSON.parse(localStorage.getItem('acdl_click_log')||'[]');log.push(Object.assign({timestamp:Date.now()},meta));localStorage.setItem('acdl_click_log',JSON.stringify(log))}catch(e){}
  }

  function pushAddToCart(product,quantity){
    const obj = {event:'addToCart',xdmCommerce:{product:buildProductXdm(product,quantity)}}; pushADL(obj);
  }

  function pushRemoveFromCart(product,quantity){
    const obj = {event:'removeFromCart',xdmCommerce:{product:buildProductXdm(product,quantity)}}; pushADL(obj);
  }

  function pushBeginCheckout(cart){
    const products = cart.map(i=>buildProductXdm(i,i.quantity));
    const order = {totalQuantity:cart.reduce((s,i)=>s+i.quantity,0),totalValue:cart.reduce((s,i)=>s+i.quantity*i.price,0)};
    pushADL({event:'beginCheckout',xdmCommerce:{cart:order,products:products}});
  }

  function pushScView(cart){
    const products = cart.map(i=>buildProductXdm(i,i.quantity));
    const order = {totalQuantity:cart.reduce((s,i)=>s+i.quantity,0),totalValue:cart.reduce((s,i)=>s+i.quantity*i.price,0),currency:'USD'};
    pushADL({event:'scView',custData:getCustData(),xdmCommerce:{products,order,cart:{items:cart,totalQuantity:order.totalQuantity,totalValue:order.totalValue,currency:'USD'}}});
  }

  function pushScCheckout(cart){
    const products = cart.map(i=>buildProductXdm(i,i.quantity));
    const order = {totalQuantity:cart.reduce((s,i)=>s+i.quantity,0),totalValue:cart.reduce((s,i)=>s+i.quantity*i.price,0),currency:'USD'};
    pushADL({event:'scCheckout',custData:getCustData(),xdmCommerce:{products,order,cart:{items:cart,totalQuantity:order.totalQuantity,totalValue:order.totalValue,currency:'USD'}}});
  }

  function pushPurchase(order){
    const products = order.items.map(i=>({productID:i.id,productName:i.name,SKU:i.id,quantity:i.quantity,price:i.price,productImageUrl:i.image,currencyCode:'USD'}));
    pushADL({event:'purchase',custData:getCustData(),xdmCommerce:{order:{orderID:order.id,originalTotal:order.amount,totalValue:order.amount,currency:'USD',paymentMethod:order.paymentMethod||'card'},products}});
  }

  // Cart helpers
  function getCart(){try{const c=localStorage.getItem('cart');return c?JSON.parse(c):[];}catch(e){return []}}
  function saveCart(cart){localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();}
  function updateCartCount(){const count = getCart().reduce((s,i)=>s+i.quantity,0);const el=document.querySelectorAll('.cart-count');el.forEach(x=>x.textContent=count);}
  function addToCart(product, quantity=1){const cart=getCart();const idx=cart.findIndex(i=>i.id===product.id);if(idx>-1){cart[idx].quantity += quantity}else{cart.push({id:product.id,name:product.name,price:product.price,image:product.image,quantity,stock:product.stock})}saveCart(cart);toast('Added to cart');pushAddToCart(product,quantity);}

  function formatPrice(v){return '$'+v.toFixed(2)}

  // small DOM helpers
  function qs(sel,ctx=document){return ctx.querySelector(sel)}
  function qsa(sel,ctx=document){return Array.from(ctx.querySelectorAll(sel))}

  window.ECOM = {toast,showLoader,hideLoader,getCart,saveCart,updateCartCount,addToCart,formatPrice,qs,qsa,pushADL,pushPageLoaded,pushLinkClicked,pushAddToCart,pushRemoveFromCart,pushBeginCheckout,pushScView,pushScCheckout,pushPurchase,getCustData};

  document.addEventListener('DOMContentLoaded',()=>{
    // header cart count init
    updateCartCount();
    // push pageLoaded on load
    try{const path = location.pathname.split('/').pop(); if(path.includes('product-details')){
      // attempt to read product id param
      const params=new URLSearchParams(location.search); const id=parseInt(params.get('id'),10); const prod = window.PRODUCTS && window.PRODUCTS.find(p=>p.id===id);
      if(prod) pushPageLoaded({xdmCommerce:{product:buildProductXdm(prod,1)}}); else pushPageLoaded();
    } else if(path.includes('cart.html')){ pushPageLoaded(); pushScView(getCart()); } else if(path.includes('checkout.html')){ pushPageLoaded(); pushScCheckout(getCart()); } else { pushPageLoaded(); }}catch(e){pushPageLoaded();}
    // mobile menu toggle
    const btn = qs('.hamburger');
    if(btn){btn.addEventListener('click',()=>{const links=qs('.nav-links');links.style.display = links.style.display==='flex'?'none':'flex';})}
    // simple search form
    const searchForm = qs('#search-form');
    if(searchForm){searchForm.addEventListener('submit',(e)=>{e.preventDefault();const q=qs('#search-input').value.trim();if(q)window.location='products.html?search='+encodeURIComponent(q);});}

    // global click capture for linkClicked
    document.addEventListener('click',(ev)=>{
      const a = ev.target.closest('a,button'); if(!a) return; const linkName = a.textContent.trim()||a.getAttribute('aria-label')||a.href||'unknown'; const linkType = a.tagName.toLowerCase(); const linkPosition = null; pushLinkClicked({linkName,linkType,linkPosition,linkPageName:document.title,pageURL:location.href});
    },true);
  });

})();
