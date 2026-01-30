
/*import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register(email, password);
      alert("Registro exitoso. Ahora inicia sesión.");
      navigate('/login');
    } catch (err) {
      alert("Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2">Crea tu cuenta</h1>
        <p className="text-textSecondary text-center mb-8">Únete a la nueva era de colaboración</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input 
              type="password" 
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-textSecondary">
          ¿Ya tienes cuenta? <Link to="/login" className="text-accent hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;*/


// pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { meService } from '../services/meService';
import { useAuthStore } from '../store/authStore';

const RegisterPage: React.FC = () => {
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
      const res = await authService.register(email.trim(), password);
      setSession(res.access_token, res.user);

      const me = await meService.getMe();
      setMe({ perfil: me.perfil });

      if (me.perfil == null) nav('/onboarding', { replace: true });
      else nav('/dashboard', { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? 'Registro falló');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-white/60 mt-1">Registro con tu backend</p>

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
            autoComplete="new-password"
          />

          {err && <div className="text-sm text-red-400">{err}</div>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white text-black font-medium py-3 disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-4 text-sm text-white/60">
          ¿Ya tienes cuenta? <Link className="text-white underline" to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
