import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { withConvexProvider } from "../../lib/convex";
import type { Id } from "../../../convex/_generated/dataModel";
import ImageUploader from "./ImageUploader";
import QRScanner from "../checkin/QRScanner";

const BASE = import.meta.env.BASE_URL ?? "/";

type Tab = "events" | "blogs" | "registrations" | "checkin" | "payments";

const ACCENT_OPTIONS = [
  { label: "Green", value: "#226d0b" },
  { label: "Gold", value: "#dfa651" },
  { label: "Orange", value: "#e88f1a" },
  { label: "Red", value: "#cb1b3a" },
  { label: "Pink", value: "#ffd1d1" },
];

const DEFAULT_EVENT = {
  title: "",
  slug: "",
  excerpt: "",
  description: "",
  date: "",
  location: "",
  capacity: 50,
  price: 0,
  imageGallery: [] as string[],
  coverImage: "",
  coverImageStorageId: undefined as string | undefined,
  imageGalleryStorageIds: undefined as string[] | undefined,
  tag: "Exhibition",
  accent: "#226d0b",
  featured: false,
  published: false,
};
const DEFAULT_BLOG = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "",
  date: new Date().toISOString().split("T")[0],
  tag: "Research",
  accent: "#226d0b",
  featured: false,
  published: false,
  coverImage: "",
  coverImageStorageId: undefined as string | undefined,
};

function AdminDashboard() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("events");

  const [eventForm, setEventForm] = useState(DEFAULT_EVENT);
  const [editingEventId, setEditingEventId] = useState<Id<"events"> | null>(
    null,
  );
  const [eventMsg, setEventMsg] = useState("");

  const [blogForm, setBlogForm] = useState(DEFAULT_BLOG);
  const [editingBlogId, setEditingBlogId] = useState<Id<"blogs"> | null>(null);
  const [blogMsg, setBlogMsg] = useState("");

  const [selectedEventForCheckin, setSelectedEventForCheckin] =
    useState<Id<"events"> | null>(null);

  const [selectedRegistration, setSelectedRegistration] =
    useState<Id<"registrations"> | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("cq_session");
    setSessionToken(token);
    setSessionLoaded(true);
  }, []);

  const user = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip",
  );
  const allEvents = useQuery(
    api.events.listAllEvents,
    sessionToken ? { sessionToken } : "skip",
  );
  const allBlogs = useQuery(
    api.blogs.listAllBlogs,
    sessionToken ? { sessionToken } : "skip",
  );
  const allRegistrations = useQuery(
    api.registrations.getAllRegistrations,
    sessionToken ? { sessionToken } : "skip",
  );
  const pendingPayments = useQuery(
    api.registrations.getPendingPaymentVerifications,
    sessionToken ? { sessionToken } : "skip",
  );

  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);

  const createBlog = useMutation(api.blogs.createBlog);
  const updateBlog = useMutation(api.blogs.updateBlog);
  const deleteBlog = useMutation(api.blogs.deleteBlog);

  const verifyPayment = useMutation(api.registrations.verifyPayment);

  if (!sessionLoaded) return <Loader />;
  if (!sessionToken) return <Redirect to={`${BASE}`} msg="Please sign in." />;
  if (user === undefined) return <Loader />;
  if (!user || !user.isAdmin)
    return <Redirect to={`${BASE}`} msg="Access denied." />;

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventMsg("");
    if (!sessionToken) return;
    try {
      if (editingEventId) {
        const res = await updateEvent({
          sessionToken,
          id: editingEventId,
          ...eventForm,
        });
        setEventMsg(res.success ? "✓ Event updated." : `✗ ${res.error}`);
      } else {
        const res = await createEvent({ sessionToken, ...eventForm });
        setEventMsg(res.success ? "✓ Event created." : `✗ ${res.error}`);
      }
      setEventForm(DEFAULT_EVENT);
      setEditingEventId(null);
    } catch (err: any) {
      setEventMsg(`✗ ${err.message}`);
    }
  };

  const handleEditEvent = (ev: any) => {
    setEditingEventId(ev._id);
    setEventForm({
      title: ev.title,
      slug: ev.slug,
      excerpt: ev.excerpt,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      capacity: ev.capacity,
      price: ev.price,
      imageGallery: ev.imageGallery,
      coverImage: ev.coverImage,
      coverImageStorageId: ev.coverImageStorageId,
      imageGalleryStorageIds: ev.imageGalleryStorageIds,
      tag: ev.tag,
      accent: ev.accent,
      featured: ev.featured,
      published: ev.published,
    });
    setTab("events");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEvent = async (id: Id<"events">) => {
    if (!sessionToken || !confirm("Delete this event?")) return;
    await deleteEvent({ sessionToken, id });
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlogMsg("");
    if (!sessionToken) return;
    try {
      if (editingBlogId) {
        const res = await updateBlog({
          sessionToken,
          id: editingBlogId,
          ...blogForm,
        });
        setBlogMsg(res.success ? "✓ Blog updated." : `✗ ${res.error}`);
      } else {
        const res = await createBlog({ sessionToken, ...blogForm });
        setBlogMsg(res.success ? "✓ Blog created." : `✗ ${res.error}`);
      }
      setBlogForm(DEFAULT_BLOG);
      setEditingBlogId(null);
    } catch (err: any) {
      setBlogMsg(`✗ ${err.message}`);
    }
  };

  const handleEditBlog = (b: any) => {
    setEditingBlogId(b._id);
    setBlogForm({
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      author: b.author,
      date: b.date,
      tag: b.tag,
      accent: b.accent,
      featured: b.featured,
      published: b.published,
      coverImage: b.coverImage,
      coverImageStorageId: b.coverImageStorageId,
    });
    setTab("blogs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteBlog = async (id: Id<"blogs">) => {
    if (!sessionToken || !confirm("Delete this blog post?")) return;
    await deleteBlog({ sessionToken, id });
  };

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-inner">
            <div>
              <div className="section-tag" style={{ marginBottom: 8 }}>
                Admin
              </div>
              <h1 className="font-display admin-h1">DASHBOARD</h1>
            </div>
            <div className="admin-user font-mono">
              <span className="user-dot"></span>
              {user.name}
            </div>
          </div>

          <div className="admin-stats">
            {[
              { label: "Events", val: allEvents?.length ?? "—" },
              { label: "Blogs", val: allBlogs?.length ?? "—" },
              { label: "Registrations", val: allRegistrations?.length ?? "—" },
            ].map((s) => (
              <div key={s.label} className="stat-chip sharp-card font-mono">
                <span className="stat-num font-display">{s.val}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-tabs-bar">
        <div className="container">
          <div className="admin-tabs">
            {(
              [
                "events",
                "blogs",
                "registrations",
                "checkin",
                "payments",
              ] as Tab[]
            ).map((t) => (
              <button
                key={t}
                className={`admin-tab font-mono${tab === t ? " active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container admin-body">
        {tab === "events" && (
          <div className="tab-content">
            <div className="form-section sharp-card">
              <h2 className="font-display section-title">
                {editingEventId ? "EDIT EVENT" : "CREATE EVENT"}
              </h2>
              <form onSubmit={handleEventSubmit} className="admin-form">
                <div className="form-row-2">
                  <Field label="Title">
                    <input
                      className="sharp-input"
                      value={eventForm.title}
                      required
                      onChange={(e) =>
                        setEventForm((p) => ({
                          ...p,
                          title: e.target.value,
                          slug: slugify(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Slug">
                    <input
                      className="sharp-input font-mono"
                      value={eventForm.slug}
                      required
                      onChange={(e) =>
                        setEventForm((p) => ({ ...p, slug: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Excerpt">
                  <input
                    className="sharp-input"
                    value={eventForm.excerpt}
                    required
                    onChange={(e) =>
                      setEventForm((p) => ({ ...p, excerpt: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className="sharp-input"
                    rows={5}
                    value={eventForm.description}
                    required
                    onChange={(e) =>
                      setEventForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    style={{ resize: "vertical" }}
                  />
                </Field>
                <div className="form-row-2">
                  <Field label="Date (e.g. Apr 20, 2026)">
                    <input
                      className="sharp-input"
                      value={eventForm.date}
                      required
                      onChange={(e) =>
                        setEventForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      className="sharp-input"
                      value={eventForm.location}
                      required
                      onChange={(e) =>
                        setEventForm((p) => ({
                          ...p,
                          location: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="form-row-3">
                  <Field label="Capacity">
                    <input
                      className="sharp-input"
                      type="number"
                      min={1}
                      value={eventForm.capacity}
                      onChange={(e) =>
                        setEventForm((p) => ({
                          ...p,
                          capacity: +e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Price (0 = Free)">
                    <input
                      className="sharp-input"
                      type="number"
                      min={0}
                      value={eventForm.price}
                      onChange={(e) =>
                        setEventForm((p) => ({ ...p, price: +e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Tag">
                    <input
                      className="sharp-input"
                      value={eventForm.tag}
                      onChange={(e) =>
                        setEventForm((p) => ({ ...p, tag: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="form-row-2">
                  <Field label="Cover Image URL">
                    <input
                      className="sharp-input"
                      value={eventForm.coverImage}
                      onChange={(e) =>
                        setEventForm((p) => ({
                          ...p,
                          coverImage: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Accent Color">
                    <div className="accent-picker">
                      {ACCENT_OPTIONS.map((a) => (
                        <button
                          type="button"
                          key={a.value}
                          className={`accent-swatch${eventForm.accent === a.value ? " selected" : ""}`}
                          style={{ background: a.value }}
                          title={a.label}
                          onClick={() =>
                            setEventForm((p) => ({ ...p, accent: a.value }))
                          }
                        />
                      ))}
                    </div>
                  </Field>
                </div>
                <Field label="Or Upload Cover Image">
                  <ImageUploader
                    sessionToken={sessionToken!}
                    onImageUpload={(storageId, url) => {
                      setEventForm((p) => ({
                        ...p,
                        coverImageStorageId: storageId,
                      }));
                    }}
                    imageType="event_cover"
                    label="Upload Cover Image"
                  />
                </Field>
                <Field label="Image Gallery (one URL per line)">
                  <textarea
                    className="sharp-input font-mono"
                    rows={3}
                    value={eventForm.imageGallery.join("\n")}
                    onChange={(e) =>
                      setEventForm((p) => ({
                        ...p,
                        imageGallery: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      }))
                    }
                    style={{ resize: "vertical", fontSize: "0.78rem" }}
                  />
                </Field>
                <Field label="Or Upload Gallery Images">
                  <ImageUploader
                    sessionToken={sessionToken!}
                    onImageUpload={(storageId, url) => {
                      setEventForm((p) => ({
                        ...p,
                        imageGalleryStorageIds: [
                          ...p.imageGalleryStorageIds,
                          storageId,
                        ],
                      }));
                    }}
                    imageType="event_gallery"
                    label="Upload Gallery Images"
                  />
                </Field>
                <div className="form-toggles">
                  <Toggle
                    label="Featured"
                    checked={eventForm.featured}
                    onChange={(v) =>
                      setEventForm((p) => ({ ...p, featured: v }))
                    }
                  />
                  <Toggle
                    label="Published"
                    checked={eventForm.published}
                    onChange={(v) =>
                      setEventForm((p) => ({ ...p, published: v }))
                    }
                  />
                </div>
                {eventMsg && (
                  <p
                    className={`form-msg font-mono${eventMsg.startsWith("✓") ? " success" : " error"}`}
                  >
                    {eventMsg}
                  </p>
                )}
                <div className="form-actions">
                  {editingEventId && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setEditingEventId(null);
                        setEventForm(DEFAULT_EVENT);
                        setEventMsg("");
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="btn-primary">
                    {editingEventId ? "Update Event →" : "Create Event →"}
                  </button>
                </div>
              </form>
            </div>

            <div className="list-section">
              <h3 className="font-display list-title">
                ALL EVENTS ({allEvents?.length ?? 0})
              </h3>
              {allEvents?.length === 0 && (
                <p className="empty-list font-mono">No events yet.</p>
              )}
              {allEvents?.map((ev) => (
                <div key={ev._id} className="list-row sharp-card">
                  <div className="list-row-info">
                    <div className="list-row-title">
                      <span
                        className="font-display"
                        style={{ fontSize: "1rem", color: "#f5f0e8" }}
                      >
                        {ev.title}
                      </span>
                      <span
                        className="list-badge font-mono"
                        style={{
                          color: ev.accent,
                          borderColor: `${ev.accent}44`,
                        }}
                      >
                        {ev.tag}
                      </span>
                      {!ev.published && (
                        <span className="list-draft font-mono">Draft</span>
                      )}
                    </div>
                    <div className="list-row-meta font-mono">
                      {ev.date} · {ev.location} ·{" "}
                      {ev.isFree ? "Free" : `₹${ev.price}`} · /{ev.slug}
                    </div>
                  </div>
                  <div className="list-row-actions">
                    <button
                      className="action-btn action-btn--edit font-mono"
                      onClick={() => handleEditEvent(ev)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn action-btn--delete font-mono"
                      onClick={() => handleDeleteEvent(ev._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "blogs" && (
          <div className="tab-content">
            <div className="form-section sharp-card">
              <h2 className="font-display section-title">
                {editingBlogId ? "EDIT BLOG POST" : "CREATE BLOG POST"}
              </h2>
              <form onSubmit={handleBlogSubmit} className="admin-form">
                <div className="form-row-2">
                  <Field label="Title">
                    <input
                      className="sharp-input"
                      value={blogForm.title}
                      required
                      onChange={(e) =>
                        setBlogForm((p) => ({
                          ...p,
                          title: e.target.value,
                          slug: slugify(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Slug">
                    <input
                      className="sharp-input font-mono"
                      value={blogForm.slug}
                      required
                      onChange={(e) =>
                        setBlogForm((p) => ({ ...p, slug: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="form-row-2">
                  <Field label="Author">
                    <input
                      className="sharp-input"
                      value={blogForm.author}
                      required
                      onChange={(e) =>
                        setBlogForm((p) => ({ ...p, author: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Date (YYYY-MM-DD)">
                    <input
                      className="sharp-input"
                      type="date"
                      value={blogForm.date}
                      required
                      onChange={(e) =>
                        setBlogForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Excerpt">
                  <input
                    className="sharp-input"
                    value={blogForm.excerpt}
                    required
                    onChange={(e) =>
                      setBlogForm((p) => ({ ...p, excerpt: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Content (Markdown)">
                  <textarea
                    className="sharp-input"
                    rows={12}
                    value={blogForm.content}
                    required
                    onChange={(e) =>
                      setBlogForm((p) => ({ ...p, content: e.target.value }))
                    }
                    style={{
                      resize: "vertical",
                      fontFamily: "monospace",
                      fontSize: "0.82rem",
                    }}
                  />
                </Field>
                <div className="form-row-3">
                  <Field label="Tag">
                    <input
                      className="sharp-input"
                      value={blogForm.tag}
                      onChange={(e) =>
                        setBlogForm((p) => ({ ...p, tag: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Cover Image URL">
                    <input
                      className="sharp-input"
                      value={blogForm.coverImage}
                      onChange={(e) =>
                        setBlogForm((p) => ({
                          ...p,
                          coverImage: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Or Upload Cover Image">
                    <ImageUploader
                      sessionToken={sessionToken!}
                      onImageUpload={(storageId, url) => {
                        setBlogForm((p) => ({
                          ...p,
                          coverImageStorageId: storageId,
                        }));
                      }}
                      imageType="blog_cover"
                      label="Upload Cover Image"
                    />
                  </Field>
                  <Field label="Accent Color">
                    <div className="accent-picker">
                      {ACCENT_OPTIONS.map((a) => (
                        <button
                          type="button"
                          key={a.value}
                          className={`accent-swatch${blogForm.accent === a.value ? " selected" : ""}`}
                          style={{ background: a.value }}
                          title={a.label}
                          onClick={() =>
                            setBlogForm((p) => ({ ...p, accent: a.value }))
                          }
                        />
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="form-toggles">
                  <Toggle
                    label="Featured"
                    checked={blogForm.featured}
                    onChange={(v) =>
                      setBlogForm((p) => ({ ...p, featured: v }))
                    }
                  />
                  <Toggle
                    label="Published"
                    checked={blogForm.published}
                    onChange={(v) =>
                      setBlogForm((p) => ({ ...p, published: v }))
                    }
                  />
                </div>
                {blogMsg && (
                  <p
                    className={`form-msg font-mono${blogMsg.startsWith("✓") ? " success" : " error"}`}
                  >
                    {blogMsg}
                  </p>
                )}
                <div className="form-actions">
                  {editingBlogId && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setEditingBlogId(null);
                        setBlogForm(DEFAULT_BLOG);
                        setBlogMsg("");
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="btn-primary">
                    {editingBlogId ? "Update Post →" : "Create Post →"}
                  </button>
                </div>
              </form>
            </div>

            <div className="list-section">
              <h3 className="font-display list-title">
                ALL POSTS ({allBlogs?.length ?? 0})
              </h3>
              {allBlogs?.length === 0 && (
                <p className="empty-list font-mono">No posts yet.</p>
              )}
              {allBlogs?.map((b) => (
                <div key={b._id} className="list-row sharp-card">
                  <div className="list-row-info">
                    <div className="list-row-title">
                      <span
                        className="font-display"
                        style={{ fontSize: "1rem", color: "#f5f0e8" }}
                      >
                        {b.title}
                      </span>
                      <span
                        className="list-badge font-mono"
                        style={{
                          color: b.accent,
                          borderColor: `${b.accent}44`,
                        }}
                      >
                        {b.tag}
                      </span>
                      {!b.published && (
                        <span className="list-draft font-mono">Draft</span>
                      )}
                    </div>
                    <div className="list-row-meta font-mono">
                      {b.author} · {b.date} · /{b.slug}
                    </div>
                  </div>
                  <div className="list-row-actions">
                    <button
                      className="action-btn action-btn--edit font-mono"
                      onClick={() => handleEditBlog(b)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn action-btn--delete font-mono"
                      onClick={() => handleDeleteBlog(b._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "registrations" && (
          <div className="tab-content">
            <h2 className="font-display section-title">
              ALL REGISTRATIONS ({allRegistrations?.length ?? 0})
            </h2>
            {!allRegistrations?.length && (
              <p className="empty-list font-mono">No registrations yet.</p>
            )}
            <div className="reg-table-wrap">
              <table className="reg-table">
                <thead>
                  <tr>
                    {[
                      "Attendee",
                      "Event",
                      "Status",
                      "Amount",
                      "Entry Code",
                      "Submission",
                      "Date",
                    ].map((h) => (
                      <th key={h} className="font-mono">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRegistrations?.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="reg-name">
                          {r.registrant?.name ?? "—"}
                        </div>
                        <div className="reg-email font-mono">
                          {r.registrant?.email ?? ""}
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontSize: "0.75rem" }}>
                        {(r.event as any)?.title ?? r.eventId}
                      </td>
                      <td>
                        <span
                          className={`status-chip font-mono status-${r.paymentStatus}`}
                        >
                          {r.paymentStatus}
                        </span>
                      </td>
                      <td className="font-mono" style={{ color: "#dfa651" }}>
                        {r.paymentStatus === "free" ? "Free" : `₹${r.amount}`}
                      </td>
                      <td
                        className="font-mono"
                        style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}
                      >
                        {r.entryCode ?? (
                          <span style={{ color: "rgba(245,240,232,0.2)" }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td>
                        {r.submissionGdriveLink ? (
                          <a
                            href={r.submissionGdriveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono"
                            style={{ color: "#dfa651", fontSize: "0.68rem" }}
                          >
                            View Link ↗
                          </a>
                        ) : (
                          <span
                            style={{
                              color: "rgba(245,240,232,0.2)",
                              fontSize: "0.72rem",
                            }}
                          >
                            None
                          </span>
                        )}
                      </td>
                      <td
                        className="font-mono"
                        style={{
                          fontSize: "0.68rem",
                          color: "rgba(245,240,232,0.4)",
                        }}
                      >
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "checkin" && (
          <div className="tab-content">
            <h2 className="font-display section-title">EVENT CHECK-IN</h2>
            {!allEvents?.length && (
              <p className="empty-list font-mono">No events available.</p>
            )}
            {allEvents?.length! > 0 && !selectedEventForCheckin && (
              <div className="checkin-events-list">
                <p className="checkin-label font-mono">
                  Select an event to start check-in:
                </p>
                <div className="events-grid">
                  {allEvents?.map((ev) => (
                    <button
                      key={ev._id}
                      className="event-select-card sharp-card"
                      onClick={() => setSelectedEventForCheckin(ev._id)}
                    >
                      <h3 className="font-display event-select-title">
                        {ev.title}
                      </h3>
                      <p className="event-select-meta font-mono">
                        {ev.date} · {ev.location}
                      </p>
                      <div className="event-select-info">
                        <span className="font-mono">
                          {allRegistrations?.filter((r) => r.eventId === ev._id)
                            .length ?? 0}{" "}
                          registrations
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedEventForCheckin && (
              <div className="checkin-scanner-wrap">
                <button
                  className="btn-outline"
                  onClick={() => setSelectedEventForCheckin(null)}
                  style={{
                    fontSize: "0.68rem",
                    padding: "8px 16px",
                    marginBottom: "20px",
                  }}
                >
                  &larr; Back to Events
                </button>
                <h3 className="font-display checkin-event-title">
                  {allEvents?.find((e) => e._id === selectedEventForCheckin)
                    ?.title ?? "Event"}
                </h3>
                <QRScanner
                  eventId={selectedEventForCheckin}
                  onVerificationSuccess={() => {}}
                  onVerificationError={() => {}}
                />
              </div>
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="tab-content">
            <h2 className="font-display section-title">PENDING PAYMENTS</h2>
            {verifyMsg && (
              <div
                className={`form-msg ${
                  verifyMsg.startsWith("✓") ? "success" : "error"
                } font-mono`}
                style={{ marginBottom: "20px" }}
              >
                {verifyMsg}
              </div>
            )}
            {!pendingPayments?.length ? (
              <p className="empty-list font-mono">No pending payments.</p>
            ) : (
              <div className="list-section">
                {pendingPayments.map((p) => (
                  <div
                    key={p._id}
                    className="list-row sharp-card"
                    style={{ alignItems: "flex-start" }}
                  >
                    <div className="list-row-info">
                      <div
                        className="list-row-title font-display"
                        style={{ fontSize: "1.2rem", color: "#dfa651" }}
                      >
                        ₹{p.amount}
                      </div>
                      <div
                        className="list-row-meta font-mono"
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <span>
                          <strong>Name:</strong> {p.registrant?.name}
                        </span>
                        <span>
                          <strong>Email:</strong> {p.registrant?.email}
                        </span>
                        <span>
                          <strong>Event:</strong> {(p.event as any)?.title}
                        </span>
                      </div>
                      {p.paymentProofUrl && (
                        <div
                          style={{
                            marginTop: "16px",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "rgba(245, 240, 232, 0.5)",
                              padding: "0 0 8px 0",
                              margin: 0,
                            }}
                          >
                            Payment Screenshot:
                          </p>
                          <img
                            src={p.paymentProofUrl}
                            alt="Payment Proof"
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                p.paymentProofUrl,
                              );
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImage Error%3C/text%3E%3C/svg%3E";
                            }}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "400px",
                              display: "block",
                              background: "#000",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                      )}
                      {selectedRegistration === p._id ? (
                        <div
                          style={{
                            marginTop: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <textarea
                            className="sharp-input font-mono"
                            placeholder="Verification notes (optional)"
                            value={verifyNotes}
                            onChange={(e) => setVerifyNotes(e.target.value)}
                            rows={3}
                            style={{
                              resize: "vertical",
                              width: "100%",
                              maxWidth: "400px",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              className="btn-primary"
                              style={{
                                padding: "8px 16px",
                                fontSize: "0.7rem",
                              }}
                              onClick={async () => {
                                setVerifyMsg("");
                                if (!sessionToken) return;
                                try {
                                  const res = await verifyPayment({
                                    sessionToken,
                                    registrationId: p._id,
                                    approved: true,
                                    notes: verifyNotes,
                                  });
                                  if (res.success) {
                                    setVerifyMsg("✓ Payment approved.");
                                    setSelectedRegistration(null);
                                    setVerifyNotes("");
                                  } else {
                                    setVerifyMsg("✗ " + res.error);
                                  }
                                } catch (e: any) {
                                  setVerifyMsg("✗ " + e.message);
                                }
                              }}
                            >
                              Approve Payment
                            </button>
                            <button
                              className="btn-outline"
                              style={{
                                padding: "8px 16px",
                                fontSize: "0.7rem",
                                color: "#cb1b3a",
                                borderColor: "rgba(203,27,58,0.3)",
                              }}
                              onClick={async () => {
                                setVerifyMsg("");
                                if (!sessionToken) return;
                                try {
                                  const res = await verifyPayment({
                                    sessionToken,
                                    registrationId: p._id,
                                    approved: false,
                                    notes: verifyNotes,
                                  });
                                  if (res.success) {
                                    setVerifyMsg("✓ Payment rejected.");
                                    setSelectedRegistration(null);
                                    setVerifyNotes("");
                                  } else {
                                    setVerifyMsg("✗ " + res.error);
                                  }
                                } catch (e: any) {
                                  setVerifyMsg("✗ " + e.message);
                                }
                              }}
                            >
                              Reject Payment
                            </button>
                            <button
                              className="btn-outline"
                              style={{
                                padding: "8px 16px",
                                fontSize: "0.7rem",
                              }}
                              onClick={() => {
                                setSelectedRegistration(null);
                                setVerifyNotes("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: "16px" }}>
                          <button
                            className="btn-primary"
                            style={{ padding: "8px 16px", fontSize: "0.7rem" }}
                            onClick={() => {
                              setSelectedRegistration(p._id);
                              setVerifyNotes("");
                              setVerifyMsg("");
                            }}
                          >
                            Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .admin-wrap { padding-top: 67px; min-height: 100vh; }
        .admin-header { background: rgba(34,109,11,0.06); border-bottom: 1px solid rgba(34,109,11,0.2); padding: 40px 0 28px; }
        .admin-header-inner { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .admin-h1 { font-size: 2.5rem; letter-spacing: 0.06em; color: #f5f0e8; line-height: 1; }
        .admin-user { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(245,240,232,0.5); padding: 8px 14px; border: 1px solid rgba(255,255,255,0.08); clip-path: polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px)); }
        .user-dot { width: 6px; height: 6px; border-radius: 50%; background: #226d0b; box-shadow: 0 0 6px #226d0b; flex-shrink: 0; }
        .admin-stats { display: flex; gap: 12px; flex-wrap: wrap; }
        .stat-chip { padding: 16px 24px; display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
        .stat-num { font-size: 1.8rem; background: linear-gradient(135deg,#226d0b,#dfa651); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-lbl { font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(245,240,232,0.4); }
        .admin-tabs-bar { border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.3); overflow-x: auto; overflow-y: hidden; }
        .admin-tabs { display: flex; gap: 0; flex-wrap: nowrap; }
        .admin-tab { background: none; border: none; border-bottom: 2px solid transparent; padding: 16px 24px; cursor: pointer; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(245,240,232,0.4); transition: color 0.2s, border-color 0.2s; white-space: nowrap; flex-shrink: 0; }
        .admin-tab.active { color: #dfa651; border-bottom-color: #dfa651; }
        .admin-tab:hover:not(.active) { color: rgba(245,240,232,0.7); }
        .admin-body { padding: 40px 24px 80px; }
        .tab-content { display: flex; flex-direction: column; gap: 40px; }
        .form-section { padding: 32px; }
        .section-title { font-size: 1.5rem; letter-spacing: 0.06em; color: #f5f0e8; margin-bottom: 28px; }
        .admin-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .form-toggles { display: flex; gap: 24px; flex-wrap: wrap; }
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px; flex-wrap: wrap; }
        .form-msg { padding: 10px 14px; font-size: 0.72rem; letter-spacing: 0.05em; }
        .form-msg.success { color: #226d0b; background: rgba(34,109,11,0.1); border: 1px solid rgba(34,109,11,0.3); }
        .form-msg.error { color: #cb1b3a; background: rgba(203,27,58,0.1); border: 1px solid rgba(203,27,58,0.3); }
        .accent-picker { display: flex; gap: 8px; padding: 8px 0; }
        .accent-swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
        .accent-swatch.selected { border-color: #fff; transform: scale(1.15); }
        .list-section { display: flex; flex-direction: column; gap: 10px; }
        .list-title { font-size: 1.2rem; letter-spacing: 0.06em; color: rgba(245,240,232,0.6); margin-bottom: 8px; }
        .list-row { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .list-row-info { flex: 1; min-width: 0; }
        .list-row-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
        .list-badge { font-size: 0.55rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 8px; border: 1px solid; }
        .list-draft { font-size: 0.55rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 8px; background: rgba(203,27,58,0.1); color: #cb1b3a; border: 1px solid rgba(203,27,58,0.3); }
        .list-row-meta { font-size: 0.62rem; letter-spacing: 0.06em; color: rgba(245,240,232,0.3); }
        .list-row-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .action-btn { background: none; border: 1px solid; padding: 6px 14px; cursor: pointer; font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; clip-path: polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,0 100%); }
        .action-btn--edit { color: #dfa651; border-color: rgba(223,166,81,0.3); }
        .action-btn--edit:hover { background: rgba(223,166,81,0.1); }
        .action-btn--delete { color: #cb1b3a; border-color: rgba(203,27,58,0.3); }
        .action-btn--delete:hover { background: rgba(203,27,58,0.1); }
        .empty-list { font-size: 0.72rem; letter-spacing: 0.1em; color: rgba(245,240,232,0.3); padding: 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.08); }
        /* Registrations table */
        .reg-table-wrap { overflow-x: auto; }
        .reg-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .reg-table th { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: #226d0b; border-bottom: 1px solid rgba(34,109,11,0.3); padding: 10px 12px; text-align: left; white-space: nowrap; }
        .reg-table td { padding: 12px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: top; }
        .reg-table tr:hover td { background: rgba(255,255,255,0.02); }
        .reg-name { font-size: 0.85rem; color: #f5f0e8; margin-bottom: 2px; }
        .reg-email { font-size: 0.62rem; letter-spacing: 0.04em; color: rgba(245,240,232,0.3); }
        .status-chip { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 10px; clip-path: polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,0 100%); }
        .status-free { background: rgba(34,109,11,0.15); color: #226d0b; border: 1px solid rgba(34,109,11,0.3); }
        .status-paid { background: rgba(223,166,81,0.15); color: #dfa651; border: 1px solid rgba(223,166,81,0.3); }
        .status-pending { background: rgba(203,27,58,0.1); color: #cb1b3a; border: 1px solid rgba(203,27,58,0.3); }
        .checkin-events-list { margin-bottom: 32px; }
        .checkin-label { font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(245,240,232,0.5); margin-bottom: 20px; display: block; }
        .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .event-select-card { background: rgba(34,109,11,0.06); border: 1px solid rgba(34,109,11,0.15); padding: 20px; display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all 0.2s; text-align: left; }
        .event-select-card:hover { background: rgba(34,109,11,0.12); border-color: rgba(34,109,11,0.3); transform: translateY(-2px); }
        .event-select-title { font-size: 1.1rem; color: #f5f0e8; margin: 0; letter-spacing: 0.02em; }
        .event-select-meta { font-size: 0.65rem; color: rgba(245,240,232,0.5); margin: 0; letter-spacing: 0.05em; }
        .event-select-info { padding-top: 8px; border-top: 1px solid rgba(34,109,11,0.2); font-size: 0.7rem; color: rgba(245,240,232,0.6); }
        .checkin-scanner-wrap { max-width: 600px; margin: 0 auto; }
        .checkin-event-title { font-size: 1.8rem; color: #f5f0e8; margin-bottom: 24px; text-align: center; }
        @media (max-width: 768px) {
          .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
          .admin-stats { gap: 8px; }
          .events-grid { grid-template-columns: 1fr; }
          .admin-tab { padding: 12px 16px; font-size: 0.62rem; }
          .admin-tabs-bar { -webkit-overflow-scrolling: touch; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(245,240,232,0.4)",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          position: "relative",
          background: checked ? "#226d0b" : "rgba(255,255,255,0.1)",
          border: `1px solid ${checked ? "rgba(34,109,11,0.5)" : "rgba(255,255,255,0.1)"}`,
          transition: "background 0.2s",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: checked ? "#fff" : "rgba(245,240,232,0.4)",
            transition: "left 0.2s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(245,240,232,0.6)",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {label}
      </span>
    </label>
  );
}

function Loader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.2em",
          color: "rgba(245,240,232,0.3)",
        }}
      >
        Loading…
      </div>
    </div>
  );
}

function Redirect({ to, msg }: { to: string; msg: string }) {
  useEffect(() => {
    setTimeout(() => (window.location.href = to), 1500);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.72rem",
          letterSpacing: "0.15em",
          color: "#cb1b3a",
        }}
      >
        {msg}
      </p>
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.62rem",
          color: "rgba(245,240,232,0.3)",
        }}
      >
        Redirecting…
      </p>
    </div>
  );
}

export default withConvexProvider(AdminDashboard);
