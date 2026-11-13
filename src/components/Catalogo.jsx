
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Search,
  Library,
  X,
  ArrowLeft,
  BookMarked,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import "./Catalogo.css";

export default function Catalogo() {
  const [libros, setLibros] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [contenidoAbierto, setContenidoAbierto] = useState(null);

  const [configuracion, setConfiguracion] = useState({
    nombre: "JR² Biblioteca Digital",
    descripcion: "Explora libros y cursos de nuestra biblioteca digital.",
  });

  useEffect(() => {
    let pendientes = 3;

    const terminarCarga = () => {
      pendientes -= 1;
      if (pendientes <= 0) setCargando(false);
    };

    const cancelarLibros = onSnapshot(
      query(
        collection(db, "libros"),
        where("publicado", "==", true)
      ),
      (snap) => {
        setLibros(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            tipoContenido: "libro",
          }))
        );
        terminarCarga();
      },
      (err) => {
        console.error("Error al cargar libros públicos:", err);
        setError(
          "No se pudo cargar el catálogo. Revisa los permisos de lectura pública de Firestore."
        );
        terminarCarga();
      }
    );

    const cancelarCursos = onSnapshot(
      query(
        collection(db, "cursos"),
        where("publicado", "==", true)
      ),
      (snap) => {
        setCursos(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            tipoContenido: "curso",
          }))
        );
        terminarCarga();
      },
      (err) => {
        console.error("Error al cargar cursos públicos:", err);
        setError(
          "No se pudo cargar el catálogo. Revisa los permisos de lectura pública de Firestore."
        );
        terminarCarga();
      }
    );

    const cancelarCategorias = onSnapshot(
      collection(db, "categorias"),
      (snap) => {
        setCategorias(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        terminarCarga();
      },
      (err) => {
        console.error("Error al cargar categorías:", err);
        terminarCarga();
      }
    );

    const cancelarConfiguracion = onSnapshot(
      doc(db, "configuracion", "general"),
      (snap) => {
        if (snap.exists()) {
          const datos = snap.data();
          setConfiguracion((actual) => ({
            ...actual,
            ...datos,
          }));
        }
      },
      (err) => {
        console.error("Error al cargar configuración pública:", err);
      }
    );

    return () => {
      cancelarLibros();
      cancelarCursos();
      cancelarCategorias();
      cancelarConfiguracion();
    };
  }, []);

  const contenidos = useMemo(() => {
    let lista = [
      ...(tipo === "todos" || tipo === "libros" ? libros : []),
      ...(tipo === "todos" || tipo === "cursos" ? cursos : []),
    ];

    if (categoria !== "todas") {
      lista = lista.filter(
        (item) => item.categoriaId === categoria
      );
    }

    const termino = busqueda.trim().toLocaleLowerCase("es");

    if (termino) {
      lista = lista.filter((item) =>
        [item.titulo, item.autor, item.descripcion]
          .filter(Boolean)
          .some((valor) =>
            valor.toLocaleLowerCase("es").includes(termino)
          )
      );
    }

    return lista;
  }, [libros, cursos, tipo, categoria, busqueda]);

  const nombreCategoria = (id) =>
    categorias.find((item) => item.id === id)?.nombre || "General";

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div className="catalog-brand">
          <span className="catalog-brand-icon">
            <Library size={25} />
          </span>

          <div>
            <strong>
              {configuracion.nombre || "JR² Biblioteca Digital"}
            </strong>
            <small>Lectura y aprendizaje</small>
          </div>
        </div>

        <span className="catalog-header-label">
          CATÁLOGO PÚBLICO
        </span>
      </header>

      <main className="catalog-main">
        <section className="catalog-hero">
          <span className="catalog-eyebrow">
            TU ESPACIO DIGITAL
          </span>

          <h1>Descubre tu próxima lectura</h1>

          <p>
            {configuracion.descripcion ||
              "Explora libros y cursos de nuestra biblioteca digital."}
          </p>

          <div className="catalog-search">
            <Search size={20} />

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, autor o descripción..."
              aria-label="Buscar contenido"
            />

            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </section>

        <section
          className="catalog-controls"
          aria-label="Filtros del catálogo"
        >
          <div className="catalog-tabs">
            <button
              className={tipo === "todos" ? "selected" : ""}
              onClick={() => setTipo("todos")}
            >
              Todo
            </button>

            <button
              className={tipo === "libros" ? "selected" : ""}
              onClick={() => setTipo("libros")}
            >
              <BookOpen size={16} /> Libros
            </button>

            <button
              className={tipo === "cursos" ? "selected" : ""}
              onClick={() => setTipo("cursos")}
            >
              <GraduationCap size={16} /> Cursos
            </button>
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
          >
            <option value="todas">Todas las categorías</option>

            {categorias
              .filter((item) => item.activa !== false)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
          </select>
        </section>

        {error && (
          <div className="catalog-alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {cargando ? (
          <div className="catalog-empty">
            <div className="catalog-loader" />
            <p>Cargando biblioteca...</p>
          </div>
        ) : contenidos.length === 0 ? (
          <div className="catalog-empty">
            <BookMarked size={42} />
            <h2>No encontramos contenido</h2>

            <p>
              {busqueda
                ? "Prueba con otra búsqueda o cambia los filtros."
                : "Los libros y cursos publicados aparecerán aquí."}
            </p>
          </div>
        ) : (
          <section
            className="catalog-grid"
            aria-label="Contenido publicado"
          >
            {contenidos.map((item) => (
              <article
                className="catalog-card"
                key={`${item.tipoContenido}-${item.id}`}
              >
                <div className="catalog-cover">
                  {item.portada ? (
                    <img
                      src={item.portada}
                      alt={`Portada de ${item.titulo}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="catalog-cover-placeholder">
                      {item.tipoContenido === "libro" ? (
                        <BookOpen size={48} />
                      ) : (
                        <GraduationCap size={48} />
                      )}
                    </div>
                  )}

                  <span className="catalog-type">
                    {item.tipoContenido === "libro"
                      ? "LIBRO"
                      : "CURSO"}
                  </span>
                </div>

                <div className="catalog-card-body">
                  <span className="catalog-category">
                    {nombreCategoria(item.categoriaId)}
                  </span>

                  <h2>{item.titulo || "Sin título"}</h2>

                  {item.tipoContenido === "libro" && (
                    <p className="catalog-author">
                      {item.autor || "Autor no especificado"}
                    </p>
                  )}

                  <p className="catalog-description">
                    {item.descripcion ||
                      "Contenido disponible en la biblioteca."}
                  </p>

                  <button
                    className="catalog-open-button"
                    onClick={() => setContenidoAbierto(item)}
                    disabled={!item.pdfUrl}
                  >
                    {item.pdfUrl
                      ? "Abrir lectura"
                      : "Lectura no disponible"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <footer className="catalog-footer">
        © {new Date().getFullYear()}{" "}
        {configuracion.nombre || "JR² Biblioteca Digital"}
      </footer>

      {contenidoAbierto && (
        <div
          className="reader-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Lectura de ${contenidoAbierto.titulo}`}
        >
          <div className="reader-window">
            <div className="reader-toolbar">
              <button
                className="reader-back"
                onClick={() => setContenidoAbierto(null)}
              >
                <ArrowLeft size={18} /> Volver al catálogo
              </button>

              <strong>{contenidoAbierto.titulo}</strong>

              <a
                className="reader-external"
                href={contenidoAbierto.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en otra pestaña
              </a>

              <button
                className="reader-close"
                onClick={() => setContenidoAbierto(null)}
                aria-label="Cerrar lector"
              >
                <X size={21} />
              </button>
            </div>

            <iframe
              className="reader-frame"
              src={`${contenidoAbierto.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              title={`Lector: ${contenidoAbierto.titulo}`}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
