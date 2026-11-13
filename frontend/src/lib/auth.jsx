import { createContext, useContext, useState } from "react";
import { setActivityUser, updateProfile } from "./activity";
import { api } from "./api";

// Session kept in this browser. The token (when the backend issued one) lives in lib/api.js.
// user = { id, name, phone, email, since } — `id` is the phone or email they signed in with.
const AuthCtx = createContext(null);
const KEY = "avodah.session";

const read = () => {
  try {
    const u = JSON.parse(localStorage.getItem(KEY));
    return u ? { ...u, id: u.id ?? u.phone ?? u.email } : null; // older sessions only stored { phone }
  } catch {
    return null;
  }
};

const initial = read();
setActivityUser(initial?.id ?? null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initial);

  /** Starts a session from the backend's user object (or a local demo one). */
  const login = ({ id, name = "", phone = null, email = null, since }) => {
    const u = { id, name, phone, email, since: since ?? user?.since ?? Date.now() };
    setUser(u);
    setActivityUser(id);
    const contact = { ...(name && { name }), ...(phone && { phone }), ...(email && { email }) };
    if (Object.keys(contact).length) updateProfile(contact);
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* storage unavailable */ }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setUser(null);
    setActivityUser(null);
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/** "+91 98765 43210" or the email address. */
export const contactLabel = (u) => (u?.phone ? `+91 ${u.phone.slice(0, 5)} ${u.phone.slice(5)}` : u?.email ?? "");
