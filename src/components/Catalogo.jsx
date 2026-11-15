
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Library,
  X,
  ArrowLeft,
  BookMarked,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ArrowRight,
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
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [categoria, setCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [contenidoAbierto, setContenidoAbierto] = useState(null);

  const [configuracion, setConfiguracion] = useState({
    nombre: "JR² Biblioteca Digital",
  });

  useEffect(() => {
    let pendientes = 2;

    const terminarCarga = () => {
      pendientes -= 1;
      if (pendientes <= 0) setCargando(false);
    };

    // CARGAR LIBROS PUBLICADOS
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

    // CARGAR CATEGORÍAS
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

    // CARGAR CONFIGURACIÓN GENERAL
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
      cancelarCategorias();
      cancelarConfiguracion();
    };
  }, []);

  // FILTRAR LIBROS
  const contenidos = useMemo(() => {
    let lista = [...libros];

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
  }, [libros, categoria, busqueda]);

  const nombreCategoria = (id) =>
    categorias.find((item) => item.id === id)?.nombre || "General";

  const filtrosActivos =
    categoria !== "todas" || busqueda.trim() !== "";

  const contenidoDestacado =
    !filtrosActivos && contenidos.length > 0
      ? contenidos[0]
      : null;

  // ORGANIZAR LIBROS POR CATEGORÍA
  const seccionesCategorias = useMemo(() => {
    if (filtrosActivos) return [];

    return categorias
      .filter((item) => item.activa !== false)
      .map((item) => ({
        ...item,
        contenidos: contenidos.filter(
          (contenido) => contenido.categoriaId === item.id
        ),
      }))
      .filter((item) => item.contenidos.length > 0);
  }, [categorias, contenidos, filtrosActivos]);

  const abrirContenido = (item) => {
    if (item?.pdfUrl) {
      setContenidoAbierto(item);
    }
  };

  const limpiarFiltros = () => {
    setCategoria("todas");
    setBusqueda("");
  };

  // TARJETA DE LIBRO
  const renderTarjeta = (item) => (
    <article
      className="premium-book-card"
      key={item.id}
    >
      <button
        className="premium-book-cover"
        onClick={() => abrirContenido(item)}
        disabled={!item.pdfUrl}
        aria-label={`Abrir ${item.titulo || "libro"}`}
      >
        {item.portada ? (
          <img
            src={item.portada}
            alt={`Portada de ${item.titulo}`}
            loading="lazy"
          />
        ) : (
          <span className="premium-cover-placeholder">
            <BookOpen size={48} />
          </span>
        )}

        <span className="premium-cover-type">
          LIBRO
        </span>

        <span className="premium-cover-action">
          <BookOpen size={17} />
          Ver libro
        </span>
      </button>

      <div className="premium-book-info">
        <span className="premium-book-category">
          {nombreCategoria(item.categoriaId)}
        </span>

        <h3>{item.titulo || "Sin título"}</h3>

        <p className="premium-book-author">
          {item.autor || "Autor no especificado"}
        </p>

        <p className="premium-book-description">
          {item.descripcion || "Libro disponible en la biblioteca."}
        </p>

        <button
          className="premium-book-button"
          onClick={() => abrirContenido(item)}
          disabled={!item.pdfUrl}
        >
          {item.pdfUrl ? "Abrir lectura" : "No disponible"}
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );

  return (
    <div className="catalog-page premium-catalog">

      {/* ENCABEZADO */}
      <header className="premium-header">
        <a
          className="premium-brand"
          href="#inicio"
          aria-label="Inicio de la biblioteca"
        >
          <span className="premium-brand-icon">
            <Library size={25} />
          </span>

          <span className="premium-brand-text">
            <strong>
              {configuracion.nombre || "JR² Biblioteca Digital"}
            </strong>
            <small>Un universo de lectura</small>
          </span>
        </a>

        <nav className="premium-navigation">
          <a href="#inicio">Inicio</a>
          <a href="#biblioteca">Biblioteca</a>
          <a href="#categorias">Categorías</a>
        </nav>

        <a className="premium-header-badge" href="#biblioteca">
          <span />
          CATÁLOGO PÚBLICO
        </a>
      </header>

      <main>

        {/* PORTADA PRINCIPAL */}
        <section className="premium-hero" id="inicio">
          <div className="premium-hero-glow" />

          <div className="premium-hero-content">
            <span className="premium-eyebrow">
              <Sparkles size={14} />
              TU PRÓXIMO MUNDO TE ESPERA
            </span>

            <h1>
              Historias que
              <br />
              <span>merecen ser vividas.</span>
            </h1>

            <p>
              Explora nuestra colección de libros y descubre nuevas historias.
            </p>

            <a href="#biblioteca" className="premium-hero-button">
              Explorar biblioteca
              <ArrowRight size={18} />
            </a>

            <div className="premium-hero-stats">
              <div>
                <strong>{libros.length}</strong>
                <span>Libros</span>
              </div>

              <i />

              <div>
                <strong>
                  {categorias.filter(
                    (item) => item.activa !== false
                  ).length}
                </strong>
                <span>Categorías</span>
              </div>
            </div>
          </div>

          {/* LIBRO DESTACADO */}
          {contenidoDestacado && (
            <div className="premium-featured">
              <div className="premium-featured-glow" />

              <div className="premium-featured-cover">
                {contenidoDestacado.portada ? (
                  <img
                    src={contenidoDestacado.portada}
                    alt={`Portada de ${contenidoDestacado.titulo}`}
                  />
                ) : (
                  <div className="premium-featured-placeholder">
                    <BookOpen size={58} />
                  </div>
                )}
              </div>

              <div className="premium-featured-info">
                <span className="premium-featured-label">
                  <Sparkles size={13} />
                  DESTACADO DE LA BIBLIOTECA
                </span>

                <span className="premium-featured-category">
                  {nombreCategoria(contenidoDestacado.categoriaId)}
                </span>

                <h2>
                  {contenidoDestacado.titulo || "Libro destacado"}
                </h2>

                <p>
                  {contenidoDestacado.descripcion ||
                    "Descubre este libro disponible en nuestra biblioteca digital."}
                </p>

                <button
                  className="premium-featured-button"
                  onClick={() => abrirContenido(contenidoDestacado)}
                  disabled={!contenidoDestacado.pdfUrl}
                >
                  <BookOpen size={17} />
                  Abrir lectura
                </button>
              </div>
            </div>
          )}
        </section>
        {/* SUGERENCIAS Y APOYO A LA BIBLIOTECA */}
        <section className="premium-support-section" id="apoyar">
          <div className="premium-support-heading">
            <span className="premium-eyebrow">
              <Sparkles size={13} />
              HAGAMOS CRECER ESTA BIBLIOTECA
            </span>

            <h2>Tu apoyo también cuenta</h2>

            <p>
              ¿Hay algún libro que te gustaría encontrar aquí?
              También puedes ayudar a que este espacio siga creciendo.
            </p>
          </div>

          <div className="premium-support-grid">
            <article className="premium-support-card">
          
            <h3>Sugiere un libro</h3>
              <p>
                Cuéntanos qué libro te gustaría ver próximamente
                en nuestra biblioteca.
              </p>
              <a
                className="premium-support-button"
                href="mailto:josericomgg@gmail.com?subject=Sugerencia%20de%20libro%20-%20JR%C2%B2%20Biblioteca%20Digital"
              >
                Enviar sugerencia
                <ArrowRight size={16} />
              </a>
            </article>

            
            <article className="premium-support-card">
              <h3>Apoya con PayPal</h3>
              <p>
                Tu colaboración puede ayudar a mantener y mejorar
                este espacio de lectura.
              </p>
              <a
                className="premium-support-button"
                href="https://paypal.me/JoseBaizabal"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donar con PayPal
                <ArrowRight size={16} />
              </a>
            </article>

            <article className="premium-support-card">
              <h3>Apoya con Mercado Pago</h3>
              <p>
                Cada aporte cuenta para seguir haciendo crecer
                nuestra colección digital.
              </p>
              <a
                className="premium-support-button"
                href="https://link.mercadopago.com.mx/ayudandoperritos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Donar con Mercado Pago
                <ArrowRight size={16} />
              </a>
            </article>

          </div>

          <p className="premium-support-thanks">
            Gracias por formar parte de JR² Biblioteca Digital.
          </p>
        </section>
        {/* BÚSQUEDA Y FILTROS */}
        <section className="premium-search-section" id="biblioteca">
          <div className="premium-section-heading">
            <div>
              <span className="premium-eyebrow">
                ENCUENTRA TU HISTORIA
              </span>

              <h2>Explora la biblioteca</h2>
            </div>

            <span className="premium-result-count">
              {contenidos.length} libros
            </span>
          </div>

          <div className="premium-search">
            <Search size={21} />

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca por título, autor o descripción..."
              aria-label="Buscar libros"
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

          <div className="premium-filter-bar">
            <div className="premium-filter-tabs">
              <button
                className="active"
                type="button"
                disabled
              >
                <BookOpen size={16} />
                Libros
              </button>
            </div>

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="todas">
                Todas las categorías
              </option>

              {categorias
                .filter((item) => item.activa !== false)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
            </select>
          </div>
        </section>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="catalog-alert premium-alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* CARGA */}
        {cargando ? (
          <div className="catalog-empty premium-empty">
            <div className="catalog-loader" />
            <p>Preparando tu biblioteca...</p>
          </div>

        ) : contenidos.length === 0 ? (

          <div className="catalog-empty premium-empty">
            <BookMarked size={44} />

            <h2>No encontramos libros</h2>

            <p>
              {busqueda
                ? "Prueba con otra búsqueda o cambia los filtros."
                : "Los libros publicados aparecerán aquí."}
            </p>

            {filtrosActivos && (
              <button
                className="premium-reset-button"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </div>

        ) : filtrosActivos ? (

          /* RESULTADOS DE BÚSQUEDA */
          <section className="premium-results-section">
            <div className="premium-section-heading">
              <div>
                <span className="premium-eyebrow">
                  RESULTADOS
                </span>

                <h2>Libros encontrados</h2>
              </div>

              <button
                className="premium-clear-filters"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            </div>

            <div className="premium-results-grid">
              {contenidos.map(renderTarjeta)}
            </div>
          </section>

        ) : (

          <>
            {/* ESTANTERÍA PRINCIPAL */}
            {contenidos.length > 1 && (
              <section className="premium-shelf-section">
                <div className="premium-section-heading">
                  <div>
                    <span className="premium-eyebrow">
                      PARA DESCUBRIR
                    </span>

                    <h2>Más para explorar</h2>
                  </div>

                  <span className="premium-shelf-note">
                    Nuestra selección
                  </span>
                </div>

                <div className="premium-shelf">
                  {contenidos.slice(1).map(renderTarjeta)}
                </div>
              </section>
            )}

            {/* CATEGORÍAS */}
            {seccionesCategorias.length > 0 && (
              <div className="premium-category-shelves" id="categorias">
                {seccionesCategorias.map((seccion) => (
                  <section
                    className="premium-shelf-section"
                    key={seccion.id}
                  >
                    <div className="premium-section-heading">
                      <div>
                        <span className="premium-eyebrow">
                          EXPLORA POR GÉNERO
                        </span>

                        <h2>{seccion.nombre}</h2>
                      </div>

                      <button
                        className="premium-category-link"
                        onClick={() => setCategoria(seccion.id)}
                      >
                        Ver categoría
                        <ChevronRight size={17} />
                      </button>
                    </div>

                    <div className="premium-shelf">
                      {seccion.contenidos.map(renderTarjeta)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="premium-footer">
        <div className="premium-footer-brand">
          <span className="premium-brand-icon">
            <Library size={22} />
          </span>

          <div>
            <strong>
              {configuracion.nombre || "JR² Biblioteca Digital"}
            </strong>

            <small>Un universo de lectura</small>
          </div>
        </div>

        <p>
          © {new Date().getFullYear()}{" "}
          {configuracion.nombre || "JR² Biblioteca Digital"}.
          Todos los derechos reservados.
        </p>

        <a href="#inicio">Volver arriba ↑</a>
      </footer>

      {/* LECTOR PDF */}
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
                <ArrowLeft size={18} />
                Volver al catálogo
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
