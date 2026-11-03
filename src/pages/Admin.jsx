import React, { useCallback, useEffect, useState } from 'react';
import { Check, FileArchive, Link2, Loader2, Search, Send, Trash2, Upload, X } from 'lucide-react';
import { BETA_PRICE } from '../../shared/config.js';
import { api, useMe } from '../lib/api.js';
import { DevSignIn, GoogleSignInButton } from '../SignIn.jsx';
import { PillButton, formatVnd, inputClass } from '../ui.jsx';
import { PageLoading, Shell, formatBytes, formatDate, formatDateTime } from './Shell.jsx';

const TABS = [
  { id: 'orders', label: 'Đơn hàng' },
  { id: 'transactions', label: 'Giao dịch chưa khớp' },
  { id: 'releases', label: 'Phiên bản' },
  { id: 'sepay', label: 'Thử SePay' },
];

const ORDER_FILTERS = [
  { id: 'pending', label: 'Chờ thanh toán' },
  { id: 'paid', label: 'Đã thanh toán' },
  { id: 'cancelled', label: 'Đã huỷ' },
  { id: 'all', label: 'Tất cả' },
];

const STATUS_BADGE = {
  pending: ['Chờ thanh toán', 'border-line2 text-white'],
  paid: ['Đã thanh toán', 'border-white bg-white text-black'],
  cancelled: ['Đã huỷ', 'border-line2 text-mute'],
};

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'border-white bg-white text-black' : 'border-line bg-inner text-white hover:border-line2'
      }`}
    >
      {children}
    </button>
  );
}

function SmallButton({ tone = 'default', children, ...rest }) {
  const tones = {
    default: 'border-line2 text-white hover:border-white/50',
    primary: 'border-white bg-white text-black hover:opacity-90',
    danger: 'border-line2 text-mute hover:border-rose-400/60 hover:text-rose-300',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${tones[tone]}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function ErrorNote({ error }) {
  return error ? (
    <p role="alert" className="rounded-2xl border border-rose-400/60 bg-rose-400/10 px-4 py-3 text-sm text-white">
      {error}
    </p>
  ) : null;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

function OrdersTab() {
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api(`/admin/orders?status=${status}&q=${encodeURIComponent(query)}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [status, query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const act = async (order, action) => {
    const prompt = action === 'confirm' ? `Xác nhận đã nhận ${formatVnd(order.amount)} cho đơn ${order.code}?` : `Huỷ đơn ${order.code}?`;
    if (!window.confirm(prompt)) return;
    setBusy(order.code);
    try {
      await api(`/admin/orders/${order.code}/${action}`, { method: 'POST', body: {} });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const counts = data?.counts || {};
  const stats = [
    ['Chờ thanh toán', counts.pending?.count || 0],
    ['Đã thanh toán', counts.paid?.count || 0],
    ['Doanh thu', formatVnd(counts.paid?.total || 0)],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[24px] border border-line bg-card p-5">
            <p className="text-sm text-mute">{label}</p>
            <p className="mt-2 text-[28px] font-medium leading-none tracking-tightish text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {ORDER_FILTERS.map((f) => (
            <Chip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <label className="relative block lg:w-[320px]">
          <span className="sr-only">Tìm đơn</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mã đơn, tên, email, SĐT..."
            className={`${inputClass(false)} !mt-2 pl-10`}
          />
        </label>
      </div>

      <ErrorNote error={error} />

      {!data ? (
        <PageLoading />
      ) : !data.orders.length ? (
        <p className="rounded-[24px] border border-dashed border-line2 p-8 text-center text-sm text-mute">Không có đơn nào.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.orders.map((o) => {
            const [badge, badgeClass] = STATUS_BADGE[o.status];
            return (
              <li key={o.code} className="grid gap-3 rounded-[24px] border border-line bg-card p-4 md:grid-cols-[150px_1fr_130px_auto] md:items-center md:gap-5">
                <div>
                  <p className="font-mono text-sm font-medium text-white">{o.code}</p>
                  <p className="mt-0.5 text-xs text-mute">{formatDateTime(o.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{o.name}</p>
                  <p className="truncate text-xs text-mute">
                    {o.userEmail} · {o.contactMethod}: {o.contact}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{formatVnd(o.amount)}</p>
                  <span className={`mt-1 inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
                    {badge}
                    {o.paidVia && ` · ${o.paidVia === 'sepay' ? 'SePay' : 'tay'}`}
                  </span>
                </div>
                <div className="flex gap-2 md:justify-end">
                  {o.status !== 'paid' && (
                    <SmallButton tone="primary" disabled={busy === o.code} onClick={() => act(o, 'confirm')}>
                      {busy === o.code ? <Loader2 className="animate-spin h-3 w-3" /> : <Check className="h-3 w-3" />} Xác nhận
                    </SmallButton>
                  )}
                  {o.status === 'pending' && (
                    <SmallButton tone="danger" disabled={busy === o.code} onClick={() => act(o, 'cancel')}>
                      <X className="h-3 w-3" /> Huỷ
                    </SmallButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Unmatched bank transactions                                         */
/* ------------------------------------------------------------------ */

function TransactionsTab() {
  const [rows, setRows] = useState(null);
  const [linking, setLinking] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows((await api('/admin/transactions')).transactions);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const link = async (e) => {
    e.preventDefault();
    try {
      await api(`/admin/orders/${code.trim().toUpperCase()}/confirm`, { method: 'POST', body: { transactionId: linking } });
      setLinking(null);
      setCode('');
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <p className="max-w-[720px] text-sm leading-[1.6] text-mute">
        Tiền đã về qua SePay nhưng không khớp đơn nào (khách ghi sai nội dung, chuyển thiếu, hoặc chuyển cho mục đích khác). Gắn giao dịch vào
        đúng mã đơn để kích hoạt cho khách.
      </p>
      <ErrorNote error={error} />
      {!rows ? (
        <PageLoading />
      ) : !rows.length ? (
        <p className="rounded-[24px] border border-dashed border-line2 p-8 text-center text-sm text-mute">Không có giao dịch nào cần xử lý.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((t) => (
            <li key={t.id} className="rounded-[24px] border border-line bg-card p-4">
              <div className="grid gap-3 md:grid-cols-[140px_1fr_auto] md:items-center md:gap-5">
                <div>
                  <p className="text-sm font-medium text-white">{formatVnd(t.amount)}</p>
                  <p className="mt-0.5 text-xs text-mute">{t.transactionDate || formatDateTime(t.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="break-words font-mono text-[13px] text-white">{t.content || '(không có nội dung)'}</p>
                  <p className="mt-0.5 text-xs text-mute">
                    {t.gateway} · #{t.id}
                    {t.note && <span className="text-rose-300"> · {t.note}</span>}
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <SmallButton onClick={() => setLinking(linking === t.id ? null : t.id)}>
                    <Link2 className="h-3 w-3" /> Gắn vào đơn
                  </SmallButton>
                </div>
              </div>
              {linking === t.id && (
                <form onSubmit={link} className="mt-3 flex gap-2 border-t border-line pt-3">
                  <label className="sr-only" htmlFor={`code-${t.id}`}>
                    Mã đơn
                  </label>
                  <input
                    id={`code-${t.id}`}
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Mã đơn, ví dụ AE7K2QXM"
                    className={`${inputClass(false)} !mt-0 font-mono uppercase`}
                  />
                  <PillButton type="submit" size="sm" disabled={!code.trim()}>
                    Xác nhận
                  </PillButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SePay tester                                                        */
/* ------------------------------------------------------------------ */

// [title, tone] per outcome from POST /api/admin/sepay-test.
const SEPAY_OUTCOMES = {
  paid: ['Khớp đơn — đủ tiền', 'ok'],
  underpaid: ['Khớp đơn — chuyển thiếu tiền', 'warn'],
  already_paid: ['Đơn này đã thanh toán trước đó', 'warn'],
  cancelled: ['Đơn này đã bị huỷ', 'warn'],
  no_order: ['Có mã đơn nhưng không tìm thấy đơn', 'bad'],
  no_code: ['Không tìm thấy mã đơn trong nội dung', 'bad'],
  duplicate: ['Giao dịch trùng — đã xử lý trước đó', 'warn'],
  ignored: ['Bỏ qua (không phải tiền vào)', 'warn'],
};

const TONE_CLASS = {
  ok: 'border-accent/60 bg-accent/10',
  warn: 'border-amber-400/50 bg-amber-400/10',
  bad: 'border-rose-400/60 bg-rose-400/10',
};

function outcomeDetail(r) {
  const { outcome, order, commit, note, codes } = r;
  if (outcome === 'paid') return commit ? `Đơn ${order.code} đã được kích hoạt. Khách thấy "Thanh toán thành công" trong vài giây.` : `Đơn ${order.code} sẽ được kích hoạt nếu tiền về với nội dung này.`;
  if (outcome === 'no_order') return `Tìm thấy ${codes.join(', ')} nhưng không có đơn nào mang mã này.`;
  if (outcome === 'no_code') return commit ? 'Giao dịch đã lưu vào tab "Giao dịch chưa khớp" để gắn tay.' : 'Giao dịch sẽ nằm ở tab "Giao dịch chưa khớp" để admin gắn tay.';
  return note;
}

function SepayTestTab() {
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState([]);
  const [amount, setAmount] = useState(String(BETA_PRICE));
  const [content, setContent] = useState('');
  const [commit, setCommit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const load = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([api('/admin/sepay-test'), api('/admin/orders?status=pending')]);
      setStatus(s);
      setPending(o.orders.slice(0, 6));
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (commit && !window.confirm(`Ghi thật giao dịch ${formatVnd(Number(amount) || 0)}? Nếu khớp, đơn sẽ được kích hoạt như khi tiền về thật.`)) return;
    setBusy(true);
    setError('');
    try {
      const r = await api('/admin/sepay-test', { method: 'POST', body: { amount: Number(amount), content, commit } });
      setResults((list) => [{ ...r, amount: Number(amount), content, at: Date.now() }, ...list].slice(0, 5));
      if (commit) load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const parsedAmount = Number(amount);

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr] lg:items-start">
      <div className="space-y-3">
        <div className="rounded-[24px] border border-line bg-card p-5 text-sm">
          <p className="font-medium text-white">Kết nối SePay</p>
          {!status ? (
            <p className="mt-2 text-mute">Đang kiểm tra...</p>
          ) : (
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-mute">SEPAY_API_KEY</dt>
                <dd className={status.apiKeyConfigured ? 'text-accent' : 'text-rose-300'}>{status.apiKeyConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-mute">Webhook thật gần nhất</dt>
                <dd className="min-w-0 truncate text-right text-white">
                  {status.lastWebhook ? `${formatDateTime(status.lastWebhook.receivedAt)} · ${formatVnd(status.lastWebhook.amount)}` : 'Chưa nhận lần nào'}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-[32px] border border-line bg-card p-6">
          <p className="text-lg font-medium tracking-tightish text-white">Gửi giao dịch thử</p>

          {pending.length > 0 && (
            <div>
              <p className="text-sm text-mute">Điền nhanh từ đơn đang chờ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pending.map((o) => (
                  <SmallButton
                    key={o.code}
                    onClick={() => {
                      setAmount(String(o.amount));
                      setContent(o.transferNote);
                    }}
                  >
                    <span className="font-mono">{o.code}</span> · {o.name}
                  </SmallButton>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="st-amount" className="text-sm text-mute">
              Số tiền (VND)
            </label>
            <input
              id="st-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              required
              className={inputClass(false)}
            />
            <p className="mt-1.5 text-xs text-mute">{parsedAmount > 0 ? formatVnd(parsedAmount) : 'Nhập số tiền'}</p>
          </div>

          <div>
            <label htmlFor="st-content" className="text-sm text-mute">
              Nội dung chuyển khoản
            </label>
            <textarea
              id="st-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
              maxLength={500}
              placeholder="MBVCB.123456 AIEDITOR BETA AE7K2QXM chuyen tien"
              className={`${inputClass(false)} font-mono text-sm`}
            />
            <p className="mt-1.5 text-xs text-mute">Ghi như ngân hàng gửi về — có thể viết thường, dính liền hoặc kèm chữ thừa.</p>
          </div>

          <div>
            <span className="text-sm text-mute">Chế độ</span>
            <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Chế độ thử">
              <Chip active={!commit} onClick={() => setCommit(false)}>
                Chạy thử
              </Chip>
              <Chip active={commit} onClick={() => setCommit(true)}>
                Ghi thật
              </Chip>
            </div>
            <p className={`mt-2 text-xs leading-[1.5] ${commit ? 'text-amber-300' : 'text-mute'}`}>
              {commit
                ? 'Lưu giao dịch (cổng TEST) và kích hoạt đơn nếu khớp — y như tiền về thật. Doanh thu sẽ tính cả giao dịch này.'
                : 'Chỉ xem hệ thống sẽ khớp thế nào, không ghi gì vào database.'}
            </p>
          </div>

          <ErrorNote error={error} />
          <PillButton type="submit" disabled={busy || !(parsedAmount > 0) || !content.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {commit ? 'Gửi và ghi thật' : 'Chạy thử'}
          </PillButton>
        </form>
      </div>

      <div className="min-w-0">
        {!results.length ? (
          <p className="rounded-[24px] border border-dashed border-line2 p-8 text-center text-sm text-mute">Kết quả các lần thử sẽ hiện ở đây.</p>
        ) : (
          <ul className="space-y-2.5" aria-live="polite">
            {results.map((r) => {
              const [title, tone] = SEPAY_OUTCOMES[r.outcome] || [r.outcome, 'warn'];
              return (
                <li key={r.at} className={`rounded-[24px] border p-5 ${TONE_CLASS[tone]}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{title}</p>
                    <span className="rounded-full border border-line2 px-2 py-0.5 text-[11px] text-mute">{r.commit ? 'Đã ghi thật' : 'Chạy thử'}</span>
                  </div>
                  <p className="mt-1 text-sm leading-[1.5] text-white/85">{outcomeDetail(r)}</p>
                  <dl className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs">
                    <div className="flex gap-3">
                      <dt className="w-20 shrink-0 text-mute">Số tiền</dt>
                      <dd className="text-white">{formatVnd(r.amount)}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-20 shrink-0 text-mute">Nội dung</dt>
                      <dd className="min-w-0 break-words font-mono text-white">{r.content}</dd>
                    </div>
                    {r.order && (
                      <div className="flex gap-3">
                        <dt className="w-20 shrink-0 text-mute">Đơn</dt>
                        <dd className="min-w-0 text-white">
                          <span className="font-mono">{r.order.code}</span> · {r.order.name} · cần {formatVnd(r.order.amount)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Releases                                                            */
/* ------------------------------------------------------------------ */

function ReleasesTab() {
  const [releases, setReleases] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setReleases((await api('/releases')).releases);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    try {
      await api('/admin/releases', { method: 'POST', form: new FormData(e.currentTarget) });
      setFormKey((k) => k + 1);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Xoá phiên bản v${r.version}${r.hasFile ? ' và file đính kèm' : ''}? Thành viên sẽ không tải được nữa.`)) return;
    try {
      await api(`/admin/releases/${r.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr] lg:items-start">
      <form key={formKey} onSubmit={submit} className="space-y-4 rounded-[32px] border border-line bg-card p-6">
        <p className="text-lg font-medium tracking-tightish text-white">Phát hành bản mới</p>
        <div>
          <label htmlFor="rel-version" className="text-sm text-mute">
            Phiên bản
          </label>
          <input id="rel-version" name="version" required maxLength={40} placeholder="1.0.0" className={inputClass(false)} />
        </div>
        <div>
          <label htmlFor="rel-title" className="text-sm text-mute">
            Tiêu đề
          </label>
          <input id="rel-title" name="title" maxLength={120} placeholder="Bản Beta đầu tiên" className={inputClass(false)} />
        </div>
        <div>
          <label htmlFor="rel-notes" className="text-sm text-mute">
            Ghi chú (mỗi dòng bắt đầu bằng “-” là một gạch đầu dòng)
          </label>
          <textarea id="rel-notes" name="notes" rows={5} placeholder={'- Thêm style Gaming Montage\n- Sửa lỗi lệch phụ đề'} className={inputClass(false)} />
        </div>
        <div>
          <label htmlFor="rel-file" className="text-sm text-mute">
            File Skill (.zip, tối đa 95 MB)
          </label>
          <input
            id="rel-file"
            name="file"
            type="file"
            className="mt-2 block w-full text-sm text-mute file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
          />
        </div>
        <ErrorNote error={error} />
        <PillButton type="submit" disabled={uploading} className="w-full">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Đang tải lên...' : 'Phát hành'}
        </PillButton>
      </form>

      <div>
        {!releases ? (
          <PageLoading />
        ) : !releases.length ? (
          <p className="rounded-[24px] border border-dashed border-line2 p-8 text-center text-sm text-mute">Chưa có phiên bản nào.</p>
        ) : (
          <ul className="space-y-2.5">
            {releases.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 rounded-[24px] border border-line bg-card p-4">
                <div className="min-w-0">
                  <p className="text-base font-medium text-white">
                    v{r.version} <span className="font-mono text-xs font-normal text-mute">· {formatDate(r.publishedAt)}</span>
                  </p>
                  {r.title && <p className="mt-0.5 font-semibold text-white">{r.title}</p>}
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-mute">
                    <FileArchive className="h-3.5 w-3.5 shrink-0" />
                    {r.hasFile ? `${r.fileName} · ${formatBytes(r.fileSize)}` : 'Không có file (chỉ ghi chú)'}
                  </p>
                </div>
                <SmallButton tone="danger" onClick={() => remove(r)} aria-label={`Xoá phiên bản ${r.version}`}>
                  <Trash2 className="h-3 w-3" /> Xoá
                </SmallButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const { me, error, reload } = useMe();
  const [tab, setTab] = useState('orders');

  useEffect(() => {
    document.title = 'Quản trị — AI EDITOR';
  }, []);

  let body;
  if (error) body = <p className="text-center text-rose-300">{error.message}</p>;
  else if (!me) body = <PageLoading />;
  else if (!me.user)
    body = (
      <div className="mx-auto max-w-[440px] pt-6">
        <h1 className="text-[32px] font-medium leading-tight tracking-tightish">Quản trị</h1>
        <GoogleSignInButton next="/admin" className="mt-6 w-full" />
        <DevSignIn onDone={reload} />
      </div>
    );
  else if (!me.isAdmin)
    body = (
      <div className="mx-auto max-w-[520px] pt-6 text-center">
        <h1 className="text-[28px] font-medium leading-tight tracking-tightish">Không có quyền truy cập</h1>
        <p className="mt-3 text-mute">Tài khoản {me.user.email} không nằm trong danh sách quản trị viên (ADMIN_EMAILS).</p>
      </div>
    );
  else
    body = (
      <>
        <h1 className="text-[32px] font-medium leading-tight tracking-tightish sm:text-[40px]">Quản trị</h1>
        <div className="no-scrollbar -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'border-white text-white' : 'border-transparent text-mute hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {tab === 'orders' && <OrdersTab />}
          {tab === 'transactions' && <TransactionsTab />}
          {tab === 'releases' && <ReleasesTab />}
          {tab === 'sepay' && <SepayTestTab />}
        </div>
      </>
    );

  return (
    <Shell me={me} active="admin">
      {body}
    </Shell>
  );
}
