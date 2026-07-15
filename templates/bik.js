// Template: ใบเบิกเงินค่าแรงล่วงหน้าหรือค่าวัสดุ (บริษัท ส.การโยธา 1993)
// เพิ่มเอกสารใหม่ = ก๊อปไฟล์นี้ แก้ render/compute แล้ว register ใน window.TEMPLATES (ดู README)

(function () {
  const num = v => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
  const r2  = n => Math.round(n * 100) / 100;
  const fmt = n => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const todayTH = () => { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${(d.getFullYear() + 543) % 100}`; };

  // ── สถานะฟอร์ม (คงไว้ข้ามการสลับหน้า) ──
  let data = {
    date: todayTH(), payerName: '', bank: '', accountNo: '',
    work: '', place: '', amphoe: '', province: '',
    items: [],                 // {name, amount} — เริ่ม 0 แถว
    advance: '', taxPct: 3, insPct: 5,
  };

  // ── การคำนวณ (money path) ──
  function compute(d) {
    const sum = d.items.reduce((a, it) => a + num(it.amount), 0);
    const advance = num(d.advance);
    const remain1 = r2(sum - advance);
    const tax = r2(remain1 * num(d.taxPct) / 100);
    const ins = r2(sum * num(d.insPct) / 100);
    const net = r2(remain1 - tax - ins);
    return { sum, advance, remain1, tax, ins, net };
  }

  let host = null, accounts = [];

  function render(_host, _accounts) {
    host = _host; accounts = _accounts || [];
    host.innerHTML = view();
    bind();
    // ไม่ย่อบนจอ — โชว์เต็มขนาดเสมอทุกเครื่อง/ทุก OS (ย่อเฉพาะตอนพิมพ์ให้พอดี 1 หน้า)
    if (!window.__bikPrintHook) {
      window.__bikPrintHook = true;
      window.addEventListener('beforeprint', fitToPage);
      window.addEventListener('afterprint', () => { const i = host && host.querySelector('.sheet-inner'); if (i) i.style.zoom = '1'; });
    }
  }

  // ชื่อไฟล์เวลา print/save: ใบเบิกเงิน <ไซต์งาน> <ผู้เบิก> <วันที่> (แทน / ในวันที่ด้วย - เลี่ยงปัญหา path)
  function docName() {
    const site = (data.work || '').trim();
    const payer = (data.payerName || '').trim();
    const date = (data.date || '').trim().replace(/\//g, '-');
    return ['ใบเบิกเงิน', site, payer, date].filter(Boolean).join(' ');
  }

  function view() {
    const t = compute(data);
    const opts = accounts.map(a =>
      `<option value="${a.id}">${esc(a.nickname || a.fullname)}${a.nickname ? ' — ' + esc(a.fullname) : ''}</option>`).join('');
    const rows = data.items.map((it, i) => `
      <tr>
        <td class="c-no">${i + 1}</td>
        <td><input class="li-name fld" data-i="${i}" value="${esc(it.name)}" placeholder="รายการค่าแรง/ค่าวัสดุ..."></td>
        <td class="c-eq">=</td>
        <td class="c-amt"><input class="li-amt fld amt" data-i="${i}" value="${esc(it.amount)}" inputmode="decimal" placeholder="0.00"></td>
        <td class="c-unit">บาท <button class="li-del no-print" data-i="${i}" title="ลบแถว">✕</button></td>
      </tr>`).join('');

    return `
    <!-- แถบช่วย เลือกจากบัญชี (ไม่ปรินต์) -->
    <div class="helper no-print">
      <label>เลือกจากบัญชี:
        <select id="payer-select"><option value="">— พิมพ์เอง —</option>${opts}</select>
      </label>
      <span class="hint">เลือกแล้วเติมชื่อ/ธนาคาร/เลขบัญชีให้อัตโนมัติ (แก้ต่อได้)</span>
    </div>

    <div class="paper"><div class="sheet-inner">
      <div class="head">
        <div class="co">บริษัท ส. การโยธา 1993 จำกัด</div>
        <div class="co-sub">208 หมู่ 11 ถ.ศรีสะเกษ – อุทุมพรพิสัย ต.หญ้าปล้อง อ.เมือง จ.ศรีสะเกษ</div>
        <div class="co-sub">โทร 045-643078 , 081-8762030</div>
      </div>

      <div class="row-r">วันที่ <input class="fld w-date" id="f-date" value="${esc(data.date)}"></div>

      <div class="ln"><b>เรื่อง</b>&nbsp;&nbsp;ขอเบิกเงินค่าแรงล่วงหน้าหรือค่าวัสดุ</div>
      <div class="ln"><b>เรียน</b>&nbsp;&nbsp;ผู้จัดการบริษัท ส.การโยธา 1993 จำกัด</div>
      <div class="ln">ด้วย ข้าพเจ้า <span class="fld ce wide" contenteditable="true" data-k="payerName">${esc(data.payerName)}</span> ได้เป็นผู้รับเหมางาน <span class="fld ce wide" contenteditable="true" data-k="work">${esc(data.work)}</span></div>
      <div class="ln">ณ <span class="fld ce" contenteditable="true" data-k="place">${esc(data.place)}</span> อำเภอ <span class="fld ce" contenteditable="true" data-k="amphoe">${esc(data.amphoe)}</span> จังหวัด <span class="fld ce" contenteditable="true" data-k="province">${esc(data.province)}</span> นั้น</div>
      <div class="ln">บัดนี้ ข้าพเจ้า ได้ทำงานดังกล่าว ดังนี้</div>

      <table class="items"><tbody>${rows}</tbody></table>
      <button class="add no-print" id="f-add">+ เพิ่มรายการ</button>

      <table class="calc">
        <tr><td class="lbl">รวมเป็นเงิน</td><td class="eq">=</td><td class="val out" id="o-sum">${fmt(t.sum)}</td><td>บาท</td></tr>
        <tr><td class="lbl">หักเบิกค่าแรงล่วงหน้า</td><td class="eq">=</td><td class="val"><input class="fld amt" id="f-adv" value="${esc(data.advance)}" inputmode="decimal" placeholder="0.00"></td><td>บาท</td></tr>
        <tr><td class="lbl">คงเหลือ</td><td class="eq">=</td><td class="val out" id="o-remain1">${fmt(t.remain1)}</td><td>บาท</td></tr>
        <tr><td class="lbl">หักภาษี ณ ที่จ่าย <input class="fld pct" id="f-tax" value="${esc(data.taxPct)}" inputmode="decimal">%</td><td class="eq">=</td><td class="val out" id="o-tax">${fmt(t.tax)}</td><td>บาท</td></tr>
        <tr><td class="lbl">หักเงินประกันผลงาน <input class="fld pct" id="f-ins" value="${esc(data.insPct)}" inputmode="decimal">%</td><td class="eq">=</td><td class="val out" id="o-ins">${fmt(t.ins)}</td><td>บาท</td></tr>
        <tr class="net"><td class="lbl"><b>คงเหลือเป็นเงินทั้งสิ้น</b></td><td class="eq">=</td><td class="val out" id="o-net"><b>${fmt(t.net)}</b></td><td>บาท</td></tr>
      </table>

      <div class="pay">
        <label><input type="checkbox" id="p-bol" checked> โอน B.O.L. ได้</label>
        <label><input type="checkbox" id="p-acc" checked> โอนเงินเลขที่บัญชี
          <span class="fld ce" contenteditable="true" data-k="bank" data-ph="ธนาคาร">${esc(data.bank)}</span>
          <span class="fld ce" contenteditable="true" data-k="accountNo" data-ph="เลขที่บัญชี">${esc(data.accountNo)}</span></label>
        <label><input type="checkbox"> ได้รับเอกสารใบกำกับภาษีแล้ว</label>
        <label><input type="checkbox"> ใบกำกับภาษีได้รับหลังโอนเงิน</label>
        <label><input type="checkbox"> เช็คเอกสารตรงกับ P/O เดือน ........ แล้ว</label>
        <label><input type="checkbox"> บิลเงินสดได้รับหลังจากโอนเงิน</label>
        <label><input type="checkbox"> ไปโอนเงินสดที่เคาน์เตอร์</label>
      </div>

      <div class="ln claim">ดังนั้น จึงขอเบิกเงิน เป็นจำนวน <span class="out" id="o-net2">${fmt(t.net)}</span> บาท
        (<span class="out baht-txt" id="o-txt">${esc(window.bahttext(t.net))}</span>)</div>
      <div class="ln">เพื่อที่ข้าพเจ้าฯ จะได้นำไปใช้จ่ายต่อไป</div>
      <div class="closing">
        <div>จึงเรียนมาเพื่อโปรดพิจารณา</div>
        <div class="sign"><div class="sl">ลงชื่อ...........................................<br><span class="cap">ผู้เบิก+ผู้รับเงิน</span></div></div>
      </div>

      <div class="boxes">
        <div class="box">
          <div>ได้ทำการตรวจสอบไปที่หน้างานแล้ว</div>
          <div>เห็นควรเบิกได้....................................บาท</div>
          <div class="sp">ลงชื่อ.............................ผู้ตรวจสอบ</div>
          <div>(............................................)</div>
          <div>......../......../........</div>
          <div class="sp">ยอดเหมา....................................บาท</div>
          <div>เบิกสะสม....................................บาท</div>
          <div>คงเหลือ......................................บาท</div>
        </div>
        <div class="box">
          <div class="chk">☐ อนุมัติ = ..............................</div>
          <div class="chk">☐ รับสดย่อยจากหน่อย</div>
          <div class="chk">☐ CMS ............................</div>
          <div class="chk">☐ B.O.L. ............................</div>
          <div class="chk">☐ OD BUYER</div>
          <div class="chk">☐ จ่ายเช็ค 8490 ............................</div>
          <div class="chk">☐ ส02 ทำรายการ,เฮียอนุมัติเอง</div>
          <div class="chk">☐ ส1 Online</div>
          <div class="chk">☐ ส22 Online</div>
          <div class="chk">☐ จ่ายเงินสด</div>
          <div class="sp">ลงชื่อ.............................ผู้จัดการ</div>
          <div>( นายสรศาสตร์ &nbsp; ศรีธัญรัตน์ )</div>
        </div>
      </div>
    </div></div>`;
  }

  // ── auto-fit: ย่อ (zoom) ให้เนื้อหาพอดี 1 หน้า A4 เมื่อสูงเกิน ──
  const AVAIL_PX = 1055; // ความสูงพื้นที่พิมพ์ A4 (296mm − ขอบ 8mm×2) ที่ 96dpi
  function fitToPage() {
    const inner = host && host.querySelector('.sheet-inner');
    if (!inner) return;
    inner.style.zoom = '1';
    inner.style.flex = 'none';   // วัดความสูง "เนื้อหาจริง"
    const need = inner.scrollHeight;
    if (need > AVAIL_PX) {
      // เนื้อหาล้น: คงความสูงเนื้อหาจริง (ไม่ fill) แล้วย่อให้พอดี — เต็มหน้าอยู่แล้วไม่ต้องดันล่าง
      inner.style.zoom = String(Math.max(0.82, AVAIL_PX / need));
    } else {
      // พอดี: fill + ดันกล่องลงชิดล่าง (flex:1 จาก CSS), ไม่ย่อ
      inner.style.flex = '';
      inner.style.zoom = '1';
    }
  }

  // ── อัปเดตยอดสด โดยไม่ re-render (กันโฟกัสหลุดตอนพิมพ์) ──
  function recompute() {
    const t = compute(data);
    const set = (id, v) => { const el = host.querySelector('#' + id); if (el) el.textContent = v; };
    set('o-sum', fmt(t.sum)); set('o-remain1', fmt(t.remain1));
    set('o-tax', fmt(t.tax)); set('o-ins', fmt(t.ins));
    host.querySelector('#o-net').innerHTML = '<b>' + fmt(t.net) + '</b>';
    set('o-net2', fmt(t.net)); set('o-txt', window.bahttext(t.net));
  }

  function bind() {
    const q = s => host.querySelector(s);
    // วันที่ (input สั้น)
    const fd = q('#f-date'); if (fd) fd.oninput = e => { data.date = e.target.value; };
    // ช่องข้อความอิสระ = contenteditable (ยืด+ตัดบรรทัดเอง ไม่ตัดข้อความหาย) → อ่านจาก textContent
    host.querySelectorAll('[data-k]').forEach(el => el.oninput = e => { data[e.target.dataset.k] = e.target.textContent; });
    // ฟิลด์ตัวเลข → recompute
    const money = { 'f-adv': 'advance', 'f-tax': 'taxPct', 'f-ins': 'insPct' };
    for (const id in money) { const el = q('#' + id); if (el) el.oninput = e => { data[money[id]] = e.target.value; recompute(); }; }
    // แถวรายการ (delegation)
    host.querySelectorAll('.li-name').forEach(el => el.oninput = e => { data.items[+e.target.dataset.i].name = e.target.value; });
    host.querySelectorAll('.li-amt').forEach(el => el.oninput = e => { data.items[+e.target.dataset.i].amount = e.target.value; recompute(); });
    host.querySelectorAll('.li-del').forEach(el => el.onclick = e => { data.items.splice(+e.target.dataset.i, 1); render(host, accounts); });
    q('#f-add').onclick = () => { data.items.push({ name: '', amount: '' }); render(host, accounts); };
    // เลือกจากบัญชี → autofill
    const sel = q('#payer-select');
    if (sel) sel.onchange = e => {
      const a = accounts.find(x => x.id === e.target.value);
      if (!a) return;
      data.payerName = a.fullname || ''; data.bank = a.bank || ''; data.accountNo = a.account_no || '';
      render(host, accounts);
    };
  }

  window.TEMPLATES = window.TEMPLATES || {};
  window.TEMPLATES.bik = { id: 'bik', title: 'ใบเบิกเงิน (ค่าแรง/วัสดุ)', render, compute, filename: docName, fit: fitToPage };
})();
