import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

// Ejemplo: 15 min de inactividad total (900s), avisa cuando quedan 2 min (780s)
const TIEMPO_AVISO_MS = 13 * 60 * 1000;
const TIEMPO_EXPIRACION_MS = 15 * 60 * 1000;

export default function ControlSesion({ onLogout }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [expirada, setExpirada] = useState(false);
  const timerAviso = useRef(null);
  const timerExpiracion = useRef(null);

  const reiniciarRelojes = useCallback(() => {
    // Si ya salió el cartel de aviso o ya expiró, no reiniciamos solo con mover el mouse
    if (mostrarModal || expirada) return;

    clearTimeout(timerAviso.current);
    clearTimeout(timerExpiracion.current);

    timerAviso.current = setTimeout(() => {
      setMostrarModal(true);
    }, TIEMPO_AVISO_MS);

    timerExpiracion.current = setTimeout(() => {
      setMostrarModal(false);
      setExpirada(true);
      localStorage.removeItem("token");
    }, TIEMPO_EXPIRACION_MS);
  }, [mostrarModal, expirada]);

  useEffect(() => {
    const eventos = ["mousedown", "keydown", "scroll", "touchstart"];

    eventos.forEach((ev) => window.addEventListener(ev, reiniciarRelojes));
    reiniciarRelojes();

    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, reiniciarRelojes));
      clearTimeout(timerAviso.current);
      clearTimeout(timerExpiracion.current);
    };
  }, [reiniciarRelojes]);

  const extenderSesion = async () => {
    try {
      const tokenActual = localStorage.getItem("token");

      const { data } = await axios.post(
        "http://127.0.0.1:8000/api/auth/extender-sesion",
        {},
        { headers: { Authorization: `Bearer ${tokenActual}` } }
      );

      localStorage.setItem("token", data.access_token);
      setMostrarModal(false);
      reiniciarRelojes();
    } catch {
      setMostrarModal(false);
      setExpirada(true);
    }
  };

  if (!mostrarModal && !expirada) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }}
      >
        {mostrarModal && !expirada ? (
          <>
            <h3 style={{ marginTop: 0, color: "#d97706" }}>
              ¿Seguís ahí? 🐾
            </h3>

            <p style={{ color: "#4b5563" }}>
              Notamos que no hubo actividad reciente. Tu sesión está por
              cerrarse por seguridad. ¿Querés mantenerla abierta?
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "20px"
              }}
            >
              <button
                onClick={extenderSesion}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Extender sesión
              </button>

              <button
                onClick={onLogout}
                style={{
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0, color: "#dc2626" }}>
              Sesión finalizada por inactividad
            </h3>

            <p style={{ color: "#4b5563" }}>
              Por tu seguridad, cerramos la sesión tras un período sin
              actividad. Volvé a ingresar para continuar trabajando.
            </p>

            <button
              onClick={onLogout}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                marginTop: "12px"
              }}
            >
              Ir al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
