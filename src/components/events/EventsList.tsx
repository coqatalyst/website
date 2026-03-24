import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";
import EventRegisterModal from "./EventRegisterModal";

const BASE = import.meta.env.BASE_URL ?? "/";

function EventsList() {
  const events = useQuery(api.events.listEvents);
  const [search, setSearch] = useState("");
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
        <style>{`
          .events-loading { display: flex; justify-content: center; padding: 80px 0; }
          .loading-dots { display: flex; gap: 8px; align-items: center; }
          .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: #226d0b; animation: loadBlink 1s ease-in-out infinite; }
          .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
          .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes loadBlink { 0%,100%{opacity:.2} 50%{opacity:1} }
        `}</style>
      </div>
    );

  if (!events || events.length === 0)
    return (
      <div className="empty-events">
        <div className="font-display empty-events-title">NO EVENTS YET</div>
        <p className="font-mono empty-events-sub">
          Check back soon for exciting workshops and sessions.
        </p>
        <style>{`
          .empty-events { padding: 80px 24px; text-align: center; }
          .empty-events-title { font-size: 2.5rem; color: rgba(245,240,232,0.2); letter-spacing: 0.05em; margin-bottom: 12px; }
          .empty-events-sub { font-size: 0.72rem; color: rgba(245,240,232,0.2); letter-spacing: 0.1em; }
        `}</style>
      </div>
    );

  const q = search.trim().toLowerCase();
  const filtered = q
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q),
      )
    : events;

  const upcoming = filtered.filter((e) => new Date(e.date) >= new Date());
  const past = filtered.filter((e) => new Date(e.date) < new Date());

  const totalVisible = upcoming.length + past.length;

  return (
    <>
      <div className="search-wrap" style={{ paddingTop: "24px" }}>
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(203, 27, 58, 0.08)",
            borderRadius: "4px",
            border: "1px solid rgba(203, 27, 58, 0.2)",
            marginBottom: "12px",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#cb1b3a",
              margin: "0",
              lineHeight: "1.4",
            }}
          >
            No Payment for Below Poverty Line Individuals
          </p>
        </div>
      </div>

      <div className="search-wrap">
        <div className="search-box">
          <span className="search-icon font-mono">⌖</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search events by title or tag..."
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <span
              className="search-clear font-mono"
              onClick={() => setSearch("")}
              style={{ cursor: "pointer" }}
            >
              ✕
            </span>
          )}
        </div>
        {q && (
          <p className="search-count font-mono">
            {totalVisible === 0
              ? "No results"
              : `${totalVisible} result${totalVisible !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <div className="container ev-body">
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
                          <span className="ev-meta-val">
                            {ev.capacity} seats
                          </span>
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

        {q && totalVisible === 0 && (
          <div className="no-results">
            <div className="no-results-title font-display">NO EVENTS FOUND</div>
            <p className="no-results-sub font-mono">
              Try a different search term.
            </p>
          </div>
        )}
      </div>

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
        .search-wrap { padding: 32px 24px 8px; display: flex; flex-direction: column; gap: 10px; max-width: 1280px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .search-box { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 14px 18px; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); transition: border-color 0.2s; }
        .search-box:focus-within { border-color: #226d0b; box-shadow: 0 0 0 1px rgba(34,109,11,0.2); }
        .search-icon { font-size: 1.1rem; color: rgba(245,240,232,0.3); flex-shrink: 0; }
        .search-input { flex: 1; background: none; border: none; outline: none; color: #f5f0e8; font-family: 'Syne', sans-serif; font-size: 0.95rem; }
        .search-input::placeholder { color: rgba(245,240,232,0.28); }
        .search-clear { font-size: 0.75rem; color: rgba(245,240,232,0.35); flex-shrink: 0; transition: color 0.15s; }
        .search-clear:hover { color: #cb1b3a; }
        .search-count { font-size: 0.62rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(245,240,232,0.3); min-height: 1em; }

        .ev-body { padding: 32px 24px 100px; }

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

        .no-results { padding: 80px 24px; text-align: center; }
        .no-results-title { font-size: 2.5rem; color: rgba(245,240,232,0.2); letter-spacing: 0.05em; margin-bottom: 12px; }
        .no-results-sub { font-size: 0.72rem; color: rgba(245,240,232,0.2); letter-spacing: 0.1em; }

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
