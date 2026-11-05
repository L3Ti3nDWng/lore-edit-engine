import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  AudioWaveform,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock3,
  Cpu,
  Dna,
  Film,
  FolderOpen,
  Home,
  Layers,
  Library,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  MonitorPlay,
  MousePointer2,
  Plus,
  QrCode,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Subtitles,
  Terminal,
  UserRound,
  Wand2,
  X,
} from 'lucide-react';
import { BETA_PRICE, BETA_SLOTS_TOTAL, CONTACT_VALIDATORS, OFFICIAL_PRICE, PRODUCT_NAME, ULTIMATE_PRICE } from '../shared/config.js';
import { api, useMe, useSlots } from './lib/api.js';
import PayosQr from './PayosQr.jsx';
import {
  CountUp,
  Glyph,
  Magnetic,
  ParallaxMedia,
  Reveal,
  ScrollTrigger,
  SlideArrow,
  Stagger,
  TiltCard,
  Words,
  gsap,
  motionOK,
  scrollLock,
  scrollToId,
  scrollToY,
  trackGlow,
  useGSAP,
  useGlyphs,
  useSmoothScroll,
  useWordReveal,
} from './motion.jsx';
import { DevSignIn, GoogleSignInButton } from './SignIn.jsx';
import { Container, CopyField, GlobalStyles, Logo, PillButton, formatVnd, inputClass } from './ui.jsx';

/* ------------------------------------------------------------------ */
/* Business config — edit these before going live                      */
/* ------------------------------------------------------------------ */

// Prices and slot totals live in shared/config.js so the API charges the same amounts.
// Slots taken are counted from paid orders (GET /api/stats).


/* ------------------------------------------------------------------ */
/* Media (free Unsplash photos, stored in /public/media)               */
/* ------------------------------------------------------------------ */

const media = (name) => `/media/${name}.jpg`;

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'Quy trình', href: '#workflow' },
  { label: 'Phong cách', href: '#showcase' },
  { label: 'Tính năng', href: '#features' },
  { label: 'Bảng giá', href: '#pricing' },
];

const STEPS = [
  {
    number: '01',
    title: 'Phân tích',
    caption:
      'Đưa video mẫu và file quay thô vào hệ thống. AI tự động bóc tách nhịp cắt, chuyển cảnh và cấu trúc thị giác.',
  },
  {
    number: '02',
    title: 'Tự động dựng',
    caption:
      'Hệ thống đa tác tử (Multi-Agent) tự động cắt ghép, căn chỉnh nhịp âm thanh trước 150ms và kiểm duyệt chất lượng từng 0.1 giây.',
  },
  {
    number: '03',
    title: 'Xuất bản',
    caption:
      'Nhận ngay video hoàn chỉnh hoặc mở trực tiếp toàn bộ lớp cắt (timeline) trên CapCut và Adobe Premiere Pro để tinh chỉnh thêm.',
  },
];

const CHOREO_LAYERS = [
  'Continuous Camera Drift',
  '-150ms Pre-Roll Anticipation',
  '2-4 Frame Micro-Staggering',
  'VietSub Auto-Sync',
];

const EXPORT_FORMATS = [
  { id: 'capcut', label: 'CapCut JSON' },
  { id: 'premiere', label: 'Premiere XML' },
  { id: 'remotion', label: 'Remotion MP4' },
  { id: 'srt', label: 'VietSub SRT' },
];

const ECOSYSTEM = [
  { label: 'CapCut', icon: Clapperboard },
  { label: 'Premiere Pro', icon: Layers },
  { label: 'Remotion', icon: Film },
  { label: 'FFmpeg', icon: Terminal },
  { label: 'MP4 4K', icon: MonitorPlay },
  { label: 'VietSub', icon: Subtitles },
  { label: 'Beat-Sync', icon: AudioWaveform },
  { label: 'Style DNA', icon: Dna },
];

const SHOWCASE = [
  {
    mode: 'Short-form Talking Head',
    image: 'mic',
    prompt: '“Tự động cắt khoảng nghỉ, chèn B-roll, zoom mượt và tạo VietSub bắt trọn từ khóa.”',
  },
  {
    mode: 'Beat-Synced Gaming / Montage',
    image: 'gaming',
    prompt: '“Bắt chuẩn từng tiếng súng và nhịp bass với độ trễ -150ms Pre-Roll Anticipation.”',
  },
  {
    mode: 'Cinematic Vlog 16:9',
    image: 'road',
    prompt: '“Giữ nhịp thở tự nhiên, hiệu ứng Continuous Camera Drift và cân chỉnh bố cục điện ảnh.”',
  },
  {
    mode: 'Commercial / TVC',
    image: 'coffee',
    prompt: '“Chuyển cảnh Object Persistence Morphing và nhịp cắt dồn dập giữ chân người xem 100%.”',
  },
  {
    mode: 'Talking Head · Review',
    image: 'camera',
    prompt: '“Clone nhịp jump-cut của video mẫu, VietSub highlight vàng, hook mạnh 3 giây đầu.”',
  },
  {
    mode: 'Montage · Phonk Drift',
    image: 'drift',
    prompt: '“Bắt nhịp bass 808, flash trắng 2 frame mỗi drop, rung máy nhẹ theo từng kick.”',
  },
  {
    mode: 'Vlog · Night City',
    image: 'tokyo',
    prompt: '“Match-cut theo hướng chuyển động máy quay, giữ âm thanh môi trường thật mềm.”',
  },
  {
    mode: 'TVC · Product Launch',
    image: 'sneaker',
    prompt: '“Speed-ramp 300% → 20% ở từng bước chân, chữ kinetic khóa theo beat.”',
  },
];

const AGENTS = [
  { name: 'Style Extractor', label: 'Agent 1', status: 'Hoàn tất', image: 'reef-1' },
  { name: 'Liquid Choreographer', label: 'Agent 2', status: 'Hoàn tất', image: 'reef-2' },
  { name: 'Timeline Compiler', label: 'Agent 3', status: 'Đang xuất XML/JSON', image: 'reef-3', running: true },
  { name: '0.1s QA Inspector', label: 'Agent 4', status: 'Đạt chuẩn 100%', image: 'hero-alt', passed: true },
];

const WORKSPACE_NAV = [
  { label: 'Tổng quan', icon: Home },
  { label: 'Trích xuất DNA', icon: Dna },
  { label: 'Thư viện Style', icon: Library },
  { label: 'Cấu hình Export', icon: FolderOpen },
  { label: 'Cài đặt', icon: Settings },
];

const WORKSPACE_FEATURES = [
  {
    icon: Cpu,
    title: 'Chạy song song',
    desc: 'Bốn tác tử cùng làm việc một lúc — trích xuất, dựng, biên dịch và kiểm duyệt.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Kiểm soát từng lớp',
    desc: 'Mọi điểm cắt, zoom và phụ đề đều mở lại được trong timeline gốc.',
  },
  {
    icon: Dna,
    title: 'Học theo gu của bạn',
    desc: 'Lưu Style DNA vào thư viện và tái sử dụng chỉ bằng một câu lệnh.',
  },
];

const BETA_FEATURES = [
  'Trọn bộ lõi Universal Style-Cloning & Liquid Choreography',
  'Xuất trực tiếp CapCut JSON, Premiere XML & Remotion/FFmpeg MP4',
  'Hỗ trợ đầy đủ: Talking Head, Gaming Montage, Vlog 16:9 & tự động VietSub',
  'Hệ thống kiểm duyệt tự động 0.1s QA Inspection',
  'Quyền truy cập nhóm kín hỗ trợ cài đặt & miễn phí nâng cấp lên Bản Chính Thức (479k)',
];

const OFFICIAL_FEATURES = [
  'Toàn bộ tính năng của bản Beta',
  'Thư viện Style DNA mẫu cập nhật định kỳ',
  'Tối ưu tốc độ xử lý cho dự án dài',
  'Hỗ trợ kỹ thuật ưu tiên',
];

const ULTIMATE_FEATURES = [
  'Toàn bộ tính năng Bản Chính Thức',
  'Huấn luyện Style DNA riêng cho thương hiệu',
  'Quy trình dựng hàng loạt cho nhiều kênh',
  'Hỗ trợ triển khai 1-1 cho đội ngũ',
];

const FAN_CARDS = [
  // Painted back to front: outer cards first, centre card last.
  { image: 'court-line', className: 'left-[-210px] top-[64px] h-[171px] w-[163px] -rotate-[16deg]' },
  { image: 'coffee-2', className: 'left-[247px] top-[64px] h-[171px] w-[163px] rotate-[16deg]' },
  { image: 'handcam', className: 'left-[-128px] top-[10px] h-[224px] w-[209px] -rotate-[8deg]' },
  { image: 'seceda', className: 'left-[119px] top-[10px] h-[224px] w-[209px] rotate-[8deg]' },
  { image: 'alley', className: 'left-0 top-0 z-10 h-[220px] w-[200px]' },
];

// How buyers want to be reached for install support and the private group invite.
const CONTACT_METHODS = [
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    field: 'Địa chỉ Email',
    type: 'email',
    placeholder: 'ban@email.com',
    validate: CONTACT_VALIDATORS.email,
    error: 'Email chưa đúng định dạng.',
  },
  {
    id: 'zalo',
    label: 'Zalo',
    icon: MessageCircle,
    field: 'Số điện thoại Zalo',
    type: 'tel',
    placeholder: '09xx xxx xxx',
    validate: CONTACT_VALIDATORS.zalo,
    error: 'Số Zalo cần 10 chữ số, ví dụ 0912 345 678.',
  },
];

/* ------------------------------------------------------------------ */
/* Helpers & hooks                                                     */
/* ------------------------------------------------------------------ */

function useLoopingTypewriter(text, speed = 55, hold = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let timer;
    const tick = (n) => {
      if (n <= text.length) {
        setCount(n);
        timer = setTimeout(() => tick(n + 1), speed);
      } else {
        timer = setTimeout(() => tick(0), hold);
      }
    };
    tick(0);
    return () => clearTimeout(timer);
  }, [text, speed, hold]);
  return text.slice(0, count);
}

function useLoopingProgress(step = 1, interval = 70, pause = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let timer;
    const tick = (v) => {
      if (v <= 100) {
        setValue(v);
        timer = setTimeout(() => tick(v + step), interval);
      } else {
        timer = setTimeout(() => tick(0), pause);
      }
    };
    tick(0);
    return () => clearTimeout(timer);
  }, [step, interval, pause]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Heading({ children, className = '', as: Tag = 'h2' }) {
  const ref = useRef(null);
  useWordReveal(ref);
  return (
    <Tag ref={ref} className={`text-[32px] font-bold leading-[1.15] tracking-[-0.03em] text-white md:text-[40px] lg:text-[48px] ${className}`}>
      {children}
    </Tag>
  );
}

function PhotoCard({ image, className = '', overlay = 'bg-black/35', position = 'center', parallax = true, children, ...rest }) {
  const zoom = 'transition-transform duration-[1400ms] ease-silk group-hover:scale-[1.04]';
  return (
    <div className={`group relative overflow-hidden rounded-[32px] border border-line bg-card ${className}`} {...rest}>
      {parallax ? (
        <ParallaxMedia src={media(image)} imgClassName={zoom} style={{ objectPosition: position }} />
      ) : (
        <div data-card-media className="pointer-events-none absolute inset-y-0 -inset-x-[10%] will-change-transform">
          <img src={media(image)} alt="" loading="lazy" className={`h-full w-full object-cover ${zoom}`} style={{ objectPosition: position }} />
        </div>
      )}
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

function Navbar({ onCheckout, me }) {
  const accountLabel = me?.user ? 'Tài khoản' : 'Đăng nhập';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.from('[data-nav-item]', { y: -24, autoAlpha: 0, duration: 1.1, ease: 'silk', stagger: 0.05, delay: 0.1 });
    },
    { scope: ref }
  );

  return (
    <header
      ref={ref}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled || open ? 'border-line bg-base/80 backdrop-blur-xl' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="relative mx-auto flex h-[81px] max-w-[1440px] items-center justify-between px-5 md:px-10" aria-label="Điều hướng chính">
        <a href="#top" aria-label="AI EDITOR — về đầu trang" data-nav-item>
          <Logo />
        </a>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex xl:gap-9">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} data-nav-item className="link-draw text-base tracking-[0.01em] text-mute transition-colors duration-300 hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex xl:gap-[30px]">
          <a
            href="/account"
            aria-label={accountLabel}
            data-nav-item
            className="link-draw inline-flex items-center gap-2 text-base font-medium tracking-tightish text-white"
          >
            {me?.user?.avatarUrl ? (
              <img src={me.user.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full border border-line2" />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
            {/* Icon only until xl so it doesn't collide with the centered links. */}
            <span className="hidden xl:inline">{accountLabel}</span>
          </a>
          <button
            type="button"
            data-nav-item
            onClick={() => scrollToId('workflow')}
            className="link-draw text-base font-medium tracking-tightish text-white"
          >
            Xem demo
          </button>
          <span data-nav-item>
            <Magnetic>
              <PillButton size="sm" variant="dark" onClick={onCheckout}>
                Nhận Slot Beta
              </PillButton>
            </Magnetic>
          </span>
        </div>

        <button
          type="button"
          data-nav-item
          className="flex h-10 w-10 flex-col items-center justify-center gap-[6px] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
        >
          <span className={`h-[1.5px] w-6 bg-white transition-transform duration-300 ${open ? 'translate-y-[3.75px] rotate-45' : ''}`} />
          <span className={`h-[1.5px] w-6 bg-white transition-transform duration-300 ${open ? '-translate-y-[3.75px] -rotate-45' : ''}`} />
        </button>
      </nav>

      {open && (
        <div className="anim-fade-up border-t border-line px-5 pb-6 pt-2 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-4 text-lg text-white">
              {l.label}
            </a>
          ))}
          <a href="/account" className="block border-b border-line py-4 text-lg text-white">
            {accountLabel}
          </a>
          <PillButton
            className="mt-6 w-full"
            onClick={() => {
              setOpen(false);
              onCheckout();
            }}
          >
            Nhận Slot Beta — {formatVnd(BETA_PRICE)}
          </PillButton>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — split: copy left, framed media right (Figma hero)            */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!motionOK()) return;
      const tl = gsap.timeline({ defaults: { ease: 'silk' }, delay: 0.2 });
      tl.from('[data-hero-badge]', { y: 24, autoAlpha: 0, duration: 1.1 })
        .from('[data-hero-title] [data-word]', { yPercent: 115, duration: 1.4, stagger: 0.06 }, '<0.08')
        .from('[data-hero-copy]', { y: 28, autoAlpha: 0, duration: 1.2 }, '<0.45')
        .from('[data-hero-cta] > *', { y: 28, autoAlpha: 0, duration: 1.1, stagger: 0.09 }, '<0.12')
        .from('[data-hero-frame]', { autoAlpha: 0, scale: 0.86, rotation: (i) => (i ? 20 : -16), duration: 1.8, stagger: 0.12 }, 0.15)
        .from('[data-hero-media]', { autoAlpha: 0, duration: 1.2 }, 0.35)
        .fromTo('[data-hero-media] img', { scale: 1.1 }, { scale: 1, duration: 2.2 }, 0.35)
        .from('[data-hero-chip]', { y: 20, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.9);

      // Scroll-out: the visual sinks slower than the copy, giving depth.
      const out = { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('[data-hero-visual]', { yPercent: 14, ease: 'none', scrollTrigger: out });
      gsap.to('[data-hero-text]', { yPercent: -8, autoAlpha: 0.15, ease: 'none', scrollTrigger: out });
    },
    { scope: ref }
  );

  return (
    <section id="top" ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-[120px] lg:pb-16">
      {/* Ambient glows (Figma hero gradient, in the brand accent). */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-[20%] -top-[30%] h-[80vh] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(4,184,224,0.16),transparent)]" />
        <div className="absolute -right-[10%] bottom-[-20%] h-[60vh] w-[50vw] rounded-full bg-[radial-gradient(closest-side,rgba(4,184,224,0.08),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-base to-transparent" />
      </div>

      <Container className="relative grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div data-hero-text>
          <button
            type="button"
            data-hero-badge
            onClick={() => scrollToId('pricing')}
            className="group inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-base/80 px-4 py-1.5 text-sm tracking-tightish backdrop-blur-md transition-colors duration-500 hover:border-line2"
          >
            <span className="font-medium text-accent">Mới</span>
            <span className="h-[18px] w-px bg-line2" />
            <span className="truncate text-white">Mở cổng Beta Test giới hạn (Ưu đãi 349.000đ)</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white transition-transform duration-500 ease-silk group-hover:translate-x-1" />
          </button>

          <h1
            data-hero-title
            className="mt-6 max-w-[640px] text-[40px] font-bold leading-[1.12] tracking-[-0.03em] text-white sm:text-[52px] lg:text-[60px] xl:text-[68px]"
          >
            <Words>Tự động hóa quy trình Edit Video</Words>{' '}
            <span className="text-mute">
              <Words>với trí tuệ nhân tạo</Words>
            </span>
          </h1>

          <p data-hero-copy className="mt-6 max-w-[520px] text-lg leading-[1.5] text-mute">
            Trích xuất Style DNA từ bất kỳ video mẫu nào, áp dụng kỹ thuật Liquid Choreography và xuất trực tiếp timeline
            CapCut, Premiere Pro hoặc MP4 4K chỉ với một câu lệnh.
          </p>

          <div data-hero-cta className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <PillButton size="lg" onClick={() => scrollToId('pricing')}>
                Sở hữu Slot Beta — 349k <SlideArrow />
              </PillButton>
            </Magnetic>
            <PillButton variant="dark" size="lg" onClick={() => scrollToId('workflow')}>
              Xem quy trình hoạt động
            </PillButton>
          </div>
        </div>

        {/* Framed media with offset outline squares, as in the Figma hero. */}
        <div data-hero-visual className="relative mx-auto aspect-square w-full max-w-[400px] sm:max-w-[480px] lg:max-w-[560px]">
          <div data-hero-frame className="absolute inset-[9%] rotate-[-9deg] rounded-[48px] border border-white/15" />
          <div data-hero-frame className="absolute inset-[11%] rotate-[7deg] rounded-[48px] border border-accent/30 bg-accent/[0.07]" />
          <div data-hero-media className="absolute inset-[10%] overflow-hidden rounded-[44px] border border-line2 bg-card shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)]">
            <img src={media('hero')} alt="" className="h-full w-full object-cover brightness-[.8] contrast-[1.1] saturate-[.85] will-change-transform" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <span
            data-hero-chip
            className="absolute bottom-[14%] left-0 inline-flex items-center gap-2 rounded-full border border-line2 bg-base/85 px-4 py-2 text-sm font-medium tracking-tightish text-white backdrop-blur-md sm:left-[-2%]"
          >
            <Dna className="h-4 w-4 text-accent" /> Style DNA
          </span>
          <span
            data-hero-chip
            className="absolute right-0 top-[16%] inline-flex items-center gap-2 rounded-full border border-line2 bg-base/85 px-4 py-2 text-sm font-medium tracking-tightish text-white backdrop-blur-md sm:right-[-2%]"
          >
            <MonitorPlay className="h-4 w-4 text-accent" /> MP4 4K
          </span>

          <Glyph type="zigzag" className="left-[2%] top-[4%]" />
          <Glyph type="rings" className="right-[4%] top-0" />
          <Glyph type="play" className="bottom-[2%] left-[10%]" />
          <Glyph type="plus" className="bottom-[8%] right-[6%]" />
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3-step workflow                                                     */
/* ------------------------------------------------------------------ */

function MockupShell({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[350px] rounded-[24px] border border-line bg-inner ${className}`}>{children}</div>;
}

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-inner py-2 pl-3 pr-4 text-xs font-medium tracking-tightish text-white">
      {Icon && <Icon className="h-3.5 w-3.5 text-mute" />}
      {children}
    </span>
  );
}

function ExtractMockup() {
  const prompt = useLoopingTypewriter('Clone nhịp cắt, zoom và màu của video mẫu...');
  return (
    <MockupShell className="p-[18px]">
      <div className="flex gap-2">
        {['popcorn-bags', 'popcorn-spill', 'popcorn-packs'].map((img) => (
          <img key={img} src={media(img)} alt="" loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
        ))}
      </div>
      <p className="mt-5 min-h-[40px] text-sm leading-[1.4] text-mute">
        {prompt}
        <span className="anim-caret ml-px inline-block h-3.5 w-px translate-y-0.5 bg-white" />
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <Chip icon={Dna}>Talking Head</Chip>
          <Chip icon={Clock3}>Beat-Sync</Chip>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
      </div>
    </MockupShell>
  );
}

function ChoreographMockup() {
  const progress = useLoopingProgress(1, 60, 1600);
  const activeLayer = Math.min(CHOREO_LAYERS.length - 1, Math.floor(progress / 25));
  return (
    <MockupShell className="p-[18px]">
      <div className="relative h-[150px] overflow-hidden rounded-2xl">
        <img src={media('popcorn-spill')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <span
          className="anim-spin absolute left-1/2 top-1/2 -ml-3 -mt-3 block h-6 w-6 rounded-full"
          style={{
            background: 'conic-gradient(rgba(255,255,255,0) 7deg, #fff 342deg)',
            WebkitMask: 'radial-gradient(circle, transparent 7px, #000 8px)',
            mask: 'radial-gradient(circle, transparent 7px, #000 8px)',
          }}
        />
        <span className="absolute bottom-2.5 left-2.5 max-w-[85%] truncate rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
          {CHOREO_LAYERS[activeLayer]}
        </span>
      </div>
      <div className="mt-[18px] flex items-center justify-between gap-3 text-sm tracking-tightish text-mute">
        <span className="truncate">Đang áp dụng Liquid Choreography...</span>
        <span className="tabular-nums">{progress}%</span>
      </div>
    </MockupShell>
  );
}

function ExportMockup() {
  const [selected, setSelected] = useState(['capcut', 'premiere']);
  const toggle = (id) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  return (
    <MockupShell className="px-[18px] pb-[18px]">
      <div className="relative h-12 overflow-hidden rounded-b-2xl">
        <img src={media('cinema-seat')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[center_70%]" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-3 bottom-1.5 flex justify-between text-[10px] font-medium tracking-tightish text-white">
          <span>project_master_v2.mp4</span>
          <span>01:24</span>
        </div>
      </div>
      <p className="mt-4 text-sm tracking-tightish text-mute">Xuất dưới dạng</p>
      <div className="relative mt-2.5 flex flex-wrap gap-2">
        {EXPORT_FORMATS.map((f) => {
          const on = selected.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggle(f.id)}
              aria-pressed={on}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium tracking-tightish transition-colors ${
                on ? 'border-white bg-white text-base' : 'border-line2 bg-chip text-white hover:border-white/40'
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <MousePointer2 className="anim-cursor pointer-events-none absolute -bottom-3 right-2 h-4 w-4 fill-white/80 text-white/80" />
      </div>
      <p className="mt-4 text-sm tracking-tightish text-mute">Mở trực tiếp trong</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {[
          { label: 'CapCut', icon: Clapperboard },
          { label: 'Premiere Pro', icon: Layers },
        ].map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-chip px-3 py-1.5 text-xs font-medium tracking-tightish text-mute"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        ))}
      </div>
    </MockupShell>
  );
}

// Figma "The Service We Provide": centred heading between glyphs, then a grid of
// centred items, each led by a tinted badge.
function Workflow() {
  const mockups = [<ExtractMockup key="1" />, <ChoreographMockup key="2" />, <ExportMockup key="3" />];
  return (
    <section id="workflow" className="relative scroll-mt-10 py-[120px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_at_top,rgba(4,184,224,0.07),transparent_60%)]" aria-hidden="true" />
      <Container className="relative">
        <div className="relative mx-auto flex max-w-[980px] flex-col items-center text-center">
          <Glyph type="play" className="-left-4 top-0 lg:-left-24" />
          <Glyph type="cross" className="-right-2 bottom-2 lg:-right-20" />
          <Heading>
            <Words>Từ Video Thô Đến Bản Dựng Hoàn Chỉnh.</Words>
            <br />
            <span className="text-mute">
              <Words>Ba Bước Đơn Giản.</Words>
            </span>
          </Heading>
          <Reveal delay={200} y={24}>
            <PillButton variant="dark" size="lg" className="mt-8" onClick={() => scrollToId('pricing')}>
              Xem bảng giá <SlideArrow />
            </PillButton>
          </Reveal>
        </div>

        <Stagger className="mt-16 grid gap-3 lg:grid-cols-3" each={0.12}>
          {STEPS.map((s, i) => (
            <div key={s.number} data-stagger className="h-full">
              <TiltCard className="flex h-full flex-col items-center rounded-[32px] border border-line bg-card p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-[17px] font-bold tabular-nums text-accent">
                  {s.number}
                </span>
                <h3 className="mt-6 text-[28px] leading-[1.2] tracking-tightish text-white md:text-[32px]">{s.title}</h3>
                <p className="mt-4 max-w-[340px] text-base leading-[1.5] tracking-tightish text-mute md:text-lg">{s.caption}</p>
                <div className="mt-auto w-full pt-10 text-left">{mockups[i]}</div>
              </TiltCard>
            </div>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ecosystem (rotating word + logo marquee)                            */
/* ------------------------------------------------------------------ */

function RotatingWord({ words }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words.length]);
  const word = words[i];
  return (
    <span className="inline-flex" aria-live="polite">
      {word.split('').map((ch, k) => (
        <span key={`${word}-${k}`} className="anim-letter whitespace-pre" style={{ animationDelay: `${k * 45}ms` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

// The marquee loops on its own and speeds up with the scroll velocity, then eases back.
function Ecosystem() {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const list = [...ECOSYSTEM, ...ECOSYSTEM];

  useGSAP(
    () => {
      if (!motionOK()) return;
      const loop = gsap.to(trackRef.current, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          loop.timeScale(1 + Math.min(5, Math.abs(self.getVelocity()) / 300));
          gsap.to(loop, { timeScale: 1, duration: 1.4, ease: 'power2.out', overwrite: true });
        },
      });
      // Hovering the strip slows it so a logo can be read.
      const el = ref.current;
      const slow = () => gsap.to(loop, { timeScale: 0.25, duration: 0.6, overwrite: true });
      const resume = () => gsap.to(loop, { timeScale: 1, duration: 0.6, overwrite: true });
      el.addEventListener('pointerenter', slow);
      el.addEventListener('pointerleave', resume);
      return () => {
        el.removeEventListener('pointerenter', slow);
        el.removeEventListener('pointerleave', resume);
      };
    },
    { scope: ref }
  );

  return (
    <section className="border-y border-line py-[100px]">
      <Container>
        <Heading>
          <Words>Xử lý mạnh mẽ mọi lớp</Words> <RotatingWord words={['Video', 'Audio', 'Style', 'Phụ đề']} />.
          <br />
          <span className="text-mute">
            <Words>Gói gọn trong một Skill</Words>
          </span>
        </Heading>
        <Reveal delay={120}>
          <div ref={ref} className="relative mt-12 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-base to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-base to-transparent" />
            <div ref={trackRef} className="flex w-max items-center will-change-transform">
              {list.map(({ label, icon: Icon }, i) => (
                <span
                  key={`${label}-${i}`}
                  className="flex shrink-0 items-center gap-2 px-10 text-[19px] font-bold tracking-tightish text-white/70 transition-colors duration-300 hover:text-white"
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase carousel                                                   */
/* ------------------------------------------------------------------ */

// Figma "Portfolio": heading left, staggered cards and pagination dots.
// While pinned, vertical scroll drives the track sideways; each photo drifts inside its card.
// Under reduced motion the track is a plain horizontal scroller.
const CARD_DROP = [0, 56, 24];

function Showcase() {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const triggerRef = useRef(null);
  const [active, setActive] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: false });
  const animated = motionOK();

  const distance = () => Math.max(0, (trackRef.current?.scrollWidth || 0) - (viewportRef.current?.clientWidth || 0));
  const cardStep = () => {
    const card = trackRef.current?.firstElementChild;
    return card ? card.getBoundingClientRect().width + 12 : 1;
  };

  useGSAP(
    () => {
      if (!animated) return;
      const tween = gsap.to(trackRef.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
            const idx = Math.min(SHOWCASE.length - 1, Math.round((self.progress * distance()) / cardStep()));
            setActive((v) => (v === idx ? v : idx));
            const start = self.progress < 0.01;
            const end = self.progress > 0.99;
            setEdge((v) => (v.start === start && v.end === end ? v : { start, end }));
          },
        },
      });
      triggerRef.current = tween.scrollTrigger;

      gsap.utils.toArray('[data-card-media]').forEach((m) => {
        gsap.fromTo(
          m,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: m.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          }
        );
      });

      gsap.from('[data-show-head] > div', {
        y: 40,
        autoAlpha: 0,
        duration: 1.2,
        ease: 'silk',
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      });
      gsap.from('[data-show-card]', {
        x: 120,
        autoAlpha: 0,
        duration: 1.4,
        ease: 'silk',
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
      });
    },
    { scope: sectionRef }
  );

  // Arrows and dots: scroll the page to where the pinned track shows the wanted card.
  const goTo = (index) => {
    const i = Math.max(0, Math.min(SHOWCASE.length - 1, index));
    const target = Math.min(distance(), i * cardStep());
    const st = triggerRef.current;
    if (st) {
      const dist = distance() || 1;
      scrollToY(st.start + (st.end - st.start) * (target / dist));
    } else {
      viewportRef.current?.scrollTo({ left: target, behavior: 'smooth' });
    }
    if (!st) setActive(i);
  };

  const onNativeScroll = () => {
    if (animated) return;
    const v = viewportRef.current;
    const max = v.scrollWidth - v.clientWidth;
    setActive(Math.min(SHOWCASE.length - 1, Math.round(v.scrollLeft / cardStep())));
    setEdge({ start: v.scrollLeft < 4, end: v.scrollLeft > max - 4 });
    if (barRef.current) barRef.current.style.transform = `scaleX(${max ? v.scrollLeft / max : 0})`;
  };

  return (
    <section id="showcase" ref={sectionRef} className="relative overflow-hidden">
      <div className="flex min-h-screen flex-col justify-center pb-10 pt-[100px]">
        <Container>
          <div data-show-head className="relative flex items-end justify-between gap-6">
            <Heading>
              <Words>Một Skill. Mọi Phong Cách Dựng.</Words>
            </Heading>
            <div className="flex shrink-0 items-center gap-2">
              <Glyph type="rings" className="-top-14 right-0 lg:-left-16 lg:right-auto lg:top-1" />
              {[
                { dir: -1, icon: ChevronLeft, label: 'Mẫu trước', disabled: edge.start },
                { dir: 1, icon: ChevronRight, label: 'Mẫu tiếp theo', disabled: edge.end },
              ].map(({ dir, icon: Icon, label, disabled }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => goTo(active + dir)}
                  aria-label={label}
                  disabled={disabled}
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-black/20 text-white transition-[border-color,background-color,opacity,transform] duration-300 hover:border-line2 hover:bg-white/5 active:scale-95 disabled:cursor-default disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-black/20"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </button>
              ))}
            </div>
          </div>

          <div
            ref={viewportRef}
            onScroll={onNativeScroll}
            className={`mt-[42px] [--cw:290px] sm:[--cw:360px] lg:[--cw:420px] ${animated ? '' : 'no-scrollbar snap-x overflow-x-auto'}`}
          >
            <div ref={trackRef} className="flex w-max items-start gap-3 pb-14 will-change-transform">
              {SHOWCASE.map((item, i) => (
                <div key={item.mode} data-show-card className="shrink-0 snap-start" style={{ marginTop: CARD_DROP[i % 3] }}>
                  <PhotoCard
                    image={item.image}
                    parallax={false}
                    overlay="bg-gradient-to-b from-black/30 via-transparent to-black/80"
                    className="h-[min(400px,48vh)] w-[var(--cw)] transition-[border-color] duration-500 hover:border-line2 sm:h-[min(440px,50vh)] lg:h-[min(480px,52vh)]"
                  >
                    <div className="flex h-full flex-col justify-between p-8">
                      <p className="text-xl font-medium tracking-tightish text-white">{item.mode}</p>
                      <div className="transition-transform duration-700 ease-silk group-hover:-translate-y-1">
                        <p className="text-sm font-medium tracking-tightish text-accent">LỆNH DNA</p>
                        <h4 className="mt-2 text-xl font-medium leading-[1.2] tracking-tightish text-white lg:text-2xl">{item.prompt}</h4>
                      </div>
                    </div>
                  </PhotoCard>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-6">
            <Glyph type="zigzag" className="left-0 top-0" />
            <div className="mx-auto flex items-center gap-2" role="group" aria-label="Chọn mẫu">
              {SHOWCASE.map((item, i) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={item.mode}
                  aria-current={active === i}
                  className="group flex h-6 items-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-[width,background-color] duration-500 ease-silk ${
                      active === i ? 'w-6 bg-accent' : 'w-1.5 bg-line2 group-hover:bg-mute'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-px w-full overflow-hidden bg-line" aria-hidden="true">
            <div ref={barRef} className="h-full origin-left bg-white/60" style={{ transform: 'scaleX(0)' }} />
          </div>
        </Container>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bento grid                                                          */
/* ------------------------------------------------------------------ */

function MetricCard({ image, value, label, className = '', position }) {
  return (
    <PhotoCard image={image} position={position} className={className} overlay="bg-black/40">
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-[52px] font-medium leading-[1.2] text-white md:text-[60px]">
          <CountUp value={value} />
        </p>
        <h4 className="mt-1 text-xl font-medium leading-[1.2] tracking-tightish text-white md:text-2xl">{label}</h4>
      </div>
    </PhotoCard>
  );
}

function CenterCard({ image, title, desc, className = '', position }) {
  return (
    <PhotoCard image={image} position={position} className={className} overlay="bg-black/40">
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h3 className="text-[32px] font-medium leading-[1.2] tracking-tightish text-white lg:text-[44px]">{title}</h3>
        <p className="mt-2 max-w-[460px] text-lg font-medium leading-[1.4] tracking-tightish text-white md:text-xl">{desc}</p>
      </div>
    </PhotoCard>
  );
}

// Figma "Why choose" header split: heading left, supporting copy and action right.
function SplitHeader({ heading, children }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
      {heading}
      <Reveal delay={150} y={24} className="lg:justify-self-end">
        {children}
      </Reveal>
    </div>
  );
}

function Features({ onCheckout }) {
  return (
    <section id="features" className="scroll-mt-10 py-[120px]">
      <Container>
        <SplitHeader
          heading={
            <Heading>
              <Words>Mọi thứ bạn cần để nhân bản</Words>
              <br />
              <Words>tốc độ Edit</Words>{' '}
              <span className="text-mute">
                <Words>gấp 10 lần</Words>
              </span>
            </Heading>
          }
        >
          <div className="max-w-[400px]">
            <p className="text-lg leading-[1.5] text-mute">Trích xuất, tự động dựng, kiểm duyệt và xuất bản — trong một luồng duy nhất.</p>
            <Magnetic className="mt-6 inline-flex">
              <PillButton onClick={onCheckout}>
                Nhận Slot Beta <SlideArrow />
              </PillButton>
            </Magnetic>
          </div>
        </SplitHeader>

        <div className="mt-[56px] grid gap-3 lg:grid-cols-[735fr_613fr]">
          <Stagger className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div data-stagger>
                <MetricCard image="fox" value="0.1s" label="Kiểm duyệt QA tự động" className="h-[250px]" />
              </div>
              <div data-stagger>
                <MetricCard image="eye" value="4K" label="60FPS · Giữ chất lượng gốc" className="h-[250px]" />
              </div>
            </div>
            <div data-stagger>
              <PhotoCard image="tennis-ball" className="h-[355px]" overlay="bg-gradient-to-b from-black/35 via-black/10 to-black/55">
                <div className="flex h-full flex-col justify-between p-8">
                  <p className="text-xl font-medium tracking-tightish text-white">Sao chép mọi Style</p>
                  <h4 className="max-w-[420px] text-xl font-medium leading-[1.2] tracking-tightish text-white md:text-2xl">
                    Từ nhịp dựng nhanh kiểu TikTok/Reels đến Vlog điện ảnh sâu lắng.
                  </h4>
                </div>
              </PhotoCard>
            </div>
            <div data-stagger>
              <CenterCard
                image="flowers"
                title="Mua 1 lần, dùng mãi mãi"
                desc="Không phí thuê bao hàng tháng, không giới hạn số lượng video xử lý."
                className="h-[260px] lg:h-[225px]"
                position="center 70%"
              />
            </div>
          </Stagger>

          <Stagger className="flex flex-col gap-3">
            <div data-stagger>
              <CenterCard
                image="tennis-court"
                title="Liquid Choreography"
                desc="Lệch pha 2-4 frame (Micro-Staggering) giúp chuyển động mượt tự nhiên, không bị “mùi AI”."
                className="h-[300px]"
              />
            </div>
            <div data-stagger>
              <CenterCard
                image="desert"
                title="Đa nền tảng dựng"
                desc="Chuyển đổi linh hoạt giữa CapCut, Premiere Pro, Remotion và FFmpeg trong một luồng duy nhất."
                className="h-[280px]"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div data-stagger>
                <MetricCard image="flowers-purple" value="90%" label="Thời gian tiết kiệm" className="h-[250px]" />
              </div>
              <div data-stagger>
                <PhotoCard image="court-line" className="h-[250px]" overlay="bg-black/10">
                  <div className="flex h-full items-center justify-center">
                    <Logo size={62} />
                  </div>
                </PhotoCard>
              </div>
            </div>
          </Stagger>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Workspace mockup                                                    */
/* ------------------------------------------------------------------ */

function WorkspaceWindow() {
  const [active, setActive] = useState(0);
  const prompt = useLoopingTypewriter('Clone nhịp cắt của video mẫu, thêm VietSub và xuất Premiere XML...', 45, 2200);
  const compile = useLoopingProgress(2, 90, 800);

  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-line bg-card shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex h-10 items-center gap-1.5 border-b border-line px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F54]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBE32]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2FC941]" />
      </div>
      <div className="flex">
        <aside className="hidden w-[160px] shrink-0 flex-col border-r border-line p-4 sm:flex">
          <Logo size={18} />
          <nav className="mt-5 space-y-1.5" aria-label="Workspace">
            {WORKSPACE_NAV.map(({ label, icon: Icon }, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setActive(i)}
                className={`flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-[10px] tracking-tightish transition-colors ${
                  active === i ? 'border-line bg-inner font-medium text-white' : 'border-transparent text-mute hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-2 pt-10">
            <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full border border-line bg-card text-[10px] text-mute">B</span>
            <div className="text-[10px] font-medium leading-[1.2] tracking-tightish">
              <p className="text-white">beta@aieditor.vn</p>
              <p className="text-mute">Beta · Vĩnh viễn</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-4">
          <div className="relative h-[150px] overflow-hidden rounded-xl sm:h-[175px]">
            <img
              src={media('hero-alt')}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover brightness-[.7] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_72%)]"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <h4 className="text-2xl font-medium tracking-tightish text-white">Style DNA v2</h4>
              <p className="mt-1 text-xs font-medium tracking-tightish text-white">Bóc tách nhịp cắt chính xác hơn đã sẵn sàng.</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium tracking-tightish text-white">Pipeline Multi-Agent</p>
              <p className="text-[10px] tracking-tightish text-mute">4 tác tử · 1 đang xử lý</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-4 py-[9px] text-[10px] text-white">
              <Plus className="h-3 w-3" /> Phiên dựng mới
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {AGENTS.map((a) => (
              <div key={a.name} className="flex items-center gap-2.5 overflow-hidden rounded-lg border border-line bg-inner p-1.5 pr-2.5">
                <img src={media(a.image)} alt="" loading="lazy" className="h-11 w-14 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium tracking-tightish text-white">
                    <span className="text-mute">{a.label}:</span> {a.name}
                  </p>
                  {a.running ? (
                    <div className="mt-1">
                      <p className="truncate text-[10px] text-mute">
                        [{a.status}] · {Math.min(compile, 100)}%
                      </p>
                      <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-chip">
                        <div className="h-full rounded-full bg-white transition-[width] duration-100" style={{ width: `${Math.min(compile, 100)}%` }} />
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-[10px] ${a.passed ? 'text-emerald-300' : 'text-mute'}`}>
                      {a.passed ? <ShieldCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}[{a.status}]
                    </p>
                  )}
                </div>
                {a.running && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-white" />}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-inner p-3">
            <p className="min-h-[34px] text-xs leading-[1.4] text-mute">
              {prompt}
              <span className="anim-caret ml-px inline-block h-3 w-px translate-y-0.5 bg-white" />
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-inner px-3 py-1.5 text-[10px] font-medium text-white">
                  <Dna className="h-3 w-3 text-mute" /> Style DNA v2
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-inner px-3 py-1.5 text-[10px] font-medium text-white">
                  <Clock3 className="h-3 w-3 text-mute" /> 4K
                </span>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-card">
                <Wand2 className="h-3 w-3 text-white" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Figma "Why choose us": split header, then one wide media frame.
// The window rises and settles to full size as the frame scrolls into view.
function Workspace() {
  const frameRef = useRef(null);

  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.fromTo(
        '[data-ws-window]',
        { scale: 0.88, yPercent: 10 },
        {
          scale: 1,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: frameRef.current, start: 'top bottom', end: 'center center', scrub: 1 },
        }
      );
    },
    { scope: frameRef }
  );

  return (
    <section id="workspace" className="relative py-[120px]">
      <Container>
        <SplitHeader
          heading={
            <Heading>
              <Words>Một trung tâm điều khiển.</Words>
              <br />
              <span className="text-mute">
                <Words>Vận hành bởi hệ thống Multi-Agent.</Words>
              </span>
            </Heading>
          }
        >
          <ul className="grid max-w-[460px] gap-5">
            {WORKSPACE_FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-lg font-medium tracking-tightish text-white">{title}</p>
                  <p className="mt-1 text-base leading-[1.5] text-mute">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </SplitHeader>

        <Reveal delay={100}>
          <div
            ref={frameRef}
            className="relative mt-[56px] flex justify-center overflow-hidden rounded-[32px] border border-line bg-card px-3 py-10 sm:px-10 lg:h-[665px] lg:items-center lg:py-0"
          >
            <ParallaxMedia src={media('reef-wide')} amount={10} imgClassName="scale-110 opacity-50 blur-[10px] brightness-[.45] saturate-[.8]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,10,10,0.75)_80%)]" />
            <div data-ws-window className="relative w-full max-w-[700px] will-change-transform">
              <WorkspaceWindow />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

function FeatureList({ items, muted = false }) {
  return (
    <ul className="space-y-3">
      {items.map((f) => (
        <li key={f} className={`flex gap-3 text-base leading-[1.4] tracking-tightish ${muted ? 'text-mute' : 'text-white'}`}>
          <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-line2 bg-chip">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function LockedCard({ title, price, features, blur, opacity, lockTitle, lockSub }) {
  return (
    <div onPointerMove={trackGlow} className="glow-card relative h-full overflow-hidden rounded-[32px] border border-line bg-card">
      <div aria-hidden="true" className={`pointer-events-none flex h-full select-none flex-col p-8 ${opacity}`} style={{ filter: `blur(${blur})` }}>
        <p className="text-xl font-medium tracking-tightish text-white">{title}</p>
        <p className="mt-8 text-[44px] font-medium leading-[1.2] tracking-tightish text-white">{formatVnd(price)}</p>
        <p className="mt-1 text-base text-mute">Thanh toán 1 lần</p>
        <div className="mt-8 h-12 rounded-full bg-white/80" />
        <div className="mt-8">
          <FeatureList items={features} muted />
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-[290px] rounded-[24px] border border-line bg-inner/95 p-6 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-line2 bg-chip">
            <Lock className="h-[18px] w-[18px] text-white" />
          </span>
          <p className="mt-4 text-lg font-medium leading-[1.3] tracking-tightish text-white">{lockTitle}</p>
          <p className="mt-2 text-sm leading-[1.4] text-mute">{lockSub}</p>
        </div>
      </div>
    </div>
  );
}

function Pricing({ onCheckout }) {
  const slotsTaken = useSlots();
  const known = slotsTaken !== null;
  const slotsLeft = known ? Math.max(0, BETA_SLOTS_TOTAL - slotsTaken) : null;
  const soldOut = slotsLeft === 0;
  const savePct = Math.round((1 - BETA_PRICE / ULTIMATE_PRICE) * 100);
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.from('[data-slot-bar]', {
        scaleX: 0,
        duration: 1.8,
        ease: 'silk',
        scrollTrigger: { trigger: '[data-slot-bar]', start: 'top 90%', once: true },
      });
    },
    { scope: ref }
  );

  return (
    <section id="pricing" ref={ref} className="scroll-mt-10 py-[120px]">
      <Container>
        <SplitHeader
          heading={
            <Heading>
              <Words>Sở hữu trọn đời.</Words>
              <br />
              <span className="text-mute">
                <Words>Thanh toán một lần duy nhất.</Words>
              </span>
            </Heading>
          }
        >
          <div className="flex max-w-[420px] flex-col items-start gap-5 lg:items-end lg:text-right">
          <p className="text-lg leading-[1.4] text-mute">Không phí thuê bao. Không giới hạn số video. Nhận mọi bản cập nhật.</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-base px-6 py-[14px] text-base font-medium tracking-tightish text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {soldOut ? (
              'Đã hết slot Beta'
            ) : known ? (
              <span>
                Còn <CountUp value={slotsLeft} />/{BETA_SLOTS_TOTAL} slot Beta
              </span>
            ) : (
              `Giới hạn ${BETA_SLOTS_TOTAL} slot Beta`
            )}
          </span>
          </div>
        </SplitHeader>

        <Stagger className="mt-[56px] grid gap-3 lg:grid-cols-3" each={0.12}>
          <div data-stagger>
            <TiltCard as="div" max={2.5} className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-line2 bg-card">
              <div className="relative h-[150px] overflow-hidden">
                <ParallaxMedia src={media('hero-alt')} amount={10} imgClassName="brightness-[.75]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-card" />
                <span className="absolute left-8 top-8 inline-flex max-w-[calc(100%-4rem)] items-center rounded-full bg-base/80 px-4 py-1.5 text-xs font-medium tracking-tightish text-white backdrop-blur-md">
                  🔥 ĐANG MỞ BÁN — GIỚI HẠN SLOT ĐẦU TIÊN
                </span>
              </div>
              <div className="flex flex-1 flex-col px-8 pb-8">
                <p className="text-xl font-medium tracking-tightish text-white">Phiên Bản Thử Nghiệm (Beta Test)</p>
                <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-[44px] font-medium leading-[1.2] tracking-tightish text-white">{formatVnd(BETA_PRICE)}</span>
                  <span className="pb-2 text-lg text-mute line-through">{formatVnd(ULTIMATE_PRICE)}</span>
                  <span className="mb-2.5 rounded-lg border border-line2 bg-chip px-2 py-0.5 text-xs font-medium text-accent">-{savePct}%</span>
                </div>
                <p className="mt-1 text-base text-mute">Thanh toán 1 lần duy nhất</p>

                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-chip">
                  <div data-slot-bar className="h-full origin-left rounded-full bg-white" style={{ width: `${(Math.min(slotsTaken ?? 0, BETA_SLOTS_TOTAL) / BETA_SLOTS_TOTAL) * 100}%` }} />
                </div>
                <p className="mt-2 text-sm text-mute">
                  {known ? `Đã nhận ${Math.min(slotsTaken, BETA_SLOTS_TOTAL)}/${BETA_SLOTS_TOTAL} slot` : `${BETA_SLOTS_TOTAL} slot đầu tiên`} · Giá tăng lên{' '}
                  {formatVnd(OFFICIAL_PRICE)} khi hết slot
                </p>

                <div className="mt-6 rounded-[24px] border border-line bg-inner p-[18px]">
                  <p className="text-sm leading-[1.5] text-mute">
                    Đây là đợt mở bán ưu đãi thử nghiệm của <strong className="font-medium text-white">Bản Chính Thức (Option 2)</strong> dành
                    riêng cho những người dùng đầu tiên tham gia test Beta. Sở hữu vĩnh viễn và nhận toàn bộ bản cập nhật khi lên bản chính
                    thức.
                  </p>
                </div>

                <PillButton className="mt-6 w-full" onClick={onCheckout} disabled={soldOut}>
                  {soldOut ? 'Đã hết slot Beta' : `Nhận Slot Beta Ngay — ${formatVnd(BETA_PRICE)}`}
                </PillButton>

                <div className="mt-8">
                  <FeatureList items={BETA_FEATURES} />
                </div>
              </div>
            </TiltCard>
          </div>

          <div data-stagger>
            <LockedCard
              title="Phiên Bản Chính Thức (Official Release)"
              price={OFFICIAL_PRICE}
              features={OFFICIAL_FEATURES}
              blur="3.5px"
              opacity="opacity-55"
              lockTitle="Mở khóa sau khi kết thúc đợt Beta"
              lockSub="Giá sẽ tăng lên 479.000đ ngay khi hết slot thử nghiệm 349.000đ"
            />
          </div>

          <div data-stagger>
            <LockedCard
              title="Phiên Bản Cao Cấp Nhất (Ultimate Studio)"
              price={ULTIMATE_PRICE}
              features={ULTIMATE_FEATURES}
              blur="4.5px"
              opacity="opacity-45"
              lockTitle="Sắp ra mắt (Coming Soon)"
              lockSub="Dành cho Agency & Studio quy mô lớn"
            />
          </div>
        </Stagger>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Checkout modal                                                      */
/* ------------------------------------------------------------------ */

const POLL_MS = 4000;

function CheckoutModal({ open, onClose, me, reloadMe }) {
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('email');
  const [contact, setContact] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [order, setOrder] = useState(null);
  const firstFieldRef = useRef(null);

  const user = me?.user;
  const nameError = touched && name.trim().length < 2 ? 'Vui lòng nhập họ tên (ít nhất 2 ký tự).' : '';
  const methodCfg = CONTACT_METHODS.find((m) => m.id === method);
  const contactError = touched && !methodCfg.validate(contact) ? methodCfg.error : '';
  // payOS payment link for this order: QR string, bank account and transfer note.
  const payment = order?.payment;
  const amount = order?.amount || BETA_PRICE;

  // Which screen to show before the order form: sign in, already owned, or the form.
  // A purchase that just completed keeps its own success screen.
  const gate = !me ? 'loading' : !user ? 'auth' : me.entitled && step !== 'paid' ? 'owned' : null;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Prefill from the Google account, or from the order the user already started.
  useEffect(() => {
    if (!open || !user) return;
    const pending = me.orders.find((o) => o.status === 'pending');
    setName((v) => v || pending?.name || user.name);
    if (pending && CONTACT_METHODS.some((m) => m.id === pending.contactMethod)) {
      setMethod(pending.contactMethod);
      setContact(pending.contact);
    } else {
      setContact((v) => v || user.email);
    }
  }, [open, user, me]);

  useEffect(() => {
    if (open) return undefined;
    const t = setTimeout(() => {
      setStep('form');
      setTouched(false);
      setSubmitting(false);
      setSubmitError('');
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  // While the transfer is outstanding, poll until the payOS webhook (or an admin) marks it paid.
  // After "Tôi đã chuyển khoản", every third poll also asks the server to check payOS directly.
  useEffect(() => {
    if (!open || !order || order.status !== 'pending' || !['payment', 'done'].includes(step)) return undefined;
    let tick = 0;
    const check = async () => {
      tick += 1;
      const sync = step === 'done' && tick % 3 === 1;
      try {
        const { order: latest } = await api(`/orders/${order.code}${sync ? '?sync=1' : ''}`);
        if (latest.status === 'paid') {
          setOrder(latest);
          setStep('paid');
          reloadMe();
        }
      } catch {
        // Transient network errors: keep polling.
      }
    };
    if (step === 'done') check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, [open, order, step, reloadMe]);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setSubmitError('');
    if (name.trim().length < 2 || !methodCfg.validate(contact)) return;
    setSubmitting(true);
    try {
      const res = await api('/orders', { method: 'POST', body: { name: name.trim(), contactMethod: method, contact: contact.trim() } });
      setOrder(res.order);
      setStep('payment');
    } catch (err) {
      if (err.code === 'already_paid') reloadMe();
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const stepIndex = gate === 'owned' ? 3 : gate ? 0 : { form: 0, payment: 1, done: 1, paid: 3 }[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <button type="button" aria-label="Đóng" onClick={onClose} className="anim-fade-up absolute inset-0 bg-black/75 backdrop-blur-md" />

      <div data-lenis-prevent className="anim-fade-up relative max-h-[92vh] w-full max-w-[860px] overflow-y-auto rounded-t-[32px] border border-line bg-card sm:rounded-[32px]">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
          <div>
            <p id="checkout-title" className="text-xl font-medium tracking-tightish text-white">
              Nhận Slot Beta
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mute">
              {['Thông tin', 'Thanh toán', 'Kích hoạt'].map((s, i) => (
                <span key={s} className={`inline-flex items-center gap-1.5 ${i <= stepIndex ? 'text-white' : ''}`}>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      i < stepIndex ? 'border-white bg-white text-base' : i === stepIndex ? 'border-white text-white' : 'border-line2'
                    }`}
                  >
                    {i < stepIndex ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  {s}
                  {i < 2 && <span className="mx-1 h-px w-4 bg-line2" />}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-line text-white transition-colors hover:border-line2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_280px]">
          <div className="p-6 sm:p-8">
            {gate === 'loading' && (
              <p className="flex items-center gap-2 text-sm text-mute">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
              </p>
            )}

            {gate === 'auth' && (
              <div className="anim-fade-up">
                <h3 className="text-2xl font-medium tracking-tightish text-white">Đăng nhập để giữ slot</h3>
                <p className="mt-2 text-base leading-[1.5] text-mute">
                  Đơn hàng gắn với tài khoản Google của bạn. Sau khi thanh toán, bạn dùng chính tài khoản này để vào trang thành viên tải Skill và
                  nhận bản cập nhật.
                </p>
                <GoogleSignInButton next="/?checkout=1" className="mt-6 w-full" />
                <DevSignIn onDone={reloadMe} />
              </div>
            )}

            {gate === 'owned' && (
              <div className="anim-fade-up">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-chip">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </span>
                <h3 className="mt-5 text-2xl font-medium tracking-tightish text-white">Bạn đã sở hữu Skill</h3>
                <p className="mt-2 text-base leading-[1.4] text-mute">Tài khoản {user.email} đã thanh toán. Vào trang thành viên để tải bản mới nhất.</p>
                <PillButton className="mt-6 w-full" onClick={() => window.location.assign('/account')}>
                  Vào trang thành viên <ArrowRight className="h-4 w-4" />
                </PillButton>
              </div>
            )}

            {!gate && step === 'form' && (
              <form onSubmit={submit} noValidate className="anim-fade-up space-y-5">
                <p className="flex items-center gap-2 rounded-2xl border border-line bg-inner px-4 py-3 text-sm text-mute">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 truncate">
                    Đơn hàng gắn với <strong className="font-medium text-white">{user.email}</strong>
                  </span>
                </p>
                <div>
                  <label htmlFor="co-name" className="text-sm text-mute">
                    Họ và tên
                  </label>
                  <input
                    id="co-name"
                    ref={firstFieldRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? 'co-name-err' : undefined}
                    className={inputClass(nameError)}
                  />
                  {nameError && (
                    <p id="co-name-err" className="mt-1.5 text-xs text-rose-300">
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-sm text-mute">Kênh liên hệ hỗ trợ</span>
                  <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Kênh liên hệ">
                    {CONTACT_METHODS.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={method === id}
                        onClick={() => {
                          setMethod(id);
                          setContact(id === 'email' ? user.email : '');
                        }}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 text-sm font-medium tracking-tightish transition-colors ${
                          method === id ? 'border-white bg-white text-base' : 'border-line bg-inner text-white hover:border-line2'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="co-contact" className="text-sm text-mute">
                    {methodCfg.field}
                  </label>
                  <input
                    id="co-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    type={methodCfg.type}
                    inputMode={methodCfg.type === 'tel' ? 'tel' : undefined}
                    autoComplete={methodCfg.type}
                    placeholder={methodCfg.placeholder}
                    aria-invalid={Boolean(contactError)}
                    aria-describedby={contactError ? 'co-contact-err' : undefined}
                    className={inputClass(contactError)}
                  />
                  {contactError && (
                    <p id="co-contact-err" className="mt-1.5 text-xs text-rose-300">
                      {contactError}
                    </p>
                  )}
                </div>

                <PillButton type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo đơn...
                    </>
                  ) : (
                    <>
                      Tiếp tục thanh toán <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </PillButton>
                {submitError && <p className="text-center text-sm text-rose-300">{submitError}</p>}
                <p className="text-center text-xs text-mute">Thông tin chỉ dùng để hỗ trợ cài đặt và mời bạn vào nhóm kín.</p>
              </form>
            )}

            {!gate && step === 'payment' && (
              <div className="anim-fade-up">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="mx-auto w-48 shrink-0 sm:mx-0">
                    <div className="aspect-square overflow-hidden rounded-[24px] bg-white p-3">
                      <PayosQr
                        value={payment?.qrCode}
                        label={`Mã VietQR chuyển khoản ${formatVnd(amount)}`}
                        caption={`${formatVnd(amount)} · ${payment?.description || ''}`}
                      />
                    </div>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-mute">
                      <QrCode className="h-3.5 w-3.5 shrink-0" />
                      Chạm vào mã để phóng to
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <CopyField label="Ngân hàng" value={payment?.bankName || (payment?.bin ? `BIN ${payment.bin}` : '')} />
                    <CopyField label="Số tài khoản" value={payment?.accountNumber} />
                    <CopyField label="Chủ tài khoản" value={payment?.accountName} />
                    <CopyField label="Số tiền" value={String(amount)} />
                    <CopyField label="Nội dung chuyển khoản" value={payment?.description} />
                  </div>
                </div>

                <p className="mt-5 rounded-[24px] border border-line bg-inner p-4 text-sm leading-[1.5] text-mute">
                  Chuyển đúng <strong className="font-medium text-white">{formatVnd(amount)}</strong> với nội dung{' '}
                  <strong className="font-medium text-white">{payment?.description}</strong>. Thanh toán qua payOS — hệ thống tự xác nhận trong vài
                  giây sau khi tiền về.
                  {payment?.checkoutUrl && (
                    <>
                      {' '}
                      <a href={payment.checkoutUrl} target="_blank" rel="noreferrer" className="text-white underline decoration-dashed underline-offset-4 hover:opacity-70">
                        Mở trang thanh toán payOS
                      </a>
                    </>
                  )}
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <PillButton variant="dark" size="lg" onClick={() => setStep('form')}>
                    <ChevronLeft className="h-4 w-4" /> Sửa thông tin
                  </PillButton>
                  <PillButton className="flex-1" onClick={() => setStep('done')}>
                    Tôi đã chuyển khoản <Check className="h-4 w-4" />
                  </PillButton>
                </div>
              </div>
            )}

            {!gate && step === 'done' && (
              <div className="anim-fade-up">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-chip">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </span>
                <h3 className="mt-5 text-2xl font-medium tracking-tightish text-white">Đang chờ xác nhận đơn #{order.code}</h3>
                <p className="mt-2 text-base leading-[1.4] text-mute">
                  Cảm ơn {name.trim() || 'bạn'}! Trang này tự cập nhật khi ngân hàng báo tiền về, thường trong vòng 1 phút. Bạn có thể đóng cửa sổ —
                  đơn vẫn được ghi nhận và hiển thị trong trang thành viên.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <PillButton variant="dark" size="lg" onClick={() => setStep('payment')}>
                    <ChevronLeft className="h-4 w-4" /> Xem lại thông tin CK
                  </PillButton>
                  <PillButton className="flex-1" onClick={() => window.location.assign('/account')}>
                    Mở trang thành viên <ArrowRight className="h-4 w-4" />
                  </PillButton>
                </div>
              </div>
            )}

            {!gate && step === 'paid' && (
              <div className="anim-fade-up">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-chip">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </span>
                <h3 className="mt-5 text-2xl font-medium tracking-tightish text-white">Thanh toán thành công!</h3>
                <p className="mt-2 text-base leading-[1.4] text-mute">
                  Đơn #{order.code} đã được xác nhận. File Skill, hướng dẫn cài đặt và link nhóm kín đang chờ bạn.
                </p>
                <PillButton className="mt-6 w-full" onClick={() => window.location.assign('/account')}>
                  Vào trang thành viên <ArrowRight className="h-4 w-4" />
                </PillButton>
              </div>
            )}
          </div>

          <aside className="border-t border-line p-6 sm:p-8 md:border-l md:border-t-0">
            <p className="text-sm text-mute">Đơn hàng</p>
            <p className="mt-3 text-base font-medium tracking-tightish text-white">{PRODUCT_NAME}</p>
            <p className="mt-1 text-sm text-mute">Sở hữu vĩnh viễn · Miễn phí nâng cấp bản chính thức</p>
            <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between text-mute">
                <span>Giá gốc</span>
                <span className="line-through">{formatVnd(ULTIMATE_PRICE)}</span>
              </div>
              <div className="flex justify-between text-mute">
                <span>Ưu đãi Beta</span>
                <span className="text-accent">-{formatVnd(ULTIMATE_PRICE - BETA_PRICE)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-medium text-white">
                <span>Tổng</span>
                <span>{formatVnd(BETA_PRICE)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer CTA & footer                                                 */
/* ------------------------------------------------------------------ */

// Figma "Contact us": heading left, action right. The photo fan opens from a stack as it scrolls in.
function FooterCta({ onCheckout }) {
  const fanRef = useRef(null);

  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.utils.toArray('[data-fan]').forEach((card) => {
        const toCentre = 100 - (card.offsetLeft + card.offsetWidth / 2);
        gsap.from(card, {
          x: toCentre,
          y: 30,
          rotation: 0,
          ease: 'none',
          scrollTrigger: { trigger: fanRef.current, start: 'top 95%', end: 'top 45%', scrub: 1 },
        });
      });
    },
    { scope: fanRef }
  );

  return (
    <section className="relative overflow-hidden border-t border-line py-[120px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(4,184,224,0.08),transparent_55%)]" aria-hidden="true" />
      <Container className="relative grid items-center gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Glyph type="plus" className="-top-12 right-0 lg:right-10" />
          <Heading className="max-w-[640px] lg:text-[56px]">
            <Words>Bản dựng tiếp theo của bạn bắt đầu từ đây</Words>
          </Heading>
          <Glyph type="rings" className="-bottom-20 left-2" />
        </div>

        <div className="flex flex-col items-center gap-10 lg:items-end">
          <div ref={fanRef} className="relative h-[250px] w-[200px] scale-[0.72] sm:scale-100 lg:mr-[230px]">
            {FAN_CARDS.map((c) => (
              <div key={c.image} data-fan className={`absolute ${c.className}`}>
                <img
                  src={media(c.image)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full rounded-[32px] border border-line object-cover shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-silk hover:-translate-y-2"
                />
              </div>
            ))}
          </div>
          <Reveal delay={150} y={24}>
            <Magnetic>
              <PillButton size="lg" onClick={onCheckout}>
                Nhận Slot Beta — {formatVnd(BETA_PRICE)} <SlideArrow />
              </PillButton>
            </Magnetic>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

// Figma footer: one row — brand, links, legal — on a quiet ground.
function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <img
        src={media('reef-wide')}
        alt=""
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 brightness-[.5] saturate-[.8] [mask-image:radial-gradient(ellipse_at_center,#000_10%,transparent_75%)]"
      />
      <Container className="relative pb-10 pt-20">
        <Stagger className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div data-stagger>
            <div className="flex items-center gap-4">
              <Logo size={32} />
              <p className="max-w-[170px] text-sm font-medium leading-[1.2] tracking-tightish text-mute">Skill AI tự động edit video & sao chép Style DNA.</p>
            </div>
            <div className="mt-8 flex gap-2">
              {[
                { icon: Mail, label: 'Email' },
                { icon: MessageCircle, label: 'Zalo' },
                { icon: Bot, label: 'Discord' },
                { icon: MonitorPlay, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  title={label}
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-card text-white transition-[border-color,transform] duration-500 ease-silk hover:-translate-y-0.5 hover:border-line2"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <div data-stagger>
            <p className="text-base tracking-[0.01em] text-mute">Điều hướng</p>
            <ul className="mt-4 space-y-[13px]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="group inline-flex items-center gap-1.5 text-lg text-white">
                    <span className="link-draw">{l.label}</span>
                    <SlideArrow className="h-3.5 w-3.5 text-mute" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div data-stagger>
            <p className="text-base tracking-[0.01em] text-mute">Định dạng</p>
            <ul className="mt-4 space-y-[13px] text-lg text-white">
              <li>CapCut JSON</li>
              <li>Premiere XML</li>
              <li>Remotion / FFmpeg</li>
              <li>VietSub SRT</li>
            </ul>
          </div>
        </Stagger>

        <div className="mt-20 flex flex-col gap-3 border-t border-line pt-8 text-base font-medium tracking-tightish text-mute sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} AI EDITOR.</span>
          <a href="#top" className="group inline-flex items-center gap-1.5 text-white">
            <span className="link-draw">Về đầu trang</span>
            <SlideArrow className="h-3.5 w-3.5 -rotate-45" />
          </a>
        </div>
      </Container>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const { me, reload: reloadMe } = useMe();
  // Google sign-in from the checkout returns to /?checkout=1 to reopen the modal.
  const [checkoutOpen, setCheckoutOpen] = useState(() => new URLSearchParams(window.location.search).has('checkout'));
  const openCheckout = useCallback(() => setCheckoutOpen(true), []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  useSmoothScroll();
  useGlyphs();

  // Every section has registered its triggers by now: order them by page position and measure once.
  useEffect(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  useEffect(() => {
    if (checkoutOpen && window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, [checkoutOpen]);

  // The page behind the checkout dialog stops scrolling while it is open.
  useEffect(() => {
    scrollLock(checkoutOpen);
  }, [checkoutOpen]);

  return (
    <div className="min-h-screen overflow-x-clip bg-base font-sans text-white">
      <GlobalStyles />
      <Navbar onCheckout={openCheckout} me={me} />
      <main>
        <Hero />
        <Workspace />
        <Workflow />
        <Ecosystem />
        <Features onCheckout={openCheckout} />
        <Showcase />
        <Pricing onCheckout={openCheckout} />
        <FooterCta onCheckout={openCheckout} />
      </main>
      <Footer />
      <CheckoutModal open={checkoutOpen} onClose={closeCheckout} me={me} reloadMe={reloadMe} />
    </div>
  );
}
