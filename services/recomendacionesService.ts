import { http } from './http';
import { Recomendacion } from '../types';

type Red3MeResponse = {
  profile: any;
  snapshot_7d: any;
  snapshot_30d: any;
  reco_meta?: {
    refresh_days: number;
    server_now: string;
    snapshot_ref_created_at: string | null;
    due: boolean;
  };
  llm_recommendations?: Recomendacion[] | null;
};

type RecosPayload = {
  headerCards: Recomendacion[];
  recomendaciones: Recomendacion[];
  generated_at: string;
};

const CACHE_KEY = 'recos_red3_cache_v2';

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toPct01(v: any) {
  const n = safeNumber(v, 0);
  return Math.max(0, Math.min(1, n));
}

function loadCache(): RecosPayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(payload: RecosPayload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

function daysBetween(aIso: string, bIso: string) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 999;
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

function labelStyle(style: string) {
  switch (style) {
    case 'TECNOLOGICO_INNOVADOR': return 'TECNOLOGICO_INNOVADOR';
    case 'MAGISTRAL_ESTRUCTURADO': return 'MAGISTRAL_ESTRUCTURADO';
    case 'PRACTICO_APLICADO': return 'PRACTICO_APLICADO';
    case 'REFLEXIVO_ITERATIVO': return 'REFLEXIVO_ITERATIVO';
    case 'EVALUATIVO': return 'EVALUATIVO';
    default: return style || 'N/A';
  }
}

function buildHeaderCards(me: Red3MeResponse): Recomendacion[] {
  const p = me.profile || {};
  const f7 = me.snapshot_7d?.features || {};
  const f30 = me.snapshot_30d?.features || {};

  const styleMain = labelStyle(p.style_main);
  const conf = toPct01(p.confidence);

  const sessions7 = safeNumber(f7.sessions_7d);
  const days7 = safeNumber(f7.active_days_7d);

  const sessions30 = safeNumber(f30.sessions_30d);
  const days30 = safeNumber(f30.active_days_30d);

  const avgLen = safeNumber(f30.chat_avg_len_30d);

  const approval = toPct01(f30.approval_ratio_30d);
  const friction = toPct01(f30.friction_ratio_30d);

  const resources30 = safeNumber(f30.resources_suggested_30d);
  const dominance = toPct01(f30.resource_tech_ratio_30d);

  return [
    {
      id: 'h1',
      tipo: 'style',
      titulo: styleMain,
      descripcion: `confidence=${conf} · data_strength=${safeNumber(p.data_strength)} · events_count=${safeNumber(p.events_count)}`,
    },
    {
      id: 'h2',
      tipo: '7d_activity',
      titulo: '7d',
      descripcion: `sessions_7d=${sessions7} · active_days_7d=${days7}`,
    },
    {
      id: 'h3',
      tipo: '30d_activity',
      titulo: '30d',
      descripcion: `sessions_30d=${sessions30} · active_days_30d=${days30}`,
    },
    {
      id: 'h4',
      tipo: 'chat',
      titulo: 'chat',
      descripcion: `chat_avg_len_30d=${avgLen}`,
    },
    {
      id: 'h5',
      tipo: 'quality',
      titulo: 'approval_friction',
      descripcion: `approval_ratio_30d=${approval} · friction_ratio_30d=${friction}`,
    },
    {
      id: 'h6',
      tipo: 'resources',
      titulo: 'resources',
      descripcion: `resources_suggested_30d=${resources30} · resource_tech_ratio_30d=${dominance}`,
    },
  ];
}

function buildRecommendationsRuleBased(me: Red3MeResponse): Recomendacion[] {
  const f30 = me.snapshot_30d?.features || {};

  const resources30 = safeNumber(f30.resources_suggested_30d);
  const dominance = toPct01(f30.resource_tech_ratio_30d);
  const evalRatio = toPct01(f30.chat_intent_eval_ratio_30d);
  const practiceRatio = toPct01(f30.chat_intent_practice_ratio_30d);
  const explainRatio = toPct01(f30.chat_intent_explain_ratio_30d);
  const rubricRatio = toPct01(f30.chat_intent_rubric_ratio_30d);
  const friction = toPct01(f30.friction_ratio_30d);

  const recos: Recomendacion[] = [];

  if (resources30 < 3) {
    recos.push({
      id: 'r1',
      tipo: 'resources_low',
      titulo: 'r1',
      descripcion: `resources_suggested_30d=${resources30}`,
    });
  }

  if (resources30 >= 3 && dominance >= 0.8) {
    recos.push({
      id: 'r2',
      tipo: 'dominance_high',
      titulo: 'r2',
      descripcion: `resources_suggested_30d=${resources30} · resource_tech_ratio_30d=${dominance}`,
    });
  }

  if (friction >= 0.3) {
    recos.push({
      id: 'r3',
      tipo: 'friction_high',
      titulo: 'r3',
      descripcion: `friction_ratio_30d=${friction}`,
    });
  }

  if (practiceRatio < 0.15) {
    recos.push({
      id: 'r4',
      tipo: 'practice_low',
      titulo: 'r4',
      descripcion: `chat_intent_practice_ratio_30d=${practiceRatio}`,
    });
  }

  if (evalRatio >= 0.4) {
    recos.push({
      id: 'r5',
      tipo: 'eval_high',
      titulo: 'r5',
      descripcion: `chat_intent_eval_ratio_30d=${evalRatio}`,
    });
  }

  if (explainRatio >= 0.45) {
    recos.push({
      id: 'r6',
      tipo: 'explain_high',
      titulo: 'r6',
      descripcion: `chat_intent_explain_ratio_30d=${explainRatio}`,
    });
  }

  if (rubricRatio < 0.10 && evalRatio >= 0.30) {
    recos.push({
      id: 'r7',
      tipo: 'rubric_low',
      titulo: 'r7',
      descripcion: `chat_intent_eval_ratio_30d=${evalRatio} · chat_intent_rubric_ratio_30d=${rubricRatio}`,
    });
  }

  if (recos.length === 0) {
    recos.push({
      id: 'r0',
      tipo: 'stable',
      titulo: 'r0',
      descripcion: `approval_ratio_30d=${toPct01(f30.approval_ratio_30d)} · friction_ratio_30d=${toPct01(f30.friction_ratio_30d)}`,
    });
  }

  return recos.slice(0, 12);
}

export const recomendacionesService = {
  getRed3: async (opts?: { window_days?: number; force?: boolean }): Promise<Red3MeResponse> => {
    const body = {
      window_days: opts?.window_days ?? 30,
      force: opts?.force ?? false,
    };
    return await http.post<Red3MeResponse>('/red3/recomendaciones', body);
  },

  registerAction: async (id: string, action: string): Promise<void> => {
    console.log(`Accion registrada (local) para ${id}: ${action}`);
  },
};