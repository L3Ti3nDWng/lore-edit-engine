import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Bot, Download, FileArchive, MessageCircle, Terminal } from 'lucide-react';
import { api, logout, useMe } from '../lib/api.js';
import { DevSignIn, GoogleSignInButton } from '../SignIn.jsx';
import { CopyField, PillButton, Tag, formatVnd } from '../ui.jsx';
import { PageLoading, Shell, formatBytes, formatDate, formatDateTime } from './Shell.jsx';

/* ------------------------------------------------------------------ */
/* Install guide — edit to match the real install steps                */
/* ------------------------------------------------------------------ */

const INSTALL_STEPS = [
  { title: 'Tải bản mới nhất', desc: 'Bấm “Tải xuống” ở khung phía trên để nhận file .zip của Skill.' },
  {
    title: 'Giải nén vào thư mục Skill',
    desc: 'Giải nén toàn bộ thư mục vào đường dẫn dưới đây (tạo thư mục nếu chưa có).',
    code: '~/.claude/skills/lore-edit-engine/',
  },
  {
    title: 'Cài FFmpeg',
    desc: 'Skill dùng FFmpeg để cắt và xuất video. macOS dùng Homebrew, Windows dùng winget.',
    code: 'brew install ffmpeg   # Windows: winget install ffmpeg',
  },
  {
    title: 'Chạy câu lệnh đầu tiên',
    desc: 'Mở thư mục chứa video mẫu và file quay thô, rồi gõ câu lệnh:',
    code: 'Edit video này theo style Talking Head',
  },
  { title: 'Gặp lỗi? Vào nhóm kín', desc: 'Gửi ảnh chụp màn hình lỗi vào nhóm hỗ trợ bên cạnh — đội ngũ phản hồi trong giờ hành chính.' },
];

const LOGIN_ERRORS = {
  cancelled: 'Bạn đã huỷ đăng nhập Google.',
  state: 'Phiên đăng nhập đã hết hạn, vui lòng thử lại.',
  token: 'Không xác thực được tài khoản Google, vui lòng thử lại.',
  claims: 'Tài khoản Google chưa xác minh email hoặc không hợp lệ.',
};

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Panel({ id, kicker, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rounded-[32px] border border-line bg-card p-6 sm:p-8">
      <p className="font-mono text-xs text-mute">{kicker}</p>
      <h2 id={`${id}-title`} className="mt-2 text-2xl font-medium tracking-tightish text-white">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

// Release notes are plain text; lines starting with "-" render as bullets.
function Notes({ text }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm leading-[1.6] text-mute">
      {lines.map((l, i) =>
        l.startsWith('-') ? (
          <li key={i} className="flex gap-2.5">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
            {l.replace(/^-\s*/, '')}
          </li>
        ) : (
          <li key={i}>{l}</li>
        )
      )}
    </ul>
  );
}

const downloadUrl = (release) => `/api/releases/${release.id}/download`;

function LatestRelease({ releases }) {
  if (releases === null) return <p className="text-sm text-mute">Đang tải danh sách phiên bản...</p>;
  const latest = releases.find((r) => r.hasFile);
  if (!latest) {
    return (
      <div className="rounded-[24px] border border-dashed border-line2 p-6 text-center">
        <FileArchive className="mx-auto h-8 w-8 text-mute" />
        <p className="mt-3 text-base font-medium text-white">Bản phát hành đầu tiên sắp lên</p>
        <p className="mt-1 text-sm text-mute">File Skill sẽ xuất hiện tại đây ngay khi được phát hành. Theo dõi nhóm kín để nhận thông báo.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5 rounded-[24px] border border-line2 bg-inner p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm text-mute">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Bản mới nhất · {formatDate(latest.publishedAt)}
        </p>
        <p className="mt-1 text-[40px] font-medium leading-[1.1] tracking-tightish text-white">v{latest.version}</p>
        <p className="mt-1 truncate text-sm text-mute">
          {latest.fileName} · {formatBytes(latest.fileSize)}
        </p>
      </div>
      <a
        href={downloadUrl(latest)}
        download
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium tracking-tightish transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4" /> Tải xuống
      </a>
    </div>
  );
}

function InstallGuide() {
  return (
    <ol className="space-y-2">
      {INSTALL_STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-4 rounded-[24px] border border-line bg-inner p-4 sm:p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line2 bg-chip font-mono text-xs text-white">0{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium tracking-tightish text-white">{s.title}</p>
            <p className="mt-1 text-sm leading-[1.6] text-mute">{s.desc}</p>
            {s.code && (
              <div className="mt-3 flex items-start gap-2 overflow-x-auto rounded-xl border border-line bg-base px-3 py-2.5">
                <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <code className="whitespace-pre font-mono text-[13px] text-white">{s.code}</code>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Changelog({ releases }) {
  if (!releases?.length) return <p className="text-sm text-mute">Chưa có ghi chú phát hành.</p>;
  return (
    <ol className="relative space-y-6 border-l border-line2 pl-6">
      {releases.map((r, i) => (
        <li key={r.id} className="relative">
          <span className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full border-2 border-card ${i === 0 ? 'bg-accent' : 'bg-line2'}`} />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-lg font-medium tracking-tightish text-white">v{r.version}</p>
            <p className="font-mono text-xs text-mute">{formatDate(r.publishedAt)}</p>
            {r.hasFile && (
              <a href={downloadUrl(r)} download className="inline-flex items-center gap-1 text-xs font-medium text-accent underline-offset-4 hover:underline">
                <Download className="h-3 w-3" /> {formatBytes(r.fileSize)}
              </a>
            )}
          </div>
          {r.title && <p className="mt-1 text-white">{r.title}</p>}
          <Notes text={r.notes} />
        </li>
      ))}
    </ol>
  );
}

function SupportCard({ support }) {
  const links = [
    { href: support?.zalo, label: 'Nhóm Zalo', icon: MessageCircle },
    { href: support?.discord, label: 'Server Discord', icon: Bot },
  ].filter((l) => l.href);
  return (
    <section aria-labelledby="support-title" className="rounded-[32px] border border-line2 bg-card p-6">
      <Tag dot>Nhóm kín</Tag>
      <h2 id="support-title" className="mt-4 text-xl font-medium tracking-tightish text-white">
        Hỗ trợ cài đặt & cập nhật
      </h2>
      <p className="mt-2 text-sm leading-[1.6] text-mute">Hỏi đáp trực tiếp với đội ngũ, nhận Style DNA mẫu mới và thông báo bản cập nhật.</p>
      <div className="mt-5 space-y-2">
        {links.length ? (
          links.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-full border border-line bg-inner px-5 py-3 text-base font-medium tracking-tightish text-white transition-colors hover:border-line2"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
              </span>
              <ArrowUpRight className="h-4 w-4 text-mute" />
            </a>
          ))
        ) : (
          <p className="rounded-[24px] border border-dashed border-line2 p-4 text-sm text-mute">Link nhóm đang được cập nhật.</p>
        )}
      </div>
    </section>
  );
}

function OrderCard({ order }) {
  return (
    <section aria-labelledby="order-title" className="rounded-[32px] border border-line bg-card p-6">
      <p className="text-sm text-mute">Đơn hàng</p>
      <h2 id="order-title" className="mt-1 font-mono text-base text-white">
        #{order.code}
      </h2>
      <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
        {[
          ['Số tiền', formatVnd(order.amount)],
          ['Thanh toán', formatDateTime(order.paidAt)],
          ['Liên hệ', order.contact],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-mute">{k}</dt>
            <dd className="truncate text-white">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

function SignedOut({ reload }) {
  const errorKey = new URLSearchParams(window.location.search).get('login_error');
  return (
    <div className="mx-auto max-w-[480px] pt-6 text-center">
      <Tag dot>Trang thành viên</Tag>
      <h1 className="mt-6 text-[36px] font-medium leading-[1.15] tracking-tightish sm:text-[44px]">
        Đăng nhập để
        <br />
        <span className="text-mute">tải Skill của bạn.</span>
      </h1>
      <p className="mt-4 text-base leading-[1.5] text-mute">Dùng đúng tài khoản Google bạn đã dùng khi đặt slot Beta.</p>
      {errorKey && (
        <p role="alert" className="mt-6 rounded-2xl border border-rose-400/60 bg-rose-400/10 px-4 py-3 text-sm text-white">
          {LOGIN_ERRORS[errorKey] || 'Đăng nhập không thành công, vui lòng thử lại.'}
        </p>
      )}
      <GoogleSignInButton next="/account" className="mt-8 w-full" />
      <div className="text-left">
        <DevSignIn onDone={reload} />
      </div>
      <p className="mt-8 text-sm text-mute">
        Chưa có slot?{' '}
        <a href="/?checkout=1" className="text-white underline decoration-dashed underline-offset-4 hover:opacity-60">
          Nhận Slot Beta
        </a>
      </p>
    </div>
  );
}

function NotEntitled({ me }) {
  const pending = me.orders.find((o) => o.status === 'pending');
  return (
    <div className="mx-auto max-w-[600px] pt-6">
      <Tag dot={Boolean(pending)}>{pending ? 'Đang chờ thanh toán' : 'Chưa có slot'}</Tag>
      <h1 className="mt-6 text-[32px] font-medium leading-[1.2] tracking-tightish sm:text-[40px]">
        {pending ? 'Chờ tiền về là mở khoá.' : 'Tài khoản chưa có đơn đã thanh toán.'}
      </h1>
      <p className="mt-4 text-base leading-[1.5] text-mute">
        {pending
          ? 'Trang này tự cập nhật khi ngân hàng báo tiền về. Kiểm tra lại số tiền và nội dung chuyển khoản dưới đây.'
          : `Bạn đang đăng nhập bằng ${me.user.email}. Nếu đã thanh toán bằng tài khoản Google khác, hãy đăng xuất và đăng nhập lại.`}
      </p>
      {pending && (
        <div className="mt-6 space-y-2">
          <CopyField label="Số tiền" value={String(pending.amount)} />
          <CopyField label="Nội dung chuyển khoản" value={pending.transferNote} />
        </div>
      )}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <PillButton onClick={() => window.location.assign('/?checkout=1')}>{pending ? 'Xem mã QR thanh toán' : 'Nhận Slot Beta'}</PillButton>
        <PillButton variant="dark" onClick={logout}>
          Đổi tài khoản
        </PillButton>
      </div>
    </div>
  );
}

function MemberHome({ me }) {
  const [releases, setReleases] = useState(null);
  useEffect(() => {
    api('/releases')
      .then((r) => setReleases(r.releases))
      .catch(() => setReleases([]));
  }, []);
  const paidOrder = me.orders.find((o) => o.status === 'paid');
  const firstName = (me.user.name || '').trim().split(/\s+/).pop() || 'bạn';

  return (
    <>
      <div className="max-w-[760px]">
        <Tag dot>Thành viên Beta</Tag>
        <h1 className="mt-6 text-[36px] font-medium leading-[1.15] tracking-tightish sm:text-[48px]">
          Chào {firstName},
          <br />
          <span className="text-mute">Skill đã sẵn sàng.</span>
        </h1>
      </div>

      <div className="mt-10 grid gap-3 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-3">
          <Panel id="download" kicker="01 — Tải xuống" title="File Skill">
            <LatestRelease releases={releases} />
          </Panel>
          <Panel id="install" kicker="02 — Cài đặt" title="Hướng dẫn cài đặt">
            <InstallGuide />
          </Panel>
          <Panel id="changelog" kicker="03 — Cập nhật" title="Changelog">
            <Changelog releases={releases} />
          </Panel>
        </div>
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-6">
          <SupportCard support={me.support} />
          {paidOrder && <OrderCard order={paidOrder} />}
        </aside>
      </div>
    </>
  );
}

export default function Account() {
  const { me, error, reload } = useMe();
  const waiting = Boolean(me?.user && !me.entitled && me.orders.some((o) => o.status === 'pending'));

  // Unlock automatically once the webhook confirms the transfer.
  useEffect(() => {
    if (!waiting) return undefined;
    const id = setInterval(reload, 8000);
    return () => clearInterval(id);
  }, [waiting, reload]);

  useEffect(() => {
    document.title = 'Trang thành viên — Lore Edit Engine';
  }, []);

  let body;
  if (error) body = <p className="text-center text-rose-300">{error.message}</p>;
  else if (!me) body = <PageLoading />;
  else if (!me.user) body = <SignedOut reload={reload} />;
  else if (!me.entitled) body = <NotEntitled me={me} />;
  else body = <MemberHome me={me} />;

  return <Shell me={me}>{body}</Shell>;
}
