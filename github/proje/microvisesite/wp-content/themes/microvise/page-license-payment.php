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
.wrap{max-width:860px;margin:12px auto;padding:0 12px}
.card{background:#fff;border:1px solid #dbe4f0;border-radius:22px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,.10)}
.hero{padding:16px 18px;background:linear-gradient(135deg,#0d6efd 0%,#1d4ed8 55%,#0f3d91 100%);color:#fff}
.hero h1{margin:0 0 4px;font-size:26px;line-height:1.1}
.hero p{margin:0;font-size:14px;color:rgba(255,255,255,.92)}
.body{padding:16px}
.result-card{border-radius:18px;padding:18px 18px 16px;margin-bottom:18px;border:1px solid}
.result-card.success{background:linear-gradient(180deg,#ecfdf5 0%,#f7fffb 100%);border-color:#86efac}
.result-card.error{background:linear-gradient(180deg,#fff1f2 0%,#fff8f8 100%);border-color:#fda4af}
.result-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.result-icon{width:46px;height:46px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:700;flex:0 0 46px}
.result-card.success .result-icon{background:#16a34a;color:#fff}
.result-card.error .result-icon{background:#dc2626;color:#fff}
.result-title{margin:0;font-size:22px;font-weight:800}
.result-sub{margin:4px 0 0;color:#475569;line-height:1.45}
.detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
.detail-box{background:rgba(255,255,255,.7);border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px}
.detail-label{display:block;font-size:11px;color:#64748b;margin-bottom:4px}
.detail-value{font-size:16px;font-weight:700;word-break:break-word}
.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px}
.label{display:block;font-size:11px;color:#64748b;margin-bottom:4px}
.value{font-size:18px;font-weight:800;line-height:1.2}
.helper{margin:0 0 10px;color:#64748b;font-size:13px}
.payment-shell{display:grid;grid-template-columns:1fr;gap:0}
.payment-form-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 10px 24px rgba(15,23,42,.05);padding:14px}
.card-preview-row{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:12px;margin-bottom:14px}
.bank-card{position:relative;min-height:142px;border-radius:18px;padding:16px;background:linear-gradient(135deg,#111827 0%,#1d4ed8 60%,#2563eb 100%);color:#fff;overflow:hidden;box-shadow:0 14px 32px rgba(37,99,235,.24)}
.bank-card:before{content:"";position:absolute;inset:auto -32px -48px auto;width:140px;height:140px;border-radius:999px;background:rgba(255,255,255,.10)}
.bank-card:after{content:"";position:absolute;inset:14px auto auto 118px;width:86px;height:86px;border-radius:999px;background:rgba(255,255,255,.06)}
.bank-card-top,.bank-card-bottom{position:relative;z-index:1}
.bank-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:18px}
.bank-card-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.14);font-size:11px;font-weight:700;letter-spacing:.02em}
.bank-card-chip{width:36px;height:24px;border-radius:7px;background:linear-gradient(135deg,#fde68a 0%,#f59e0b 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
.bank-card-brand{font-size:12px;font-weight:700;color:rgba(255,255,255,.92)}
.bank-card-number{margin:0 0 14px;font-size:22px;font-weight:800;letter-spacing:.08em}
.bank-card-meta{display:flex;justify-content:space-between;gap:10px}
.bank-card-meta span{display:block;font-size:10px;color:rgba(255,255,255,.78);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em}
.bank-card-meta strong{font-size:13px;font-weight:700}
.side-box{padding:14px;border:1px solid #dbe4f0;border-radius:18px;background:linear-gradient(180deg,#f8fafc 0%,#eef4ff 100%)}
.side-box .value{font-size:24px}
.side-box p{margin:8px 0 0;font-size:12px;line-height:1.45;color:#64748b}
.notice{padding:14px 16px;border-radius:14px;margin-bottom:14px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c}
label{display:block;font-size:13px;font-weight:700;margin:0 0 5px}
input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #cbd5e1;border-radius:12px;font-size:14px;background:#fff}
input:focus{outline:none;border-color:#0d6efd;box-shadow:0 0 0 4px rgba(13,110,253,.12)}
.grid{display:grid;gap:12px}
.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0}
.button{border:0;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:700;cursor:pointer}
.primary{background:#dc2626;color:#fff}
.secondary{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#e0ecff;color:#1d4ed8}
.secondary:hover,.primary:hover{filter:brightness(.97)}
.muted{font-size:12px;color:#64748b;line-height:1.45}
.loader{display:none;margin-top:10px;color:#1d4ed8;font-weight:700;font-size:13px}
@media(max-width:640px){.summary,.detail-grid,.two,.card-preview-row{grid-template-columns:1fr}.actions{flex-direction:column;align-items:stretch}.hero h1{font-size:24px}.result-head{align-items:center}.bank-card-number{font-size:20px}.wrap{padding:0 8px}.body{padding:12px}.payment-form-card{padding:12px}}
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
        <div class="payment-shell">
          <div class="payment-form-card">
            <div class="card-preview-row">
              <div class="bank-card">
                <div class="bank-card-top">
                  <div class="bank-card-badge"><span class="bank-card-chip"></span> Guvenli Odeme</div>
                  <div class="bank-card-brand">Microvise Secure</div>
                </div>
                <div class="bank-card-bottom">
                  <div id="card-preview-number" class="bank-card-number">**** **** **** ****</div>
                  <div class="bank-card-meta">
                    <div>
                      <span>Kart Sahibi</span>
                      <strong id="card-preview-name">AD SOYAD</strong>
                    </div>
                    <div>
                      <span>Son Kullanma</span>
                      <strong id="card-preview-expiry">AA/YY</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div class="side-box">
                <span class="label">Toplam Odeme</span>
                <div class="value"><?php echo esc_html($amount . ' ' . $currency); ?></div>
                <p>Banka 3D onayi sonrasi sonuc bu ekranda gosterilir.</p>
              </div>
            </div>
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
          </div>
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
      var cardHolder=document.getElementById('card-holder');
      var cardNumber=document.getElementById('card-number');
      var cardExpiry=document.getElementById('card-expiry');
      var cardCvc=document.getElementById('card-cvc');
      var previewNumber=document.getElementById('card-preview-number');
      var previewName=document.getElementById('card-preview-name');
      var previewExpiry=document.getElementById('card-preview-expiry');
      function digits(v){return(v||'').replace(/\D/g,'');}
      function showError(message){errorBox.textContent=message;errorBox.style.display='block';}
      function updatePreviewNumber(){var number=digits(cardNumber.value);var masked='**** **** **** ****';if(number){var visible=number.slice(0,16);var parts=[];for(var i=0;i<visible.length;i+=4){parts.push(visible.slice(i,i+4).padEnd(4,'*'));}masked=parts.join(' ');}previewNumber.textContent=masked;}
      function updatePreviewName(){previewName.textContent=(cardHolder.value.trim()||'Ad Soyad').toUpperCase();}
      function updatePreviewExpiry(){previewExpiry.textContent=cardExpiry.value.trim()||'AA/YY';}
      cardHolder.addEventListener('input',updatePreviewName);
      cardNumber.addEventListener('input',function(){var d=digits(cardNumber.value).slice(0,19);var p=[];for(var i=0;i<d.length;i+=4){p.push(d.slice(i,i+4));}cardNumber.value=p.join(' ');updatePreviewNumber();});
      cardExpiry.addEventListener('input',function(){var d=digits(cardExpiry.value).slice(0,4);if(d.length>=3){d=d.slice(0,2)+'/'+d.slice(2);}cardExpiry.value=d;updatePreviewExpiry();});
      cardCvc.addEventListener('input',function(){cardCvc.value=digits(cardCvc.value).slice(0,4);});
      updatePreviewNumber();
      updatePreviewName();
      updatePreviewExpiry();
      form.addEventListener('submit',function(event){event.preventDefault();errorBox.style.display='none';var holder=cardHolder.value.trim();var number=digits(cardNumber.value);var expiry=cardExpiry.value.trim().split('/');var expMonth=expiry[0]||'';var expYearShort=expiry[1]||'';var expYear=expYearShort?'20'+expYearShort:'';var cvc=digits(cardCvc.value);if(!holder||number.length<12||expMonth.length!==2||expYearShort.length!==2||cvc.length<3){showError('Lutfen kart bilgilerini eksiksiz ve dogru girin.');return;}loader.style.display='block';payButton.disabled=true;fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionToken:sessionToken,cardHolderName:holder,cardNumber:number,expireMonth:expMonth,expireYear:expYear,cvc:cvc})}).then(function(response){return response.json();}).then(function(data){if(data&&data.success&&data.html){document.open();document.write(data.html);document.close();return;}throw new Error((data&&data.message)||'Odeme baslatilamadi.');}).catch(function(error){loader.style.display='none';payButton.disabled=false;showError(error&&error.message?error.message:'Odeme baslatilamadi.');});});
      })();
      </script>
<?php endif; ?>
    </div>
  </div>
</div>
<?php wp_footer(); ?>
</body></html>
