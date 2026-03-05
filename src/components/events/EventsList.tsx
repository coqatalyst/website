import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";
import EventRegisterModal from "./EventRegisterModal";

const BASE = import.meta.env.BASE_URL ?? "/";

function EventsList() {
  const events = useQuery(api.events.listEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [AuthModal, setAuthModal] = useState<React.ComponentType<any> | null>(
    null,
  );

  const sessionToken =
    typeof window !== "undefined" ? localStorage.getItem("cq_session") : null;

  const handleRegisterClick = (eventId: string) => {
    if (!sessionToken) {
      import("../auth/AuthModal").then((m) => setAuthModal(() => m.default));
      setShowAuth(true);
      return;
    }
    setSelectedEventId(eventId);
  };

  if (events === undefined)
    return (
      <div className="events-loading">
        <div className="loading-dots font-mono">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );

  if (!events || events.length === 0) return null;

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  return (
    <>
      {upcoming.length > 0 && (
        <div className="ev-section">
          <div className="section-tag" style={{ marginBottom: 32 }}>
            Upcoming
          </div>
          <div className="ev-grid">
            {upcoming.map((ev) => (
              <div key={ev._id} className="ev-card-wrapper">
                <a
                  href={`${BASE}events/${ev.slug}`}
                  className="ev-card-link"
                  title={ev.title}
                >
                  <div
                    className="ev-card sharp-card"
                    style={{ "--accent": ev.accent } as any}
                  >
                    <div className="ev-card-header">
                      <span
                        className="ev-tag font-mono"
                        style={{ color: ev.accent }}
                      >
                        {ev.tag}
                      </span>
                      <span className="ev-badge ev-badge--upcoming font-mono">
                        Upcoming
                      </span>
                    </div>
                    <h3 className="font-display ev-title">{ev.title}</h3>
                    <p className="ev-desc">{ev.excerpt}</p>
                    <div className="ev-meta">
                      <div className="ev-meta-row font-mono">
                        <span className="ev-meta-label">Date</span>
                        <span className="ev-meta-val">{ev.date}</span>
                      </div>
                      <div className="ev-meta-row font-mono">
                        <span className="ev-meta-label">Where</span>
                        <span className="ev-meta-val">{ev.location}</span>
                      </div>
                      <div className="ev-meta-row font-mono">
                        <span className="ev-meta-label">Price</span>
                        <span className="ev-meta-val">
                          {ev.isFree ? "Free" : `₹${ev.price}`}
                        </span>
                      </div>
                      <div className="ev-meta-row font-mono">
                        <span className="ev-meta-label">Capacity</span>
                        <span className="ev-meta-val">{ev.capacity} seats</span>
                      </div>
                    </div>
                    <div
                      className="ev-accent-line"
                      style={{ background: ev.accent }}
                    ></div>
                  </div>
                </a>
                <button
                  className="btn-primary ev-cta"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRegisterClick(ev._id);
                  }}
                >
                  Register →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="ev-section">
          <div className="section-tag" style={{ marginBottom: 32 }}>
            Past Events
          </div>
          <div className="ev-grid">
            {past.map((ev) => (
              <div key={ev._id} className="ev-card-wrapper">
                <a
                  href={`${BASE}events/${ev.slug}`}
                  className="ev-card-link"
                  title={ev.title}
                >
                  <div className="ev-card ev-card--past sharp-card">
                    <div className="ev-card-header">
                      <span
                        className="ev-tag font-mono"
                        style={{ color: ev.accent }}
                      >
                        {ev.tag}
                      </span>
                      <span className="ev-badge ev-badge--past font-mono">
                        Past
                      </span>
                    </div>
                    <h3 className="font-display ev-title ev-title--past">
                      {ev.title}
                    </h3>
                    <p className="ev-desc ev-desc--past">{ev.excerpt}</p>
                    <div className="ev-meta">
                      <div className="ev-meta-row font-mono">
                        <span className="ev-meta-label">Date</span>
                        <span className="ev-meta-val">{ev.date}</span>
                      </div>
                      <div className="ev-meta-row font-mono">
                        <span className="ev-meta-label">Where</span>
                        <span className="ev-meta-val">{ev.location}</span>
                      </div>
                    </div>
                    <div
                      className="ev-accent-line"
                      style={{ background: ev.accent, opacity: 0.4 }}
                    ></div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEventId && (
        <EventRegisterModal
          eventId={selectedEventId as any}
          sessionToken={sessionToken!}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {showAuth && AuthModal && (
        <AuthModal
          onSuccess={() => {
            setShowAuth(false);
            window.location.reload();
          }}
          onClose={() => setShowAuth(false)}
        />
      )}

      <style>{`
        .events-loading { display: flex; justify-content: center; padding: 80px 0; }
        .loading-dots { display: flex; gap: 8px; align-items: center; }
        .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: #226d0b; animation: loadBlink 1s ease-in-out infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes loadBlink { 0%,100%{opacity:.2} 50%{opacity:1} }
        
        .ev-section { margin-bottom: 72px; }
        .ev-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 28px; }
        
        .ev-card-wrapper { display: flex; flex-direction: column; }
        .ev-card-link { text-decoration: none; color: inherit; flex: 1; display: block; }
        .ev-card { padding: 28px; position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1); display: flex; flex-direction: column; height: 100%; }
        .ev-card-link:hover .ev-card { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.4); }
        
        .ev-cta { transition: all 0.2s; margin-top: auto; }
        .ev-card-link:hover .ev-cta { transform: translateX(2px); }
        
        .ev-card--past { opacity: 0.7; }
        .ev-card--past:hover { opacity: 1; }
        
        .ev-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
        .ev-tag { font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; padding: 4px 8px; }
        .ev-badge { font-size: 0.60rem; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%); white-space: nowrap; }
        .ev-badge--upcoming { background: rgba(34,109,11,.2); color: #226d0b; border: 1px solid rgba(34,109,11,.35); }
        .ev-badge--past { background: rgba(255,255,255,.05); color: rgba(245,240,232,.4); border: 1px solid rgba(255,255,255,.08); }
        
        .ev-title { font-size: 1.4rem; letter-spacing: 0.02em; color: #f5f0e8; line-height: 1.2; margin-bottom: 12px; }
        .ev-title--past { color: rgba(245,240,232,.65); }
        
        .ev-desc { font-size: 0.9rem; color: rgba(245,240,232,.6); line-height: 1.6; margin-bottom: 24px; flex-grow: 1; }
        .ev-desc--past { color: rgba(245,240,232,.5); }
        
        .ev-meta { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
        .ev-meta-row { display: flex; gap: 12px; font-size: 0.70rem; letter-spacing: 0.1em; align-items: baseline; }
        .ev-meta-label { text-transform: uppercase; color: rgba(245,240,232,.35); font-weight: 600; min-width: 70px; }
        .ev-meta-val { color: rgba(245,240,232,.7); }
        
        .ev-accent-line { height: 2px; width: 40px; margin-top: 0; transition: width 0.3s cubic-bezier(0.23, 1, 0.320, 1); border-radius: 1px; }
        .ev-card-link:hover .ev-accent-line { width: 100%; }
        
        @media (max-width: 640px) {
          .ev-grid { grid-template-columns: 1fr; gap: 24px; }
          .ev-card { padding: 24px; }
          .ev-title { font-size: 1.25rem; }
          .ev-desc { font-size: 0.85rem; }
          .ev-meta-row { font-size: 0.65rem; gap: 8px; }
        }
      `}</style>
    </>
  );
}

export default withConvexProvider(EventsList);
