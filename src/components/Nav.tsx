import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { withConvexProvider } from "../lib/convex";

const BASE = import.meta.env.BASE_URL ?? "/";

interface NavProps {
  currentPath?: string;
}

function Nav({ currentPath = "/" }: NavProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [AuthModal, setAuthModal] = useState<React.ComponentType<any> | null>(
    null,
  );

  useEffect(() => {
    setSessionToken(localStorage.getItem("cq_session"));
    // Lazy load AuthModal
    import("./auth/AuthModal").then((m) => setAuthModal(() => m.default));
  }, []);

  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );

  const logout = useMutation(api.auth.logout);

  const handleLogout = async () => {
    if (sessionToken) {
      await logout({ sessionToken });
      localStorage.removeItem("cq_session");
      setSessionToken(null);
      window.location.href = BASE;
    }
  };

  const handleAuthSuccess = (u: any, token: string) => {
    setSessionToken(token);
    setShowAuth(false);
    window.location.reload();
  };

  const isActive = (path: string) =>
    currentPath === path || currentPath === `${BASE}${path}`.replace("//", "/");

  const links = [
    { href: `${BASE}`, label: "Home" },
    { href: `${BASE}about`, label: "About" },
    { href: `${BASE}events`, label: "Events" },
    { href: `${BASE}blog`, label: "Blog" },
    { href: `${BASE}contact`, label: "Contact" },
  ];

  return (
    <>
      <nav className="cq-nav">
        <div className="nav-container">
          <a href={BASE} className="nav-brand font-display">
            <img
              src={`${BASE}assets/logo-icon.png`}
              alt="CQ"
              width="32"
              height="32"
              style={{ borderRadius: 6, marginRight: 10 }}
            />
            COQATALYST
          </a>

          <div className="nav-links hide-mobile">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`nav-link${isActive(l.href) ? " active" : ""}`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="nav-auth hide-mobile">
            {user ? (
              <div className="nav-user">
                <a
                  href={`${BASE}dashboard`}
                  className="btn-outline"
                  style={{ padding: "8px 16px", fontSize: "0.65rem" }}
                >
                  Dashboard
                </a>
                {user.isAdmin && (
                  <a
                    href={`${BASE}admin`}
                    className="btn-outline"
                    style={{ padding: "8px 16px", fontSize: "0.65rem" }}
                  >
                    Admin ⚙
                  </a>
                )}
                <div className="user-pill font-mono">
                  <span className="user-dot"></span>
                  {user.name.split(" ")[0]}
                </div>
                <button className="nav-logout font-mono" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="btn-primary"
                onClick={() => setShowAuth(true)}
                style={{ padding: "8px 20px", fontSize: "0.65rem" }}
              >
                Sign In →
              </button>
            )}
          </div>

          <button
            className="nav-hamburger show-mobile font-mono"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="nav-mobile-menu">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`nav-mobile-link font-mono${isActive(l.href) ? " active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="nav-mobile-divider"></div>
            {user ? (
              <>
                <a
                  href={`${BASE}dashboard`}
                  className="nav-mobile-link font-mono"
                  onClick={() => setMobileOpen(false)}
                >
                  📊 Dashboard
                </a>
                {user.isAdmin && (
                  <a
                    href={`${BASE}admin`}
                    className="nav-mobile-link font-mono"
                    onClick={() => setMobileOpen(false)}
                  >
                    ⚙ Admin
                  </a>
                )}
                <span className="nav-mobile-user font-mono">{user.name}</span>
                <button
                  className="nav-mobile-link font-mono"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                className="btn-primary"
                style={{ margin: "8px 16px", fontSize: "0.72rem" }}
                onClick={() => {
                  setShowAuth(true);
                  setMobileOpen(false);
                }}
              >
                Sign In →
              </button>
            )}
          </div>
        )}
      </nav>

      {showAuth && AuthModal && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}

      <style>{`
        .cq-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(10,10,10,0.9); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          height: 67px;
        }
        .nav-container {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          height: 100%; display: flex; align-items: center; gap: 32px;
        }
        .nav-brand {
          display: flex; align-items: center;
          font-size: 1.1rem; letter-spacing: 0.1em; color: #f5f0e8;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-links { display: flex; align-items: center; gap: 28px; flex: 1; }
        .nav-auth { margin-left: auto; }
        .nav-user { display: flex; align-items: center; gap: 12px; }
        .user-pill {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(245,240,232,0.6); padding: 6px 12px;
          border: 1px solid rgba(255,255,255,0.1);
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }
        .user-dot { width: 6px; height: 6px; border-radius: 50%; background: #226d0b; box-shadow: 0 0 6px #226d0b; flex-shrink: 0; }
        .nav-logout {
          background: none; border: none; cursor: pointer;
          font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(245,240,232,0.35); transition: color 0.2s;
        }
        .nav-logout:hover { color: #cb1b3a; }
        .nav-hamburger {
          margin-left: auto; background: none; border: none;
          color: #f5f0e8; font-size: 1.1rem; cursor: pointer; padding: 8px;
        }
        .nav-mobile-menu {
          display: flex; flex-direction: column;
          background: #0d0d0d; border-top: 1px solid rgba(255,255,255,0.06);
          padding: 12px 0;
        }
        .nav-mobile-link {
          padding: 12px 24px; font-size: 0.72rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(245,240,232,0.6);
          text-decoration: none; transition: color 0.15s;
        }
        .nav-mobile-link:hover, .nav-mobile-link.active { color: #dfa651; }
        .nav-mobile-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 8px 0; }
        .nav-mobile-user { padding: 8px 24px; font-size: 0.65rem; letter-spacing: 0.1em; color: #226d0b; text-transform: uppercase; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}

export default withConvexProvider(Nav);
