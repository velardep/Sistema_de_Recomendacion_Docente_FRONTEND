import React, { useEffect, useMemo, useState } from 'react';
import { recomendacionesService } from '../../services/recomendacionesService';
import { Recomendacion, Red3RecomendacionesResponse } from '../../types';

const SkeletonCard: React.FC = () => (
  <div className="bg-card h-40 rounded-2xl animate-pulse border border-border" />
);

const Card: React.FC<{
  item: Recomendacion & { features_used?: string[] };
  snapshot7?: any;
  snapshot30?: any;
  onAction?: (id: string) => void;
  cta?: string;
}> = ({ item, snapshot7, snapshot30, onAction, cta }) => {
  const featuresUsed = item.features_used || [];

  return (
    <div className="bg-card border border-border p-4 sm:p-5 lg:p-6 rounded-2xl hover:border-accent/50 transition-all flex h-full flex-col group">
      <div className="text-[11px] sm:text-xs uppercase tracking-widest text-accent font-bold mb-4">
        {item.tipo}
      </div>

      <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-accent transition-colors break-words">
        {item.titulo}
      </h3>

      <p className="text-textSecondary text-sm leading-relaxed mb-4">
        {item.descripcion}
      </p>

      {featuresUsed.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-textSecondary mb-4 space-y-1 font-mono overflow-hidden">
          {featuresUsed.map((f) => {
            const value =
              snapshot30?.features?.[f] ??
              snapshot7?.features?.[f];

            return (
              <div key={f} className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-all">{f}</span>
                <span className="shrink-0 text-right">
                  {typeof value === 'number'
                    ? value.toFixed(3)
                    : String(value)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {onAction && (
        <button
          onClick={() => onAction(item.id)}
          className="mt-auto w-full bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg border border-white/10 text-sm font-medium transition-all"
        >
          {cta || 'Explorar'}
        </button>
      )}
    </div>
  );
};

const RecomendacionesSection: React.FC = () => {
  const [data, setData] = useState<Red3RecomendacionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cards = useMemo(() => data?.cards ?? [], [data]);
  const recs = useMemo(() => data?.recomendaciones ?? [], [data]);

  useEffect(() => {
    let mounted = true;

    recomendacionesService.getRed3({ window_days: 30, force: false })
      .then(res => {
        if (!mounted) return;
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const handleAction = (id: string) => {
    recomendacionesService.registerAction(id, "click");
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await recomendacionesService.getRed3({ window_days: 30, force: true });
      setData(res);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Para Ti</h1>
          <p className="text-sm sm:text-base text-textSecondary max-w-2xl">
            Sugerencias inteligentes basadas en tu actividad reciente (se recalcula cada pocos días, puede tardar algunos segundos en actualizarse al hacer clic)
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all disabled:opacity-50"
        >
          {refreshing ? 'Actualizando…' : 'Actualizar ahora'}
        </button>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Tu resumen</h2>
          {data?.meta?.cached != null && (
            <div className="text-xs text-textSecondary">
              {data.meta.cached ? 'Cache' : 'Nuevo'} · {data.meta.period_end || ''}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(item => (
              <Card
                key={item.id}
                item={item}
                snapshot7={data?.snapshot_7d}
                snapshot30={data?.snapshot_30d}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Acciones sugeridas</h2>
          <p className="text-xs text-textSecondary">
            Haz clic para explorarlas (y luego conectamos tracking real si lo quieres)
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-card h-48 rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recs.map(item => (
              <Card
                key={item.id}
                item={item}
                onAction={handleAction}
                cta="Explorar"
                snapshot7={data?.snapshot_7d}
                snapshot30={data?.snapshot_30d}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecomendacionesSection;