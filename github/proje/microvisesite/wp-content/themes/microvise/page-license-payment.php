<?php
/* Template Name: Lisans Odeme */
$session_token = isset($_GET['session']) ? sanitize_text_field(wp_unslash($_GET['session'])) : '';
$license_status = isset($_GET['license']) ? sanitize_key(wp_unslash($_GET['license'])) : '';
$payment_id = isset($_GET['paymentId']) ? absint($_GET['paymentId']) : 0;
$restaurant_id = isset($_GET['restaurantId']) ? absint($_GET['restaurantId']) : 0;
$months = isset($_GET['months']) ? absint($_GET['months']) : 1;
$amount = isset($_GET['amount']) ? sanitize_text_field(wp_unslash($_GET['amount'])) : '0.00';
$currency = isset($_GET['currency']) ? sanitize_text_field(wp_unslash($_GET['currency'])) : 'TRY';
$restaurant_name = isset($_GET['restaurant']) ? sanitize_text_field(wp_unslash($_GET['restaurant'])) : 'Restoran';
$error_message = isset($_GET['errmsg']) ? sanitize_text_field(wp_unslash($_GET['errmsg'])) : '';
$api_url = 'https://frfood-backend.onrender.com/api/payment/license-hosted/pay';
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lisans Odeme</title>
<?php wp_head(); ?>
<style>
body{margin:0;background:linear-gradient(180deg,#eff6ff 0%,#f8fafc 100%);font-family:Arial,sans-serif;color:#0f172a}
.wrap{max-width:900px;margin:32px auto;padding:0 16px}
.card{background:#fff;border:1px solid #dbe4f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.10)}
.hero{padding:30px;background:linear-gradient(135deg,#0d6efd 0%,#1d4ed8 55%,#0f3d91 100%);color:#fff}
.hero h1{margin:0 0 8px;font-size:34px;line-height:1.1}
.hero p{margin:0;color:rgba(255,255,255,.92)}
.body{padding:28px}
.result-card{border-radius:20px;padding:22px 22px 18px;margin-bottom:22px;border:1px solid}
.result-card.success{background:linear-gradient(180deg,#ecfdf5 0%,#f7fffb 100%);border-color:#86efac}
.result-card.error{background:linear-gradient(180deg,#fff1f2 0%,#fff8f8 100%);border-color:#fda4af}
.result-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:12px}
.result-icon{width:52px;height:52px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;flex:0 0 52px}
.result-card.success .result-icon{background:#16a34a;color:#fff}
.result-card.error .result-icon{background:#dc2626;color:#fff}
.result-title{margin:0;font-size:24px;font-weight:800}
.result-sub{margin:4px 0 0;color:#475569;line-height:1.5}
.detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
.detail-box{background:rgba(255,255,255,.7);border:1px solid rgba(148,163,184,.22);border-radius:14px;padding:14px}
.detail-label{display:block;font-size:12px;color:#64748b;margin-bottom:5px}
.detail-value{font-size:18px;font-weight:700;word-break:break-word}
.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:20px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px}
.label{display:block;font-size:12px;color:#64748b;margin-bottom:6px}
.value{font-size:22px;font-weight:800;line-height:1.2}
.helper{margin:-4px 0 20px;color:#64748b;font-size:14px}
.notice{padding:16px 18px;border-radius:16px;margin-bottom:18px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c}
label{display:block;font-size:14px;font-weight:700;margin:0 0 6px}
input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #cbd5e1;border-radius:14px;font-size:15px;background:#fff}
input:focus{outline:none;border-color:#0d6efd;box-shadow:0 0 0 4px rgba(13,110,253,.12)}
.grid{display:grid;gap:16px}
.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.actions{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:22px}
.button{border:0;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:700;cursor:pointer}
.primary{background:#dc2626;color:#fff}
.secondary{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#e0ecff;color:#1d4ed8}
.secondary:hover,.primary:hover{filter:brightness(.97)}
.muted{font-size:14px;color:#64748b;line-height:1.5}
.loader{display:none;margin-top:14px;color:#1d4ed8;font-weight:700}
@media(max-width:640px){.summary,.detail-grid,.two{grid-template-columns:1fr}.actions{flex-direction:column;align-items:stretch}.hero h1{font-size:28px}.result-head{align-items:center}}
</style>
</head>
<body <?php body_class('microvise-license-payment'); ?>>
<div class="wrap">
  <div class="card">
    <div class="hero">
      <h1>Lisans Odeme</h1>
      <p>Odeme Microvise uzerinden alinir ve sonuc bu ekranda net olarak gosterilir.</p>
    </div>
    <div class="body">
<?php if ($license_status === 'success') : ?>
      <div class="result-card success">
        <div class="result-head">
          <div class="result-icon">✓</div>
          <div>
            <h2 class="result-title">Odeme Onaylandi</h2>
            <p class="result-sub">Lisans suresi otomatik uzatildi. Restoran lisansi yeni doneme aktarildi.</p>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-box"><span class="detail-label">Odeme No</span><div class="detail-value"><?php echo $payment_id ? esc_html('#' . (string) $payment_id) : '-'; ?></div></div>
          <div class="detail-box"><span class="detail-label">Restoran No</span><div class="detail-value"><?php echo $restaurant_id ? esc_html((string) $restaurant_id) : '-'; ?></div></div>
          <div class="detail-box"><span class="detail-label">Durum</span><div class="detail-value">Basarili</div></div>
        </div>
      </div>
      <a class="button secondary" href="<?php echo esc_url(home_url('/lisans-odeme/')); ?>">Yeni odeme sayfasi</a>
      <script>
      (function(){
        var payload = {
          type: 'microvise-license-payment-result',
          status: 'success',
          paymentId: <?php echo wp_json_encode($payment_id); ?>,
          restaurantId: <?php echo wp_json_encode($restaurant_id); ?>
        };
        if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*');
        if (window.opener && !window.opener.closed) window.opener.postMessage(payload, '*');
      })();
      </script>
<?php elseif ($license_status === 'fail') : ?>
      <div class="result-card error">
        <div class="result-head">
          <div class="result-icon">!</div>
          <div>
            <h2 class="result-title">Odeme Tamamlanamadi</h2>
            <p class="result-sub"><?php echo esc_html($error_message !== '' ? $error_message : 'Banka islemi basarisiz dondu.'); ?></p>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-box"><span class="detail-label">Odeme No</span><div class="detail-value"><?php echo $payment_id ? esc_html('#' . (string) $payment_id) : '-'; ?></div></div>
          <div class="detail-box"><span class="detail-label">Restoran No</span><div class="detail-value"><?php echo $restaurant_id ? esc_html((string) $restaurant_id) : '-'; ?></div></div>
          <div class="detail-box"><span class="detail-label">Durum</span><div class="detail-value">Basarisiz</div></div>
        </div>
      </div>
      <a class="button secondary" href="<?php echo esc_url(home_url('/lisans-odeme/')); ?>">Tekrar dene</a>
      <script>
      (function(){
        var payload = {
          type: 'microvise-license-payment-result',
          status: 'fail',
          paymentId: <?php echo wp_json_encode($payment_id); ?>,
          restaurantId: <?php echo wp_json_encode($restaurant_id); ?>,
          errorMessage: <?php echo wp_json_encode($error_message !== '' ? $error_message : 'Banka islemi basarisiz dondu.'); ?>
        };
        if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*');
        if (window.opener && !window.opener.closed) window.opener.postMessage(payload, '*');
      })();
      </script>
<?php elseif ($session_token === '') : ?>
      <div class="notice"><strong>Odeme baglantisi gecersiz.</strong><br>Bu ekran restoran panelinden olusturulan gecerli odeme oturumu ile acilmalidir.</div>
<?php else : ?>
      <div class="summary">
        <div class="box"><span class="label">Restoran</span><div class="value"><?php echo esc_html($restaurant_name); ?></div></div>
        <div class="box"><span class="label">Sure</span><div class="value"><?php echo esc_html((string) max($months, 1)); ?> ay</div></div>
        <div class="box"><span class="label">Tutar</span><div class="value"><?php echo esc_html($amount . ' ' . $currency); ?></div></div>
      </div>
      <p class="helper">Kart bilgilerinizi girin. Banka onayi sonrasi sonuc bu sayfaya geri doner.</p>
      <div id="license-error" class="notice" style="display:none"></div>
      <form id="license-payment-form" class="grid" novalidate>
        <div>
          <label for="card-holder">Kart uzerindeki isim</label>
          <input id="card-holder" type="text" autocomplete="cc-name" placeholder="Ad Soyad" required>
        </div>
        <div>
          <label for="card-number">Kart numarasi</label>
          <input id="card-number" type="text" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="1234 5678 9012 3456" required>
        </div>
        <div class="grid two">
          <div>
            <label for="card-expiry">Son kullanma</label>
            <input id="card-expiry" type="text" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="03/29" required>
          </div>
          <div>
            <label for="card-cvc">CVC</label>
            <input id="card-cvc" type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="CVC" required>
          </div>
        </div>
        <div class="actions">
          <div class="muted">Banka onayi sonrasi ayni sayfada sonucu goreceksiniz.</div>
          <button id="pay-button" class="button primary" type="submit">Odeme Yap</button>
        </div>
        <div id="license-loader" class="loader">Banka ekrani hazirlaniyor...</div>
      </form>
      <script>
      (function(){
      var sessionToken=<?php echo wp_json_encode($session_token); ?>;
      var apiUrl=<?php echo wp_json_encode($api_url); ?>;
      var form=document.getElementById('license-payment-form');
      var errorBox=document.getElementById('license-error');
      var loader=document.getElementById('license-loader');
      var payButton=document.getElementById('pay-button');
      var cardNumber=document.getElementById('card-number');
      var cardExpiry=document.getElementById('card-expiry');
      var cardCvc=document.getElementById('card-cvc');
      function digits(v){return(v||'').replace(/\D/g,'');}
      function showError(message){errorBox.textContent=message;errorBox.style.display='block';}
      cardNumber.addEventListener('input',function(){var d=digits(cardNumber.value).slice(0,19);var p=[];for(var i=0;i<d.length;i+=4){p.push(d.slice(i,i+4));}cardNumber.value=p.join(' ');});
      cardExpiry.addEventListener('input',function(){var d=digits(cardExpiry.value).slice(0,4);if(d.length>=3){d=d.slice(0,2)+'/'+d.slice(2);}cardExpiry.value=d;});
      cardCvc.addEventListener('input',function(){cardCvc.value=digits(cardCvc.value).slice(0,4);});
      form.addEventListener('submit',function(event){event.preventDefault();errorBox.style.display='none';var holder=document.getElementById('card-holder').value.trim();var number=digits(cardNumber.value);var expiry=cardExpiry.value.trim().split('/');var expMonth=expiry[0]||'';var expYearShort=expiry[1]||'';var expYear=expYearShort?'20'+expYearShort:'';var cvc=digits(cardCvc.value);if(!holder||number.length<12||expMonth.length!==2||expYearShort.length!==2||cvc.length<3){showError('Lutfen kart bilgilerini eksiksiz ve dogru girin.');return;}loader.style.display='block';payButton.disabled=true;fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionToken:sessionToken,cardHolderName:holder,cardNumber:number,expireMonth:expMonth,expireYear:expYear,cvc:cvc})}).then(function(response){return response.json();}).then(function(data){if(data&&data.success&&data.html){document.open();document.write(data.html);document.close();return;}throw new Error((data&&data.message)||'Odeme baslatilamadi.');}).catch(function(error){loader.style.display='none';payButton.disabled=false;showError(error&&error.message?error.message:'Odeme baslatilamadi.');});});
      })();
      </script>
<?php endif; ?>
    </div>
  </div>
</div>
<?php wp_footer(); ?>
</body></html>
