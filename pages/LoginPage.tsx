/*import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      // login() del store ahora también dispara fetchMe()
      await login(res.access_token, res.user);
      // RequireAuth se encargará de redirigir a onboarding si es necesario
      navigate('/dashboard');
    } catch (err) {
      alert("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="bg-card border border-border w-full max-w-md p-10 rounded-3xl shadow-2xl">
        <h1 className="text-4xl font-black text-center mb-2 tracking-tight">Nexus</h1>
        <p className="text-textSecondary text-center mb-10 text-sm">Tu asistente docente de nueva generación</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-textSecondary uppercase ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full bg-background border border-border rounded-xl px-4 py-4 focus:outline-none focus:border-accent transition-all"
              placeholder="nombre@colegio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-textSecondary uppercase ml-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full bg-background border border-border rounded-xl px-4 py-4 focus:outline-none focus:border-accent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-textSecondary">
          ¿Nuevo aquí? <Link to="/register" className="text-accent font-bold hover:underline">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;*/

// pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { meService } from '../services/meService';
import { useAuthStore } from '../store/authStore';

const LoginPage: React.FC = () => {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setMe = useAuthStore((s) => s.setMe);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      setSession(res.access_token, res.user);

      const me = await meService.getMe();
      setMe({ perfil: me.perfil });

      if (me.perfil == null) nav('/onboarding', { replace: true });
      else nav('/dashboard', { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? 'Login falló');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-white/60 mt-1">Accede con tu cuenta</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {err && <div className="text-sm text-red-400">{err}</div>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white text-black font-medium py-3 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-sm text-white/60">
          ¿No tienes cuenta? <Link className="text-white underline" to="/register">Regístrate</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
