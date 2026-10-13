function getProductOffer(product, now = new Date()) {
  const variant = product.hasVariants ? product.variants?.find(v => v.isDefault) || product.variants?.[0] : null;
  const originalPrice = Number(variant ? variant.price : product.price || 0);
  const discounts = (product.discounts_products || []).map(row => row.discounts).filter(discount => {
    if (!discount || discount.is_active === false || discount.code) return false;
    if (discount.starts_at && !(new Date(discount.starts_at) <= now)) return false;
    if (discount.ends_at && !(new Date(discount.ends_at) >= now)) return false;
    if (discount.max_uses != null && Number(discount.uses || 0) >= Number(discount.max_uses)) return false;
    const percent = Number(discount.percent_value ?? Number(discount.percent || 0) / 100);
    return Number.isFinite(percent) && percent > 0 && percent < 1;
  }).sort((a,b) => Number(b.priority || 0) - Number(a.priority || 0) || Number(b.percent_value || b.percent / 100) - Number(a.percent_value || a.percent / 100) || Number(a.id) - Number(b.id));
  const applied = discounts.some(d => !d.stackable) ? discounts.slice(0,1) : discounts;
  const currentPrice = Math.round(applied.reduce((price,discount) => price * (1 - Number(discount.percent_value ?? Number(discount.percent || 0) / 100)), originalPrice) * 100) / 100;
  const offerActive = currentPrice < originalPrice && currentPrice > 0;
  return { originalPrice, currentPrice: offerActive ? currentPrice : originalPrice, discountPercent: offerActive ? Math.round((1 - currentPrice / originalPrice) * 100) : 0, offerActive };
}
module.exports = { getProductOffer };
