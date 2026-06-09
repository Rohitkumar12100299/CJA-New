/* cart.js - cart page logic */
(function(){
  const {getCart,saveCart,updateCartCount,formatPrice,toast} = window.ECOM;

  function renderCart(){
    const cart = getCart();
    const tbody = document.getElementById('cart-body');
    const summary = document.getElementById('cart-summary');
    if(!tbody || !summary) return;
    tbody.innerHTML='';
    if(cart.length===0){tbody.innerHTML='<tr><td colspan="5" class="center">Your cart is empty</td></tr>';summary.innerHTML='';return}
    let subtotal =0, totalItems=cart.length, totalQty=0;
    cart.forEach(item=>{
      const row=document.createElement('tr');
      const itemTotal = item.price * item.quantity; subtotal+=itemTotal; totalQty+=item.quantity;
      row.innerHTML = `
        <td style="width:120px"><img src="${item.image}" style="width:100px;height:70px;object-fit:cover;border-radius:8px"></td>
        <td>${item.name}</td>
        <td>${formatPrice(item.price)}</td>
        <td><div class="qty"><button class="btn btn-secondary" data-action="dec" data-id="${item.id}">-</button><span style="min-width:36px;text-align:center;display:inline-block">${item.quantity}</span><button class="btn btn-secondary" data-action="inc" data-id="${item.id}">+</button></div></td>
        <td>${formatPrice(itemTotal)} <button class="btn btn-secondary" data-action="remove" data-id="${item.id}" style="margin-left:12px">Remove</button></td>
      `;
      tbody.appendChild(row);
    });
    const tax = +(subtotal*0.08).toFixed(2);
    const shipping = subtotal>100?0:9.99;
    const grand = +(subtotal + tax + shipping).toFixed(2);
    summary.innerHTML = `
      <div class="cart-summary">
        <p>Total Items: <strong>${totalItems}</strong></p>
        <p>Total Quantity: <strong>${totalQty}</strong></p>
        <p>Subtotal: <strong>${formatPrice(subtotal)}</strong></p>
        <p>Tax (8%): <strong>${formatPrice(tax)}</strong></p>
        <p>Shipping: <strong>${formatPrice(shipping)}</strong></p>
        <p style="font-size:18px">Grand Total: <strong>${formatPrice(grand)}</strong></p>
        <div style="margin-top:12px"><a id="proceed-to-checkout" href="checkout.html" class="btn btn-primary">Proceed to Checkout</a></div>
      </div>
    `;
    // attach proceed listener
    const proceed = document.getElementById('proceed-to-checkout'); if(proceed){proceed.addEventListener('click',()=>{try{window.ECOM.pushBeginCheckout(getCart())}catch(e){}})}
    // attach listeners
    tbody.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',onAction));
  }

  function onAction(e){
    const id = parseInt(e.currentTarget.dataset.id,10);
    const action = e.currentTarget.dataset.action;
    let cart = getCart();
    const idx = cart.findIndex(i=>i.id===id); if(idx===-1) return;
    if(action==='inc'){if(cart[idx].quantity < cart[idx].stock) cart[idx].quantity +=1}
    if(action==='dec'){cart[idx].quantity = Math.max(1, cart[idx].quantity -1)}
    if(action==='remove'){try{window.ECOM.pushRemoveFromCart(cart[idx],cart[idx].quantity)}catch(e){};cart.splice(idx,1);toast('Removed from cart')}
    saveCart(cart);renderCart();
  }

  document.addEventListener('DOMContentLoaded',()=>{renderCart();updateCartCount();});
})();
