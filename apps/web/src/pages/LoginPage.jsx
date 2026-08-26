import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Mail, Users, ShieldCheck, TrendingUp, ArrowRight, Eye, EyeOff, Wifi, Cpu } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import authService from '@/services/auth/index.js';
import { DEMO_PASSWORD, ROLES } from '@/mocks/users.js';
import { isMockMode } from '@/api/http.js';

/** Chips en producción: solo rellenan el correo (cada usuario tiene su propia clave). */
const API_ACCOUNT_CHIPS = [
  { email: 'julio@hscontrol.com', name: 'Julio', role: 'Admin' },
  { email: 'mavel@hscontrol.com', name: 'Mavel', role: 'Admin' },
  { email: 'vanessa@hscontrol.com', name: 'Vanessa', role: 'Ventas' },
  { email: 'wilson@hscontrol.com', name: 'Wilson', role: 'Ventas' },
  { email: 'stephany@hscontrol.com', name: 'Stephany', role: 'Finanzas' },
  { email: 'marcelo@hscontrol.com', name: 'Marcelo', role: 'Sin acceso' },
  { email: 'ronald@hscontrol.com', name: 'Ronald', role: 'Sin acceso' },
  { email: 'rodrigo@hscontrol.com', name: 'Rodrigo', role: 'Sin acceso' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const accountChips = isMockMode
    ? authService.listDemoAccounts().map((a) => ({
        email: a.email,
        name: a.name,
        role: a.role,
        password: a.password || DEMO_PASSWORD,
      }))
    : API_ACCOUNT_CHIPS;

  const fillAccount = (account) => {
    setEmail(account.email);
    if (isMockMode && account.password) setPassword(account.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password, { remember });
    if (result.success) {
      toast.success('Acceso autorizado');
      const role = result.user?.role;
      navigate(role === ROLES.NONE ? '/sin-acceso' : '/dashboard');
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Acceso - H&S Tecnologías</title>
        <meta name="description" content="Acceso operativo a la plataforma de gestión H&S Tecnologías." />
      </Helmet>

      <style>{`
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

        {/* Hero decorativo: solo desktop (form first en móvil) */}
        <div className="relative hidden lg:flex lg:w-[62%] min-h-[100dvh] overflow-hidden">
          <img
            src="/branding/login-bg.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            width="1200"
            height="800"
            decoding="async"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(3,14,23,0.92) 0%, rgba(7,38,58,0.75) 50%, rgba(3,14,23,0.88) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(2,8,14,0.97) 0%, rgba(2,8,14,0.5) 35%, transparent 65%)' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(17,212,177,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(17,212,177,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

          <div className="relative z-10 flex flex-col justify-between min-h-[100dvh] p-10 xl:p-14">
            <div className="flex items-center gap-4">
              <img
                src="/branding/hyslogo.jpg"
                alt="H&S Tecnologías"
                width="72"
                height="72"
                className="relative h-[72px] w-[72px] rounded-2xl object-contain p-2"
                style={{
                  background: 'rgba(7,38,58,0.7)',
                  border: '1px solid rgba(17,212,177,0.3)',
                  boxShadow: '0 0 28px -4px rgba(17,212,177,0.4)',
                }}
              />
              <div>
                <p className="font-black leading-none tracking-tight text-[2rem]" style={{ color: '#E8F0F7' }}>
                  H&amp;S <span style={{ color: '#11D4B1' }}>Tecnologías</span>
                </p>
                <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase mt-1.5" style={{ color: '#11D4B1' }}>
                  Tecnología con Garantía
                </p>
              </div>
            </div>

            <div className="max-w-2xl py-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10.5px] font-bold uppercase tracking-[0.15em]"
                style={{ background: 'rgba(17,212,177,0.08)', border: '1px solid rgba(17,212,177,0.2)', color: '#11D4B1' }}
              >
                <Cpu className="h-3 w-3" />
                Plataforma Operativa Integrada
              </div>
              <h1 className="font-black leading-[1.08] tracking-tight mb-5 text-[3rem]" style={{ color: '#E8F0F7' }}>
                Somos <span style={{ color: '#11D4B1' }}>familia</span>,
                <br />somos <span style={{ color: '#11D4B1' }}>H&amp;S</span>.
              </h1>
              <p className="text-sm leading-relaxed mb-8 pl-4" style={{ color: '#9BBAD0', borderLeft: '2px solid rgba(17,212,177,0.5)' }}>
                Por muy alta que sea una montaña,{' '}
                <span style={{ color: '#C8D9E6' }}>siempre hay un camino hacia la cima.</span>
              </p>
              <div className="flex items-center gap-7">
                {[
                  { icon: Users, label: 'Trabajo en equipo' },
                  { icon: ShieldCheck, label: 'Seguridad operativa' },
                  { icon: TrendingUp, label: 'Resultados reales' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(17,212,177,0.1)', border: '1px solid rgba(17,212,177,0.22)' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: '#11D4B1' }} strokeWidth={2.2} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#C8D9E6' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(3,14,23,0.72)', border: '1px solid rgba(17,212,177,0.12)' }}
            >
              <h3 className="text-sm font-bold" style={{ color: '#E8F0F7' }}>Operación comercial</h3>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: '#9BBAD0' }}>
                Cotizaciones, clientes, relevamientos y tareas.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario: primero en el DOM → above-the-fold en móvil */}
        <div
          className="relative w-full lg:w-[38%] min-h-[100dvh] flex items-center justify-center px-4 py-6 sm:px-8 lg:px-10"
          style={{ background: 'linear-gradient(160deg, #030E17 0%, #041C2C 60%, #030E17 100%)' }}
        >
          <div className="relative w-full max-w-[28rem]">
            {/* Brand compacto solo móvil */}
            <div className="flex lg:hidden items-center gap-3 mb-5 px-1">
              <img
                src="/branding/hyslogo.jpg"
                alt=""
                width="40"
                height="40"
                className="h-10 w-10 rounded-xl object-contain p-1"
                style={{ background: 'rgba(7,38,58,0.7)', border: '1px solid rgba(17,212,177,0.3)' }}
              />
              <p className="font-black text-lg tracking-tight" style={{ color: '#E8F0F7' }}>
                H&amp;S <span style={{ color: '#11D4B1' }}>Tecnologías</span>
              </p>
            </div>

            <div
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, rgba(7,38,58,0.85) 0%, rgba(4,28,44,0.92) 100%)',
                border: '1px solid rgba(17,212,177,0.15)',
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7)',
              }}
            >
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(17,212,177,0.7) 40%, transparent)' }} />

              <div className="p-5 sm:p-8 lg:p-10">
                <div className="flex flex-col items-center text-center mb-6 sm:mb-9">
                  <div className="relative mb-4 sm:mb-5">
                    <div className="absolute -inset-3 rounded-full hs-ring-pulse hidden sm:block" style={{ border: '1px solid rgba(17,212,177,0.2)' }} />
                    <div
                      className="relative h-14 w-14 sm:h-[72px] sm:w-[72px] rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(17,212,177,0.15) 0%, rgba(4,28,44,0.9) 100%)',
                        border: '1.5px solid rgba(17,212,177,0.45)',
                      }}
                    >
                      <Lock className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: '#11D4B1' }} strokeWidth={1.8} />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-[1.6rem] font-black tracking-tight" style={{ color: '#E8F0F7' }}>
                    Acceso Operativo
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-px flex-1 w-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(17,212,177,0.5))' }} />
                    <Wifi className="h-3 w-3" style={{ color: 'rgba(17,212,177,0.6)' }} />
                    <div className="h-px flex-1 w-10" style={{ background: 'linear-gradient(90deg, rgba(17,212,177,0.5), transparent)' }} />
                  </div>
                  <p className="text-[11px] font-medium mt-2" style={{ color: '#6B8499' }}>Plataforma H&amp;S Tecnologías</p>
                </div>

                {isMockMode && (
                  <p className="text-[11px] text-[#8DA4B8] mb-3">
                    POC mock. Contraseña: <span className="font-mono text-white">{DEMO_PASSWORD}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-5">
                  {accountChips.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillAccount(account)}
                      className="text-left text-[11px] rounded-lg px-2 py-1.5 bg-white/5 hover:bg-white/10 text-[#d6e8f5] min-h-11"
                    >
                      <span className="block font-bold truncate">{account.name}</span>
                      <span className="block opacity-70 truncate">{String(account.role || '').split('/')[0]}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: '#7EA4BC' }}>
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(17,212,177,0.6)' }} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="correo@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        className="h-11 sm:h-12 pl-10 rounded-xl hs-input-dark border focus-visible:ring-0"
                      />
                    </div>
                  </div>

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
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="h-11 sm:h-12 pl-10 pr-11 rounded-xl hs-input-dark border focus-visible:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(141,164,184,0.5)' }}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none min-h-11">
                      <Checkbox
                        checked={remember}
                        onCheckedChange={(val) => setRemember(!!val)}
                        className="border-white/15 data-[state=checked]:bg-[#11D4B1] data-[state=checked]:border-[#11D4B1] data-[state=checked]:text-[#041C2C]"
                      />
                      <span className="text-[12px] font-semibold" style={{ color: '#8DA4B8' }}>Recordarme</span>
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
                          toast.success(isMockMode
                            ? 'POC mock: no se envía correo real.'
                            : 'Si el correo existe, el administrador gestionará el restablecimiento.');
                        } catch {
                          toast.error('No se pudo enviar la solicitud. Contactá al administrador.');
                        }
                      }}
                      className="text-[12px] font-bold min-h-11"
                      style={{ color: 'rgba(17,212,177,0.75)' }}
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-11 sm:h-12 rounded-xl font-black text-[14px] overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                    style={{
                      background: isLoading ? 'rgba(17,212,177,0.6)' : 'linear-gradient(135deg, #11D4B1 0%, #09B99A 60%, #07A88C 100%)',
                      color: '#03111A',
                      boxShadow: isLoading ? 'none' : '0 0 28px -4px rgba(17,212,177,0.6)',
                    }}
                  >
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

                <div className="mt-5 sm:mt-7 pt-4 sm:pt-5 flex flex-col items-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2" style={{ color: '#8DA4B8' }}>
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#11D4B1' }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide">Sistema seguro y protegido</span>
                  </div>
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
