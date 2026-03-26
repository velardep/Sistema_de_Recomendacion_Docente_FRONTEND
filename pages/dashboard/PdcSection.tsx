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

const inputClass =
  'w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent';
const textareaClass =
  'w-full bg-white text-black rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent';
  type PlanningMode = 'with_psp' | 'without_psp';

const PdcSection: React.FC = () => {
  const { perfil, user } = useAuthStore();

  const docenteNombre = useMemo(() => {
    if (perfil?.nombres && perfil?.apellidos) return `${perfil.nombres} ${perfil.apellidos}`;
    return user?.email || '';
  }, [perfil?.nombres, perfil?.apellidos, user?.email]);

  const [form, setForm] = useState({
    identificacion: {
      distrito_educativo: '',
      unidad_educativa: perfil?.unidad_educativa || '',
      nivel: '',
      anio_escolaridad: '',
      area: '',
      trimestre: '2do',
      fecha_inicio: '',
      fecha_fin: '',
      tiempo: '',
      semanas: '4',
      periodos_por_semana: '3',
      duracion_periodo: '45',
      docente: docenteNombre,
    },
    contexto: {
      use_psp: true,
      psp_titulo: '',
      psp_actividad: '',
      objetivo_holistico_pat: '',
      objetivo_aprendizaje: '',
      producto: '',
      metodologia: '',
      tipo_evaluacion: '',
    },
    variables: {
      contenidos: '',
    },
  });

  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // MENU
  const [view, setView] = useState<'generar' | 'mis_pdc'>('generar');

  // Biblioteca
  const [libLoading, setLibLoading] = useState(false);
  const [libItems, setLibItems] = useState<PdcLibItem[]>([]);
  const [libQ, setLibQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const update = (path: string, value: any) => {
    setForm(prev => {
      const clone: any = structuredClone(prev);
      const keys = path.split('.');
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const setPlanningMode = (mode: PlanningMode) => {
    setForm(prev => {
      const clone: any = structuredClone(prev);
      clone.contexto.use_psp = mode === 'with_psp';
      return clone;
    });
  };



  const validateForm = () => {
    const distritoEducativo = form.identificacion.distrito_educativo.trim();
    const area = form.identificacion.area.trim();
    const nivel = form.identificacion.nivel.trim();
    const anio = form.identificacion.anio_escolaridad.trim();
    const fechaInicio = form.identificacion.fecha_inicio.trim();
    const fechaFin = form.identificacion.fecha_fin.trim();
    const semanas = form.identificacion.semanas.trim();
    const periodosPorSemana = form.identificacion.periodos_por_semana.trim();
    const duracionPeriodo = form.identificacion.duracion_periodo.trim();

    const contenidos = form.variables.contenidos
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (!area) {
      alert('Debes ingresar el área');
      return false;
    }
    if (!nivel) {
      alert('Debes ingresar el nivel');
      return false;
    }
    if (!anio) {
      alert('Debes ingresar el año de escolaridad');
      return false;
    }
    if (!distritoEducativo) {
      alert('Debes ingresar el distrito educativo');
      return false;
    }
    if (!fechaInicio) {
      alert('Debes ingresar la fecha de inicio');
      return false;
    }
    if (!fechaFin) {
      alert('Debes ingresar la fecha final');
      return false;
    }
    if (!semanas) {
      alert('Debes ingresar la cantidad de semanas');
      return false;
    }
    if (!periodosPorSemana) {
      alert('Debes ingresar la cantidad de periodos por semana');
      return false;
    }
    if (!duracionPeriodo) {
      alert('Debes ingresar la duración de cada periodo');
      return false;
    }
    if (!contenidos.length) {
      alert('Debes ingresar al menos un contenido');
      return false;
    }

    if (form.contexto.use_psp) {
      if (!form.contexto.psp_titulo.trim()) {
        alert('Debes ingresar el título del PSP');
        return false;
      }
      if (!form.contexto.psp_actividad.trim()) {
        alert('Debes ingresar la actividad del PSP');
        return false;
      }
      if (!form.contexto.objetivo_holistico_pat.trim()) {
        alert('Debes ingresar el Objetivo Holístico PAT');
        return false;
      }
    } else {
      if (!form.contexto.objetivo_aprendizaje.trim()) {
        alert('Debes ingresar el objetivo de aprendizaje');
        return false;
      }
      if (!form.contexto.producto.trim()) {
        alert('Debes ingresar el producto o evidencia esperada');
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => {
    const contenidos = form.variables.contenidos
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const distritoEducativo = form.identificacion.distrito_educativo.trim();
    const fechaInicio = form.identificacion.fecha_inicio.trim();
    const fechaFin = form.identificacion.fecha_fin.trim();
    const semanas = form.identificacion.semanas.trim();
    const periodosPorSemana = form.identificacion.periodos_por_semana.trim();
    const duracionPeriodo = form.identificacion.duracion_periodo.trim();

    const tiempoLabel =
      semanas && periodosPorSemana
        ? `${Number(semanas) * Number(periodosPorSemana)} periodos`
        : '';

    const payload: any = {
      ...form,
      identificacion: {
        ...form.identificacion,
        distrito_educativo: distritoEducativo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tiempo: tiempoLabel,
        semanas,
        periodos_por_semana: periodosPorSemana,
        duracion_periodo: duracionPeriodo,
      },
      contexto: {
        ...form.contexto,
        use_psp: !!form.contexto.use_psp,
      },
      variables: { contenidos },
    };

    if (payload.contexto.use_psp) {
      payload.contexto.objetivo_aprendizaje = '';
      payload.contexto.producto = '';
      payload.contexto.metodologia = '';
      payload.contexto.tipo_evaluacion = '';
    } else {
      payload.contexto.psp_titulo = '';
      payload.contexto.psp_actividad = '';
      payload.contexto.objetivo_holistico_pat = '';
    }

    return payload;
  };

  const generar = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();

      setPreview({
        identificacion: payload.identificacion,
        contexto: payload.contexto,
        contenidos: payload.variables.contenidos,
        mode: payload.contexto.use_psp ? 'with_psp' : 'without_psp',
      });

      const blob = await pdcService.generate(payload);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PDC.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'No se pudo generar el PDC');
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
  }, [view]);

  const filteredItems = useMemo(() => {
    const s = libQ.trim().toLowerCase();
    if (!s) return libItems;
    return libItems.filter(it => (it.original_name || '').toLowerCase().includes(s));
  }, [libItems, libQ]);

  const onPickUpload = async (file?: File | null) => {
    if (!file) return;

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
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 xl:p-10">
      {/* MENU */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary tracking-tight">
            PDC
          </h1>
          <p className="text-sm sm:text-[15px] text-textSecondary mt-1 max-w-2xl leading-relaxed">
            Genera un Plan de Desarrollo Curricular o administra tu biblioteca de documentos finales.
          </p>
        </div>

        <div className="inline-flex w-full sm:w-auto rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setView('generar')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold transition ${
              view === 'generar'
                ? 'bg-accent text-white'
                : 'bg-card text-textPrimary hover:opacity-90'
            }`}
          >
            Generar
          </button>
          <button
            onClick={() => setView('mis_pdc')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold transition ${
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
          {/* FORM */}
          <div className="bg-card p-5 sm:p-6 lg:p-8 rounded-2xl border border-border shadow-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary">
                Generar Plan de Desarrollo Curricular (PDC)
              </h2>
              <p className="text-sm text-textSecondary">
                Completa los datos mínimos y el sistema generará el documento en Word.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-textSecondary">
                Modalidad de planificación
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlanningMode('with_psp')}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                    form.contexto.use_psp
                      ? 'bg-accent text-white border-accent'
                      : 'bg-background text-textPrimary border-border hover:opacity-90'
                  }`}
                >
                  Con PSP
                </button>

                <button
                  type="button"
                  onClick={() => setPlanningMode('without_psp')}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                    !form.contexto.use_psp
                      ? 'bg-accent text-white border-accent'
                      : 'bg-background text-textPrimary border-border hover:opacity-90'
                  }`}
                >
                  Sin PSP
                </button>
              </div>
            </div>

            {/* Datos referenciales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Field label="Distrito educativo">
                <input
                  value={form.identificacion.distrito_educativo}
                  onChange={e => update('identificacion.distrito_educativo', e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Cercado"
                />
              </Field>
              <Field label="Unidad Educativa">
                <input
                  value={form.identificacion.unidad_educativa}
                  onChange={e => update('identificacion.unidad_educativa', e.target.value)}
                  className={inputClass}
                  placeholder="Ej: U.E. Juan XXIII"
                />
              </Field>

              <Field label="Docente">
                <input
                  value={form.identificacion.docente}
                  onChange={e => update('identificacion.docente', e.target.value)}
                  className={inputClass}
                  placeholder="Ej: María Pérez"
                />
              </Field>

              <Field label="Nivel (texto libre)">
                <input
                  value={form.identificacion.nivel}
                  onChange={e => update('identificacion.nivel', e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Secundaria Comunitaria Productiva"
                />
              </Field>

              <Field label="Año de escolaridad (texto libre)">
                <input
                  value={form.identificacion.anio_escolaridad}
                  onChange={e => update('identificacion.anio_escolaridad', e.target.value)}
                  className={inputClass}
                  placeholder="Ej: 3er Año"
                />
              </Field>

              <Field label="Trimestre">
                <select
                  value={form.identificacion.trimestre}
                  onChange={e => update('identificacion.trimestre', e.target.value)}
                  className={inputClass}
                >
                  <option value="1ro">1ro</option>
                  <option value="2do">2do</option>
                  <option value="3ro">3ro</option>
                </select>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:col-span-2">
                <Field label="Fecha de inicio">
                  <input
                    value={form.identificacion.fecha_inicio}
                    onChange={e => update('identificacion.fecha_inicio', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: 2 de marzo"
                  />
                </Field>

                <Field label="Fecha final">
                  <input
                    value={form.identificacion.fecha_fin}
                    onChange={e => update('identificacion.fecha_fin', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: 30 de marzo"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:col-span-2">
                <Field label="Semanas">
                  <input
                    value={form.identificacion.semanas}
                    onChange={e => update('identificacion.semanas', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: 4"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Periodos por semana">
                  <input
                    value={form.identificacion.periodos_por_semana}
                    onChange={e => update('identificacion.periodos_por_semana', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: 3"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Duración del periodo (min)">
                  <input
                    value={form.identificacion.duracion_periodo}
                    onChange={e => update('identificacion.duracion_periodo', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: 45"
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </div>

            <Field label="Área / Materia">
              <input
                value={form.identificacion.area}
                onChange={e => update('identificacion.area', e.target.value)}
                className={inputClass}
                placeholder="Ej: Biología - Geografía"
              />
            </Field>

            {/* PSP 
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-textPrimary">PSP (Llave de la planificación)</h3>

              <Field label="Título del PSP">
                <textarea
                  value={form.contexto.psp_titulo}
                  onChange={e => update('contexto.psp_titulo', e.target.value)}
                  rows={3}
                  className={textareaClass}
                  placeholder='Ej: "Fortalecimiento de la salud comunitaria y prevención del consumo de drogas"'
                />
              </Field>

              <Field label="Actividad del PSP">
                <textarea
                  value={form.contexto.psp_actividad}
                  onChange={e => update('contexto.psp_actividad', e.target.value)}
                  rows={3}
                  className={textareaClass}
                  placeholder="Ej: Taller de sensibilización sobre efectos químicos de sustancias en el cuerpo."
                />
              </Field>

              <Field label="Objetivo Holístico PAT (input del docente)">
                <textarea
                  value={form.contexto.objetivo_holistico_pat}
                  onChange={e => update('contexto.objetivo_holistico_pat', e.target.value)}
                  rows={3}
                  className={textareaClass}
                  placeholder="Ej: Desarrollamos principios de responsabilidad (Ser) mediante el estudio de la vida (Saber) para promover la salud integral (Decidir)."
                />
              </Field>
            </div>*/}
            {form.contexto.use_psp ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-textPrimary">PSP (Llave de la planificación)</h3>

                <Field label="Título del PSP">
                  <textarea
                    value={form.contexto.psp_titulo}
                    onChange={e => update('contexto.psp_titulo', e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder='Ej: "Fortalecimiento de la salud comunitaria y prevención del consumo de drogas"'
                  />
                </Field>

                <Field label="Actividad del PSP">
                  <textarea
                    value={form.contexto.psp_actividad}
                    onChange={e => update('contexto.psp_actividad', e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder="Ej: Taller de sensibilización sobre efectos químicos de sustancias en el cuerpo."
                  />
                </Field>

                <Field label="Objetivo Holístico PAT (input del docente)">
                  <textarea
                    value={form.contexto.objetivo_holistico_pat}
                    onChange={e => update('contexto.objetivo_holistico_pat', e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder="Ej: Desarrollamos principios de responsabilidad (Ser) mediante el estudio de la vida (Saber) para promover la salud integral (Decidir)."
                  />
                </Field>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-textPrimary">Planificación sin PSP</h3>

                <Field label="Objetivo de aprendizaje">
                  <textarea
                    value={form.contexto.objetivo_aprendizaje}
                    onChange={e => update('contexto.objetivo_aprendizaje', e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder="Ej: Comprender y aplicar los contenidos de la unidad en situaciones concretas de aprendizaje."
                  />
                </Field>

                <Field label="Producto o evidencia esperada">
                  <textarea
                    value={form.contexto.producto}
                    onChange={e => update('contexto.producto', e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder="Ej: Mapa conceptual, práctica escrita, exposición, informe breve."
                  />
                </Field>

                <Field label="Metodología (opcional)">
                  <input
                    value={form.contexto.metodologia}
                    onChange={e => update('contexto.metodologia', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: Aprendizaje basado en problemas, práctica guiada, trabajo colaborativo"
                  />
                </Field>

                <Field label="Tipo de evaluación (opcional)">
                  <input
                    value={form.contexto.tipo_evaluacion}
                    onChange={e => update('contexto.tipo_evaluacion', e.target.value)}
                    className={inputClass}
                    placeholder="Ej: Formativa, sumativa, diagnóstica"
                  />
                </Field>
              </div>
            )}

            {/* Contenidos */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-textSecondary">
                Contenidos estructurados por semanas
              </label>
              <textarea
                value={form.variables.contenidos}
                onChange={e => update('variables.contenidos', e.target.value)}
                rows={10}
                className={textareaClass}
                placeholder={
                  'Semana 1\n• Conceptualización de la Geografía\n• Ramas de la Geografía\n• Geografía Física\n\nSemana 2\n• Importancia de la Geografía Física\n• Elementos de la Geografía Física'
                }
              />
              <p className="text-xs text-textSecondary">
                Escribe los contenidos como en una planificación real: Por semana y con subpuntos.
              </p>
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
          <div className="bg-card p-5 sm:p-6 lg:p-8 rounded-2xl border border-border shadow-lg">
            <h3 className="text-xl sm:text-2xl font-semibold text-textPrimary mb-6">
              Vista previa (Inputs)
            </h3>

            {preview ? (
              <div className="space-y-6 text-textPrimary">
                <Section title="I. Datos Referenciales">
                  <KV k="Distrito educativo" v={preview.identificacion?.distrito_educativo} />
                  <KV k="Unidad Educativa" v={preview.identificacion?.unidad_educativa} />
                  <KV k="Docente" v={preview.identificacion?.docente} />
                  <KV k="Nivel" v={preview.identificacion?.nivel} />
                  <KV k="Año de escolaridad" v={preview.identificacion?.anio_escolaridad} />
                  <KV k="Área" v={preview.identificacion?.area} />
                  <KV k="Trimestre" v={preview.identificacion?.trimestre} />
                  <KV
                    k="Fecha"
                    v={
                      preview.identificacion?.fecha_inicio && preview.identificacion?.fecha_fin
                        ? `Del: ${preview.identificacion?.fecha_inicio}  |  Al: ${preview.identificacion?.fecha_fin}`
                        : ''
                    }
                  />
                  <KV k="Semanas" v={preview.identificacion?.semanas} />
                  <KV k="Periodos por semana" v={preview.identificacion?.periodos_por_semana} />
                  <KV
                    k="Duración del periodo"
                    v={preview.identificacion?.duracion_periodo ? `${preview.identificacion?.duracion_periodo} min` : ''}
                  />
                  <KV k="Tiempo total" v={preview.identificacion?.tiempo} />
                  <KV k="Modalidad" v={preview.mode === 'with_psp' ? 'Con PSP' : 'Sin PSP'} />
                </Section>

              {preview.mode === 'with_psp' ? (
                <Section title="II. Planificación con PSP">
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
              ) : (
                <Section title="II. Planificación sin PSP">
                  <KV k="Objetivo de aprendizaje" v={preview.contexto?.objetivo_aprendizaje} />
                  <KV k="Producto o evidencia" v={preview.contexto?.producto} />
                  <KV k="Metodología" v={preview.contexto?.metodologia} />
                  <KV k="Tipo de evaluación" v={preview.contexto?.tipo_evaluacion} />
                  <div className="mt-3">
                    <p className="text-sm text-textSecondary mb-2">Contenidos</p>
                    <ul className="list-disc pl-6 space-y-1">
                      {(preview.contenidos || []).map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </Section>
              )}

              <p className="text-xs text-textSecondary">
                Luego el preview será del documento generado (Objetivo, Práctica, Teoría, Valoración, Producción, Recursos, Criterios).
              </p>
            </div>
            ) : (
              <div className="rounded-xl border border-border bg-background/40 p-5">
                <p className="text-textSecondary">
                  Completa el formulario y genera el documento para ver la vista previa.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="bg-card p-5 sm:p-6 lg:p-8 rounded-2xl border border-border shadow-lg space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary">Mis PDC</h2>
                <p className="text-sm text-textSecondary mt-1 max-w-2xl">
                  Sube aquí únicamente los DOCX que ya revisaste y consideras finales.
                </p>
              </div>

              <button
                onClick={refreshLibrary}
                disabled={libLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border bg-background hover:opacity-90 text-textPrimary"
              >
                {libLoading ? 'Actualizando...' : 'Refrescar'}
              </button>
            </div>

            <div className="border border-border rounded-xl p-4 bg-background/40 space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-textSecondary">
                  Formato permitido:{' '}
                  <span className="font-semibold text-textPrimary">.docx, .pdf</span>
                </div>

                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold cursor-pointer hover:opacity-90 w-full sm:w-auto">
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
                    <div className="h-2 bg-accent transition-all" style={{ width: `${uploadPct}%` }} />
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
                className={inputClass}
              />
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden md:block border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-0 bg-background/60 px-4 py-3 text-xs font-semibold text-textSecondary">
                <div className="col-span-5 lg:col-span-6">Documento</div>
                <div className="col-span-4 lg:col-span-3">Fecha</div>
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
                    <div key={it.id} className="grid grid-cols-12 px-4 py-3 items-center gap-3">
                      <div className="col-span-5 lg:col-span-6 min-w-0">
                        <p className="font-semibold text-textPrimary truncate">{it.original_name}</p>
                        <p className="text-xs text-textSecondary truncate">{it.storage_path}</p>
                      </div>

                      <div className="col-span-4 lg:col-span-3 text-sm text-textPrimary min-w-0">
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredItems.length === 0 ? (
                <div className="border border-border rounded-xl px-4 py-6 text-sm text-textSecondary bg-background/40">
                  {libLoading ? 'Cargando...' : 'No hay documentos en tu biblioteca.'}
                </div>
              ) : (
                filteredItems.map((it) => (
                  <div
                    key={it.id}
                    className="border border-border rounded-2xl bg-background/40 p-4 space-y-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-textPrimary break-words">{it.original_name}</p>
                      <p className="text-xs text-textSecondary mt-1 break-all">{it.storage_path}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <p className="text-[11px] text-textSecondary">Fecha</p>
                        <p className="text-textPrimary">{fmtDate(it.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-textSecondary">Tamaño</p>
                        <p className="text-textPrimary">{fmtBytes(it.size_bytes)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background hover:opacity-90 text-textPrimary text-sm"
                        onClick={() => onDownload(it)}
                      >
                        Descargar
                      </button>

                      <button
                        className="w-full px-3 py-2 rounded-lg border border-red-300 bg-red-50 hover:opacity-90 text-red-700 text-sm"
                        onClick={() => onDelete(it)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
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
    <p className="font-medium whitespace-pre-wrap break-words">{v || ''}</p>
  </div>
);

export default PdcSection;