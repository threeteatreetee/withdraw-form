// ── SHELL ── login + Supabase + บัญชี CRUD + nav + print + mount template
// (โครงเป็น prototype: จัด section ชัด ๆ เผื่อเพิ่ม template/ฟีเจอร์ทีหลัง)

// ── CONFIG ── ใช้โปรเจกต์ Supabase เดียวกับ task-tracker
const SUPABASE_URL = 'https://wocqftaojrviqjprzrjw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3FmdGFvanJ2aXFqcHJ6cmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjI0NzIsImV4cCI6MjA5ODMzODQ3Mn0.O5RbRSCpb8o_baMgBOD9sMMz3WRazsQoZ6JDqM7rk7k';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inputStyle = 'width:100%; box-sizing:border-box; padding:12px 14px; font-size:16px; border:1px solid #d1d5db; border-radius:10px; outline:none;';

const state = { page: 'create', accounts: [], search: '', tplId: 'bik', modal: null, session: null };

// ── AUTH ──
let loginBusy = false, loginErr = '';
async function doLogin(email, password) {
  if (!email || !password) { loginErr = 'กรอกอีเมลและรหัสผ่าน'; return renderLogin(); }
  loginErr = ''; loginBusy = true; renderLogin();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  loginBusy = false;
  if (error) { loginErr = 'เข้าสู่ระบบไม่สำเร็จ — เช็คอีเมล/รหัสผ่าน'; renderLogin(); }
  // สำเร็จ → onAuthStateChange เด้งให้เอง
}
function renderLogin() {
  $('#main').hidden = true;
  $('#login-view').hidden = false;
  $('#login-view').innerHTML = `
  <div class="login-wrap">
    <div class="login-card">
      <div style="text-align:center; margin-bottom:22px;">
        <div style="font-size:34px;">🧾</div>
        <div style="font-size:20px; font-weight:700; color:#0f172a;">ระบบเอกสารเบิกเงิน</div>
        <div style="font-size:13px; color:#9ca3af; margin-top:4px;">ส.การโยธา 1993 — เข้าสู่ระบบ</div>
      </div>
      <input id="login-email" type="email" autocomplete="username" placeholder="อีเมล" style="${inputStyle} margin-bottom:10px;">
      <input id="login-pw" type="password" autocomplete="current-password" placeholder="รหัสผ่าน" style="${inputStyle} margin-bottom:14px;">
      ${loginErr ? `<div class="login-err">${esc(loginErr)}</div>` : ''}
      <button id="login-btn" ${loginBusy ? 'disabled' : ''} style="width:100%; background:#2563eb; color:#fff; border:none; border-radius:11px; padding:14px; font-size:16px; font-weight:700; cursor:pointer; opacity:${loginBusy ? 0.6 : 1};">${loginBusy ? 'กำลังเข้า...' : 'เข้าสู่ระบบ'}</button>
    </div>
  </div>`;
  const go = () => doLogin($('#login-email').value.trim(), $('#login-pw').value);
  $('#login-btn').onclick = go;
  $('#login-pw').onkeydown = e => { if (e.key === 'Enter') go(); };
}
async function boot() {
  sb.auth.onAuthStateChange((_e, s) => {
    const was = !!state.session; state.session = s;
    if (s && !was) enterApp();
    else if (!s && was) renderLogin();
  });
  const { data } = await sb.auth.getSession();
  state.session = data.session;
  if (state.session) enterApp(); else renderLogin();
}
async function enterApp() {
  $('#login-view').hidden = true;
  $('#main').hidden = false;
  await loadAccounts();
  renderNav();
  showPage('create');
}

// ── ACCOUNTS ──
const displayName = a => a.nickname || a.fullname || '';
async function loadAccounts() {
  const { data, error } = await sb.from('accounts').select('*');
  if (error) { console.warn('load accounts failed:', error.message); return; }
  state.accounts = (data || []).sort((a, b) => displayName(a).localeCompare(displayName(b), 'th'));
}
async function saveAccount(acc) {
  const row = { nickname: acc.nickname || null, fullname: acc.fullname, bank: acc.bank || null, account_no: acc.account_no || null };
  const res = acc.id ? await sb.from('accounts').update(row).eq('id', acc.id) : await sb.from('accounts').insert(row);
  if (res.error) { alert('บันทึกไม่สำเร็จ: ' + res.error.message); return; }
  await loadAccounts(); state.modal = null; renderAccounts();
}
async function deleteAccount(id) {
  if (!confirm('ลบรายชื่อนี้?')) return;
  const { error } = await sb.from('accounts').delete().eq('id', id);
  if (error) { alert('ลบไม่สำเร็จ: ' + error.message); return; }
  await loadAccounts(); state.modal = null; renderAccounts();
}
function renderAccounts() {
  const q = state.search.trim().toLowerCase();
  const list = state.accounts.filter(a =>
    !q || displayName(a).toLowerCase().includes(q) || (a.fullname || '').toLowerCase().includes(q) || (a.account_no || '').includes(q));
  $('#acc-list').innerHTML = list.length ? list.map(a => `
    <div class="acc-card" data-id="${a.id}">
      <div class="acc-name">${esc(a.nickname || a.fullname)}${a.nickname ? `<span class="acc-real"> ${esc(a.fullname)}</span>` : ''}</div>
      <div class="acc-bank">${esc(a.bank || '')} ${esc(a.account_no || '')}</div>
    </div>`).join('') : `<div class="empty">${state.accounts.length ? 'ไม่พบรายชื่อที่ค้นหา' : 'ยังไม่มีรายชื่อ — กด + เพิ่มรายชื่อ'}</div>`;
  $('#acc-list').querySelectorAll('.acc-card').forEach(el =>
    el.onclick = () => openModal(state.accounts.find(a => a.id === el.dataset.id)));
  renderModal();
}
function openModal(acc) { state.modal = acc ? { ...acc } : { nickname: '', fullname: '', bank: '', account_no: '' }; renderModal(); }
function renderModal() {
  const m = state.modal;
  if (!m) { $('#modal-root').innerHTML = ''; return; }
  $('#modal-root').innerHTML = `
  <div class="overlay">
    <div class="modal">
      <div class="modal-title">${m.id ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อ'}</div>
      <label class="f">ชื่อจริง-สกุล *<input id="m-full" value="${esc(m.fullname)}"></label>
      <label class="f">ชื่อเรียก (ไม่บังคับ)<input id="m-nick" value="${esc(m.nickname || '')}"></label>
      <label class="f">ธนาคาร<input id="m-bank" value="${esc(m.bank || '')}"></label>
      <label class="f">เลขบัญชี<input id="m-acc" value="${esc(m.account_no || '')}"></label>
      <div class="modal-btns">
        ${m.id ? `<button id="m-del" class="btn-del">ลบ</button>` : '<span></span>'}
        <div>
          <button id="m-cancel" class="btn-ghost">ยกเลิก</button>
          <button id="m-save" class="btn-primary">บันทึก</button>
        </div>
      </div>
    </div>
  </div>`;
  $('#m-cancel').onclick = () => { state.modal = null; renderModal(); };
  $('#m-save').onclick = () => {
    const full = $('#m-full').value.trim();
    if (!full) { alert('ต้องกรอกชื่อจริง-สกุล'); return; }
    saveAccount({ id: m.id, fullname: full, nickname: $('#m-nick').value.trim(), bank: $('#m-bank').value.trim(), account_no: $('#m-acc').value.trim() });
  };
  if (m.id) $('#m-del').onclick = () => deleteAccount(m.id);
}

// ── NAV / TEMPLATE / PRINT ──
function renderNav() {
  const tpls = Object.values(window.TEMPLATES || {});
  // แสดง dropdown เลือก template เฉพาะเมื่อมี > 1 (ตอนนี้มีตัวเดียว)
  $('#tpl-select').hidden = tpls.length <= 1;
  $('#tpl-select').innerHTML = tpls.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join('');
  $('#tpl-select').value = state.tplId;
  $('#tpl-select').onchange = e => { state.tplId = e.target.value; mountTemplate(); };
  $('#nav-create').onclick = () => showPage('create');
  $('#nav-accounts').onclick = () => showPage('accounts');
  $('#btn-print').onclick = printDoc;
  $('#btn-save').onclick = printDoc;   // เปิด dialog เดียวกัน → เลือก "Save as PDF" (ชื่อไฟล์ตั้งให้แล้ว)
  $('#acc-add').onclick = () => openModal(null);
  $('#acc-search').oninput = e => { state.search = e.target.value; renderAccounts(); };
}
function mountTemplate() {
  const t = window.TEMPLATES[state.tplId];
  if (t) t.render($('#form-host'), state.accounts);
}

// ── ชื่อไฟล์ PDF: ต้องตั้ง document.title ก่อน window.print() (Chrome อ่าน title ตอนเรียก print) ──
let __origTitle = null;
function printFilename() { const t = window.TEMPLATES[state.tplId]; return (t && t.filename) ? t.filename() : ''; }
function applyPrintTitle() { const n = printFilename(); if (n) { if (__origTitle === null) __origTitle = document.title; document.title = n; } }
function restoreTitle() { if (__origTitle !== null) { document.title = __origTitle; __origTitle = null; } }
function printDoc() { applyPrintTitle(); window.print(); }
window.addEventListener('beforeprint', applyPrintTitle);  // เผื่อกด Ctrl+P (บาง browser ใช้ได้)
window.addEventListener('afterprint', restoreTitle);
function showPage(p) {
  state.page = p;
  $('#page-create').hidden = p !== 'create';
  $('#page-accounts').hidden = p !== 'accounts';
  $('#nav-create').classList.toggle('on', p === 'create');
  $('#nav-accounts').classList.toggle('on', p === 'accounts');
  if (p === 'create') mountTemplate();
  if (p === 'accounts') renderAccounts();
}

boot();
