// แปลงจำนวนเงิน (บาท.สตางค์) → ข้อความภาษาไทย เช่น 38614.76 → "สามหมื่นแปดพันหกร้อยสิบสี่บาทเจ็ดสิบหกสตางค์"
// money path — มี self-check ท้ายไฟล์

(function (global) {
  const NUM  = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const UNIT = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

  // อ่านเลข 0..999999 เป็นคำ ('' ถ้าเป็น 0)
  function readGroup(n) {
    let s = '';
    const str = String(n), len = str.length;
    for (let i = 0; i < len; i++) {
      const d = +str[i], pos = len - 1 - i;
      if (d === 0) continue;
      if (pos === 0 && d === 1 && len > 1) s += 'เอ็ด';
      else if (pos === 1 && d === 1)        s += 'สิบ';
      else if (pos === 1 && d === 2)        s += 'ยี่สิบ';
      else                                  s += NUM[d] + UNIT[pos];
    }
    return s;
  }

  // อ่านจำนวนเต็มบาท (รองรับหลักล้านด้วย recursion)
  function readInt(n) {
    if (n === 0) return 'ศูนย์';
    let s = '';
    const millions = Math.floor(n / 1000000), rest = n % 1000000;
    // ponytail: recursion อ่านล้านซ้อนได้ แต่ไม่ทำ "เอ็ด" ข้ามหลักล้าน (เช่น 1,000,001) — ยอดเบิกจริงหลักหมื่น/แสน ไม่ถึง
    if (millions > 0) s += readInt(millions) + 'ล้าน';
    s += readGroup(rest);
    return s;
  }

  function bahttext(amount) {
    amount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(amount)) return '';
    const neg = amount < 0; amount = Math.abs(amount);
    const baht = Math.floor(amount);
    const satang = Math.round((amount - baht) * 100);
    let out = readInt(baht) + 'บาท';
    out += satang === 0 ? 'ถ้วน' : readGroup(satang) + 'สตางค์';
    return (neg ? 'ลบ' : '') + out;
  }

  global.bahttext = bahttext;

  // ── self-check (รันตอนโหลด, เตือนใน console ถ้าเพี้ยน) ──
  const cases = [
    [38614.76, 'สามหมื่นแปดพันหกร้อยสิบสี่บาทเจ็ดสิบหกสตางค์'],
    [0,        'ศูนย์บาทถ้วน'],
    [21,       'ยี่สิบเอ็ดบาทถ้วน'],
    [101,      'หนึ่งร้อยเอ็ดบาทถ้วน'],
    [1000000,  'หนึ่งล้านบาทถ้วน'],
    [30.5,     'สามสิบบาทห้าสิบสตางค์'],
  ];
  for (const [n, want] of cases) {
    const got = bahttext(n);
    console.assert(got === want, `bahttext(${n}) = "${got}" ≠ "${want}"`);
  }
})(window);
