import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function TemplateLibrary({ currentPipeline, onLoad }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContribute, setShowContribute] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', author: '', tags: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listTemplates();
      setTemplates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const use = async (id) => {
    try {
      const full = await api.getTemplate(id);
      onLoad(full.pipeline);
    } catch (e) {
      setError(e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.saveTemplate({
        name: form.name,
        description: form.description,
        author: form.author,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        pipeline: currentPipeline,
      });
      setForm({ name: '', description: '', author: '', tags: '' });
      setShowContribute(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-library">
      <div className="template-library-header">
        <h3>Template Library</h3>
        <button className="btn-small" onClick={() => setShowContribute((v) => !v)}>
          {showContribute ? 'Cancel' : '+ Share current pipeline'}
        </button>
      </div>

      {error && <div className="error-inline">{error}</div>}

      {showContribute && (
        <form className="contribute-form" onSubmit={submit}>
          <input
            required
            placeholder="Template name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            placeholder="Your name"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <input
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Contribute Template'}
          </button>
        </form>
      )}

      {loading && <p className="hint">Loading templates...</p>}

      <div className="template-list">
        {templates.map((t) => (
          <div key={t.id} className="template-card">
            <div className="template-card-header">
              <strong>{t.name}</strong>
              <button className="btn-small" onClick={() => use(t.id)}>Use</button>
            </div>
            <p className="template-description">{t.description}</p>
            <div className="template-meta">
              <span>by {t.author}</span>
              <div className="template-tags">
                {t.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
