import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { CATEGORIES, CONDITIONS, DURATIONS } from "../../../shared/types";

export default function CreateAuction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "New",
    startingPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    duration: "24h",
    shippingCost: "0",
    shippingMethod: "Standard Shipping",
    imageUrls: "",
  });

  const update = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const imageUrls = form.imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);

      const auction = await api.auctions.create({
        ...form,
        startingPrice: parseFloat(form.startingPrice),
        reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : null,
        buyNowPrice: form.buyNowPrice ? parseFloat(form.buyNowPrice) : null,
        shippingCost: parseFloat(form.shippingCost || "0"),
        imageUrls,
      });

      navigate(`/auction/${auction.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Auction</h1>
      <p className="text-gray-600 mb-8">List your item and let the bidding begin</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Item Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={update("title")} className="input-field" required maxLength={120} placeholder="e.g., Vintage Rolex Submariner 1960" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={update("description")} className="input-field min-h-[120px]" required placeholder="Describe your item in detail..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={update("category")} className="input-field" required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select value={form.condition} onChange={update("condition")} className="input-field">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (one per line)</label>
            <textarea
              value={form.imageUrls}
              onChange={update("imageUrls")}
              className="input-field min-h-[80px]"
              placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
            />
            <p className="text-xs text-gray-500 mt-1">Add up to 8 image URLs</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($)</label>
              <input type="number" value={form.startingPrice} onChange={update("startingPrice")} className="input-field" required min="0.01" step="0.01" placeholder="0.99" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Price ($) <span className="text-gray-400 font-normal">optional</span></label>
              <input type="number" value={form.reservePrice} onChange={update("reservePrice")} className="input-field" min="0.01" step="0.01" placeholder="Hidden minimum" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buy Now ($) <span className="text-gray-400 font-normal">optional</span></label>
              <input type="number" value={form.buyNowPrice} onChange={update("buyNowPrice")} className="input-field" min="0.01" step="0.01" placeholder="Instant buy" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Auction Settings</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm({ ...form, duration: d.value })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.duration === d.value
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-primary-400"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost ($)</label>
              <input type="number" value={form.shippingCost} onChange={update("shippingCost")} className="input-field" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
              <input type="text" value={form.shippingMethod} onChange={update("shippingMethod")} className="input-field" placeholder="e.g., USPS Priority" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Platform Fee:</strong> 5% of the final sale price will be deducted as a platform fee.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
          {loading ? "Creating Auction..." : "Launch Auction"}
        </button>
      </form>
    </div>
  );
}
