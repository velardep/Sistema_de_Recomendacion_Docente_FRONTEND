
import React, { useEffect, useState } from 'react';
import { recomendacionesService } from '../../services/recomendacionesService';
import { Recomendacion } from '../../types';

const RecomendacionesSection: React.FC = () => {
  const [items, setItems] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recomendacionesService.list().then(res => {
      setItems(res);
      setLoading(false);
    });
  }, []);

  const handleAction = (id: string) => {
    recomendacionesService.registerAction(id, "click");
    alert("Acción registrada");
  };

  return (
    <div className="p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Para Ti</h1>
        <p className="text-textSecondary">Sugerencias inteligentes basadas en tu actividad reciente</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card h-48 rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border p-6 rounded-2xl hover:border-accent/50 transition-all flex flex-col group">
              <div className="text-xs uppercase tracking-widest text-accent font-bold mb-4">{item.tipo}</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{item.titulo}</h3>
              <p className="text-textSecondary text-sm mb-6 flex-1">{item.descripcion}</p>
              <button 
                onClick={() => handleAction(item.id)}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
              >
                Explorar Ahora
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecomendacionesSection;
