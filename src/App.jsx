
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./services/firebase";

import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import Catalogo from "./components/Catalogo";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // El panel administrativo se abre desde /admin
  const esAdmin = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        Cargando...
      </div>
    );
  }

  // Página pública: catálogo de libros y cursos
  if (!esAdmin) {
    return <Catalogo />;
  }

  // Panel administrativo: requiere iniciar sesión
  if (!user) {
    return <Login />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => signOut(auth)}
    />
  );
}

export default App;
