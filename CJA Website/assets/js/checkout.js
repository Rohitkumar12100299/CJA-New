/* checkout.js - handles checkout form, validation, and payment simulation */
(function(){
  const {getCart,formatPrice,showLoader,hideLoader,toast,saveCart,updateCartCount} = window.ECOM;

  function renderSummary(){
    const cart = getCart();
    const list = document.getElementById('order-list');
    const totals = document.getElementById('order-totals');
    if(!list || !totals) return;
    list.innerHTML=''; let subtotal=0, qty=0;
    cart.forEach(i=>{subtotal += i.price*i.quantity; qty += i.quantity; const li = document.createElement('div');li.style.display='flex';li.style.justifyContent='space-between';li.style.marginBottom='6px';li.innerHTML=`<div>${i.name} x ${i.quantity}</div><div>${formatPrice(i.price*i.quantity)}</div>`;list.appendChild(li)});
    const tax = +(subtotal*0.08).toFixed(2);
    const shipping = subtotal>100?0:9.99;
    const grand = +(subtotal + tax + shipping).toFixed(2);
    totals.innerHTML = `<div>Subtotal: <strong>${formatPrice(subtotal)}</strong></div><div>Tax: <strong>${formatPrice(tax)}</strong></div><div>Shipping: <strong>${formatPrice(shipping)}</strong></div><div style="margin-top:8px;font-size:18px">Grand Total: <strong>${formatPrice(grand)}</strong></div>`;
    document.getElementById('place-order-btn').dataset.amount = grand;
  }

  function validate(form){
    const errors = {};
    const el = (name)=>form.querySelector(`[name="${name}"]`);
    const fullName = el('fullname').value.trim(); if(!fullName) errors.fullname='Required';
    const email = el('email').value.trim(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email='Invalid email';
    const phone = el('phone').value.trim(); if(!/^\+?\d{7,15}$/.test(phone)) errors.phone='Invalid phone';
    const address = el('address1').value.trim(); if(!address) errors.address1='Required';
    const city = el('city').value.trim(); if(!city) errors.city='Required';
    const zip = el('zip').value.trim(); if(!zip) errors.zip='Required';
    const card = el('card').value.replace(/\s+/g,''); if(!/^\d{13,19}$/.test(card)) errors.card='Invalid card number';
    const expiry = el('expiry').value.trim(); if(!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) errors.expiry='Invalid expiry';
    const cvv = el('cvv').value.trim(); if(!/^\d{3,4}$/.test(cvv)) errors.cvv='Invalid CVV';
    // show errors
    form.querySelectorAll('.error').forEach(x=>x.textContent='');
    Object.keys(errors).forEach(k=>{const e = form.querySelector(`[data-error="${k}"]`); if(e) e.textContent=errors[k]});
    return Object.keys(errors).length===0;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    renderSummary();
    const form = document.getElementById('checkout-form');
    if(!form) return;
    form.addEventListener('submit',(e)=>{e.preventDefault(); processPayment(form)});

    // simulate buttons
    const btnProceed = document.getElementById('proceed-order');
    const btnFail = document.getElementById('order-failure-btn');
    if(btnProceed) btnProceed.addEventListener('click',()=>{processPayment(form, true)});
    if(btnFail) btnFail.addEventListener('click',()=>{processPayment(form, false)});
  });

  function processPayment(form, forceOutcome=null){
    if(!validate(form)) return toast('Please fix validation errors');
    showLoader();
    setTimeout(()=>{
      hideLoader();
      const success = (forceOutcome===null) ? (Math.random() > 0.3) : !!forceOutcome;
      const cart = getCart();
      const order = {id: 'ORD-'+Date.now(),date: new Date().toISOString(),items:cart,amount:parseFloat(document.getElementById('place-order-btn').dataset.amount||0),customer:{name:form.fullname.value,email:form.email.value},shipping:{address:form.address1.value,city:form.city.value,zip:form.zip.value}};
      // persist last_order
      localStorage.setItem('last_order', JSON.stringify(order));
      try{
        // push payment events to adobeDataLayer
        const products = cart.map(i=>({productID:i.id,productName:i.name,SKU:i.id,quantity:i.quantity,price:i.price,productImageUrl:i.image,currencyCode:'USD'}));
        if(success){
          // payment confirmed
          window.ECOM.pushADL({event:'paymentConfirmed',custData:window.ECOM && window.ECOM.getCustData?window.ECOM.getCustData():{},xdmCommerce:{order:{orderID:order.id,totalValue:order.amount,paymentMethod:'card',currency:'USD'},products}});
          // purchase
          try{window.ECOM.pushPurchase(order);}catch(e){}
          // clear cart
          localStorage.removeItem('cart'); updateCartCount();
          window.location='order-success.html?order='+order.id;
        } else {
          const reasons = ['Payment declined','Invalid card details','Network issue','Transaction timeout'];
          const reason = reasons[Math.floor(Math.random()*reasons.length)];
          localStorage.setItem('last_order_failure', JSON.stringify({order,reason}));
          // payment failed event
          try{window.ECOM.pushADL({event:'paymentFailed',custData:window.ECOM && window.ECOM.getCustData?window.ECOM.getCustData():{},xdmCommerce:{order:{orderID:order.id,totalValue:order.amount,paymentMethod:'card',currency:'USD'},products},reason});}catch(e){}
          window.location='order-failure.html';
        }
      }catch(e){
        // fallback redirect
        if(success){localStorage.removeItem('cart'); updateCartCount(); window.location='order-success.html?order='+order.id} else {localStorage.setItem('last_order_failure', JSON.stringify({order,reason:'processing_error'})); window.location='order-failure.html'}
      }
    }, 1200);
  }

})();
