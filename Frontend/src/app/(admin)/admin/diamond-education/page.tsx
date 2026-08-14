"use client";

import React, { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/utils/api";

interface DiamondArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  summary?: string;
  tags?: any;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["4Cs", "Certification", "Diamond Shapes", "Metals & Sourcing", "Jewelry Care"];

export default function AdminDiamondEducationPage() {
  const [articles, setArticles] = useState<DiamondArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<DiamondArticle | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "4Cs",
    summary: "",
    content: "",
    isPublished: true,
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getAdminSecret = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("vrix-admin-secret") || process.env.NEXT_PUBLIC_ADMIN_SECRET || "vrix_admin_secret_change_me_in_production";
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/diamond-education/admin/list`, {
        headers: {
          "X-Admin-Secret": getAdminSecret(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      } else {
        showToast("Error loading articles. Please check admin secret.");
      }
    } catch (err) {
      showToast("Network error fetching articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenModal = (article?: DiamondArticle) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        category: article.category,
        summary: article.summary || "",
        content: article.content,
        isPublished: article.isPublished,
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: "",
        category: "4Cs",
        summary: "",
        content: "",
        isPublished: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showToast("Title and Content are required.");
      return;
    }

    setSaveLoading(true);
    const baseUrl = getApiBaseUrl();
    const headers = {
      "Content-Type": "application/json",
      "X-Admin-Secret": getAdminSecret(),
    };

    try {
      if (editingArticle) {
        const res = await fetch(`${baseUrl}/diamond-education/admin/update/${editingArticle.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast("Article updated successfully.");
          setIsModalOpen(false);
          fetchArticles();
        } else {
          showToast("Failed to update article.");
        }
      } else {
        const res = await fetch(`${baseUrl}/diamond-education/admin/create`, {
          method: "POST",
          headers,
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast("New article created successfully.");
          setIsModalOpen(false);
          fetchArticles();
        } else {
          showToast("Failed to create article.");
        }
      }
    } catch (err) {
      showToast("Server error while saving article.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this education article?")) return;

    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/diamond-education/admin/delete/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Secret": getAdminSecret(),
        },
      });
      if (res.ok) {
        showToast("Article deleted.");
        fetchArticles();
      } else {
        showToast("Failed to delete article.");
      }
    } catch (err) {
      showToast("Server error during deletion.");
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesCat = selectedCategory === "All" || a.category === selectedCategory;
    const matchesQuery =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.summary && a.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-sm">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
            VRIX AI Chatbot Knowledge Base
          </span>
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-slate-900 uppercase">
            Diamond Education Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage educational articles, 4Cs guides, certifications, and material standards consumed by the Gemini AI Chatbot.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Create Article</span>
        </button>
      </div>

      {/* ─── Operational Guide Card ─── */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
          <span className="material-symbols-outlined text-amber-700">school</span>
          <h2>How Diamond Education & AI RAG Synthesis Work</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-amber-900/90 leading-relaxed">
          <div className="bg-white/80 p-4 rounded border border-amber-200/50 space-y-1.5">
            <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider">
              1. Admin Management
            </span>
            <p>
              Create articles covering topics like <strong>4Cs (Cut, Color, Clarity, Carat)</strong>, <strong>Ethical Sourcing</strong>, <strong>Lab Certifications (IGI/GIA)</strong>, and <strong>Metal Purity</strong>.
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded border border-amber-200/50 space-y-1.5">
            <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider">
              2. Gemini RAG Tool Execution
            </span>
            <p>
              When a guest asks a diamond education question, Gemini calls <code>get_diamond_education(topic)</code>. The backend performs keyword search across your published articles and returns DB context for RAG answer synthesis.
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded border border-amber-200/50 space-y-1.5">
            <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider">
              3. Anti-Hallucination Fallback
            </span>
            <p>
              If no DB match exists, <code>noMatchFound: true</code> is returned. Gemini answers general industry facts only, refuses to invent VRIX policies, and offers a <strong>Concierge Handoff</strong> option.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded border border-slate-200">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, content, or summary..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded bg-white outline-none focus:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Category:</span>
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded text-xs transition-colors shrink-0 ${
              selectedCategory === "All"
                ? "bg-slate-900 text-white font-medium"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white font-medium"
                  : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article List Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
            <span>Loading Diamond Education articles...</span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="material-symbols-outlined text-slate-300 text-4xl">article</span>
            <p className="text-xs text-slate-600 font-medium">No education articles found.</p>
            <p className="text-[11px] text-slate-400">
              Create your first article to populate the Gemini Chatbot knowledge base.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Title &amp; Summary</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <h4 className="font-semibold text-slate-900 text-sm mb-0.5">{article.title}</h4>
                      <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed">
                        {article.summary || article.content.substring(0, 100) + "..."}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="bg-amber-100/70 text-amber-900 text-[10px] font-semibold px-2.5 py-1 rounded">
                        {article.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {article.isPublished ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2.5 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenModal(article)}
                        className="text-slate-700 hover:text-slate-900 font-medium px-2 py-1 hover:bg-slate-200/60 rounded text-[11px] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-rose-600 hover:text-rose-800 font-medium px-2 py-1 hover:bg-rose-50 rounded text-[11px] transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form for Create / Edit Article */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-light text-slate-900 uppercase tracking-wide">
                {editingArticle ? "Edit Diamond Education Article" : "Create New Education Article"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Understanding Diamond Cut & Brilliance"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded outline-none focus:border-slate-800 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0"
                    />
                    <span>Publish article immediately</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                  Short Summary (Optional)
                </label>
                <input
                  type="text"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="One sentence summary of key takeaways..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded outline-none focus:border-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                  Full Educational Content *
                </label>
                <textarea
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write clear, informative educational guidance about this diamond topic..."
                  className="w-full p-3 text-xs border border-slate-300 rounded outline-none focus:border-slate-800 leading-relaxed font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saveLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingArticle ? "Save Changes" : "Create Article"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
