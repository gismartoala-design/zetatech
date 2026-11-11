import type { SiteBlock } from '@shared/website';

/** Only merchandising slots move; custom text, contact and galleries retain
 * their positions. Saved CMS documents and administrator previews are untouched. */
export function arrangeStorefrontBlocks(blocks: SiteBlock[]): SiteBlock[] {
  const rank: Partial<Record<SiteBlock['type'], number>> = { hero: 0, benefits: 1, products: 2, image: 3, brands: 4 };
  const sorted = blocks.filter(block => !block.hidden && rank[block.type] !== undefined).sort((a, b) => rank[a.type]! - rank[b.type]!);
  let index = 0;
  return blocks.map(block => !block.hidden && rank[block.type] !== undefined ? sorted[index++] : block);
}
