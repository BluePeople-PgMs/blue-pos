/** Mensajes legibles para errores comunes de Supabase Auth. */
export function mensajeErrorAuth(mensaje: string): string {
  const m = mensaje.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos. Si es tu primera vez, usa «Crear cuenta» abajo.";
  }
  if (m.includes("email not confirmed")) {
    return "Tu correo aún no está confirmado. Pide al facilitador que confirme el usuario en Supabase o revisa tu bandeja.";
  }
  if (m.includes("email rate limit") || m.includes("over_email_send_rate_limit")) {
    return "Supabase alcanzó el límite de correos. Pide al facilitador que cree tu usuario con «Auto confirm» en el dashboard.";
  }
  if (m.includes("user already registered")) {
    return "Ese correo ya está registrado. Usa «Ya tengo cuenta» e inicia sesión.";
  }
  if (m.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (m.includes("signup is disabled")) {
    return "El registro está deshabilitado en este proyecto. El facilitador debe darte un usuario.";
  }
  if (m.includes("invalid api key")) {
    return "Clave de Supabase inválida. Revisa NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local y reinicia npm run dev.";
  }

  return mensaje;
}