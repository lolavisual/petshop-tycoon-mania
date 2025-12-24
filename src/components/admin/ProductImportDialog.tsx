import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, FileText, X, Check, 
  AlertCircle, Loader2, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import yaml from 'js-yaml';

interface ImportedProduct {
  name_ru: string;
  name?: string;
  description_ru?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  icon?: string;
  in_stock?: boolean;
  image_url?: string;
}

interface ProductImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: ImportedProduct[]) => Promise<void>;
}

const ACCEPTED_FORMATS = '.csv,.xls,.xlsx,.yml,.yaml,.xml';

const categoryMapping: Record<string, string> = {
  // Russian
  'кошки': 'cats',
  'коты': 'cats',
  'кот': 'cats',
  'кошка': 'cats',
  'собаки': 'dogs',
  'собака': 'dogs',
  'пес': 'dogs',
  'грызуны': 'rodents',
  'грызун': 'rodents',
  'хомяк': 'rodents',
  'птицы': 'birds',
  'птица': 'birds',
  'попугай': 'birds',
  'рыбы': 'fish',
  'рыба': 'fish',
  'аквариум': 'fish',
  'другое': 'other',
  'прочее': 'other',
  // English
  'cats': 'cats',
  'cat': 'cats',
  'dogs': 'dogs',
  'dog': 'dogs',
  'rodents': 'rodents',
  'rodent': 'rodents',
  'birds': 'birds',
  'bird': 'birds',
  'fish': 'fish',
  'other': 'other',
};

const normalizeCategory = (cat?: string): string => {
  if (!cat) return 'other';
  const normalized = cat.toLowerCase().trim();
  return categoryMapping[normalized] || 'other';
};

const parsePrice = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return ['true', '1', 'да', 'yes', 'в наличии', 'есть'].includes(lower);
  }
  if (typeof value === 'number') return value === 1;
  return true; // default to in stock
};

const ProductImportDialog = ({ isOpen, onClose, onImport }: ProductImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ImportedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedProducts([]);
    setError(null);
    setParsing(false);
    setImporting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const normalizeRow = (row: Record<string, unknown>): ImportedProduct | null => {
    // Find name field (various possible column names)
    const nameRu = row['name_ru'] || row['название'] || row['name'] || row['Название'] || row['NAME'] || row['title'] || row['Товар'];
    
    if (!nameRu || typeof nameRu !== 'string' || !nameRu.trim()) {
      return null;
    }

    return {
      name_ru: String(nameRu).trim(),
      name: String(row['name'] || row['Name'] || nameRu).trim(),
      description_ru: String(row['description_ru'] || row['описание'] || row['description'] || row['Описание'] || '').trim() || undefined,
      description: String(row['description'] || row['Description'] || '').trim() || undefined,
      category: normalizeCategory(String(row['category'] || row['категория'] || row['Категория'] || '')),
      price: parsePrice(row['price'] || row['цена'] || row['Цена'] || row['стоимость'] || 0),
      currency: String(row['currency'] || row['валюта'] || 'RUB').toUpperCase(),
      icon: String(row['icon'] || row['иконка'] || row['эмодзи'] || '🐾'),
      in_stock: parseBoolean(row['in_stock'] || row['в_наличии'] || row['наличие'] || row['stock'] || true),
      image_url: String(row['image_url'] || row['изображение'] || row['image'] || row['url'] || '').trim() || undefined,
    };
  };

  const parseCSV = async (content: string): Promise<ImportedProduct[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const products = (results.data as Record<string, unknown>[])
            .map(normalizeRow)
            .filter((p): p is ImportedProduct => p !== null);
          resolve(products);
        },
        error: (err) => reject(err),
      });
    });
  };

  const parseExcel = async (buffer: ArrayBuffer): Promise<ImportedProduct[]> => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    
    return data
      .map(normalizeRow)
      .filter((p): p is ImportedProduct => p !== null);
  };

  const parseYAML = async (content: string): Promise<ImportedProduct[]> => {
    const data = yaml.load(content);
    
    // Handle different YAML structures
    let items: Record<string, unknown>[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (typeof data === 'object' && data !== null) {
      // Check for common wrapper keys
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.products)) items = obj.products;
      else if (Array.isArray(obj.items)) items = obj.items;
      else if (Array.isArray(obj.товары)) items = obj.товары;
      else items = [obj];
    }
    
    return items
      .map(normalizeRow)
      .filter((p): p is ImportedProduct => p !== null);
  };

  const parseXML = async (content: string): Promise<ImportedProduct[]> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    
    // Handle parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Ошибка парсинга XML');
    }
    
    // Try different XML structures
    const productNodes = doc.querySelectorAll('product, item, offer, товар, Product, Item, Offer');
    
    if (productNodes.length === 0) {
      throw new Error('Не найдены товары в XML. Ожидаются теги: product, item, offer, товар');
    }
    
    const products: ImportedProduct[] = [];
    
    productNodes.forEach(node => {
      const getTextContent = (tagNames: string[]): string => {
        for (const tag of tagNames) {
          const el = node.querySelector(tag);
          if (el?.textContent) return el.textContent.trim();
          // Also check attributes
          const attr = node.getAttribute(tag);
          if (attr) return attr.trim();
        }
        return '';
      };
      
      const nameRu = getTextContent(['name_ru', 'название', 'name', 'title', 'Name', 'Title']);
      
      if (nameRu) {
        products.push({
          name_ru: nameRu,
          name: getTextContent(['name', 'Name']) || nameRu,
          description_ru: getTextContent(['description_ru', 'описание', 'description', 'Description']) || undefined,
          category: normalizeCategory(getTextContent(['category', 'категория', 'Category'])),
          price: parsePrice(getTextContent(['price', 'цена', 'Price', 'cost', 'стоимость'])),
          currency: getTextContent(['currency', 'валюта', 'Currency']) || 'RUB',
          icon: getTextContent(['icon', 'иконка', 'эмодзи', 'emoji']) || '🐾',
          in_stock: parseBoolean(getTextContent(['in_stock', 'наличие', 'stock', 'available'])),
          image_url: getTextContent(['image_url', 'изображение', 'image', 'picture', 'url', 'img']) || undefined,
        });
      }
    });
    
    return products;
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setParsing(true);
    
    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      let products: ImportedProduct[] = [];
      
      if (extension === 'csv') {
        const content = await selectedFile.text();
        products = await parseCSV(content);
      } else if (extension === 'xls' || extension === 'xlsx') {
        const buffer = await selectedFile.arrayBuffer();
        products = await parseExcel(buffer);
      } else if (extension === 'yml' || extension === 'yaml') {
        const content = await selectedFile.text();
        products = await parseYAML(content);
      } else if (extension === 'xml') {
        const content = await selectedFile.text();
        products = await parseXML(content);
      } else {
        throw new Error(`Неподдерживаемый формат: ${extension}`);
      }
      
      if (products.length === 0) {
        throw new Error('Не удалось найти товары в файле. Проверьте формат данных.');
      }
      
      setParsedProducts(products);
      toast.success(`Найдено ${products.length} товаров`);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка парсинга файла');
      setParsedProducts([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;
    
    setImporting(true);
    try {
      await onImport(parsedProducts);
      toast.success(`Импортировано ${parsedProducts.length} товаров`);
      handleClose();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Ошибка импорта товаров');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `name_ru,description_ru,category,price,currency,icon,in_stock
"Корм для кошек Premium","Сухой корм премиум класса",кошки,1500,RUB,🐱,true
"Поводок для собак","Прочный поводок 2м",собаки,800,RUB,🐕,true
"Клетка для хомяка","Большая клетка с лабиринтом",грызуны,3500,RUB,🐹,true`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Импорт товаров
            </h3>
            <Button size="sm" variant="ghost" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* File Upload Zone */}
          {!file && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Выберите файл для импорта</p>
                <p className="text-sm text-muted-foreground">
                  CSV, XLS, XLSX, YML, XML
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FORMATS}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать шаблон CSV
              </Button>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Поддерживаемые колонки:</strong></p>
                <p>name_ru (название), description_ru (описание), category (категория), price (цена), currency (валюта), icon (эмодзи), in_stock (наличие), image_url (изображение)</p>
              </div>
            </div>
          )}

          {/* Parsing State */}
          {parsing && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
              <p>Обработка файла...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="space-y-4">
              <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Ошибка</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={resetState}>
                Попробовать снова
              </Button>
            </div>
          )}

          {/* Parsed Products Preview */}
          {!parsing && !error && parsedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{file?.name}</span>
                <Button size="sm" variant="ghost" onClick={resetState}>
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="bg-muted/30 p-3 rounded-xl">
                <p className="font-medium mb-2">
                  <Check className="w-4 h-4 inline mr-1 text-green-500" />
                  Найдено {parsedProducts.length} товаров
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {parsedProducts.slice(0, 10).map((product, idx) => (
                    <div key={idx} className="text-sm flex justify-between items-center py-1 border-b border-muted-foreground/10 last:border-0">
                      <span className="truncate flex-1">{product.icon} {product.name_ru}</span>
                      <span className="text-muted-foreground ml-2">
                        {product.price} {product.currency}
                      </span>
                    </div>
                  ))}
                  {parsedProducts.length > 10 && (
                    <p className="text-xs text-muted-foreground pt-2">
                      ...и ещё {parsedProducts.length - 10} товаров
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetState}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 btn-gradient-primary"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Импортировать
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductImportDialog;
