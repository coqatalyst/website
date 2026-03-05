import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";

const BASE = import.meta.env.BASE_URL ?? "/";

function BlogList() {
  const [search, setSearch] = useState("");
  const blogs = useQuery(api.blogs.listBlogs);

  if (blogs === undefined)
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

  if (!blogs || blogs.length === 0)
    return (
      <div className="empty-blog">
        <div className="font-display empty-blog-title">NO POSTS YET</div>
        <p className="font-mono empty-blog-sub">Check back soon.</p>
        <style>{`
          .empty-blog { padding: 80px 24px; text-align: center; }
          .empty-blog-title { font-size: 2.5rem; color: rgba(245,240,232,0.2); letter-spacing: 0.05em; margin-bottom: 12px; }
          .empty-blog-sub { font-size: 0.72rem; color: rgba(245,240,232,0.2); letter-spacing: 0.1em; }
        `}</style>
      </div>
    );

  const q = search.trim().toLowerCase();
  const filtered = q
    ? blogs.filter((b) => b.title.toLowerCase().includes(q))
    : blogs;

  const featured = q ? null : blogs.find((b) => b.featured);
  const rest = filtered.filter((b) => !b.featured || !!q);
  const totalVisible = (featured && !q ? 1 : 0) + rest.length;

  return (
    <>
      <div className="search-wrap">
        <div className="search-box">
          <span className="search-icon font-mono">⌖</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search posts by title..."
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

      <div className="blog-body container">
        {featured && !q && (
          <div className="featured-wrap">
            <div className="featured-card">
              <div className="stripe-accent featured-stripe"></div>
              <div className="featured-inner">
                <div className="featured-tags">
                  <span className="tag-pill tag-pill--green font-mono">
                    Featured
                  </span>
                  <span className="featured-cat font-mono">{featured.tag}</span>
                </div>
                <h2 className="font-display featured-title">
                  {featured.title}
                </h2>
                <p className="featured-excerpt">{featured.excerpt}</p>
                <div className="featured-meta">
                  <span className="meta-text font-mono">
                    {featured.author} · {featured.date}
                  </span>
                  <a
                    href={`${BASE}blog/${featured.slug}`}
                    className="btn-primary"
                  >
                    Read →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="posts-grid">
            {rest.map((post) => (
              <article key={post._id} className="post-card sharp-card">
                <div className="post-card-top">
                  <span
                    className="post-tag font-mono"
                    style={{ color: post.accent }}
                  >
                    {post.tag}
                  </span>
                </div>
                <h3 className="post-title font-display">{post.title}</h3>
                <p className="post-excerpt">{post.excerpt}</p>
                <div className="post-foot">
                  <span className="post-byline font-mono">
                    {post.author} · {post.date}
                  </span>
                  <a
                    href={`${BASE}blog/${post.slug}`}
                    className="post-link font-mono"
                    style={{ color: post.accent }}
                  >
                    Read →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {q && totalVisible === 0 && (
          <div className="no-results">
            <div className="no-results-title font-display">NO POSTS FOUND</div>
            <p className="no-results-sub font-mono">
              Try a different search term.
            </p>
          </div>
        )}
      </div>

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

        .blog-body { padding: 32px 24px 100px; }
        .featured-wrap { margin-bottom: 44px; }
        .featured-card { background: linear-gradient(135deg, rgba(34,109,11,0.1), rgba(223,166,81,0.05)); border: 1px solid rgba(34,109,11,0.25); clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px)); position: relative; overflow: hidden; }
        .featured-stripe { position: absolute; inset: 0; opacity: 0.18; pointer-events: none; }
        .featured-inner { padding: 48px; position: relative; z-index: 1; }
        .featured-tags { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
        .tag-pill { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; }
        .tag-pill--green { background: #226d0b; color: white; }
        .featured-cat { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: #226d0b; }
        .featured-title { font-size: clamp(1.8rem, 3vw, 2.8rem); color: #f5f0e8; line-height: 1.1; letter-spacing: 0.02em; margin-bottom: 16px; }
        .featured-excerpt { color: rgba(245,240,232,0.6); font-size: 0.9rem; line-height: 1.7; max-width: 600px; margin-bottom: 24px; }
        .featured-meta { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
        .meta-text { font-size: 0.62rem; color: rgba(245,240,232,0.4); letter-spacing: 0.05em; }

        .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-bottom: 56px; }
        .post-card { padding: 28px; transition: transform 0.2s, box-shadow 0.2s; }
        .post-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .post-card-top { margin-bottom: 14px; }
        .post-tag { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; }
        .post-title { font-size: 1.4rem; letter-spacing: 0.03em; color: #f5f0e8; line-height: 1.1; margin-bottom: 12px; }
        .post-excerpt { color: rgba(245,240,232,0.5); font-size: 0.82rem; line-height: 1.7; margin-bottom: 20px; }
        .post-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
        .post-byline { font-size: 0.58rem; color: rgba(245,240,232,0.3); }
        .post-link { font-size: 0.62rem; text-decoration: none; letter-spacing: 0.1em; transition: opacity 0.2s; }
        .post-link:hover { opacity: 0.7; }

        .no-results { padding: 80px 24px; text-align: center; }
        .no-results-title { font-size: 2.5rem; color: rgba(245,240,232,0.2); letter-spacing: 0.05em; margin-bottom: 12px; }
        .no-results-sub { font-size: 0.72rem; color: rgba(245,240,232,0.2); letter-spacing: 0.1em; }

        @media (max-width: 600px) {
          .featured-inner { padding: 24px; }
          .posts-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}

export default withConvexProvider(BlogList);
