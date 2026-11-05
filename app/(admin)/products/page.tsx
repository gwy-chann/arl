import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Products | ARLQ Food Condiments Trading',
  description: 'Manage condiment products catalog, SKU tracking, and pricing.',
};

export default function ProductsPage() {
  return (
    <PlaceholderPage
      title="Products Catalog"
      subtitle="The product catalog module for managing toyo, suka, and patis condiments will be released soon."
      icon="tag"
      bannerNote="Product Categories are already live and ready to manage! You can configure condiment categories, descriptions, and statuses."
      relatedLinks={[
        {
          label: 'Manage Categories',
          href: '/products/categories',
          badge: 'Ready',
        },
      ]}
      plannedFeatures={[
        {
          title: 'Condiment Catalog & Details',
          description:
            'Create, edit, and organize toyo, suka, and patis products with descriptions and unit specifications.',
        },
        {
          title: 'Packaging & Sizing Options',
          description:
            'Configure container sizes from small bottles (350ml, 750ml) to 1-gallon jugs and 20L industrial drums.',
        },
        {
          title: 'SKU & Barcode Tracking',
          description:
            'Assign unique stock keeping units and barcode identifiers for fast scanning and inventory accuracy.',
        },
        {
          title: 'Tiered Pricing Management',
          description:
            'Set up standard wholesale pricing, bulk discount rules, and retail suggested rates per condiment item.',
        },
      ]}
    />
  );
}
