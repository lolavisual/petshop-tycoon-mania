import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, Search, Link2, Loader2, Download, 
  ShoppingBag, ExternalLink, CheckCircle, AlertCircle,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ScrapedProduct {
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: string;
  url?: string;
}

interface FirecrawlImportTabProps {
  onImportProducts: (products: ScrapedProduct[]) => Promise<void>;
}

const popularPetShops = [
  { name: 'Petshop.ru', url: 'https://petshop.ru', icon: '🐕' },
  { name: 'Zoopassage', url: 'https://zoopassage.ru', icon: '🐈' },
  { name: 'Мир корма', url: 'https://mirkorma.ru', icon: '🦮' },
  { name: 'Бетховен', url: 'https://bethowen.ru', icon: '🐾' },
];

const categoryKeywords: Record<string, string[]> = {
  cats: ['кошк', 'кот', 'cat', 'котят', 'котен'],
  dogs: ['собак', 'щен', 'dog', 'пес'],
  birds: ['птиц', 'попуг', 'bird', 'канарей'],
  fish: ['рыб', 'аквариум', 'fish'],
  rodents: ['грызун', 'хомяк', 'крыс', 'морск'],
};

const detectCategory = (text: string): string => {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'other';
};

const FirecrawlImportTab = ({ onImportProducts }: FirecrawlImportTabProps) => {
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'scrape' | 'search' | 'map' | null>(null);
  const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [mappedUrls, setMappedUrls] = useState<string[]>([]);

  // Scrape a single product page
  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Введите URL страницы');
      return;
    }

    setIsLoading(true);
    setAction('scrape');
    setScrapedProducts([]);
    setRawResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl', {
        body: { 
          action: 'scrape', 
          url,
          options: {
            formats: ['markdown', 'links'],
            onlyMainContent: true,
          }
        },
      });

      if (error) throw error;

      const content = data?.data?.markdown || data?.markdown || '';
      setRawResult(content.slice(0, 2000) + (content.length > 2000 ? '...' : ''));

      // Try to extract product info from markdown
      const products = parseProductsFromMarkdown(content, url);
      setScrapedProducts(products);

      if (products.length > 0) {
        toast.success(`Найдено ${products.length} товаров`);
      } else {
        toast.info('Товары не найдены. Показан сырой контент.');
      }
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error('Ошибка при парсинге страницы');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  // Search for pet products
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Введите поисковый запрос');
      return;
    }

    setIsLoading(true);
    setAction('search');
    setScrapedProducts([]);
    setRawResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl', {
        body: { 
          action: 'search', 
          query: `${searchQuery} купить зоомагазин`,
          options: { limit: 10 }
        },
      });

      if (error) throw error;

      const results = data?.data || [];
      const products: ScrapedProduct[] = results.map((item: { title: string; description: string; url: string }) => ({
        name: item.title || 'Без названия',
        description: item.description,
        url: item.url,
        category: detectCategory(item.title + ' ' + (item.description || '')),
      }));

      setScrapedProducts(products);
      toast.success(`Найдено ${products.length} результатов`);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Ошибка при поиске');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  // Map website URLs
  const handleMap = async (siteUrl?: string) => {
    const targetUrl = siteUrl || url;
    if (!targetUrl.trim()) {
      toast.error('Введите URL сайта');
      return;
    }

    setIsLoading(true);
    setAction('map');
    setMappedUrls([]);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl', {
        body: { 
          action: 'map', 
          url: targetUrl,
          options: { 
            search: 'корм товар product',
            limit: 50 
          }
        },
      });

      if (error) throw error;

      const links = data?.links || [];
      setMappedUrls(links.slice(0, 50));
      toast.success(`Найдено ${links.length} страниц`);
    } catch (err) {
      console.error('Map error:', err);
      toast.error('Ошибка при сканировании сайта');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  // Enhanced price extraction with multiple formats
  const extractPrice = (text: string): number | undefined => {
    // Multiple price patterns for Russian e-commerce
    const patterns = [
      /(\d[\d\s]*[.,]?\d*)\s*(?:₽|руб\.?|RUB|р\.)/gi,      // Standard: 1234 ₽, 1234 руб
      /(?:цена|price|стоимость)[:\s]*(\d[\d\s]*[.,]?\d*)/gi, // Price label: Цена: 1234
      /(\d{1,3}(?:[\s,]\d{3})*(?:[.,]\d{2})?)\s*(?:₽|руб)/gi, // Formatted: 1 234,00 ₽
      /(?:от|от\s)(\d[\d\s]*)/gi,                            // From price: от 1234
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const priceStr = match[1]
          .replace(/\s/g, '')
          .replace(',', '.');
        const price = parseFloat(priceStr);
        if (price > 0 && price < 1000000) { // Sanity check
          return price;
        }
      }
    }
    return undefined;
  };

  // Enhanced image URL extraction
  const extractImageUrl = (text: string, baseUrl: string): string | undefined => {
    const patterns = [
      /!\[.*?\]\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp)[^\s)]*)\)/gi, // Markdown images
      /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)/gi,         // HTML img tags
      /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp))/gi,                 // Direct URLs
      /(?:src|data-src)=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)/gi,     // Lazy load images
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        let imgUrl = match[1];
        // Handle relative URLs
        if (imgUrl.startsWith('/')) {
          try {
            const base = new URL(baseUrl);
            imgUrl = `${base.origin}${imgUrl}`;
          } catch {
            // Keep original if URL parsing fails
          }
        }
        return imgUrl;
      }
    }
    return undefined;
  };

  // Extract product name from various formats
  const extractProductName = (text: string): string | undefined => {
    // Clean markdown headers
    if (text.startsWith('#')) {
      return text.replace(/^#+\s*/, '').trim();
    }
    
    // Try to extract from bold/strong text
    const boldMatch = text.match(/\*\*([^*]+)\*\*|__([^_]+)__/);
    if (boldMatch) {
      return (boldMatch[1] || boldMatch[2]).trim();
    }

    // Try to find product-like text (avoid navigation links)
    const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    if (cleanText.length > 10 && cleanText.length < 200 && !cleanText.includes('|')) {
      return cleanText;
    }

    return undefined;
  };

  // Parse products from markdown content with improved recognition
  const parseProductsFromMarkdown = (markdown: string, sourceUrl: string): ScrapedProduct[] => {
    const products: ScrapedProduct[] = [];
    const seenNames = new Set<string>();
    
    // Split into sections (by headers or double newlines)
    const sections = markdown.split(/(?=^#{1,3}\s)|(?:\n{2,})/m);
    
    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed || trimmed.length < 20) continue;

      // Try to extract product info from this section
      const name = extractProductName(trimmed);
      if (!name || seenNames.has(name.toLowerCase())) continue;

      const price = extractPrice(trimmed);
      const imageUrl = extractImageUrl(trimmed, sourceUrl);
      const category = detectCategory(trimmed);

      // Only add if we have at least a name and price OR name and image
      if (name && (price || imageUrl)) {
        seenNames.add(name.toLowerCase());
        products.push({
          name,
          price,
          image_url: imageUrl,
          category,
          url: sourceUrl,
          description: trimmed.slice(0, 200).replace(/[#*_\[\]]/g, '').trim(),
        });
      }
    }

    // Second pass: try line-by-line for list-style products
    if (products.length === 0) {
      const lines = markdown.split('\n');
      let currentProduct: Partial<ScrapedProduct> = {};
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const price = extractPrice(line);
        const imgUrl = extractImageUrl(line, sourceUrl);
        const name = extractProductName(line);

        if (name && !seenNames.has(name.toLowerCase())) {
          // Save previous product if valid
          if (currentProduct.name && (currentProduct.price || currentProduct.image_url)) {
            products.push(currentProduct as ScrapedProduct);
          }
          
          seenNames.add(name.toLowerCase());
          currentProduct = {
            name,
            category: detectCategory(name),
            url: sourceUrl,
          };
        }

        if (price && currentProduct.name) {
          currentProduct.price = price;
        }

        if (imgUrl && currentProduct.name) {
          currentProduct.image_url = imgUrl;
        }
      }

      // Add last product
      if (currentProduct.name && (currentProduct.price || currentProduct.image_url)) {
        products.push(currentProduct as ScrapedProduct);
      }
    }

    return products;
  };

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const handleImportSelected = async () => {
    const productsToImport = scrapedProducts.filter((_, i) => selectedProducts.has(i));
    if (productsToImport.length === 0) {
      toast.error('Выберите товары для импорта');
      return;
    }

    try {
      await onImportProducts(productsToImport);
      toast.success(`Импортировано ${productsToImport.length} товаров`);
      setScrapedProducts([]);
      setSelectedProducts(new Set());
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Ошибка при импорте');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Globe className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Firecrawl Import</h2>
          <p className="text-sm text-muted-foreground">
            Парсинг товаров с сайтов зоомагазинов
          </p>
        </div>
      </div>

      {/* Quick Access - Popular Shops */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Популярные зоомагазины
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularPetShops.map((shop) => (
            <Button
              key={shop.url}
              variant="outline"
              size="sm"
              onClick={() => {
                setUrl(shop.url);
                handleMap(shop.url);
              }}
              disabled={isLoading}
            >
              <span className="mr-1">{shop.icon}</span>
              {shop.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Scrape URL */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Парсинг страницы
        </h3>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://petshop.ru/catalog/cats/food"
            className="flex-1"
          />
          <Button 
            onClick={handleScrape} 
            disabled={isLoading}
          >
            {isLoading && action === 'scrape' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
          <Button 
            onClick={() => handleMap()} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading && action === 'map' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Карта сайта'
            )}
          </Button>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Search className="w-4 h-4" />
          Поиск товаров в интернете
        </h3>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Корм для кошек Royal Canin"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
          >
            {isLoading && action === 'search' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Mapped URLs */}
      {mappedUrls.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Найденные страницы ({mappedUrls.length})</h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {mappedUrls.map((link, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-sm p-2 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => {
                  setUrl(link);
                  setMappedUrls([]);
                }}
              >
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{link}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Raw Result */}
      {rawResult && scrapedProducts.length === 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Сырой контент (товары не распознаны)
          </h3>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60 whitespace-pre-wrap">
            {rawResult}
          </pre>
        </Card>
      )}

      {/* Scraped Products */}
      {scrapedProducts.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Найденные товары ({scrapedProducts.length})
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedProducts.size === scrapedProducts.length) {
                    setSelectedProducts(new Set());
                  } else {
                    setSelectedProducts(new Set(scrapedProducts.map((_, i) => i)));
                  }
                }}
              >
                {selectedProducts.size === scrapedProducts.length ? 'Снять всё' : 'Выбрать всё'}
              </Button>
              <Button
                size="sm"
                onClick={handleImportSelected}
                disabled={selectedProducts.size === 0}
              >
                Импортировать ({selectedProducts.size})
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scrapedProducts.map((product, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProducts.has(i) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => toggleProductSelection(i)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  selectedProducts.has(i) ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}>
                  {selectedProducts.has(i) && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                </div>

                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {product.category && (
                    <Badge variant="secondary">{product.category}</Badge>
                  )}
                  {product.price && (
                    <span className="font-semibold text-primary">{product.price} ₽</span>
                  )}
                </div>

                {product.url && (
                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">💡 Как использовать</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Карта сайта:</strong> Находит все страницы товаров на сайте</li>
          <li>• <strong>Парсинг страницы:</strong> Извлекает товары с конкретной страницы</li>
          <li>• <strong>Поиск:</strong> Ищет товары в интернете по названию</li>
          <li>• Выберите найденные товары и нажмите "Импортировать"</li>
        </ul>
      </Card>
    </motion.div>
  );
};

export default FirecrawlImportTab;
