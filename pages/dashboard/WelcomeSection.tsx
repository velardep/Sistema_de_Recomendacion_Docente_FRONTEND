// src/pages/dashboard/WelcomeSection.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const WelcomeSection: React.FC = () => {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const perfil = useAuthStore((s) => s.perfil);

  const nombre =
    perfil?.nombres ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Docente');

  return (
    <div className="p-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="text-xl uppercase tracking-widest text-accent font-bold mb-2">
            Inicio
          </div>
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {nombre}</h1>
          <p className="text-textSecondary max-w-3xl">
            Este prototipo fue pensado para apoyar el trabajo docente de forma práctica.
            Ayudarte a resolver dudas, aprovechar tus materiales, recibir sugerencias
            útiles y construir un PDC con mayor acompañamiento.
          </p>
        </div>

        <button
          onClick={() => nav('/dashboard/chat')}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
        >
          Ir al chat
        </button>
      </header>

      <section className="mb-10">
        <div className="text-xl uppercase tracking-widest text-accent font-bold mb-4">
          Conoce el sistema
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card border border-border p-6 md:p-8 rounded-2xl">
            <div className="text-xl uppercase tracking-widest text-accent font-bold mb-3">
              ¿Por qué existe este sistema?
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3">
              Un apoyo para la carga real del trabajo docente.
            </h2>
            <p className="text-textSecondary text-sm leading-7">
              En la práctica, muchos docentes deben planificar, preparar materiales,
              adaptar actividades, responder dudas, organizar evidencias y elaborar
              documentos pedagógicos con poco tiempo disponible. Esa carga suele crecer
              aún más cuando se trabaja con varios cursos, distintos ritmos de avance y
              necesidades concretas del contexto educativo boliviano.
            </p>
            <p className="text-textSecondary text-sm leading-7 mt-4">
              Este sistema busca responder a ese problema. No pretende reemplazar al
              docente, sino brindarle una herramienta de apoyo para ahorrar tiempo,
              ordenar mejor la información, aprovechar materiales ya existentes y
              facilitar decisiones pedagógicas cotidianas. La idea central es que el
              docente pueda concentrarse más en enseñar y acompañar y menos en repetir
              tareas operativas una y otra vez.
            </p>
          </div>

          <div className="bg-card border border-border p-6 md:p-8 rounded-2xl">
            <div className="text-xl uppercase tracking-widest text-accent font-bold mb-3">
              Redes neuronales aplicadas
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3">
              ¿Cómo usa inteligencia artificial este sistema?
            </h2>
            <p className="text-textSecondary text-sm leading-7">
              El sistema utiliza modelos de inteligencia artificial, incluyendo redes
              neuronales, para reconocer patrones en la información y ofrecer apoyo más
              útil al docente. En palabras simples, estas redes aprenden a identificar
              relaciones entre textos, consultas, materiales y formas de uso del sistema,
              con el fin de dar respuestas, sugerencias y apoyos más relevantes.
            </p>
            <p className="text-textSecondary text-sm leading-7 mt-4">
              En lugar de trabajar como una búsqueda rígida, el sistema intenta entender
              mejor lo que el docente necesita dentro de un contexto educativo real.
              Permitiendo orientar funciones hacia tareas frecuentes del sistema
              educativo boliviano, como aclarar contenidos, recuperar información desde
              materiales propios, sugerir acciones útiles y apoyar la elaboración de
              documentos pedagógicos. Aun así, la decisión final siempre sigue siendo del docente.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="text-xl uppercase tracking-widest text-accent font-bold mb-4">
          Secciones principales
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl hover:border-accent/40 transition-all flex flex-col">
            <div className="text-xl uppercase tracking-widest text-accent font-bold mb-5">
              Chat general
            </div>
            <h3 className="text-xl font-bold mb-3">Qué es, qué hace y cómo funciona</h3>
            <p className="text-textSecondary text-sm leading-7">
              El chat general es el punto más directo para interactuar con el sistema.
              Sirve para hacer preguntas, pedir explicaciones, solicitar ideas de
              actividades, reformular textos, generar ejemplos o recibir apoyo sobre
              contenidos pedagógicos y de aula.
            </p>
            <p className="text-textSecondary text-sm leading-7 mt-4">
              Funciona como una conversación guiada: El docente escribe lo que necesita
              y el sistema responde en lenguaje claro. Es especialmente útil cuando se
              requiere apoyo rápido, sin necesidad de crear primero un espacio o subir
              archivos. Puede servir tanto para una consulta puntual como para comenzar
              a trabajar una idea más amplia.
            </p>

            <div className="mt-6">
              <Link
                to="/dashboard/chat"
                className="inline-flex bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
              >
                Ir al chat
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl hover:border-accent/40 transition-all flex flex-col">
            <div className="text-xl uppercase tracking-widest text-accent font-bold mb-5">
              Sugerencias
            </div>
            <h3 className="text-xl font-bold mb-3">Qué es, qué hace y cómo funciona</h3>
            <p className="text-textSecondary text-sm leading-7">
              La sección de sugerencias muestra acciones o recomendaciones que el sistema
              considera útiles según la actividad reciente del docente. Su objetivo no
              es imponer pasos, sino proponer apoyos oportunos que puedan facilitar el
              trabajo diario.
            </p>
            <p className="text-textSecondary text-sm leading-7 mt-4">
              Por ejemplo, el sistema puede detectar que conviene reforzar una acción,
              revisar cierto material, continuar un proceso o atender algún aspecto que
              haya quedado pendiente. En términos simples, esta sección funciona como una
              ayuda personalizada para que el docente no tenga que descubrir por sí solo
              todo lo que podría aprovechar dentro de la plataforma.
            </p>

            <div className="mt-6">
              <Link
                to="/dashboard/recomendaciones"
                className="inline-flex bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
              >
                Ver sugerencias
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl hover:border-accent/40 transition-all flex flex-col">
            <div className="text-xl uppercase tracking-widest text-accent font-bold mb-5">
              Espacios
            </div>
            <h3 className="text-xl font-bold mb-3">Qué es, qué hace y cómo funciona</h3>
            <p className="text-textSecondary text-sm leading-7">
              Los espacios son áreas de trabajo donde el docente puede subir materiales
              propios, como documentos o recursos, para luego hacer preguntas sobre ese
              contenido específico. Esto permite que el sistema no responda solo de forma
              general, sino también apoyándose en los archivos que el usuario decidió usar.
            </p>
            <p className="text-textSecondary text-sm leading-7 mt-4">
              En la práctica, un espacio ayuda a organizar el trabajo por tema, curso,
              unidad o necesidad concreta. El docente sube sus archivos, el sistema
              procesa la información y después puede responder preguntas relacionadas con
              esos materiales. Así se vuelve más fácil recuperar ideas, resumir contenido,
              aclarar dudas o reutilizar información ya existente.
            </p>

            <div className="mt-6">
              <Link
                to="/dashboard/espacios"
                className="inline-flex bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
              >
                Ir a espacios
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl hover:border-accent/40 transition-all flex flex-col">
            <div className="text-xl uppercase tracking-widest text-accent font-bold mb-5">
              Plan de Desarrollo Curricular (PDC)
            </div>
            <h3 className="text-xl font-bold mb-3">Qué es, qué hace y cómo funciona</h3>
            <p className="text-textSecondary text-sm leading-7">
              La sección de PDC (Planificacion de Desarrollo Curricular) está orientada a 
              apoyar la construcción de este documento 
              pedagógico de una manera más guiada. Su propósito es ayudar al docente a
              avanzar con mayor orden, claridad y respaldo, reduciendo el tiempo que
              normalmente toma estructurar este tipo de planificación.
            </p>
            <p className="text-textSecondary text-sm leading-7 mt-4">
              El funcionamiento se centra en acompañar el proceso. El sistema toma la
              información disponible, organiza elementos útiles y apoya en la redacción o
              estructuración del documento según lo que el docente vaya necesitando. No
              sustituye el criterio profesional, pero sí ofrece una base de trabajo que
              puede acelerar el proceso y hacerlo menos pesado.
            </p>

            <div className="mt-6">
              <Link
                to="/dashboard/pdc"
                className="inline-flex bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
              >
                Ir a PDC
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-2">¿Cómo empezar si eres nuevo?</h2>
          <p className="text-textSecondary text-sm leading-7">
            Una forma sencilla de empezar es esta: 
            Primero entra al chat general para
            probar una consulta rápida, luego crea o revisa un espacio si quieres trabajar
            con tus propios materiales, después visita sugerencias para ver apoyos
            recomendados y finalmente usa la sección PDC cuando necesites avanzar en una
            planificación más estructurada.
          </p>
        </div>
      </section>

      <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h2 className="text-lg font-bold">Tu perfil</h2>
            <p className="text-textSecondary text-sm mt-1">
              {perfil
                ? 'Perfil completo ✅'
                : 'Aún no completaste tu perfil. Te tomará aproximadamente 1 minuto.'}
            </p>
          </div>

          {!perfil && (
            <Link
              to="/onboarding"
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 text-sm font-medium transition-all"
            >
              Completar perfil
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;