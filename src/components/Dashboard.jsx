
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FolderOpen,
  Image,
  Settings,
  Menu,
  Library,
  Bell,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Images,
  Link,
  ExternalLink,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [active, setActive] = useState("Inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  const [libros, setLibros] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [configuracion, setConfiguracion] = useState({
    nombre: "JR² Biblioteca Digital",
    descripcion: "Biblioteca digital de libros y cursos.",
  });
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);

  const [cargandoLibros, setCargandoLibros] = useState(true);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  const [errorLibros, setErrorLibros] = useState("");
  const [errorCategorias, setErrorCategorias] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [mostrarFormularioCategoria, setMostrarFormularioCategoria] =
    useState(false);
  const [editandoCategoriaId, setEditandoCategoriaId] = useState(null);

  const [filtroPortadas, setFiltroPortadas] = useState("todos");

  const formularioInicial = {
    titulo: "",
    autor: "",
    descripcion: "",
    portada: "",
    pdfUrl: "",
    publicado: false,
    categoriaId: "",
  };

  const categoriaInicial = {
    nombre: "",
    descripcion: "",
    tipo: "ambos",
    activa: true,
  };

  const [formulario, setFormulario] = useState(formularioInicial);
  const [nombreArchivoPDF, setNombreArchivoPDF] = useState("");

  const GITHUB_PDF_BASE =
    "https://josericomgg-lgtm.github.io/JR2-Biblioteca-PDF";
  const [formularioCategoria, setFormularioCategoria] =
    useState(categoriaInicial);

  const menu = [
    { name: "Inicio", icon: LayoutDashboard },
    { name: "Libros", icon: BookOpen },
    { name: "Cursos", icon: GraduationCap },
    { name: "Categorías", icon: FolderOpen },
    { name: "Portadas", icon: Image },
    { name: "Configuración", icon: Settings },
  ];

  // ESCUCHAR LIBROS
  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "libros"),
      (snapshot) => {
        const registros = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setLibros(registros);
        setCargandoLibros(false);
        setErrorLibros("");
      },
      (error) => {
        console.error("Error al cargar libros:", error);
        setErrorLibros("No se pudieron cargar los libros.");
        setCargandoLibros(false);
      }
    );

    return () => cancelar();
  }, []);

  // ESCUCHAR CURSOS
  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "cursos"),
      (snapshot) => {
        const registros = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setCursos(registros);
        setCargandoCursos(false);
      },
      (error) => {
        console.error("Error al cargar cursos:", error);
        setCargandoCursos(false);
      }
    );

    return () => cancelar();
  }, []);

  // ESCUCHAR CATEGORÍAS
  useEffect(() => {
    const cancelar = onSnapshot(
      collection(db, "categorias"),
      (snapshot) => {
        const registros = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setCategorias(registros);
        setCargandoCategorias(false);
        setErrorCategorias("");
      },
      (error) => {
        console.error("Error al cargar categorías:", error);
        setErrorCategorias(
          "No se pudieron cargar las categorías. Revisa los permisos de Firestore."
        );
        setCargandoCategorias(false);
      }
    );

    return () => cancelar();
  }, []);

  // ESCUCHAR CONFIGURACIÓN DE LA BIBLIOTECA
  useEffect(() => {
    const cancelar = onSnapshot(
      doc(db, "configuracion", "general"),
      (snapshot) => {
        if (snapshot.exists()) {
          const datos = snapshot.data();
          setConfiguracion({
            nombre: datos.nombre || "JR² Biblioteca Digital",
            descripcion:
              datos.descripcion || "Biblioteca digital de libros y cursos.",
          });
        }
      },
      (error) => {
        console.error("Error al cargar configuración:", error);
      }
    );

    return () => cancelar();
  }, []);

  // GUARDAR CONFIGURACIÓN DE LA BIBLIOTECA
  const guardarConfiguracion = async (e) => {
    e.preventDefault();

    const nombre = configuracion.nombre.trim();
    const descripcion = configuracion.descripcion.trim();

    if (!nombre) {
      alert("Escribe el nombre de la biblioteca.");
      return;
    }

    setGuardandoConfiguracion(true);

    try {
      await setDoc(
        doc(db, "configuracion", "general"),
        {
          nombre,
          descripcion,
          fechaActualizacion: serverTimestamp(),
        },
        { merge: true }
      );
      alert("Configuración guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      alert("No se pudo guardar la configuración. Revisa los permisos de Firestore.");
    } finally {
      setGuardandoConfiguracion(false);
    }
  };

  // CAMBIAR FORMULARIO DE LIBROS Y CURSOS
  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // GENERAR ENLACE PÚBLICO DEL PDF DESDE GITHUB PAGES
  const generarEnlacePDF = () => {
    const nombre = nombreArchivoPDF.trim();

    if (!nombre) {
      alert("Escribe el nombre del archivo PDF.");
      return;
    }

    const carpeta = active === "Cursos" ? "cursos" : "libros";
    const archivo = nombre.toLowerCase().endsWith(".pdf")
      ? nombre
      : `${nombre}.pdf`;
    const nombreCodificado = encodeURIComponent(archivo);
    const enlace = `${GITHUB_PDF_BASE}/${carpeta}/${nombreCodificado}`;

    setFormulario((anterior) => ({
      ...anterior,
      pdfUrl: enlace,
    }));
  };

  // CAMBIAR FORMULARIO DE CATEGORÍAS
  const manejarCambioCategoria = (e) => {
    const { name, value, type, checked } = e.target;

    setFormularioCategoria((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // NOMBRE DE CATEGORÍA
  const obtenerNombreCategoria = (categoriaId) => {
    if (!categoriaId) return "Sin categoría";

    const categoria = categorias.find((item) => item.id === categoriaId);

    return categoria ? categoria.nombre : "Categoría no disponible";
  };

  // CATEGORÍAS DISPONIBLES
  const categoriasDisponibles = categorias.filter(
    (categoria) =>
      categoria.activa !== false &&
      (categoria.tipo === "ambos" ||
        (active === "Libros" && categoria.tipo === "libros") ||
        (active === "Cursos" && categoria.tipo === "cursos"))
  );

  // ABRIR NUEVO LIBRO
  const nuevoLibro = () => {
    setFormulario({ ...formularioInicial });
    setEditandoId(null);
    setMostrarFormulario(true);
  };

  // EDITAR LIBRO
  const editarLibro = (libro) => {
    setActive("Libros");
    setFormulario({
      titulo: libro.titulo || "",
      autor: libro.autor || "",
      descripcion: libro.descripcion || "",
      portada: libro.portada || "",
      pdfUrl: libro.pdfUrl || "",
      publicado: libro.publicado || false,
      categoriaId: libro.categoriaId || "",
    });

    setEditandoId(libro.id);
    setMostrarFormulario(true);
  };

  // GUARDAR LIBRO
  const guardarLibro = async (e) => {
    e.preventDefault();

    if (!formulario.titulo.trim()) {
      alert("Escribe el título del libro.");
      return;
    }

    try {
      if (editandoId) {
        await updateDoc(doc(db, "libros", editandoId), {
          ...formulario,
        });
      } else {
        await addDoc(collection(db, "libros"), {
          ...formulario,
          fechaCreacion: serverTimestamp(),
        });
      }

      setFormulario({ ...formularioInicial });
      setEditandoId(null);
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Error al guardar libro:", error);
      alert("No se pudo guardar el libro. Revisa tu conexión y permisos.");
    }
  };

  // ELIMINAR LIBRO
  const eliminarLibro = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este libro?"
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "libros", id));
    } catch (error) {
      console.error("Error al eliminar libro:", error);
      alert("No se pudo eliminar el libro.");
    }
  };

  // NUEVO CURSO
  const nuevoCurso = () => {
    setFormulario({ ...formularioInicial });
    setEditandoId(null);
    setMostrarFormulario(true);
  };

  // EDITAR CURSO
  const editarCurso = (curso) => {
    setActive("Cursos");
    setFormulario({
      titulo: curso.titulo || "",
      autor: "",
      descripcion: curso.descripcion || "",
      portada: curso.portada || "",
      pdfUrl: curso.pdfUrl || "",
      publicado: curso.publicado || false,
      categoriaId: curso.categoriaId || "",
    });

    setEditandoId(curso.id);
    setMostrarFormulario(true);
  };

  // GUARDAR CURSO
  const guardarCurso = async (e) => {
    e.preventDefault();

    if (!formulario.titulo.trim()) {
      alert("Escribe el título del curso.");
      return;
    }

    try {
      const datosCurso = {
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        portada: formulario.portada,
        pdfUrl: formulario.pdfUrl,
        publicado: formulario.publicado,
        categoriaId: formulario.categoriaId,
      };

      if (editandoId) {
        await updateDoc(doc(db, "cursos", editandoId), datosCurso);
      } else {
        await addDoc(collection(db, "cursos"), {
          ...datosCurso,
          fechaCreacion: serverTimestamp(),
        });
      }

      setFormulario({ ...formularioInicial });
      setEditandoId(null);
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Error al guardar curso:", error);
      alert("No se pudo guardar el curso.");
    }
  };

  // ELIMINAR CURSO
  const eliminarCurso = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este curso?"
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "cursos", id));
    } catch (error) {
      console.error("Error al eliminar curso:", error);
      alert("No se pudo eliminar el curso.");
    }
  };

  // NUEVA CATEGORÍA
  const nuevaCategoria = () => {
    setFormularioCategoria({ ...categoriaInicial });
    setEditandoCategoriaId(null);
    setMostrarFormularioCategoria(true);
  };

  // EDITAR CATEGORÍA
  const editarCategoria = (categoria) => {
    setFormularioCategoria({
      nombre: categoria.nombre || "",
      descripcion: categoria.descripcion || "",
      tipo: categoria.tipo || "ambos",
      activa: categoria.activa !== false,
    });

    setEditandoCategoriaId(categoria.id);
    setMostrarFormularioCategoria(true);
  };

  // GUARDAR CATEGORÍA
  const guardarCategoria = async (e) => {
    e.preventDefault();

    if (!formularioCategoria.nombre.trim()) {
      alert("Escribe el nombre de la categoría.");
      return;
    }

    try {
      const datos = {
        ...formularioCategoria,
        nombre: formularioCategoria.nombre.trim(),
        descripcion: formularioCategoria.descripcion.trim(),
      };

      if (editandoCategoriaId) {
        await updateDoc(
          doc(db, "categorias", editandoCategoriaId),
          datos
        );
      } else {
        await addDoc(collection(db, "categorias"), {
          ...datos,
          fechaCreacion: serverTimestamp(),
        });
      }

      setFormularioCategoria({ ...categoriaInicial });
      setEditandoCategoriaId(null);
      setMostrarFormularioCategoria(false);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      alert("No se pudo guardar la categoría. Revisa los permisos de Firestore.");
    }
  };

  // ELIMINAR CATEGORÍA
  const eliminarCategoria = async (categoria) => {
    const tieneLibros = libros.some(
      (libro) => libro.categoriaId === categoria.id
    );

    const tieneCursos = cursos.some(
      (curso) => curso.categoriaId === categoria.id
    );

    if (tieneLibros || tieneCursos) {
      alert(
        "No puedes eliminar esta categoría porque está asignada a libros o cursos. Puedes desactivarla o cambiar primero esas asignaciones."
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "categorias", categoria.id));
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      alert("No se pudo eliminar la categoría.");
    }
  };

  // GALERÍA DE PORTADAS
  const portadas = [
    ...libros.map((libro) => ({
      ...libro,
      tipoContenido: "libro",
      coleccion: "Libros",
    })),
    ...cursos.map((curso) => ({
      ...curso,
      tipoContenido: "curso",
      coleccion: "Cursos",
    })),
  ];

  const portadasFiltradas = portadas.filter((item) => {
    if (filtroPortadas === "libros") return item.tipoContenido === "libro";
    if (filtroPortadas === "cursos") return item.tipoContenido === "curso";
    if (filtroPortadas === "sin-portada") return !item.portada;
    return true;
  });

  const totalConPortada = portadas.filter((item) => item.portada).length;
  const totalSinPortada = portadas.length - totalConPortada;

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "show" : ""}`}>
        <div className="brand">
          <Library size={30} />
          <div>
            <h2>JR²</h2>
            <span>Biblioteca Digital</span>
          </div>
        </div>

        <p className="menu-label">MENÚ PRINCIPAL</p>

        <nav>
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={
                  active === item.name ? "nav-item active" : "nav-item"
                }
                onClick={() => {
                  setActive(item.name);
                  setMenuOpen(false);
                }}
              >
                <Icon size={19} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>JR² Biblioteca Digital</span>
          <small>Panel administrativo</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu />
          </button>

          <div className="breadcrumb">Administración / {active}</div>

          <div className="top-actions">
            <span className="admin-email">{user.email}</span>

            <button className="icon-button" aria-label="Notificaciones">
              <Bell size={19} />
            </button>

            <button
              className="logout-button"
              onClick={onLogout}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">PANEL ADMINISTRATIVO</span>
              <h1>
                {active === "Inicio" ? "Bienvenido a tu biblioteca" : active}
              </h1>
              <p>Gestiona tus libros, cursos y contenido digital.</p>
            </div>

            <div className="welcome-icon">
              <Library size={42} />
            </div>
          </div>

          {/* INICIO */}
          {active === "Inicio" && (
            <>
              <h3 className="section-title">Resumen general</h3>

              <div className="stats">
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <BookOpen />
                  </div>
                  <span>Total de libros</span>
                  <strong>{libros.length}</strong>
                  <small>Libros registrados</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon gold">
                    <GraduationCap />
                  </div>
                  <span>Total de cursos</span>
                  <strong>{cursos.length}</strong>
                  <small>Cursos registrados</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <FolderOpen />
                  </div>
                  <span>Categorías</span>
                  <strong>{categorias.length}</strong>
                  <small>Categorías creadas</small>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-heading">
                  <div>
                    <h3>Actividad de la biblioteca</h3>
                    <p>Tu espacio de administración está preparado.</p>
                  </div>
                  <Library size={27} />
                </div>

                <div className="empty-state">
                  <BookOpen size={38} />
                  <h3>¡Comencemos!</h3>
                  <p>
                    Cuando agregues libros y cursos aparecerán aquí.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* LIBROS */}
          {active === "Libros" && (
            <div className="panel-card books-panel">
              <div className="books-heading">
                <div>
                  <h2>Biblioteca de libros</h2>
                  <p>Administra los libros de tu catálogo digital.</p>
                </div>

                <button className="add-book-button" onClick={nuevoLibro}>
                  <Plus size={18} />
                  Agregar libro
                </button>
              </div>

              {errorLibros && <p className="books-error">{errorLibros}</p>}

              {cargandoLibros ? (
                <p className="books-message">Cargando libros...</p>
              ) : libros.length === 0 ? (
                <div className="books-empty">
                  <BookOpen size={42} />
                  <h3>Aún no hay libros</h3>
                  <p>Agrega tu primer libro a la biblioteca.</p>
                </div>
              ) : (
                <div className="books-list">
                  {libros.map((libro) => (
                    <article className="book-item" key={libro.id}>
                      <div className="book-cover">
                        {libro.portada ? (
                          <img src={libro.portada} alt={libro.titulo} />
                        ) : (
                          <BookOpen size={32} />
                        )}
                      </div>

                      <div className="book-information">
                        <h3>{libro.titulo}</h3>
                        <p>{libro.autor || "Autor no especificado"}</p>
                        <p>{obtenerNombreCategoria(libro.categoriaId)}</p>

                        <span
                          className={
                            libro.publicado
                              ? "book-status published"
                              : "book-status draft"
                          }
                        >
                          {libro.publicado ? "Publicado" : "No publicado"}
                        </span>
                      </div>

                      <div className="book-actions">
                        <button
                          onClick={() => editarLibro(libro)}
                          title="Editar libro"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => eliminarLibro(libro.id)}
                          title="Eliminar libro"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CURSOS */}
          {active === "Cursos" && (
            <div className="panel-card books-panel">
              <div className="books-heading">
                <div>
                  <h2>Biblioteca de cursos</h2>
                  <p>Administra los cursos de tu catálogo digital.</p>
                </div>

                <button className="add-book-button" onClick={nuevoCurso}>
                  <Plus size={18} />
                  Agregar curso
                </button>
              </div>

              {cargandoCursos ? (
                <p className="books-message">Cargando cursos...</p>
              ) : cursos.length === 0 ? (
                <div className="books-empty">
                  <GraduationCap size={42} />
                  <h3>Aún no hay cursos</h3>
                  <p>Agrega tu primer curso a la biblioteca.</p>
                </div>
              ) : (
                <div className="books-list">
                  {cursos.map((curso) => (
                    <article className="book-item" key={curso.id}>
                      <div className="book-cover">
                        {curso.portada ? (
                          <img src={curso.portada} alt={curso.titulo} />
                        ) : (
                          <GraduationCap size={32} />
                        )}
                      </div>

                      <div className="book-information">
                        <h3>{curso.titulo}</h3>
                        <p>{curso.descripcion || "Sin descripción"}</p>
                        <p>{obtenerNombreCategoria(curso.categoriaId)}</p>

                        <span
                          className={
                            curso.publicado
                              ? "book-status published"
                              : "book-status draft"
                          }
                        >
                          {curso.publicado ? "Publicado" : "No publicado"}
                        </span>
                      </div>

                      <div className="book-actions">
                        <button
                          onClick={() => editarCurso(curso)}
                          title="Editar curso"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => eliminarCurso(curso.id)}
                          title="Eliminar curso"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORÍAS */}
          {active === "Categorías" && (
            <div className="panel-card books-panel">
              <div className="books-heading">
                <div>
                  <h2>Administrar categorías</h2>
                  <p>
                    Organiza tus libros y cursos por temas o áreas de interés.
                  </p>
                </div>

                <button className="add-book-button" onClick={nuevaCategoria}>
                  <Plus size={18} />
                  Nueva categoría
                </button>
              </div>

              {errorCategorias && (
                <p className="books-error">{errorCategorias}</p>
              )}

              {cargandoCategorias ? (
                <p className="books-message">Cargando categorías...</p>
              ) : categorias.length === 0 ? (
                <div className="books-empty">
                  <FolderOpen size={42} />
                  <h3>Aún no hay categorías</h3>
                  <p>
                    Crea tu primera categoría para organizar el contenido.
                  </p>
                </div>
              ) : (
                <div className="books-list">
                  {categorias.map((categoria) => (
                    <article className="book-item" key={categoria.id}>
                      <div className="book-cover">
                        <FolderOpen size={32} />
                      </div>

                      <div className="book-information">
                        <h3>{categoria.nombre}</h3>
                        <p>{categoria.descripcion || "Sin descripción"}</p>
                        <p>
                          Tipo:{" "}
                          {categoria.tipo === "libros"
                            ? "Libros"
                            : categoria.tipo === "cursos"
                              ? "Cursos"
                              : "Libros y cursos"}
                        </p>

                        <span
                          className={
                            categoria.activa !== false
                              ? "book-status published"
                              : "book-status draft"
                          }
                        >
                          {categoria.activa !== false ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <div className="book-actions">
                        <button
                          onClick={() => editarCategoria(categoria)}
                          title="Editar categoría"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => eliminarCategoria(categoria)}
                          title="Eliminar categoría"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PORTADAS */}
          {active === "Portadas" && (
            <div className="panel-card books-panel">
              <div className="books-heading">
                <div>
                  <h2>Galería de portadas</h2>
                  <p>
                    Consulta y administra las imágenes de tus libros y cursos.
                  </p>
                </div>
                <Images size={30} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "15px",
                  marginBottom: "25px",
                }}
              >
                <div className="stat-card">
                  <span>Contenidos registrados</span>
                  <strong>{portadas.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Con portada</span>
                  <strong>{totalConPortada}</strong>
                </div>
                <div className="stat-card">
                  <span>Sin portada</span>
                  <strong>{totalSinPortada}</strong>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "22px",
                }}
              >
                {[
                  { id: "todos", texto: "Todos" },
                  { id: "libros", texto: "Libros" },
                  { id: "cursos", texto: "Cursos" },
                  { id: "sin-portada", texto: "Sin portada" },
                ].map((filtro) => (
                  <button
                    key={filtro.id}
                    onClick={() => setFiltroPortadas(filtro.id)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      color: "white",
                      background:
                        filtroPortadas === filtro.id
                          ? "#7653d6"
                          : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {filtro.texto}
                  </button>
                ))}
              </div>

              {cargandoLibros || cargandoCursos ? (
                <p className="books-message">Cargando galería...</p>
              ) : portadasFiltradas.length === 0 ? (
                <div className="books-empty">
                  <Image size={42} />
                  <h3>No hay contenidos en esta selección</h3>
                  <p>
                    Agrega libros o cursos, o cambia el filtro de la galería.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(155px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {portadasFiltradas.map((item) => (
                    <article
                      key={`${item.tipoContenido}-${item.id}`}
                      style={{
                        minWidth: 0,
                        overflow: "hidden",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.045)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    >
                      <div
                        style={{
                          height: "205px",
                          background: "rgba(100,75,170,0.18)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {item.portada ? (
                          <img
                            src={item.portada}
                            alt={item.titulo || "Portada"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div style={{ textAlign: "center", opacity: 0.65 }}>
                            {item.tipoContenido === "libro" ? (
                              <BookOpen size={42} />
                            ) : (
                              <GraduationCap size={42} />
                            )}
                            <p style={{ fontSize: "12px" }}>Sin portada</p>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "13px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#d5b66d",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.coleccion}
                        </span>

                        <h3
                          style={{
                            fontSize: "14px",
                            margin: "7px 0",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.titulo || "Sin título"}
                        </h3>

                        <p
                          style={{
                            fontSize: "12px",
                            opacity: 0.7,
                            marginBottom: "12px",
                          }}
                        >
                          {obtenerNombreCategoria(item.categoriaId)}
                        </p>

                        <button
                          className="add-book-button"
                          style={{
                            width: "100%",
                            justifyContent: "center",
                          }}
                          onClick={() =>
                            item.tipoContenido === "libro"
                              ? editarLibro(item)
                              : editarCurso(item)
                          }
                        >
                          <Pencil size={15} />
                          Editar contenido
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONFIGURACIÓN */}
          {active === "Configuración" && (
            <div className="panel-card books-panel">
              <div className="books-heading">
                <div>
                  <h2>Configuración de la biblioteca</h2>
                  <p>Personaliza la información general de tu biblioteca.</p>
                </div>
                <Settings size={30} />
              </div>

              <form onSubmit={guardarConfiguracion}>
                <div className="book-modal">
                  <label>Nombre de la biblioteca</label>
                  <input
                    type="text"
                    value={configuracion.nombre}
                    onChange={(e) =>
                      setConfiguracion((anterior) => ({
                        ...anterior,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Nombre de la biblioteca"
                    required
                  />

                  <label>Descripción</label>
                  <textarea
                    value={configuracion.descripcion}
                    onChange={(e) =>
                      setConfiguracion((anterior) => ({
                        ...anterior,
                        descripcion: e.target.value,
                      }))
                    }
                    placeholder="Descripción de la biblioteca"
                    rows="4"
                  />

                  <div className="book-modal-actions">
                    <button
                      type="submit"
                      className="save-book-button"
                      disabled={guardandoConfiguracion}
                    >
                      <Save size={17} />
                      {guardandoConfiguracion ? "Guardando..." : "Guardar configuración"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>

      {/* FORMULARIO DE LIBROS Y CURSOS */}
      {mostrarFormulario && (
        <div className="book-modal-overlay">
          <div className="book-modal">
            <div className="book-modal-heading">
              <div>
                <h2>
                  {editandoId
                    ? active === "Cursos"
                      ? "Editar curso"
                      : "Editar libro"
                    : active === "Cursos"
                      ? "Agregar curso"
                      : "Agregar libro"}
                </h2>
                <p>Información del contenido digital.</p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
              >
                <X />
              </button>
            </div>

            <form
              onSubmit={active === "Cursos" ? guardarCurso : guardarLibro}
            >
              <label>
                {active === "Cursos"
                  ? "Título del curso *"
                  : "Título del libro *"}
              </label>

              <input
                name="titulo"
                value={formulario.titulo}
                onChange={manejarCambio}
                placeholder={
                  active === "Cursos"
                    ? "Nombre del curso"
                    : "Nombre del libro"
                }
                required
              />

              {active === "Libros" && (
                <>
                  <label>Autor</label>
                  <input
                    name="autor"
                    value={formulario.autor}
                    onChange={manejarCambio}
                    placeholder="Nombre del autor"
                  />
                </>
              )}

              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={manejarCambio}
                placeholder="Descripción del contenido"
                rows="3"
              />

              <label>Categoría</label>
              <select
                name="categoriaId"
                value={formulario.categoriaId}
                onChange={manejarCambio}
              >
                <option value="">Sin categoría</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>

              <label>URL de la portada</label>
              <input
                name="portada"
                value={formulario.portada}
                onChange={manejarCambio}
                placeholder="https://..."
              />

              <div className="pdf-github-section">
                <label>Documento PDF en GitHub</label>
                <p style={{ fontSize: "12px", opacity: 0.7 }}>
                  Escribe el nombre exacto del archivo que subiste a GitHub.
                </p>

                <input
                  type="text"
                  value={nombreArchivoPDF}
                  onChange={(e) => setNombreArchivoPDF(e.target.value)}
                  placeholder="Ejemplo: matematicas.pdf"
                />

                <button
                  type="button"
                  className="add-book-button"
                  onClick={generarEnlacePDF}
                  style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
                >
                  <Link size={16} />
                  Generar enlace de GitHub
                </button>

                <label style={{ marginTop: "18px", display: "block" }}>
                  URL del PDF
                </label>
                <input
                  name="pdfUrl"
                  value={formulario.pdfUrl}
                  onChange={manejarCambio}
                  placeholder="El enlace aparecerá aquí"
                />

                <button
                  type="button"
                  className="add-book-button"
                  disabled={!formulario.pdfUrl}
                  onClick={() =>
                    window.open(formulario.pdfUrl, "_blank", "noopener,noreferrer")
                  }
                  style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
                >
                  <ExternalLink size={16} />
                  Probar documento
                </button>
              </div>

              <label className="book-publish-option">
                <input
                  type="checkbox"
                  name="publicado"
                  checked={formulario.publicado}
                  onChange={manejarCambio}
                />
                Publicar este {active === "Cursos" ? "curso" : "libro"}
              </label>

              <div className="book-modal-actions">
                <button
                  type="button"
                  className="cancel-book-button"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="save-book-button">
                  <Save size={17} />
                  Guardar {active === "Cursos" ? "curso" : "libro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMULARIO DE CATEGORÍAS */}
      {mostrarFormularioCategoria && (
        <div className="book-modal-overlay">
          <div className="book-modal">
            <div className="book-modal-heading">
              <div>
                <h2>
                  {editandoCategoriaId
                    ? "Editar categoría"
                    : "Nueva categoría"}
                </h2>
                <p>Organiza el contenido de tu biblioteca.</p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarFormularioCategoria(false)}
              >
                <X />
              </button>
            </div>

            <form onSubmit={guardarCategoria}>
              <label>Nombre de la categoría *</label>
              <input
                name="nombre"
                value={formularioCategoria.nombre}
                onChange={manejarCambioCategoria}
                placeholder="Ej. Tecnología, Historia, Matemáticas..."
                required
              />

              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formularioCategoria.descripcion}
                onChange={manejarCambioCategoria}
                placeholder="Describe brevemente esta categoría"
                rows="3"
              />

              <label>Sección a la que pertenece</label>
              <select
                name="tipo"
                value={formularioCategoria.tipo}
                onChange={manejarCambioCategoria}
              >
                <option value="ambos">Libros y cursos</option>
                <option value="libros">Solo libros</option>
                <option value="cursos">Solo cursos</option>
              </select>

              <label className="book-publish-option">
                <input
                  type="checkbox"
                  name="activa"
                  checked={formularioCategoria.activa}
                  onChange={manejarCambioCategoria}
                />
                Categoría activa
              </label>

              <div className="book-modal-actions">
                <button
                  type="button"
                  className="cancel-book-button"
                  onClick={() => setMostrarFormularioCategoria(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="save-book-button">
                  <Save size={17} />
                  Guardar categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
