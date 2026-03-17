import React, { useMemo, useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { pdcService } from '../../services/pdcService';
import { pdcLibraryService } from '../../services/pdcLibraryService';

type PdcLibItem = {
  id: string;
  docente_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes?: number | null;
  created_at: string;
};

const fmtBytes = (n?: number | null) => {
  if (!n || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const PdcSection: React.FC = () => {
  const { perfil, user } = useAuthStore();

  const docenteNombre = useMemo(() => {
    if (perfil?.nombres && perfil?.apellidos) return `${perfil.nombres} ${perfil.apellidos}`;
    return user?.email || '';
  }, [perfil?.nombres, perfil?.apellidos, user?.email]);

  const [form, setForm] = useState({
    identificacion: {
      unidad_educativa: perfil?.unidad_educativa || '',
      nivel: '',                 // texto libre: "Secundaria Comunitaria Productiva"
      anio_escolaridad: '',      // texto libre: "3er Año"
      area: '',                  // "Biología - Geografía"
      trimestre: '2do',          // default razonable
      tiempo: '4 semanas',       // default razonable
      docente: docenteNombre,
    },
    contexto: {
      psp_titulo: '',
      psp_actividad: '',
      objetivo_holistico_pat: '', // input del docente
    },
    variables: {
      contenidos: '', // texto multilinea
    },
  });

  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ MENU
  const [view, setView] = useState<'generar' | 'mis_pdc'>('generar');

  // ✅ Biblioteca
  const [libLoading, setLibLoading] = useState(false);
  const [libItems, setLibItems] = useState<PdcLibItem[]>([]);
  const [libQ, setLibQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const update = (path: string, value: string) => {
    setForm(prev => {
      const clone: any = structuredClone(prev);
      const keys = path.split('.');
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const buildPayload = () => {
    const contenidos = form.variables.contenidos
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    return {
      ...form,
      variables: { contenidos },
    };
  };

  const generar = async () => {
    setLoading(true);
    try {
      const payload = buildPayload();

      setPreview({
        identificacion: payload.identificacion,
        contexto: payload.contexto,
        contenidos: payload.variables.contenidos,
      });

      const blob = await pdcService.generate(payload);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PDC.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  // ---- Biblioteca
  const refreshLibrary = async () => {
    setLibLoading(true);
    try {
      const data = await pdcLibraryService.list();
      setLibItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'No se pudo cargar Mis PDC');
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'mis_pdc') refreshLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const filteredItems = useMemo(() => {
    const s = libQ.trim().toLowerCase();
    if (!s) return libItems;
    return libItems.filter(it => (it.original_name || '').toLowerCase().includes(s));
  }, [libItems, libQ]);

  const onPickUpload = async (file?: File | null) => {
    if (!file) return;

    /*const name = file.name.toLowerCase();
    if (!name.endsWith('.docx')) {
      alert('Solo se permite .docx');
      return;
    }*/
    const name = file.name.toLowerCase();
    const isDocx = name.endsWith('.docx');
    const isPdf = name.endsWith('.pdf');

    if (!(isDocx || isPdf)) {
    alert('Solo se permite .docx o .pdf');
    return;
    }

    setUploading(true);
    setUploadPct(0);
    try {
      await pdcLibraryService.upload(file, (pct: number) => setUploadPct(pct));
      await refreshLibrary();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Error subiendo el archivo');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const onDelete = async (it: PdcLibItem) => {
    if (!confirm(`¿Eliminar "${it.original_name}"?`)) return;
    try {
      await pdcLibraryService.remove(it.id);
      setLibItems(prev => prev.filter(x => x.id !== it.id));
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'No se pudo eliminar');
    }
  };

  const onDownload = async (it: PdcLibItem) => {
    try {
      const blob = await pdcLibraryService.download(it.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = it.original_name || 'PDC.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'No se pudo descargar');
    }
  };

  return (
    <div className="min-h-screen bg-background p-10">

      {/* MENU */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">PDC</h1>
          <p className="text-sm text-textSecondary">
            Genera un PDC o administra tu biblioteca de documentos finales.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setView('generar')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              view === 'generar'
                ? 'bg-accent text-white'
                : 'bg-card text-textPrimary hover:opacity-90'
            }`}
          >
            Generar
          </button>
          <button
            onClick={() => setView('mis_pdc')}
            className={`px-4 py-2 text-sm font-semibold transition ${
              view === 'mis_pdc'
                ? 'bg-accent text-white'
                : 'bg-card text-textPrimary hover:opacity-90'
            }`}
          >
            Mis PDC
          </button>
        </div>
      </div>

      {view === 'generar' ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* FORM */}
          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-textPrimary">
                Generar Plan de Desarrollo Curricular (PDC)
              </h2>
              <p className="text-sm text-textSecondary">
                Completa los datos mínimos y el sistema generará el documento en Word.
              </p>
            </div>

            {/* Datos referenciales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Unidad Educativa">
                <input
                  value={form.identificacion.unidad_educativa}
                  onChange={e => update('identificacion.unidad_educativa', e.target.value)}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: U.E. Juan XXIII"
                />
              </Field>

              <Field label="Docente">
                <input
                  value={form.identificacion.docente}
                  onChange={e => update('identificacion.docente', e.target.value)}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: María Pérez"
                />
              </Field>

              <Field label="Nivel (texto libre)">
                <input
                  value={form.identificacion.nivel}
                  onChange={e => update('identificacion.nivel', e.target.value)}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: Secundaria Comunitaria Productiva"
                />
              </Field>

              <Field label="Año de escolaridad (texto libre)">
                <input
                  value={form.identificacion.anio_escolaridad}
                  onChange={e => update('identificacion.anio_escolaridad', e.target.value)}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: 3er Año"
                />
              </Field>

              <Field label="Trimestre">
                <select
                  value={form.identificacion.trimestre}
                  onChange={e => update('identificacion.trimestre', e.target.value)}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="1ro">1ro</option>
                  <option value="2do">2do</option>
                  <option value="3ro">3ro</option>
                </select>
              </Field>

              <Field label="Tiempo / Duración">
                <input
                  value={form.identificacion.tiempo}
                  onChange={e => update('identificacion.tiempo', e.target.value)}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: 4 semanas"
                />
              </Field>
            </div>

            <Field label="Área / Materia">
              <input
                value={form.identificacion.area}
                onChange={e => update('identificacion.area', e.target.value)}
                className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Ej: Biología - Geografía"
              />
            </Field>

            {/* PSP */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-textPrimary">PSP (Llave de la planificación)</h3>

              <Field label="Título del PSP">
                <textarea
                  value={form.contexto.psp_titulo}
                  onChange={e => update('contexto.psp_titulo', e.target.value)}
                  rows={3}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder='Ej: "Fortalecimiento de la salud comunitaria y prevención del consumo de drogas"'
                />
              </Field>

              <Field label="Actividad del PSP">
                <textarea
                  value={form.contexto.psp_actividad}
                  onChange={e => update('contexto.psp_actividad', e.target.value)}
                  rows={3}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: Taller de sensibilización sobre efectos químicos de sustancias en el cuerpo."
                />
              </Field>

              <Field label="Objetivo Holístico PAT (input del docente)">
                <textarea
                  value={form.contexto.objetivo_holistico_pat}
                  onChange={e => update('contexto.objetivo_holistico_pat', e.target.value)}
                  rows={3}
                  className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: Desarrollamos principios de responsabilidad (Ser) mediante el estudio de la vida (Saber) para promover la salud integral (Decidir)."
                />
              </Field>
            </div>

            {/* Contenidos */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-textSecondary">
                Temas / Contenidos (uno por línea)
              </label>
              <textarea
                value={form.variables.contenidos}
                onChange={e => update('variables.contenidos', e.target.value)}
                rows={5}
                className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder={"1. La célula y sus funciones.\n2. Tipos de tejidos orgánicos."}
              />
            </div>

            <button
              onClick={generar}
              disabled={loading}
              className="w-full bg-accent hover:opacity-90 transition text-white font-semibold py-3 rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? 'Generando documento...' : 'Generar y Exportar Word'}
            </button>
          </div>

          {/* PREVIEW */}
          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
            <h3 className="text-2xl font-semibold text-textPrimary mb-6">
              Vista previa (Inputs)
            </h3>

            {preview ? (
              <div className="space-y-6 text-textPrimary">
                <Section title="I. Datos Referenciales">
                  <KV k="Unidad Educativa" v={preview.identificacion?.unidad_educativa} />
                  <KV k="Nivel" v={preview.identificacion?.nivel} />
                  <KV k="Año de escolaridad" v={preview.identificacion?.anio_escolaridad} />
                  <KV k="Trimestre" v={preview.identificacion?.trimestre} />
                  <KV k="Área" v={preview.identificacion?.area} />
                  <KV k="Tiempo" v={preview.identificacion?.tiempo} />
                </Section>

                <Section title="II. Planificación">
                  <KV k="Título del PSP" v={preview.contexto?.psp_titulo} />
                  <KV k="Actividad del PSP" v={preview.contexto?.psp_actividad} />
                  <KV k="Objetivo Holístico PAT" v={preview.contexto?.objetivo_holistico_pat} />
                  <div className="mt-3">
                    <p className="text-sm text-textSecondary mb-2">Contenidos</p>
                    <ul className="list-disc pl-6 space-y-1">
                      {(preview.contenidos || []).map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </Section>

                <p className="text-xs text-textSecondary">
                  Luego el preview será del documento generado (Objetivo, Práctica, Teoría, Valoración, Producción, Recursos, Criterios).
                </p>
              </div>
            ) : (
              <p className="text-textSecondary">
                Completa el formulario y genera el documento para ver la vista previa.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-3xl font-bold text-textPrimary">Mis PDC</h2>
                <p className="text-sm text-textSecondary">
                  Sube aquí únicamente los DOCX que ya revisaste y consideras finales.
                </p>
              </div>

              <button
                onClick={refreshLibrary}
                disabled={libLoading}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:opacity-90 text-textPrimary"
              >
                {libLoading ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>

            <div className="border border-border rounded-xl p-4 bg-background/40 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-textSecondary">Formato permitido: 
                    <span className="font-semibold text-textPrimary">.docx, .pdf</span>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold cursor-pointer hover:opacity-90">
                  <input
                    type="file"
                    accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => onPickUpload(e.target.files?.[0])}
                    disabled={uploading}
                  />
                    {uploading ? 'Subiendo...' : 'Subir archivo'}
                </label>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded bg-border overflow-hidden">
                    <div className="h-2 bg-accent" style={{ width: `${uploadPct}%` }} />
                  </div>
                  <p className="text-xs text-textSecondary">Progreso: {uploadPct}%</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                value={libQ}
                onChange={(e) => setLibQ(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-0 bg-background/60 px-4 py-3 text-xs font-semibold text-textSecondary">
                <div className="col-span-6">Documento</div>
                <div className="col-span-3">Fecha</div>
                <div className="col-span-1">Tamaño</div>
                <div className="col-span-2 text-right">Acciones</div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-textSecondary">
                  {libLoading ? 'Cargando...' : 'No hay documentos en tu biblioteca.'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredItems.map((it) => (
                    <div key={it.id} className="grid grid-cols-12 px-4 py-3 items-center">
                      <div className="col-span-6">
                        <p className="font-semibold text-textPrimary truncate">{it.original_name}</p>
                        <p className="text-xs text-textSecondary truncate">{it.storage_path}</p>
                      </div>

                      <div className="col-span-3 text-sm text-textPrimary">
                        {fmtDate(it.created_at)}
                      </div>

                      <div className="col-span-1 text-sm text-textPrimary">
                        {fmtBytes(it.size_bytes)}
                      </div>

                      <div className="col-span-2 flex justify-end gap-2">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-border bg-background hover:opacity-90 text-textPrimary text-sm"
                          onClick={() => onDownload(it)}
                        >
                          Descargar
                        </button>

                        <button
                          className="px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:opacity-90 text-red-700 text-sm"
                          onClick={() => onDelete(it)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-textSecondary">{label}</label>
    {children}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border border-border rounded-xl p-4 bg-background/40">
    <p className="text-sm font-bold text-accent mb-3">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

const KV: React.FC<{ k: string; v?: string }> = ({ k, v }) => (
  <div>
    <p className="text-xs text-textSecondary">{k}</p>
    <p className="font-medium whitespace-pre-wrap">{v || ''}</p>
  </div>
);

export default PdcSection;