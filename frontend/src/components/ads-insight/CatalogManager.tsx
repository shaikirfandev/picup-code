'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchCatalogs,
  createCatalog,
  addProductToCatalog,
  addProductGroupToCatalog,
} from '@/store/slices/adsInsightSlice';
import {
  Package,
  ChevronLeft,
  Plus,
  Tag,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { Catalog, CatalogProduct, ProductGroup } from '@/types';

export default function CatalogManager() {
  const dispatch = useAppDispatch();
  const { catalogs, loading } = useAppSelector((s) => s.adsInsight);
  const [expandedCatalog, setExpandedCatalog] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'groups'>('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [newCatalog, setNewCatalog] = useState({ name: '', description: '' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    currency: 'USD',
    imageUrl: '',
    productUrl: '',
    category: '',
    availability: 'in_stock' as const,
  });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  useEffect(() => {
    dispatch(fetchCatalogs());
  }, [dispatch]);

  const handleCreateCatalog = async () => {
    if (!newCatalog.name.trim()) return;
    await dispatch(createCatalog(newCatalog));
    setShowCreateModal(false);
    setNewCatalog({ name: '', description: '' });
  };

  const handleAddProduct = async () => {
    if (!expandedCatalog || !newProduct.name.trim()) return;
    await dispatch(addProductToCatalog({ catalogId: expandedCatalog, product: newProduct }));
    setShowAddProduct(false);
    setNewProduct({ name: '', price: 0, currency: 'USD', imageUrl: '', productUrl: '', category: '', availability: 'in_stock' });
  };

  const handleAddGroup = async () => {
    if (!expandedCatalog || !newGroup.name.trim()) return;
    await dispatch(addProductGroupToCatalog({ catalogId: expandedCatalog, group: newGroup }));
    setShowAddGroup(false);
    setNewGroup({ name: '', description: '' });
  };

  const availabilityColors: Record<string, string> = {
    in_stock: 'bg-green-500/10 text-green-400',
    out_of_stock: 'bg-red-500/10 text-red-400',
    preorder: 'bg-blue-500/10 text-blue-400',
    discontinued: 'bg-gray-500/10 text-gray-400',
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ads-insight-platform/business" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-400" />
            Catalogs &amp; Products
          </h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Catalog
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Catalogs</p>
          <p className="text-2xl font-bold">{catalogs.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Products</p>
          <p className="text-2xl font-bold">
            {catalogs.reduce((s, c) => s + (c.products?.length || 0), 0)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Product Groups</p>
          <p className="text-2xl font-bold">
            {catalogs.reduce((s, c) => s + (c.productGroups?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Catalog List */}
      <div className="space-y-4">
        {loading && catalogs.length === 0 && (
          <div className="card p-12 text-center text-[var(--text-muted)]">Loading catalogs...</div>
        )}
        {!loading && catalogs.length === 0 && (
          <div className="card p-12 text-center text-[var(--text-muted)]">
            No catalogs yet. Create one to start adding products.
          </div>
        )}

        {catalogs.map((cat) => {
          const isExpanded = expandedCatalog === cat._id;
          return (
            <div key={cat._id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--surface)]/50"
                onClick={() => {
                  setExpandedCatalog(isExpanded ? null : cat._id);
                  setActiveTab('products');
                }}
              >
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {cat.name}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] ml-6">
                    {cat.description && `${cat.description} · `}
                    {cat.products?.length || 0} products · {cat.productGroups?.length || 0} groups
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  cat.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {cat.status}
                </span>
              </div>

              {isExpanded && (
                <div className="border-t border-[var(--border)]">
                  {/* Tabs */}
                  <div className="flex border-b border-[var(--border)]">
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'products'
                          ? 'border-[var(--accent)] text-[var(--accent)]'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 inline mr-1.5" />Products
                    </button>
                    <button
                      onClick={() => setActiveTab('groups')}
                      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'groups'
                          ? 'border-[var(--accent)] text-[var(--accent)]'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Layers className="w-4 h-4 inline mr-1.5" />Product Groups
                    </button>
                  </div>

                  <div className="p-5">
                    {/* Products Tab */}
                    {activeTab === 'products' && (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setShowAddProduct(true)}
                            className="btn-primary text-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Product
                          </button>
                        </div>
                        {(cat.products?.length || 0) === 0 ? (
                          <p className="text-sm text-[var(--text-muted)] text-center py-6">No products in this catalog.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cat.products?.map((p: CatalogProduct, idx: number) => (
                              <div key={idx} className="bg-[var(--surface)] rounded-lg p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="text-sm font-medium">{p.name}</h4>
                                  {p.productUrl && (
                                    <a href={p.productUrl} target="_blank" rel="noreferrer">
                                      <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">${p.price}</span>
                                  <span className="text-xs text-[var(--text-muted)]">{p.currency}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {p.category && (
                                    <span className="text-xs bg-[var(--bg)] px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Tag className="w-3 h-3" />{p.category}
                                    </span>
                                  )}
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${availabilityColors[p.availability] || ''}`}>
                                    {p.availability.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Product Inline Form */}
                        {showAddProduct && (
                          <div className="bg-[var(--surface)] rounded-lg p-4 space-y-3 mt-4 border border-[var(--border)]">
                            <h4 className="text-sm font-semibold">Add Product</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Product name *"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                className="input"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Price"
                                  value={newProduct.price || ''}
                                  onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                  className="input flex-1"
                                />
                                <select
                                  value={newProduct.currency}
                                  onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                                  className="px-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                placeholder="Image URL"
                                value={newProduct.imageUrl}
                                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                className="input"
                              />
                              <input
                                type="text"
                                placeholder="Product URL"
                                value={newProduct.productUrl}
                                onChange={(e) => setNewProduct({ ...newProduct, productUrl: e.target.value })}
                                className="input"
                              />
                              <input
                                type="text"
                                placeholder="Category"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                className="input"
                              />
                              <select
                                value={newProduct.availability}
                                onChange={(e) => setNewProduct({ ...newProduct, availability: e.target.value as any })}
                                className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm"
                              >
                                <option value="in_stock">In Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="preorder">Preorder</option>
                                <option value="discontinued">Discontinued</option>
                              </select>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setShowAddProduct(false)} className="btn-secondary text-xs">Cancel</button>
                              <button onClick={handleAddProduct} className="btn-primary text-xs" disabled={!newProduct.name.trim()}>
                                Add Product
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Product Groups Tab */}
                    {activeTab === 'groups' && (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setShowAddGroup(true)}
                            className="btn-primary text-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Group
                          </button>
                        </div>
                        {(cat.productGroups?.length || 0) === 0 ? (
                          <p className="text-sm text-[var(--text-muted)] text-center py-6">No product groups defined.</p>
                        ) : (
                          <div className="space-y-2">
                            {cat.productGroups?.map((g: ProductGroup, idx: number) => (
                              <div key={idx} className="bg-[var(--surface)] rounded-lg p-3">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-purple-400" />
                                  {g.name}
                                </h4>
                                {g.description && (
                                  <p className="text-xs text-[var(--text-muted)] mt-1 ml-6">{g.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {showAddGroup && (
                          <div className="bg-[var(--surface)] rounded-lg p-4 space-y-3 mt-4 border border-[var(--border)]">
                            <h4 className="text-sm font-semibold">Add Product Group</h4>
                            <input
                              type="text"
                              placeholder="Group name *"
                              value={newGroup.name}
                              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                              className="input w-full"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newGroup.description}
                              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                              className="input w-full"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setShowAddGroup(false)} className="btn-secondary text-xs">Cancel</button>
                              <button onClick={handleAddGroup} className="btn-primary text-xs" disabled={!newGroup.name.trim()}>
                                Add Group
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Catalog Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md space-y-4 relative">
            <h2 className="text-lg font-bold">Create Catalog</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Name *</label>
                <input
                  type="text"
                  value={newCatalog.name}
                  onChange={(e) => setNewCatalog({ ...newCatalog, name: e.target.value })}
                  className="input w-full"
                  placeholder="Catalog name"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
                <textarea
                  value={newCatalog.description}
                  onChange={(e) => setNewCatalog({ ...newCatalog, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleCreateCatalog} className="btn-primary text-sm" disabled={loading || !newCatalog.name.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
