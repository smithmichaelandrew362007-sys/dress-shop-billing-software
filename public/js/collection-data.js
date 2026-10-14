/**
 * SURYA TEXTILES A BILLING SOFTWARE - Signature Collections Dataset & Engine
 * Powers dedicated collection pages (Evening Gowns, Bridal Lehengas, Sarees & Drapes, Men's Couture)
 */
const COLLECTIONS_DATA = {
  'evening-gowns': {
    key: 'evening-gowns',
    title: 'Evening Gowns & Nightwear',
    subtitle: 'Velvet, Satin & Red Carpet Glamour',
    heroImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1600&q=80',
    tagline: 'From red-carpet galas to luxury silk loungewear, discover our curated gowns.',
    badge: 'Red Carpet & Luxury Loungewear',
    subcategories: ['All Gowns', 'Night Gowns & Robes', 'Evening Gowns', 'Cocktail Dresses', 'Ball Gowns'],
    items: [
      {
        id: 3,
        name: 'Emerald Velvet Floor-Length Evening Gown',
        sku: 'LUM-GWN-003',
        subcategory: 'Evening Gowns',
        category: 'Evening Gowns',
        fabric: 'Plush Micro Velvet with Silk Satin Lining',
        sizes: 'XS, S, M, L, XL',
        colors: 'Emerald Green, Wine Red, Onyx Black',
        price: 9999,
        stock_quantity: 14,
        image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
        description: 'Dramatic mermaid silhouette with thigh-high slit, cowl neckline, and internal boned corset structure.',
        is_featured: 1
      },
      {
        id: 19,
        name: 'Luxury Silk Charmeuse Night Gown & Robe Set',
        sku: 'LUM-NGT-019',
        subcategory: 'Night Gowns & Robes',
        category: 'Evening Gowns',
        fabric: '100% Pure Mulberry Silk Charmeuse',
        sizes: 'XS, S, M, L',
        colors: 'Blush Pink, Pearl Ivory, Midnight Navy',
        price: 6499,
        stock_quantity: 16,
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        description: 'Ultra-luxurious pure mulberry silk night gown featuring French Chantilly lace scalloped trim, adjustable straps, and coordinating silk belted kimono robe.',
        is_featured: 1
      },
      {
        id: 17,
        name: 'Sequined Hollywood Glamour Slit Gown',
        sku: 'LUM-GWN-017',
        subcategory: 'Evening Gowns',
        category: 'Evening Gowns',
        fabric: 'Stretch Mesh with Micro Sequins',
        sizes: 'XS, S, M, L',
        colors: 'Champagne Gold, Silver Metallic, Ruby Red',
        price: 7999,
        stock_quantity: 11,
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        description: 'Stunning red-carpet showstopper fully coated in light-catching micro sequins with an open back cut-out and graceful train.',
        is_featured: 1
      },
      {
        id: 15,
        name: 'Kashmiri Hand-Embroidered Velvet Cape Dress',
        sku: 'LUM-GWN-015',
        subcategory: 'Evening Gowns',
        category: 'Evening Gowns',
        fabric: 'Rich Silk Velvet with Tilla Embroidery',
        sizes: 'S, M, L, XL',
        colors: 'Burgundy Wine, Forest Green, Midnight Blue',
        price: 11499,
        stock_quantity: 7,
        image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        description: 'Royal cape silhouette with traditional Kashmiri metallic tilla needlework around the neck and cascading hem.',
        is_featured: 1
      },
      {
        id: 20,
        name: 'Midnight Obsidian Corset Ball Gown',
        sku: 'LUM-GWN-020',
        subcategory: 'Ball Gowns',
        category: 'Evening Gowns',
        fabric: 'Multi-Tiered Tulle & Duchesse Satin',
        sizes: 'XS, S, M, L, XL',
        colors: 'Obsidian Black, Deep Violet, Midnight Teal',
        price: 14500,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        description: 'Breathtaking floor-length gala ball gown featuring a hand-structured corset bodice, sweetheart plunge, and voluminous tiered tulle skirt.',
        is_featured: 1
      },
      {
        id: 21,
        name: 'Celestial Crystal Embellished Night Gown',
        sku: 'LUM-NGT-021',
        subcategory: 'Night Gowns & Robes',
        category: 'Evening Gowns',
        fabric: 'Featherlight Modal Satin & Lace',
        sizes: 'S, M, L, XL',
        colors: 'Celestial Silver, Rose Dust, Lavender Mist',
        price: 4999,
        stock_quantity: 18,
        image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
        description: 'Dreamy flowing night gown crafted in feather-soft modal satin with crystal neckline beading and deep crossover back.',
        is_featured: 0
      },
      {
        id: 22,
        name: 'Champagne Shimmer Backless Slip Dress',
        sku: 'LUM-GWN-022',
        subcategory: 'Cocktail Dresses',
        category: 'Evening Gowns',
        fabric: 'Liquid Metallic Satin',
        sizes: 'XS, S, M, L',
        colors: 'Champagne Shimmer, Bronze, Pewter',
        price: 5299,
        stock_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
        description: 'Minimalist 90s-inspired slip gown in high-shine liquid metallic champagne satin with a cowl drape back and side slit.',
        is_featured: 0
      },
      {
        id: 23,
        name: 'Sapphire Star Mermaid Evening Gown',
        sku: 'LUM-GWN-023',
        subcategory: 'Evening Gowns',
        category: 'Evening Gowns',
        fabric: 'Italian Crepe & Hand-set Crystals',
        sizes: 'S, M, L, XL',
        colors: 'Royal Sapphire, Ruby Red, Emerald',
        price: 12800,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=800&q=80',
        description: 'Deep sapphire blue mermaid silhouette with sculpted shoulder drape and crystal floral constellation embroidery along the torso.',
        is_featured: 1
      },
      {
        id: 5,
        name: 'Pleated Satin Cocktail Midi Dress',
        sku: 'LUM-DRS-005',
        subcategory: 'Cocktail Dresses',
        category: 'Evening Gowns',
        fabric: 'Duchess Satin',
        sizes: 'XS, S, M, L',
        colors: 'Rose Gold, Sapphire Blue, Champagne Gold',
        price: 3699,
        stock_quantity: 20,
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        description: 'Chic asymmetrical drape dress with sunburst knife pleating and a removable sash belt.',
        is_featured: 0
      },
      {
        id: 24,
        name: 'Blossom Silk Kimono Night Gown',
        sku: 'LUM-NGT-024',
        subcategory: 'Night Gowns & Robes',
        category: 'Evening Gowns',
        fabric: 'Pure Raw Silk Satin',
        sizes: 'Free Size',
        colors: 'Sakura Pink, Ivory White, Jade',
        price: 4499,
        stock_quantity: 14,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Graceful lounge and night gown with wide kimono bell sleeves, oriental floral hand-painting, and tie sash.',
        is_featured: 0
      }
    ]
  },

  'bridal-lehengas': {
    key: 'bridal-lehengas',
    title: 'Bridal & Lehengas',
    subtitle: 'Heirloom Masterpieces & Wedding Couture',
    heroImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Handcrafted Zardozi, royal velvets, and pure Katan silk lehengas fit for a queen.',
    badge: 'Heirloom Masterpieces',
    subcategories: ['All Bridal', 'Bridal Lehengas', 'Pastel Organza', 'Reception Glamour', 'Mehendi & Sangeet'],
    items: [
      {
        id: 2,
        name: 'Zardozi Hand-Embroidered Bridal Lehenga',
        sku: 'LUM-LEH-002',
        subcategory: 'Bridal Lehengas',
        category: 'Bridal & Lehengas',
        fabric: 'Raw Silk & Hand-Dyed Organza',
        sizes: 'S, M, L, XL',
        colors: 'Deep Maroon, Ruby Scarlet, Dusty Rose',
        price: 24500,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Opulent bridal masterpiece embellished with dabka, sequin, and real zardozi needlework. Comes with dual dupatta set.',
        is_featured: 1
      },
      {
        id: 25,
        name: 'Royal Noor Mahal Velvet Bridal Lehenga',
        sku: 'LUM-LEH-025',
        subcategory: 'Bridal Lehengas',
        category: 'Bridal & Lehengas',
        fabric: 'Heritage Silk Velvet & Tissue Dupatta',
        sizes: 'Custom, S, M, L, XL',
        colors: 'Ruby Velvet, Crimson, Wine',
        price: 38900,
        stock_quantity: 4,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Couture bridal ensemble crafted in crimson micro-velvet, featuring 3D floral zardozi embroidery, semi-precious beadwork, and pure gold tissue veil.',
        is_featured: 1
      },
      {
        id: 26,
        name: 'Gulbahar Pastel Organza Floral Lehenga',
        sku: 'LUM-LEH-026',
        subcategory: 'Pastel Organza',
        category: 'Bridal & Lehengas',
        fabric: 'Handloom Sheer Organza & Silk Crepe',
        sizes: 'XS, S, M, L',
        colors: 'Blush Pink, Mint Mist, Peach Powder',
        price: 18999,
        stock_quantity: 9,
        image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        description: 'Enchanting modern bridal lehenga with delicate resham floral blooms, pearl edge scallop border, and featherlight organza dupatta.',
        is_featured: 1
      },
      {
        id: 27,
        name: 'Kashi Vermilion Raw Silk Wedding Lehenga',
        sku: 'LUM-LEH-027',
        subcategory: 'Bridal Lehengas',
        category: 'Bridal & Lehengas',
        fabric: 'Pure Banarasi Raw Silk & Zari',
        sizes: 'S, M, L, XL',
        colors: 'Vermilion Red, Sindoor Scarlet',
        price: 28500,
        stock_quantity: 7,
        image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
        description: 'Traditional Indian wedding attire featuring auspicious vermilion red silk woven with antique gold jaal and handcrafted peacock motifs.',
        is_featured: 1
      },
      {
        id: 28,
        name: 'Champagne Gold Crystal Reception Lehenga',
        sku: 'LUM-LEH-028',
        subcategory: 'Reception Glamour',
        category: 'Bridal & Lehengas',
        fabric: 'Metallic Mesh & Imported Crystals',
        sizes: 'S, M, L',
        colors: 'Champagne Gold, Rose Gold, Platinum',
        price: 32000,
        stock_quantity: 5,
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        description: 'Show-stopping reception lehenga glistening with Swarovski crystals, sequins, and metallic bead tassels, paired with off-shoulder corset blouse.',
        is_featured: 1
      },
      {
        id: 29,
        name: 'Peacock Teal Mehendi Mirrorwork Lehenga',
        sku: 'LUM-LEH-029',
        subcategory: 'Mehendi & Sangeet',
        category: 'Bridal & Lehengas',
        fabric: 'Georgette Silk with Real Mirror Embellishment',
        sizes: 'XS, S, M, L, XL',
        colors: 'Peacock Teal, Mustard Yellow, Lime Green',
        price: 16800,
        stock_quantity: 11,
        image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        description: 'Vibrant festive lehenga illuminated with hand-stitched glass mirrorwork, contrasting thread borders, and latkan tie-ups.',
        is_featured: 0
      },
      {
        id: 30,
        name: 'Ivory & Rose Gold Bridal Anarkali Gown',
        sku: 'LUM-LEH-030',
        subcategory: 'Bridal Lehengas',
        category: 'Bridal & Lehengas',
        fabric: 'Chanderi Silk & Net with Can-Can Flare',
        sizes: 'S, M, L, XL, XXL',
        colors: 'Ivory White, Soft Blush',
        price: 21999,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Regal floor-sweeping bridal anarkali lehenga gown featuring 48 kallis, heavy gota patti borders, and scalloped net veil.',
        is_featured: 1
      },
      {
        id: 31,
        name: 'Midnight Blue Velvet Sangeet Lehenga',
        sku: 'LUM-LEH-031',
        subcategory: 'Mehendi & Sangeet',
        category: 'Bridal & Lehengas',
        fabric: 'Deep Blue Micro Velvet & Organza',
        sizes: 'S, M, L, XL',
        colors: 'Midnight Blue, Sapphire',
        price: 26500,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        description: 'Dramatic evening Sangeet lehenga in midnight sapphire velvet featuring silver pita needlework and geometric floral motifs.',
        is_featured: 0
      }
    ]
  },

  'sarees-drapes': {
    key: 'sarees-drapes',
    title: 'Sarees & Heritage Drapes',
    subtitle: 'Pure Katan, Banarasi & Kanchipuram Silks',
    heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Timeless handloom weaves woven with authentic zari by generational master weavers.',
    badge: '100% Pure Silk Certified',
    subcategories: ['All Sarees', 'Banarasi Silk', 'Kanchipuram Silk', 'Organza Drapes', 'Paithani Silk', 'Chanderi & Tissue'],
    items: [
      {
        id: 1,
        name: 'Royal Heritage Banarasi Silk Saree',
        sku: 'LUM-SAR-001',
        subcategory: 'Banarasi Silk',
        category: 'Sarees & Drapes',
        fabric: 'Pure Katan Silk with Gold Zari',
        sizes: 'Free Size',
        colors: 'Crimson Red, Royal Magenta, Midnight Blue',
        price: 8499,
        stock_quantity: 18,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Handwoven in Varanasi with antique gold zari work and elaborate floral jaal pattern. Includes unstitched blouse piece.',
        is_featured: 1
      },
      {
        id: 32,
        name: 'Regal Kanchipuram Gold Brocade Temple Silk Saree',
        sku: 'LUM-SAR-032',
        subcategory: 'Kanchipuram Silk',
        category: 'Sarees & Drapes',
        fabric: 'Pure Mulberry Silk & Korvai Gold Zari',
        sizes: 'Free Size',
        colors: 'Peacock Green, Bridal Red, Golden Yellow',
        price: 15800,
        stock_quantity: 10,
        image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        description: 'Authentic Kanchipuram silk saree with interlocking korvai border, traditional temple gopuram motifs, and heavy grand zari pallu.',
        is_featured: 1
      },
      {
        id: 6,
        name: 'Pastel Organza Hand-Painted Floral Saree',
        sku: 'LUM-SAR-006',
        subcategory: 'Organza Drapes',
        category: 'Sarees & Drapes',
        fabric: 'Pure Sheer Organza Silk',
        sizes: 'Free Size',
        colors: 'Blush Pink, Mint Green, Lilac Violet',
        price: 5899,
        stock_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        description: 'Airy, featherlight pure organza saree adorned with handcrafted botanical blooms and scalloped cutwork border.',
        is_featured: 1
      },
      {
        id: 33,
        name: 'Maharani Paithani Handloom Silk Saree',
        sku: 'LUM-SAR-033',
        subcategory: 'Paithani Silk',
        category: 'Sarees & Drapes',
        fabric: 'Pure Yeola Silk & Real Zari Peacock Pallu',
        sizes: 'Free Size',
        colors: 'Royal Purple, Emerald Green, Rani Pink',
        price: 14200,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Heirloom Maharashtra Paithani saree with kaleidoscope peacock motifs woven on pure gold tissue pallu and muniya border.',
        is_featured: 1
      },
      {
        id: 34,
        name: 'Chanderi Tissue Metallic Gold Festive Saree',
        sku: 'LUM-SAR-034',
        subcategory: 'Chanderi & Tissue',
        category: 'Sarees & Drapes',
        fabric: 'Silk Tissue with Micro Zari Weave',
        sizes: 'Free Size',
        colors: 'Metallic Gold, Silver Mist, Copper',
        price: 6499,
        stock_quantity: 15,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Luminous metallic gold Chanderi tissue drape with delicate hand-block accents and hand-rolled edging.',
        is_featured: 0
      },
      {
        id: 35,
        name: 'Tussar Georgette Kashmiri Tilla Saree',
        sku: 'LUM-SAR-035',
        subcategory: 'Organza Drapes',
        category: 'Sarees & Drapes',
        fabric: 'Pure Tussar Georgette Silk',
        sizes: 'Free Size',
        colors: 'Oatmeal Beige, Dusty Rose, Powder Blue',
        price: 9800,
        stock_quantity: 9,
        image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
        description: 'Textured handloom Tussar georgette embellished with Kashmiri metallic tilla needlework around the scalloped borders.',
        is_featured: 1
      },
      {
        id: 36,
        name: 'Crimson Wedding Katan Silk Saree',
        sku: 'LUM-SAR-036',
        subcategory: 'Banarasi Silk',
        category: 'Sarees & Drapes',
        fabric: 'Double-Twisted Pure Katan Silk',
        sizes: 'Free Size',
        colors: 'Auspicious Crimson, Sindoor Red',
        price: 18500,
        stock_quantity: 7,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Grand bridal heritage weave adorned with an elaborate shikargah animal & vine jaal, symbolizing royalty and auspiciousness.',
        is_featured: 1
      },
      {
        id: 37,
        name: 'Midnight Black & Gold Banarasi Tanchoi Saree',
        sku: 'LUM-SAR-037',
        subcategory: 'Banarasi Silk',
        category: 'Sarees & Drapes',
        fabric: 'Pure Silk Tanchoi Jacquard',
        sizes: 'Free Size',
        colors: 'Jet Black with Antique Gold',
        price: 7899,
        stock_quantity: 14,
        image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
        description: 'Sophisticated evening drape woven using the ancient satin tanchoi technique, creating an embossed dual-color floral tapestry.',
        is_featured: 0
      }
    ]
  },

  'mens-couture': {
    key: 'mens-couture',
    title: "Men's Couture & Sherwanis",
    subtitle: 'Raw Silk Sherwanis, Bandhgalas & Bespoke Tuxedos',
    heroImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Impeccable tailoring and imperial poise for grooms, galas, and festive soirees.',
    badge: 'Bespoke Master Tailoring',
    subcategories: ["All Men's Couture", 'Groom Sherwanis', 'Tuxedos & Suits', 'Bandhgala Suits', 'Kurtas & Sets', 'Blazers & Jackets'],
    items: [
      {
        id: 10,
        name: 'Imperial Raw Silk Groom Sherwani Set',
        sku: 'LUM-MEN-010',
        subcategory: 'Groom Sherwanis',
        category: "Men's Couture",
        fabric: 'Handwoven Raw Silk with Pure Zari',
        sizes: '38, 40, 42, 44',
        colors: 'Ivory Gold, Royal Cream, Pale Peach',
        price: 18500,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Regal groom sherwani with intricate hand-embroidered collar, French knot work, silk stole, and churidar.',
        is_featured: 1
      },
      {
        id: 9,
        name: 'Bespoke Italian Wool 3-Piece Tuxedo',
        sku: 'LUM-MEN-009',
        subcategory: 'Tuxedos & Suits',
        category: "Men's Couture",
        fabric: 'Super 130s Italian Wool & Satin Lapel',
        sizes: '38, 40, 42, 44, 46',
        colors: 'Midnight Navy, Jet Black, Charcoal Slate',
        price: 16999,
        stock_quantity: 10,
        image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        description: 'Masterfully crafted tuxedo featuring peak satin lapels, single-button closure, tailored vest, and flat-front trousers.',
        is_featured: 1
      },
      {
        id: 38,
        name: 'Royal Jodhpur Velvet Bandhgala Suit',
        sku: 'LUM-MEN-038',
        subcategory: 'Bandhgala Suits',
        category: "Men's Couture",
        fabric: 'Plush Silk Velvet & Metal Buttons',
        sizes: '38, 40, 42, 44, 46',
        colors: 'Midnight Navy, Royal Wine, Black',
        price: 13999,
        stock_quantity: 9,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Structured aristocratic Bandhgala jacket crafted in midnight navy velvet, detailed with hand-engraved crest buttons and bespoke trousers.',
        is_featured: 1
      },
      {
        id: 18,
        name: 'Modern Cut Herringbone Tweed Blazer',
        sku: 'LUM-MEN-018',
        subcategory: 'Blazers & Jackets',
        category: "Men's Couture",
        fabric: 'Pure Shetland Wool Tweed',
        sizes: '38, 40, 42, 44',
        colors: 'Earthy Brown, Slate Grey, Forest Green',
        price: 6899,
        stock_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Structured heritage tweed blazer with genuine horn buttons, ticket pocket, and dual rear vents.',
        is_featured: 0
      },
      {
        id: 12,
        name: "Lucknowi Hand-Chikankari Men's Kurta",
        sku: 'LUM-MEN-012',
        subcategory: 'Kurtas & Sets',
        category: "Men's Couture",
        fabric: 'Fine Cotton Silk with Shadow Work',
        sizes: '38, 40, 42, 44, 46',
        colors: 'Pearl White, Pistachio Green, Pastel Peach',
        price: 3199,
        stock_quantity: 25,
        image_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
        description: 'Intricate shadow work Chikankari hand embroidery along the yoke and sleeves. Pairs seamlessly with churidar.',
        is_featured: 0
      },
      {
        id: 39,
        name: 'Ivory & Antique Gold Indo-Western Achkan',
        sku: 'LUM-MEN-039',
        subcategory: 'Groom Sherwanis',
        category: "Men's Couture",
        fabric: 'Raw Silk with Angrakha Overlap',
        sizes: '38, 40, 42, 44',
        colors: 'Ivory Cream with Antique Gold',
        price: 15400,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Contemporary asymmetrical angrakha cut jacket featuring antique zardozi piping, mother-of-pearl buttons, and cowl dhoti.',
        is_featured: 1
      },
      {
        id: 40,
        name: 'Royal Maharaja Brocade Sherwani with Stole',
        sku: 'LUM-MEN-040',
        subcategory: 'Groom Sherwanis',
        category: "Men's Couture",
        fabric: 'Varanasi Silk Brocade with Hand Zari',
        sizes: '38, 40, 42, 44',
        colors: 'Imperial Gold, Royal Maroon',
        price: 22500,
        stock_quantity: 5,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Fit for royalty — heavy Banarasi brocade sherwani accompanied by an embroidered silk stole and coordinating safa fabric.',
        is_featured: 1
      },
      {
        id: 41,
        name: 'Cashmere Wool Charcoal Tuxedo with Shawl Collar',
        sku: 'LUM-MEN-041',
        subcategory: 'Tuxedos & Suits',
        category: "Men's Couture",
        fabric: 'Italian Cashmere-Wool Blend & Grosgrain Silk',
        sizes: '38, 40, 42, 44, 46',
        colors: 'Charcoal Black, Midnight Noir',
        price: 19800,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        description: 'Sleek black-tie dinner jacket with curved shawl collar in grosgrain silk, satin-covered buttons, and tailored trousers.',
        is_featured: 1
      }
    ]
  }
};

/**
 * Collection Page Controller
 */
const CollectionPage = {
  currentKey: 'evening-gowns',
  activeSubcategory: 'All Gowns',
  searchQuery: '',
  sortBy: 'featured',
  data: null,
  filteredItems: [],

  init(defaultKey) {
    // 1. Determine collection key from URL parameter or provided default
    const params = new URLSearchParams(window.location.search);
    const keyParam = params.get('type') || params.get('collection') || params.get('cat') || defaultKey || 'evening-gowns';
    
    // Normalize aliases
    let key = keyParam.toLowerCase();
    if (key.includes('gown') || key.includes('night') || key.includes('evening')) key = 'evening-gowns';
    else if (key.includes('bridal') || key.includes('lehenga')) key = 'bridal-lehengas';
    else if (key.includes('saree') || key.includes('drape')) key = 'sarees-drapes';
    else if (key.includes('men') || key.includes('sherwani') || key.includes('tuxedo')) key = 'mens-couture';

    if (!COLLECTIONS_DATA[key]) {
      key = 'evening-gowns';
    }

    this.currentKey = key;
    this.data = COLLECTIONS_DATA[key];
    this.activeSubcategory = this.data.subcategories[0] || 'All';

    // 2. Render Hero Header & Metadata
    this.renderHeroBanner();
    this.renderSubcategories();
    this.bindControls();

    // 3. Filter & Render Items
    this.filterAndRender();

    // 4. Update cart badge counter
    this.updateCartBadge();
  },

  renderHeroBanner() {
    const d = this.data;
    document.title = `${d.title} | Signature Collection | SURYA TEXTILES A BILLING SOFTWARE`;

    const elTitle = document.getElementById('collection-hero-title');
    const elSub = document.getElementById('collection-hero-subtitle');
    const elDesc = document.getElementById('collection-hero-desc');
    const elBadge = document.getElementById('collection-hero-badge');
    const elBreadcrumbCurrent = document.getElementById('breadcrumb-current-collection');
    const elHeroSec = document.getElementById('collection-hero-section');

    if (elTitle) elTitle.textContent = d.title;
    if (elSub) elSub.textContent = d.subtitle;
    if (elDesc) elDesc.textContent = d.tagline;
    if (elBadge) elBadge.innerHTML = `<i class="fas fa-sparkles"></i> ${d.badge}`;
    if (elBreadcrumbCurrent) elBreadcrumbCurrent.textContent = d.title;

    if (elHeroSec && d.heroImage) {
      elHeroSec.style.backgroundImage = `linear-gradient(rgba(10, 12, 16, 0.78), rgba(10, 12, 16, 0.94)), url('${d.heroImage}')`;
      elHeroSec.style.backgroundSize = 'cover';
      elHeroSec.style.backgroundPosition = 'center 35%';
    }
  },

  renderSubcategories() {
    const container = document.getElementById('collection-subcategories-bar');
    if (!container) return;

    let html = '';
    this.data.subcategories.forEach((sub, idx) => {
      const isActive = sub === this.activeSubcategory;
      html += `
        <button class="cat-pill ${isActive ? 'active' : ''}" data-subcategory="${sub}">
          <i class="fas fa-gem"></i> ${sub}
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = btn.getAttribute('data-subcategory');
        this.activeSubcategory = sub;
        container.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterAndRender();
      });
    });
  },

  bindControls() {
    // Search input
    const searchInput = document.getElementById('collection-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.filterAndRender();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('collection-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.filterAndRender();
      });
    }
  },

  filterAndRender() {
    let items = [...this.data.items];

    // Filter by subcategory (unless "All")
    if (this.activeSubcategory && !this.activeSubcategory.startsWith('All')) {
      items = items.filter(item => item.subcategory === this.activeSubcategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      const q = this.searchQuery;
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.fabric.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.colors && item.colors.toLowerCase().includes(q))
      );
    }

    // Sort
    if (this.sortBy === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Featured / default
      items.sort((a, b) => (b.is_featured || 0) - (a.is_featured || 0));
    }

    this.filteredItems = items;
    this.renderGrid();
  },

  renderGrid() {
    const grid = document.getElementById('collection-items-grid');
    const countDisplay = document.getElementById('collection-count-display');
    if (!grid) return;

    if (countDisplay) {
      countDisplay.textContent = `${this.filteredItems.length} curated designs`;
    }

    if (this.filteredItems.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No dresses found matching "${this.searchQuery || this.activeSubcategory}"</h3>
          <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try choosing another category or clearing your search filter.</p>
          <button class="btn btn-outline-gold btn-sm" style="margin-top: 1rem;" onclick="CollectionPage.resetFilters()">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    const currency = '₹';

    this.filteredItems.forEach(item => {
      const sizeList = item.sizes ? item.sizes.split(',').map(s => `<span class="size-pill">${s.trim()}</span>`).join('') : '';

      html += `
        <article class="dress-card" data-id="${item.id}">
          <div class="dress-image-wrapper" onclick="CollectionPage.openQuickView(${item.id})">
            <img src="${item.image_url}" alt="${item.name}" loading="lazy" class="dress-image" onerror="this.src='https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'" />
            <div class="dress-overlay-actions">
              <button class="btn-quick-view" onclick="event.stopPropagation(); CollectionPage.openQuickView(${item.id})">
                <i class="fas fa-eye"></i> Quick View
              </button>
            </div>
            <span class="dress-stock-badge in-stock">
              <i class="fas fa-check-circle"></i> In Stock
            </span>
          </div>

          <div class="dress-card-body">
            <div class="dress-meta-row">
              <span class="dress-sku">${item.sku}</span>
              <span class="dress-gender-tag">${item.subcategory}</span>
            </div>

            <h3 class="dress-title" title="${item.name}" onclick="CollectionPage.openQuickView(${item.id})">
              ${item.name}
            </h3>

            <div class="dress-fabric-tag">
              <i class="fas fa-scroll"></i> ${item.fabric}
            </div>

            <div class="dress-sizes-list">
              <span style="font-size: 0.72rem; color: var(--text-muted); margin-right: 4px;">Sizes:</span>
              ${sizeList}
            </div>

            <div class="dress-card-footer">
              <div class="dress-price-tag">
                <span class="currency">${currency}</span>
                <span class="amount">${Number(item.price).toLocaleString()}</span>
              </div>
              <button class="btn btn-primary btn-sm" onclick="CollectionPage.addToBilling(${item.id})" title="Add to POS bill / shopping cart">
                <i class="fas fa-shopping-bag"></i> Add to Bill
              </button>
            </div>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
  },

  resetFilters() {
    this.searchQuery = '';
    const searchInput = document.getElementById('collection-search-input');
    if (searchInput) searchInput.value = '';
    this.activeSubcategory = this.data.subcategories[0] || 'All';
    this.renderSubcategories();
    this.filterAndRender();
  },

  openQuickView(itemId) {
    const item = this.data.items.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('collection-quick-view-modal');
    if (!modal) return;

    document.getElementById('qv-product-name').textContent = item.name;
    document.getElementById('qv-product-sku').textContent = item.sku;
    document.getElementById('qv-product-price').textContent = `₹${Number(item.price).toLocaleString()}`;
    document.getElementById('qv-product-desc').textContent = item.description;
    document.getElementById('qv-product-fabric').textContent = item.fabric;
    document.getElementById('qv-product-colors').textContent = item.colors || 'Standard Boutique Palette';
    document.getElementById('qv-product-img').src = item.image_url;
    document.getElementById('qv-product-stock').textContent = `${item.stock_quantity || 12} units in stock`;

    // Sizes buttons
    const sizesContainer = document.getElementById('qv-product-sizes');
    if (sizesContainer) {
      const sizes = item.sizes ? item.sizes.split(',').map(s => s.trim()) : ['Free Size'];
      sizesContainer.innerHTML = sizes.map((s, idx) => `
        <button class="size-choice-btn ${idx === 0 ? 'active' : ''}" onclick="CollectionPage.selectQuickViewSize(this, '${s}')">
          ${s}
        </button>
      `).join('');
      this.selectedQuickViewSize = sizes[0];
    }

    // Add to bill button in modal
    const modalAddBtn = document.getElementById('qv-btn-add-bill');
    if (modalAddBtn) {
      modalAddBtn.onclick = () => {
        this.addToBilling(item.id, this.selectedQuickViewSize);
        this.closeQuickView();
      };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  selectQuickViewSize(btn, size) {
    document.querySelectorAll('.size-choice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.selectedQuickViewSize = size;
  },

  closeQuickView() {
    const modal = document.getElementById('collection-quick-view-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  addToBilling(itemId, selectedSize) {
    const item = this.data.items.find(i => i.id === itemId);
    if (!item) return;

    let cart = [];
    try {
      const saved = localStorage.getItem('boutique_pos_cart');
      if (saved) cart = JSON.parse(saved);
    } catch (e) {}

    const availableSizes = item.sizes ? item.sizes.split(',').map(s => s.trim()) : ['Free Size'];
    const size = selectedSize || availableSizes[0] || 'Free Size';
    const availableColors = item.colors ? item.colors.split(',').map(c => c.trim()) : ['Default'];

    const existingIdx = cart.findIndex(c => c.product_id === item.id && c.size === size);
    if (existingIdx > -1) {
      cart[existingIdx].quantity += 1;
      cart[existingIdx].line_total = cart[existingIdx].quantity * cart[existingIdx].unit_price;
    } else {
      cart.push({
        product_id: item.id,
        product_name: item.name,
        sku: item.sku,
        size: size,
        available_sizes: availableSizes,
        color: availableColors[0] || '',
        unit_price: Number(item.price),
        quantity: 1,
        line_total: Number(item.price),
        max_stock: item.stock_quantity || 15
      });
    }

    try {
      localStorage.setItem('boutique_pos_cart', JSON.stringify(cart));
    } catch (e) {}

    this.updateCartBadge();
    this.showToast(`"${item.name}" added to Billing Bill & Cart!`);
  },

  updateCartBadge() {
    let total = 0;
    let grandTotal = 0;
    try {
      const saved = localStorage.getItem('boutique_pos_cart');
      if (saved) {
        const cart = JSON.parse(saved);
        total = cart.reduce((sum, it) => sum + (it.quantity || 1), 0);
        grandTotal = cart.reduce((sum, it) => sum + ((it.quantity || 1) * (Number(it.unit_price) || 0)), 0);
      }
    } catch (e) {}

    document.querySelectorAll('.nav-cart-badge-count').forEach(el => {
      el.textContent = total;
      el.style.display = total > 0 ? 'inline-block' : 'none';
    });

    const floatBar = document.getElementById('mobile-cart-float-bar');
    const floatQty = document.getElementById('cart-float-qty');
    const floatAmt = document.getElementById('cart-float-amt');
    if (floatQty) floatQty.textContent = `${total} ${total === 1 ? 'item' : 'items'} in bill`;
    if (floatAmt) floatAmt.textContent = `₹${grandTotal.toLocaleString()}`;
    if (floatBar) {
      floatBar.style.display = total > 0 ? 'flex' : 'none';
    }
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}" style="color: var(--accent-gold);"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};
