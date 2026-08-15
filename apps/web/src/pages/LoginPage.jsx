import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Mail, Users, ShieldCheck, TrendingUp, Calendar, ArrowRight, Eye, EyeOff, Wifi, Activity, Cpu } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import authService from '@/services/auth/index.js';
import { DEMO_PASSWORD } from '@/mocks/users.js';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const COMPANY_PHOTOS = ['/branding/login-bg.svg'];



const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const demoAccounts = authService.listDemoAccounts();

  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const todayStr = format(today, 'yyyy-MM-dd');
        const endDateStr = format(addDays(today, 3), 'yyyy-MM-dd');
        const scheds = await pb.collection('schedules').getFullList({
          filter: `fecha_programada >= "${todayStr}" && fecha_programada < "${endDateStr}"`,
          sort: 'fecha_programada',
          $autoCancel: false
        });
        setSchedules(scheds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchPublicData();
  }, []);

  // Cycle background photo
  useEffect(() => {
    const t = setInterval(() => setPhotoIndex(i => (i + 1) % COMPANY_PHOTOS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      toast.success('Acceso autorizado');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const isTerminado = estado => {
    const e = (estado || '').toLowerCase();
    return e.includes('termin') || e.includes('complet') || e.includes('pagad');
  };

  const renderScheduleColumn = (date, title) => {
    let daySchedules = schedules
      .filter(s => isSameDay(new Date(`${s.fecha_programada}`.slice(0, 10) + 'T00:00:00'), date))
      .map(s => ({
        cliente: s.cliente || 'Sin cliente',
        descripcion: s.descripcion_trabajo,
        estado: s.estado === 'completado' ? 'terminado' : 'programado',
      }));


    return (
      <div key={title} className="flex flex-col">
        {/* Column header */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#11D4B1]">{title}</span>
          <span className="text-[10px] font-semibold text-[#8DA4B8] tabular-nums">
            {format(date, 'dd MMM', { locale: es })}
          </span>
        </div>
        <div className="space-y-2 flex-1">
          {loadingData ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 w-full rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.05]" />
            ))
          ) : daySchedules.length > 0 ? (
            daySchedules.slice(0, 2).map((job, i) => (
              <div
                key={i}
                className="group relative flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all duration-200"
                style={{
                  background: 'rgba(7,38,58,0.6)',
                  backdropFilter: 'blur(8px)',
                  borderColor: isTerminado(job.estado) ? 'rgba(17,212,177,0.18)' : 'rgba(255,255,255,0.07)',
                }}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${isTerminado(job.estado) ? 'bg-[#11D4B1]' : 'bg-sky-400/60'}`} />
                <div className="min-w-0 pl-1">
                  <p className="font-bold text-[11.5px] text-[#E8F0F7] line-clamp-1">{job.cliente}</p>
                  <p className="text-[10px] text-[#8DA4B8] line-clamp-1 mt-0.5">{job.descripcion}</p>
                </div>
                <div className={`shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${isTerminado(job.estado) ? 'bg-[#11D4B1]/12 text-[#11D4B1] border border-[#11D4B1]/20' : 'bg-sky-500/10 text-sky-300 border border-sky-400/15'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isTerminado(job.estado) ? 'bg-[#11D4B1]' : 'bg-sky-400 animate-pulse'}`} />
                  {isTerminado(job.estado) ? 'Listo' : 'Prog.'}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-14 rounded-xl border border-dashed border-white/[0.08] text-[10.5px] text-[#8DA4B8]/60">
              Sin trabajos programados
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Acceso - H&S Tecnologías</title>
        <meta name="description" content="Acceso operativo a la plataforma de gestión H&S Tecnologías." />
      </Helmet>

      <style>{`
        @keyframes hs-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes hs-fade-photo {
          0%, 100% { opacity: 0; }
          15%, 85% { opacity: 1; }
        }
        .hs-photo-active { animation: hs-fade-photo 5s ease-in-out forwards; }
        .hs-input-dark {
          background: rgba(4,28,44,0.85) !important;
          border-color: rgba(17,212,177,0.15) !important;
          color: #E8F0F7 !important;
          caret-color: #11D4B1;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hs-input-dark:focus {
          border-color: rgba(17,212,177,0.5) !important;
          box-shadow: 0 0 0 3px rgba(17,212,177,0.08), inset 0 1px 0 rgba(17,212,177,0.06) !important;
          outline: none !important;
        }
        .hs-input-dark::placeholder { color: rgba(141,164,184,0.4); }
        @keyframes hs-ring-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.06); }
        }
        .hs-ring-pulse { animation: hs-ring-pulse 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: '#030E17' }}>

        {/* ── LEFT PANEL ── */}
        <div className="relative w-full lg:w-[62%] min-h-[50vh] lg:min-h-[100dvh] overflow-hidden">

          {/* Cycling background photos */}
          {COMPANY_PHOTOS.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: idx === photoIndex ? 1 : 0 }}
            />
          ))}

          {/* Layered overlays for depth + readability */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(3,14,23,0.92) 0%, rgba(7,38,58,0.75) 50%, rgba(3,14,23,0.88) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(2,8,14,0.97) 0%, rgba(2,8,14,0.5) 35%, transparent 65%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 10% 15%, rgba(17,212,177,0.09), transparent)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 40% at 80% 80%, rgba(0,80,160,0.12), transparent)' }} />

          {/* Tech grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(17,212,177,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(17,212,177,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />

          {/* Scan line */}
          <div className="absolute inset-x-0 h-[1px] opacity-[0.12] pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(17,212,177,0.8), transparent)',
            animation: 'hs-scan 7s linear infinite',
          }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between min-h-[50vh] lg:min-h-[100dvh] p-6 sm:p-10 lg:p-12 xl:p-14">

            {/* TOP: Logo + Brand */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute -inset-2 rounded-3xl blur-xl opacity-40" style={{ background: 'rgba(17,212,177,0.35)' }} />
                <img
                  src="/branding/logo.svg"
                  alt="H&S Tecnologías"
                  className="relative h-[72px] w-[72px] rounded-2xl object-contain p-2"
                  style={{
                    background: 'rgba(7,38,58,0.7)',
                    border: '1px solid rgba(17,212,177,0.3)',
                    boxShadow: '0 0 28px -4px rgba(17,212,177,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                />
              </div>
              <div>
                <p className="font-black leading-none tracking-tight" style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', color: '#E8F0F7' }}>
                  H&amp;S <span style={{ color: '#11D4B1' }}>Tecnologías</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-px w-6" style={{ background: 'linear-gradient(90deg, #11D4B1, transparent)' }} />
                  <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase" style={{ color: '#11D4B1' }}>Tecnología con Garantía</p>
                </div>
              </div>
            </div>

            {/* MIDDLE: Headline + stats strip */}
            <div className="mt-auto mb-auto py-8 lg:py-0 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10.5px] font-bold uppercase tracking-[0.15em]"
                style={{ background: 'rgba(17,212,177,0.08)', border: '1px solid rgba(17,212,177,0.2)', color: '#11D4B1' }}>
                <Cpu className="h-3 w-3" />
                Plataforma Operativa Integrada
              </div>

              <h1 className="font-black leading-[1.08] tracking-tight mb-5" style={{ fontSize: 'clamp(2rem,4vw,3.4rem)', color: '#E8F0F7', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Somos <span style={{ color: '#11D4B1', textShadow: '0 0 30px rgba(17,212,177,0.35)' }}>familia</span>,
                <br />somos <span style={{ color: '#11D4B1', textShadow: '0 0 30px rgba(17,212,177,0.35)' }}>H&amp;S</span>.
              </h1>

              <p className="text-sm leading-relaxed mb-8 pl-4" style={{
                color: '#9BBAD0',
                borderLeft: '2px solid rgba(17,212,177,0.5)',
                maxWidth: '36rem'
              }}>
                Por muy alta que sea una montaña,{' '}
                <span style={{ color: '#C8D9E6' }}>siempre hay un camino hacia la cima.</span>
              </p>

              {/* Stats strip */}
              <div className="flex items-center gap-5 sm:gap-7">
                {[
                  { icon: Users, label: 'Trabajo en equipo', val: '' },
                  { icon: ShieldCheck, label: 'Seguridad operativa', val: '' },
                  { icon: TrendingUp, label: 'Resultados reales', val: '' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(17,212,177,0.1)', border: '1px solid rgba(17,212,177,0.22)', boxShadow: '0 0 14px -4px rgba(17,212,177,0.25)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#11D4B1' }} strokeWidth={2.2} />
                    </div>
                    <span className="text-xs font-semibold leading-tight" style={{ color: '#C8D9E6' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM: Schedule block */}
            <div className="rounded-2xl p-5 sm:p-6" style={{
              background: 'rgba(3,14,23,0.72)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(17,212,177,0.12)',
              boxShadow: '0 0 40px -10px rgba(17,212,177,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(17,212,177,0.12)', border: '1px solid rgba(17,212,177,0.25)' }}>
                    <Calendar className="h-3.5 w-3.5" style={{ color: '#11D4B1' }} />
                  </div>
                  <div>
                    <h3 className="text-[12.5px] font-black uppercase tracking-[0.12em]" style={{ color: '#E8F0F7' }}>
                      Programación General <span style={{ color: '#11D4B1' }}>(72h)</span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: '#11D4B1' }}>
                  <Activity className="h-3 w-3" />
                  <span>En vivo</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#11D4B1] animate-pulse" />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px mb-5" style={{ background: 'linear-gradient(90deg, rgba(17,212,177,0.3), rgba(17,212,177,0.05), transparent)' }} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderScheduleColumn(today, 'Hoy')}
                {renderScheduleColumn(tomorrow, 'Mañana')}
                {renderScheduleColumn(dayAfter, 'Pasado')}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="relative w-full lg:w-[38%] min-h-[55vh] lg:min-h-[100dvh] flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10"
          style={{ background: 'linear-gradient(160deg, #030E17 0%, #041C2C 60%, #030E17 100%)' }}>

          {/* BG accents */}
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: 'absolute', top: '15%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(17,212,177,0.07) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,60,140,0.12) 0%, transparent 70%)' }} />
            {/* Decorative corner lines */}
            <svg className="absolute top-8 right-8 opacity-20" width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M60 0 L60 20 M60 0 L40 0" stroke="#11D4B1" strokeWidth="1.5" />
            </svg>
            <svg className="absolute bottom-8 left-8 opacity-20" width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M0 60 L0 40 M0 60 L20 60" stroke="#11D4B1" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="relative w-full max-w-[28rem]">
            {/* Outer glow ring */}
            <div className="absolute -inset-px rounded-3xl opacity-60 pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(17,212,177,0.2) 0%, transparent 50%, rgba(17,212,177,0.08) 100%)',
              filter: 'blur(1px)',
            }} />

            <div className="relative rounded-3xl overflow-hidden" style={{
              background: 'linear-gradient(160deg, rgba(7,38,58,0.85) 0%, rgba(4,28,44,0.92) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(17,212,177,0.15)',
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
            }}>
              {/* Card top accent bar */}
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(17,212,177,0.7) 40%, rgba(17,212,177,0.3) 70%, transparent)' }} />

              <div className="p-8 sm:p-10">
                {/* Lock icon header */}
                <div className="flex flex-col items-center text-center mb-9">
                  <div className="relative mb-5">
                    {/* Outer ring */}
                    <div className="absolute -inset-3 rounded-full hs-ring-pulse" style={{
                      border: '1px solid rgba(17,212,177,0.2)',
                    }} />
                    {/* Glow blob */}
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: 'rgba(17,212,177,0.4)' }} />
                    <div className="relative h-[72px] w-[72px] rounded-full flex items-center justify-center" style={{
                      background: 'linear-gradient(135deg, rgba(17,212,177,0.15) 0%, rgba(4,28,44,0.9) 100%)',
                      border: '1.5px solid rgba(17,212,177,0.45)',
                      boxShadow: '0 0 30px -4px rgba(17,212,177,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}>
                      <Lock className="h-7 w-7" style={{ color: '#11D4B1' }} strokeWidth={1.8} />
                    </div>
                  </div>

                  <h2 className="text-[1.6rem] font-black tracking-tight" style={{ color: '#E8F0F7' }}>
                    Acceso Operativo
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-px flex-1 w-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(17,212,177,0.5))' }} />
                    <Wifi className="h-3 w-3" style={{ color: 'rgba(17,212,177,0.6)' }} />
                    <div className="h-px flex-1 w-10" style={{ background: 'linear-gradient(90deg, rgba(17,212,177,0.5), transparent)' }} />
                  </div>
                  <p className="text-[11.5px] font-medium mt-2" style={{ color: '#6B8499' }}>Plataforma H&amp;S Tecnologías</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#11D4B1]">POC · autenticación mock</p>
                  <p className="text-[11px] text-[#8DA4B8]">Datos ficticios. Contraseña de todas las cuentas: <span className="font-mono text-white">{DEMO_PASSWORD}</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {demoAccounts.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => { setEmail(account.email); setPassword(account.password); }}
                        className="text-left text-[11px] rounded-lg px-2 py-1.5 bg-white/5 hover:bg-white/10 text-[#d6e8f5]"
                      >
                        <span className="block font-bold truncate">{account.name}</span>
                        <span className="block opacity-70 truncate">{account.role.split('/')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: '#7EA4BC' }}>
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(17,212,177,0.6)' }} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@hs.local"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="h-12 pl-10 rounded-xl hs-input-dark border focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: '#7EA4BC' }}>
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(17,212,177,0.6)' }} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="h-12 pl-10 pr-11 rounded-xl hs-input-dark border focus-visible:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'rgba(141,164,184,0.5)' }}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 hover:text-[#11D4B1]" /> : <Eye className="h-4 w-4 hover:text-[#11D4B1]" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <Checkbox
                        checked={remember}
                        onCheckedChange={val => setRemember(!!val)}
                        className="border-white/15 data-[state=checked]:bg-[#11D4B1] data-[state=checked]:border-[#11D4B1] data-[state=checked]:text-[#041C2C]"
                      />
                      <span className="text-[12.5px] font-semibold" style={{ color: '#8DA4B8' }}>Recordarme</span>
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          toast.error('Ingresá tu correo primero para restablecer la contraseña.');
                          return;
                        }
                        try {
                          await authService.requestPasswordReset(email);
                          toast.success('POC mock: no se envía correo real. Usá las cuentas de demostración.');
                        } catch (err) {
                          toast.error('No se pudo enviar el correo. Contactá al administrador.');
                        }
                      }}
                      className="text-[12.5px] font-bold transition-colors"
                      style={{ color: 'rgba(17,212,177,0.75)' }}
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-12 rounded-xl font-black text-[14px] overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    style={{
                      background: isLoading ? 'rgba(17,212,177,0.6)' : 'linear-gradient(135deg, #11D4B1 0%, #09B99A 60%, #07A88C 100%)',
                      color: '#03111A',
                      boxShadow: isLoading ? 'none' : '0 0 28px -4px rgba(17,212,177,0.6), 0 4px 12px rgba(0,0,0,0.3)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {/* Shimmer on hover */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-[#03111A]/30 border-t-[#03111A] animate-spin" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          Iniciar Sesión
                          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-7 pt-5 flex flex-col items-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2" style={{ color: '#8DA4B8' }}>
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#11D4B1' }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide">Sistema seguro y protegido</span>
                  </div>
                  <p className="text-[10.5px]" style={{ color: 'rgba(141,164,184,0.45)' }}>Tu información está encriptada y protegida.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
