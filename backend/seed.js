require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/db');

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Wishlist = require('./models/Wishlist');
const Cart = require('./models/Cart');

const img = (name) => `/uploads/seed/${name}.jpg`;

const categories = [
  {
    name: 'Electronics',
    description: 'Headphones, laptops, wearables and smart devices for modern living.',
    image: img('p01-1'),
  },
  {
    name: 'Fashion',
    description: 'Everyday essentials and statement pieces, crafted to last.',
    image: img('p10-1'),
  },
  {
    name: 'Home & Kitchen',
    description: 'Thoughtful objects that make your space warmer and more functional.',
    image: img('p15-1'),
  },
  {
    name: 'Books',
    description: 'Bestsellers, timeless classics and ideas worth keeping on your shelf.',
    image: img('p22-1'),
  },
  {
    name: 'Sports',
    description: 'Gear for training days, match days and everything in between.',
    image: img('p27-1'),
  },
  {
    name: 'Accessories',
    description: 'Bags, watches and finishing touches that elevate the everyday.',
    image: img('p31-1'),
  },
];

const products = [
  {
    name: 'Aurora ANC Wireless Headphones',
    category: 'Electronics',
    brand: 'Aurora',
    price: 12999,
    discountPrice: 8999,
    stock: 42,
    images: [img('p01-1'), img('p01-2')],
    featured: true,
    trending: true,
    shortDescription: 'Adaptive noise cancellation, studio-grade sound and a 40-hour battery.',
    description:
      'Aurora ANC headphones pair custom 40 mm drivers with adaptive noise cancellation that tunes itself to your surroundings. Memory-foam ear cushions stay comfortable through long work sessions, while multipoint Bluetooth keeps your laptop and phone connected at once. A ten-minute quick charge delivers up to six hours of playback.',
    highlights: ['Adaptive hybrid ANC with transparency mode', '40-hour battery life, USB-C fast charging', 'Multipoint Bluetooth 5.3 connectivity', 'Foldable design with hard travel case'],
  },
  {
    name: 'Nimbus 14" Ultrabook',
    category: 'Electronics',
    brand: 'Nimbus',
    price: 84999,
    discountPrice: 72999,
    stock: 18,
    images: [img('p02-1'), img('p02-2')],
    featured: true,
    shortDescription: 'A feather-light aluminium laptop with a 2.8K display and all-day battery.',
    description:
      'The Nimbus 14 is built for people who work from anywhere. Its 2.8K OLED display covers 100% of the DCI-P3 colour space, the fanless aluminium chassis weighs just 1.1 kg, and the 68 Wh battery comfortably covers a full working day. Fast charging gets you back to 50% in half an hour.',
    highlights: ['14-inch 2.8K OLED display', '16 GB RAM / 512 GB NVMe SSD', '1.1 kg fanless aluminium body', 'Up to 18 hours battery life'],
  },
  {
    name: 'Pulse Smartwatch Series 5',
    category: 'Electronics',
    brand: 'Pulse',
    price: 15999,
    discountPrice: 11999,
    stock: 35,
    images: [img('p03-1'), img('p03-2')],
    trending: true,
    shortDescription: 'Health tracking, GPS and a bright always-on AMOLED display.',
    description:
      'Pulse Series 5 keeps your health data close at hand with continuous heart-rate, SpO2 and sleep tracking. Built-in GPS maps your runs without your phone, and the always-on AMOLED display stays readable in direct sunlight. Swim-proof to 5 ATM with a seven-day typical battery life.',
    highlights: ['1.43-inch always-on AMOLED display', 'Built-in GPS and 120+ workout modes', 'Heart rate, SpO2 and sleep tracking', '5 ATM water resistance'],
  },
  {
    name: 'Vortex RGB Mechanical Keyboard',
    category: 'Electronics',
    brand: 'Vortex',
    price: 6499,
    discountPrice: 4799,
    stock: 55,
    images: [img('p04-1'), img('p04-2')],
    shortDescription: 'Hot-swappable switches, per-key RGB and a satisfying aluminium frame.',
    description:
      'A compact 75% mechanical keyboard with hot-swappable linear switches, sound-dampening foam and a gasket-mounted aluminium plate. Connect over USB-C, Bluetooth or the 2.4 GHz dongle, and customise every key with the companion desktop app.',
    highlights: ['75% hot-swappable layout', 'Tri-mode: USB-C, Bluetooth, 2.4 GHz', 'Per-key RGB with aluminium frame', 'Mac and Windows keycaps included'],
  },
  {
    name: 'Echo 360 Bluetooth Speaker',
    category: 'Electronics',
    brand: 'Echo',
    price: 4999,
    discountPrice: 3499,
    stock: 60,
    images: [img('p05-1'), img('p05-2')],
    shortDescription: 'Room-filling 360° sound in a rugged, waterproof body.',
    description:
      'Echo 360 uses dual passive radiators and a full-range driver to fill a room with balanced sound. IP67 waterproofing makes it a natural companion for the pool or a rainy trek, and two speakers can be paired for true stereo separation.',
    highlights: ['360-degree sound with dual passive radiators', 'IP67 dust and waterproof rating', '20-hour playtime', 'Stereo pairing support'],
  },
  {
    name: 'Lumen 4K Action Camera',
    category: 'Electronics',
    brand: 'Lumen',
    price: 21999,
    discountPrice: 16999,
    stock: 22,
    images: [img('p06-1'), img('p06-2')],
    shortDescription: '4K60 footage, horizon lock and a waterproof shell straight out of the box.',
    description:
      'Capture fast-moving adventures with 4K60 video, 20 MP stills and HyperSmooth-style electronic stabilisation. The included waterproof case is rated to 40 metres, and the front-facing colour screen makes framing vlogs effortless.',
    highlights: ['4K60 video and 20 MP photos', 'Electronic stabilisation with horizon lock', 'Waterproof to 40 m with included case', 'Voice control and live streaming'],
  },
  {
    name: 'Orbit True Wireless Earbuds',
    category: 'Electronics',
    brand: 'Orbit',
    price: 3999,
    discountPrice: 2499,
    stock: 80,
    images: [img('p07-1'), img('p07-2')],
    featured: true,
    shortDescription: 'Pocketable earbuds with active noise cancellation and 28-hour playtime.',
    description:
      'Orbit earbuds deliver punchy sound and effective active noise cancellation in a case small enough for a coin pocket. Four microphones keep calls clear on windy streets, and the case adds three extra charges for up to 28 hours of total listening.',
    highlights: ['Active noise cancellation', '28 hours total playtime with case', 'IPX5 sweat resistance', 'USB-C and wireless charging'],
  },
  {
    name: 'Nova 27" 4K IPS Monitor',
    category: 'Electronics',
    brand: 'Nova',
    price: 32999,
    discountPrice: 26999,
    stock: 15,
    images: [img('p08-1'), img('p08-2')],
    shortDescription: 'A colour-accurate 4K display with USB-C power delivery.',
    description:
      'The Nova 27 delivers crisp 4K detail with 99% sRGB coverage and factory calibration for reliable colour. A single USB-C cable carries video, data and 90 W of power to your laptop, while the slim bezels and adjustable stand keep your desk clean.',
    highlights: ['27-inch 4K IPS panel', '99% sRGB, factory calibrated', 'USB-C with 90 W power delivery', 'Height, tilt and pivot adjustment'],
  },
  {
    name: 'Urban Flex Running Sneakers',
    category: 'Fashion',
    brand: 'UrbanFlex',
    price: 5999,
    discountPrice: 3999,
    stock: 65,
    images: [img('p09-1'), img('p09-2')],
    featured: true,
    trending: true,
    shortDescription: 'Responsive foam cushioning wrapped in a breathable knit upper.',
    description:
      'Urban Flex sneakers are built for daily miles and everything after. A responsive nitrogen-infused foam midsole absorbs impact, the engineered knit upper keeps air moving, and a durable rubber outsole grips wet pavement without feeling heavy.',
    highlights: ['Nitrogen-infused foam midsole', 'Breathable engineered knit upper', 'Reflective heel detail for low light', 'Weight: 245 g (UK 8)'],
  },
  {
    name: 'Heritage Denim Jacket',
    category: 'Fashion',
    brand: 'Heritage',
    price: 4499,
    discountPrice: 3199,
    stock: 38,
    images: [img('p10-1'), img('p10-2')],
    shortDescription: 'A timeless mid-wash denim jacket with a broken-in feel.',
    description:
      'Cut from 12 oz cotton denim and garment-washed for softness, the Heritage jacket is the layer you reach for all year. Metal shank buttons, twin chest pockets and a slightly boxy fit keep it classic without feeling costume-like.',
    highlights: ['100% cotton 12 oz denim', 'Garment-washed for a broken-in feel', 'Two chest pockets and side pockets', 'Unisex relaxed fit'],
  },
  {
    name: 'Essential Organic Cotton Tee',
    category: 'Fashion',
    brand: 'Northline',
    price: 1299,
    discountPrice: 799,
    stock: 120,
    images: [img('p11-1'), img('p11-2')],
    shortDescription: 'A heavyweight organic cotton tee that holds its shape.',
    description:
      'Made from 220 GSM organic cotton with a clean neckline and a slightly relaxed body, this is the everyday tee that survives repeated washing. Pre-shrunk and dyed with low-impact pigments in a range of easy neutrals.',
    highlights: ['220 GSM organic cotton', 'Pre-shrunk, shape-retaining fit', 'Low-impact dye process', 'Ethically manufactured'],
  },
  {
    name: 'Tailored Slim-Fit Jeans',
    category: 'Fashion',
    brand: 'Northline',
    price: 2999,
    discountPrice: 2199,
    stock: 70,
    images: [img('p12-1'), img('p12-2')],
    shortDescription: 'Stretch denim with a clean slim silhouette and comfortable waist.',
    description:
      'These slim-fit jeans use a cotton-elastane blend that moves with you while keeping its shape. A mid-rise waist, tapered leg and dark indigo wash make them equally at home with a blazer or a hoodie.',
    highlights: ['98% cotton, 2% elastane stretch denim', 'Mid-rise slim tapered fit', 'Reinforced belt loops and pockets', 'Dark indigo wash'],
  },
  {
    name: 'Meadow Floral Summer Dress',
    category: 'Fashion',
    brand: 'Meadow',
    price: 3499,
    discountPrice: 2499,
    stock: 45,
    images: [img('p13-1'), img('p13-2')],
    trending: true,
    shortDescription: 'A breezy midi dress with a hand-painted floral print.',
    description:
      'The Meadow dress is cut from lightweight viscose with a softly gathered waist and a floaty midi hem. Adjustable straps and hidden side pockets make it an easy choice for warm afternoons and long dinners.',
    highlights: ['Lightweight viscose with floral print', 'Adjustable straps and hidden pockets', 'Midi length with gathered waist', 'Machine washable'],
  },
  {
    name: 'Alpine Hooded Puffer Jacket',
    category: 'Fashion',
    brand: 'Alpine',
    price: 6999,
    discountPrice: 4999,
    stock: 28,
    images: [img('p14-1'), img('p14-2')],
    shortDescription: 'Lightweight warmth with a water-repellent recycled shell.',
    description:
      'Alpine packs serious warmth into a jacket that folds into its own pocket. Recycled synthetic insulation traps heat without bulk, the DWR-coated shell shrugs off light rain, and the adjustable hood stays put in gusty weather.',
    highlights: ['Recycled synthetic insulation', 'Water-repellent ripstop shell', 'Packs into its own pocket', 'Adjustable hood and hem'],
  },
  {
    name: 'AeroBrew Precision Coffee Maker',
    category: 'Home & Kitchen',
    brand: 'AeroBrew',
    price: 8999,
    discountPrice: 6499,
    stock: 26,
    images: [img('p15-1'), img('p15-2')],
    featured: true,
    shortDescription: 'Pour-over style coffee at the press of a button, with temperature control.',
    description:
      'AeroBrew recreates the ritual of a careful pour-over without the guesswork. A PID controller holds water within 1°C, the shower head saturates the bed evenly, and the thermal carafe keeps coffee hot for two hours without a hotplate scorching it.',
    highlights: ['PID temperature control within 1°C', '6-cup thermal carafe', 'Reusable stainless steel filter', 'Scheduled brew and auto shut-off'],
  },
  {
    name: 'Nordic Oak Lounge Chair',
    category: 'Home & Kitchen',
    brand: 'Nordhaus',
    price: 18999,
    discountPrice: 14999,
    stock: 12,
    images: [img('p16-1'), img('p16-2')],
    shortDescription: 'Solid oak frame with a deep, supportive seat in bouclé fabric.',
    description:
      'The Nordic lounge chair balances a sculptural solid oak frame with a generously padded seat. Upholstered in a durable bouclé weave, it is built for slow Sunday mornings and long reading sessions. Assembly takes about fifteen minutes.',
    highlights: ['Solid oak frame with natural finish', 'Durable bouclé upholstery', 'High-resilience foam cushioning', 'Easy 15-minute assembly'],
  },
  {
    name: 'Halo Ambient Table Lamp',
    category: 'Home & Kitchen',
    brand: 'Halo',
    price: 2999,
    discountPrice: 1999,
    stock: 48,
    images: [img('p17-1'), img('p17-2')],
    shortDescription: 'Dimmable, warm-to-cool light with a touch-sensitive base.',
    description:
      'Halo casts a soft, glare-free glow from a frosted opal shade. Tap the base to cycle through three colour temperatures and hold to dim. A built-in memory function returns to your favourite setting each time you switch it on.',
    highlights: ['3 colour temperatures, stepless dimming', 'Frosted opal glass shade', 'Touch control with memory', 'Energy-efficient LED (8 W)'],
  },
  {
    name: "Chef's Edge 5-Piece Knife Set",
    category: 'Home & Kitchen',
    brand: "Chef's Edge",
    price: 5499,
    discountPrice: 3999,
    stock: 33,
    images: [img('p18-1'), img('p18-2')],
    shortDescription: 'High-carbon stainless steel knives with a magnetic oak block.',
    description:
      'A focused set of five knives covering every everyday task, forged from high-carbon German stainless steel and hardened to 58 HRC. Full-tang handles stay balanced in the hand, and the magnetic oak block keeps edges protected and within reach.',
    highlights: ['5 forged high-carbon steel knives', '58 HRC hardness for edge retention', 'Full-tang ergonomic handles', 'Magnetic solid oak block'],
  },
  {
    name: 'Terra Ceramic Planter',
    category: 'Home & Kitchen',
    brand: 'Terra',
    price: 1499,
    discountPrice: 999,
    stock: 90,
    images: [img('p19-1'), img('p19-2')],
    shortDescription: 'A hand-glazed stoneware planter with a drainage tray.',
    description:
      'Each Terra planter is wheel-thrown and glazed by hand, so no two pieces are exactly alike. A drainage hole and matching saucer keep roots healthy, while the matte speckled finish suits everything from herbs to monsteras.',
    highlights: ['Hand-glazed stoneware', 'Drainage hole with matching saucer', 'Fits 6-inch nursery pots', 'Indoor use'],
  },
  {
    name: 'Zen Stoneware Dinner Set',
    category: 'Home & Kitchen',
    brand: 'Zen',
    price: 4299,
    discountPrice: 3199,
    stock: 40,
    images: [img('p20-1'), img('p20-2')],
    shortDescription: 'A 16-piece reactive-glaze set for four, made for daily use.',
    description:
      'The Zen dinner set brings a calm, handmade feel to everyday meals. Each piece is fired at high temperature for chip resistance and finished with a reactive glaze that pools beautifully at the edges. Dishwasher and microwave safe.',
    highlights: ['16 pieces: dinner, side, bowl and mug for four', 'Reactive glaze, each piece unique', 'Dishwasher and microwave safe', 'Chip-resistant stoneware'],
  },
  {
    name: 'PureSip Insulated Bottle 1L',
    category: 'Home & Kitchen',
    brand: 'PureSip',
    price: 1799,
    discountPrice: 1199,
    stock: 110,
    images: [img('p21-1'), img('p21-2')],
    trending: true,
    shortDescription: 'Double-wall steel that keeps drinks cold for 24 hours.',
    description:
      'PureSip is built from 18/8 stainless steel with a vacuum-insulated double wall. It keeps water cold for a full day and tea hot for twelve hours, while the leakproof lid and powder-coated finish make it a reliable travel companion.',
    highlights: ['18/8 stainless steel, BPA-free', 'Cold 24 h / hot 12 h', 'Leakproof twist lid', 'Fits standard cup holders'],
  },
  {
    name: 'The Silent Orchard',
    category: 'Books',
    brand: 'Inkwell Press',
    price: 599,
    discountPrice: 399,
    stock: 150,
    images: [img('p22-1'), img('p22-2')],
    featured: true,
    shortDescription: 'A quietly devastating family saga set across three generations.',
    description:
      'When Maya returns to her grandmother’s orchard, she finds a box of letters that rewrites everything she believed about her family. The Silent Orchard is a tender, sharply observed novel about inheritance, forgiveness and the stories we choose to keep.',
    highlights: ['Paperback, 384 pages', 'Literary fiction', 'Includes reading group guide', 'Inkwell Press first edition'],
  },
  {
    name: 'Atomic Habits',
    category: 'Books',
    brand: 'Penguin',
    price: 799,
    discountPrice: 549,
    stock: 200,
    images: [img('p23-1'), img('p23-2')],
    trending: true,
    shortDescription: 'The million-copy bestseller on building better habits, one percent at a time.',
    description:
      'James Clear’s practical framework shows how tiny changes compound into remarkable results. Drawing on biology, psychology and neuroscience, Atomic Habits gives you tools to make good habits obvious, attractive, easy and satisfying.',
    highlights: ['Paperback, 320 pages', 'International bestseller', 'Practical habit-building framework', 'Includes bonus chapter'],
  },
  {
    name: 'The Design of Everyday Things',
    category: 'Books',
    brand: 'MIT Press',
    price: 899,
    discountPrice: 649,
    stock: 95,
    images: [img('p24-1'), img('p24-2')],
    shortDescription: 'The classic introduction to human-centred design, revised and expanded.',
    description:
      'Don Norman explains why some products feel effortless and others infuriating, and how design can close the gap. This revised edition adds contemporary examples from software, services and smart devices. Essential reading for anyone who makes things for people.',
    highlights: ['Paperback, 368 pages', 'Revised and expanded edition', 'Classic text on human-centred design', 'MIT Press'],
  },
  {
    name: 'Start With Why',
    category: 'Books',
    brand: 'Portfolio',
    price: 699,
    discountPrice: 449,
    stock: 130,
    images: [img('p25-1'), img('p25-2')],
    shortDescription: 'How great leaders inspire everyone to take action.',
    description:
      'Simon Sinek explores why some organisations command loyalty while others struggle to be noticed. Through examples from Apple to the civil-rights movement, Start With Why shows how a clear sense of purpose shapes behaviour, culture and long-term success.',
    highlights: ['Paperback, 256 pages', 'Leadership and business strategy', 'Includes practical exercises', 'Portfolio edition'],
  },
  {
    name: 'The Psychology of Money',
    category: 'Books',
    brand: 'Jaico',
    price: 499,
    discountPrice: 349,
    stock: 180,
    images: [img('p26-1'), img('p26-2')],
    featured: true,
    shortDescription: 'Timeless lessons on wealth, greed and happiness.',
    description:
      'Morgan Housel argues that doing well with money has less to do with what you know and more to do with how you behave. In nineteen short chapters he explores luck, risk, compounding and the stories we tell ourselves about enough.',
    highlights: ['Paperback, 256 pages', '19 short, readable chapters', 'Personal finance and behaviour', 'Jaico bestseller'],
  },
  {
    name: 'Apex Pro Match Football',
    category: 'Sports',
    brand: 'Apex',
    price: 2499,
    discountPrice: 1799,
    stock: 75,
    images: [img('p27-1'), img('p27-2')],
    trending: true,
    shortDescription: 'A thermally bonded match ball with a true, predictable flight.',
    description:
      'The Apex Pro uses a thermally bonded seamless construction for a softer touch and a more consistent flight. A textured micro-layer improves grip in wet conditions, and the latex bladder holds pressure through repeated sessions.',
    highlights: ['FIFA Quality Pro inspired construction', 'Thermally bonded seamless panels', 'Size 5, match weight', 'All-weather textured surface'],
  },
  {
    name: 'FlexGrip Adjustable Dumbbell Set',
    category: 'Sports',
    brand: 'FlexGrip',
    price: 8999,
    discountPrice: 6999,
    stock: 20,
    images: [img('p28-1'), img('p28-2')],
    shortDescription: 'Two dumbbells that replace fifteen pairs, from 2.5 to 24 kg.',
    description:
      'FlexGrip’s dial system lets you change weight in seconds without scattering plates across the floor. The compact tray holds both dumbbells, and the knurled steel handle stays secure during presses, rows and lunges.',
    highlights: ['2.5–24 kg per dumbbell', 'Quick-turn weight selection', 'Space-saving storage trays', 'Steel handle with secure knurling'],
  },
  {
    name: 'Flow Anti-Slip Yoga Mat',
    category: 'Sports',
    brand: 'Flow',
    price: 1999,
    discountPrice: 1399,
    stock: 85,
    images: [img('p29-1'), img('p29-2')],
    shortDescription: 'A 6 mm natural rubber mat with a grippy, sweat-resistant surface.',
    description:
      'Flow’s natural rubber base stays planted through vinyasas and sweaty flows. The 6 mm cushioning protects knees and wrists without sacrificing stability, and the alignment lines help you check your stance without a mirror.',
    highlights: ['6 mm natural rubber cushioning', 'Sweat-resistant grip surface', 'Alignment guide lines', 'Carry strap included'],
  },
  {
    name: 'Velocity Grade-1 Cricket Bat',
    category: 'Sports',
    brand: 'Velocity',
    price: 4999,
    discountPrice: 3499,
    stock: 30,
    images: [img('p30-1'), img('p30-2')],
    shortDescription: 'Grade-1 English willow with a mid-to-low sweet spot.',
    description:
      'Hand-selected Grade-1 English willow gives the Velocity bat a responsive, powerful feel from the first knock. The mid-to-low sweet spot suits front-foot play, and the semi-oval handle reduces vibration on mistimed shots.',
    highlights: ['Grade-1 English willow', 'Mid-to-low sweet spot', 'Semi-oval handle', 'Weight: 1180–1230 g'],
  },
  {
    name: 'Nomad Leather Laptop Backpack',
    category: 'Accessories',
    brand: 'Nomad',
    price: 5499,
    discountPrice: 3999,
    stock: 44,
    images: [img('p31-1'), img('p31-2')],
    featured: true,
    shortDescription: 'Full-grain leather and waxed canvas, built for the daily commute.',
    description:
      'The Nomad backpack pairs full-grain leather panels with water-resistant waxed canvas. A padded 16-inch laptop sleeve, quick-access top pocket and trolley strap make travel easier, while the leather develops a unique patina over time.',
    highlights: ['Fits 16-inch laptops', 'Full-grain leather and waxed canvas', 'Water-resistant lining', 'Luggage trolley strap'],
  },
  {
    name: 'Horizon Polarised Aviators',
    category: 'Accessories',
    brand: 'Horizon',
    price: 2999,
    discountPrice: 1999,
    stock: 65,
    images: [img('p32-1'), img('p32-2')],
    trending: true,
    shortDescription: 'Classic aviators with polarised lenses and a lightweight metal frame.',
    description:
      'Horizon aviators use polarised CR-39 lenses that cut glare without dulling colour. The lightweight stainless steel frame flexes without losing shape, and adjustable silicone nose pads keep the fit comfortable through long days.',
    highlights: ['Polarised CR-39 lenses', '100% UVA/UVB protection', 'Lightweight stainless steel frame', 'Hard case and microfibre pouch'],
  },
  {
    name: 'Chrono Classic Automatic Watch',
    category: 'Accessories',
    brand: 'Chrono',
    price: 14999,
    discountPrice: 11999,
    stock: 18,
    images: [img('p33-1'), img('p33-2')],
    shortDescription: 'A 40 mm automatic dress watch with a sapphire crystal.',
    description:
      'The Chrono Classic houses a reliable 24-jewel automatic movement in a slim 40 mm stainless steel case. A domed sapphire crystal, exhibition caseback and hand-finished leather strap make it a watch you can wear every day and keep for years.',
    highlights: ['Automatic movement, 40-hour reserve', '40 mm stainless steel case', 'Domed sapphire crystal', 'Italian leather strap'],
  },
  {
    name: 'Aria Leather Tote Handbag',
    category: 'Accessories',
    brand: 'Aria',
    price: 7999,
    discountPrice: 5999,
    stock: 25,
    images: [img('p34-1'), img('p34-2')],
    shortDescription: 'A structured everyday tote in soft pebbled leather.',
    description:
      'Aria’s tote is made from soft pebbled leather with a structured base that keeps its shape when you set it down. The roomy interior fits a 14-inch laptop, and the detachable pouch keeps smaller essentials organised.',
    highlights: ['Genuine pebbled leather', 'Fits a 14-inch laptop', 'Detachable internal pouch', 'Magnetic closure'],
  },
  {
    name: 'Voyager RFID Passport Wallet',
    category: 'Accessories',
    brand: 'Voyager',
    price: 2499,
    discountPrice: 1699,
    stock: 60,
    images: [img('p35-1'), img('p35-2')],
    shortDescription: 'A slim travel organiser with RFID-blocking protection.',
    description:
      'Keep passports, cards and boarding passes in one place with the Voyager travel wallet. RFID-blocking lining protects contactless cards, while the elastic closure and water-resistant exterior handle crowded airports and rainy transfers.',
    highlights: ['RFID-blocking lining', 'Holds two passports and eight cards', 'Water-resistant exterior', 'Fits inside a jacket pocket'],
  },
];

const addresses = {
  alex: {
    fullName: 'Alex Morgan',
    phone: '9876543210',
    street: '42 Maple Avenue, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
  },
  priya: {
    fullName: 'Priya Sharma',
    phone: '9822011223',
    street: '18 Rose Villa, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400050',
    country: 'India',
  },
  rohan: {
    fullName: 'Rohan Mehta',
    phone: '9911002233',
    street: '7 Lake Road, Salt Lake',
    city: 'Kolkata',
    state: 'West Bengal',
    postalCode: '700091',
    country: 'India',
  },
};

const seed = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
      throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding production');
    }

    await connectDB();

    console.log('Clearing existing ShopSphere collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Wishlist.deleteMany({}),
      Cart.deleteMany({}),
    ]);

    console.log('Creating categories...');
    const createdCategories = await Category.create(categories);
    const categoryMap = new Map(createdCategories.map((c) => [c.name, c._id]));

    console.log(`Creating ${products.length} products...`);
    const createdProducts = [];
    for (const item of products) {
      const product = await Product.create({
        name: item.name,
        description: item.description,
        shortDescription: item.shortDescription,
        price: item.price,
        discountPrice: item.discountPrice,
        images: item.images,
        category: categoryMap.get(item.category),
        brand: item.brand,
        stock: item.stock,
        highlights: item.highlights,
        isFeatured: Boolean(item.featured),
        isTrending: Boolean(item.trending),
        soldCount: Math.floor(Math.random() * 40),
      });
      createdProducts.push(product);
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@shopsphere.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123';

    console.log('Creating demo accounts...');
    const admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'Store Administrator',
      email: adminEmail,
      password: adminPassword,
      phone: '9000000000',
      role: 'admin',
      address: {
        fullName: 'Store Administrator',
        phone: '9000000000',
        street: '1 Commerce Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
    });

    const alex = await User.create({
      name: 'Alex Morgan',
      email: 'customer@shopsphere.com',
      password: customerPassword,
      phone: addresses.alex.phone,
      address: addresses.alex,
    });
    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: customerPassword,
      phone: addresses.priya.phone,
      address: addresses.priya,
    });
    const rohan = await User.create({
      name: 'Rohan Mehta',
      email: 'rohan@example.com',
      password: customerPassword,
      phone: addresses.rohan.phone,
      address: addresses.rohan,
    });

    console.log('Creating sample orders...');
    const byName = (name) => createdProducts.find((p) => p.name === name);
    const orderSpecs = [
      { user: alex, items: [[byName('Aurora ANC Wireless Headphones'), 1], [byName('PureSip Insulated Bottle 1L'), 2]], daysAgo: 28, status: 'Delivered', payment: 'Online' },
      { user: priya, items: [[byName('Atomic Habits'), 1], [byName('The Psychology of Money'), 1]], daysAgo: 24, status: 'Delivered', payment: 'COD' },
      { user: rohan, items: [[byName('Apex Pro Match Football'), 1]], daysAgo: 21, status: 'Delivered', payment: 'Online' },
      { user: alex, items: [[byName('Nimbus 14" Ultrabook'), 1], [byName('Nova 27" 4K IPS Monitor'), 1]], daysAgo: 17, status: 'Delivered', payment: 'Online' },
      { user: priya, items: [[byName('Meadow Floral Summer Dress'), 1], [byName('Horizon Polarised Aviators'), 1]], daysAgo: 14, status: 'Shipped', payment: 'COD' },
      { user: rohan, items: [[byName('FlexGrip Adjustable Dumbbell Set'), 1]], daysAgo: 11, status: 'Delivered', payment: 'Online' },
      { user: alex, items: [[byName('AeroBrew Precision Coffee Maker'), 1], [byName('Terra Ceramic Planter'), 2]], daysAgo: 9, status: 'Shipped', payment: 'Online' },
      { user: priya, items: [[byName('Nomad Leather Laptop Backpack'), 1]], daysAgo: 6, status: 'Processing', payment: 'COD' },
      { user: rohan, items: [[byName('Chrono Classic Automatic Watch'), 1]], daysAgo: 4, status: 'Processing', payment: 'Online' },
      { user: alex, items: [[byName('Vortex RGB Mechanical Keyboard'), 1], [byName('Orbit True Wireless Earbuds'), 1]], daysAgo: 3, status: 'Pending', payment: 'COD' },
      { user: priya, items: [[byName('Zen Stoneware Dinner Set'), 1]], daysAgo: 2, status: 'Cancelled', payment: 'Online' },
      { user: rohan, items: [[byName('Urban Flex Running Sneakers'), 1], [byName('Essential Organic Cotton Tee'), 2]], daysAgo: 1, status: 'Pending', payment: 'Online' },
    ];

    const createdOrders = [];
    for (const spec of orderSpecs) {
      const orderItems = spec.items.map(([product, quantity]) => ({
        product: product._id,
        name: product.name,
        image: product.images[0],
        price: product.finalPrice ?? product.discountPrice ?? product.price,
        quantity,
      }));
      const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingPrice = itemsPrice >= 999 ? 0 : 49;
      const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);
      const statusHistory = [{ status: 'Pending', date: createdAt, note: 'Order placed successfully' }];
      if (['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(spec.status)) {
        statusHistory.push({ status: 'Processing', date: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000), note: 'Payment verified and order confirmed' });
      }
      if (['Shipped', 'Delivered'].includes(spec.status)) {
        statusHistory.push({ status: 'Shipped', date: new Date(createdAt.getTime() + 20 * 60 * 60 * 1000), note: 'Handed over to the courier partner' });
      }
      if (spec.status === 'Delivered') {
        statusHistory.push({ status: 'Delivered', date: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), note: 'Delivered to the customer' });
      }
      if (spec.status === 'Cancelled') {
        statusHistory.push({ status: 'Cancelled', date: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000), note: 'Cancelled by customer' });
      }

      const order = await Order.create({
        user: spec.user._id,
        orderItems,
        shippingAddress: spec.user.address,
        paymentMethod: spec.payment,
        paymentStatus: spec.status === 'Cancelled' ? (spec.payment === 'Online' ? 'Refunded' : 'Pending') : spec.payment === 'Online' ? 'Paid' : 'Pending',
        ...(spec.payment === 'Online'
          ? {
              paymentResult: {
                transactionId: `SIM-${Math.random().toString(16).slice(2, 12).toUpperCase()}`,
                provider: 'ShopSphere Pay (simulated)',
                paidAt: createdAt,
              },
            }
          : {}),
        itemsPrice,
        discountAmount: 0,
        shippingPrice,
        totalPrice: itemsPrice + shippingPrice,
        orderStatus: spec.status,
        statusHistory,
        ...(spec.status === 'Delivered' ? { deliveredAt: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) } : {}),
        ...(spec.status === 'Cancelled' ? { cancelledAt: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000), cancelReason: 'Changed my mind' } : {}),
      });

      // Preserve the intended historical date for the sales chart.
      await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt, updatedAt: createdAt } });
      createdOrders.push(order);
    }

    console.log('Creating sample reviews...');
    const reviewSpecs = [
      [alex, byName('Aurora ANC Wireless Headphones'), 5, 'Best headphones I have owned', 'The noise cancellation is genuinely excellent on flights, and the battery lasts me a full week of commuting.'],
      [priya, byName('Atomic Habits'), 5, 'Simple and practical', 'I have read a lot of productivity books and this one actually gives you things to do. The two-minute rule alone was worth it.'],
      [rohan, byName('Apex Pro Match Football'), 4, 'Great match ball', 'Holds pressure well and has a nice touch. The surface scuffs a little after a few games on concrete but that is expected.'],
      [alex, byName('Nimbus 14" Ultrabook'), 5, 'Perfect for travel', 'The screen is gorgeous and I can work a full day without the charger. Fans never spun up during normal use.'],
      [priya, byName('Meadow Floral Summer Dress'), 4, 'Lovely fabric', 'The print is even prettier in person and the pockets are a nice touch. Runs slightly large, so consider sizing down.'],
      [rohan, byName('FlexGrip Adjustable Dumbbell Set'), 5, 'Saves so much space', 'The dial mechanism is quick and feels solid. I replaced a whole rack with these.'],
      [alex, byName('AeroBrew Precision Coffee Maker'), 4, 'Consistent coffee every morning', 'Took a couple of tries to dial in my grind, but now it makes a very good cup with no effort.'],
      [priya, byName('The Psychology of Money'), 5, 'Changed how I think', 'Short chapters, big ideas. I keep coming back to the chapter on enough.'],
      [rohan, byName('Urban Flex Running Sneakers'), 5, 'Light and comfortable', 'Did a 10k in these out of the box with no blisters. Grip is good on wet roads.'],
      [alex, byName('Vortex RGB Mechanical Keyboard'), 4, 'Great typing feel', 'The gasket mount makes it much softer than my old keyboard. Bluetooth switching between devices works reliably.'],
    ];

    for (const [user, product, rating, title, comment] of reviewSpecs) {
      const order = createdOrders.find(
        (o) => String(o.user) === String(user._id) && o.orderItems.some((item) => String(item.product) === String(product._id))
      );
      await Review.create({
        user: user._id,
        product: product._id,
        rating,
        title,
        comment,
        isVerifiedPurchase: Boolean(order),
      });
    }

    // Recalculate product rating aggregates from the seeded reviews.
    const ratingAgg = await Review.aggregate([
      { $group: { _id: '$product', ratings: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
    ]);
    for (const entry of ratingAgg) {
      await Product.updateOne(
        { _id: entry._id },
        { $set: { ratings: Math.round(entry.ratings * 10) / 10, numReviews: entry.numReviews } }
      );
    }

    console.log('Creating wishlist and cart demo data...');
    await Wishlist.create({
      user: alex._id,
      products: [byName('Chrono Classic Automatic Watch')._id, byName('Nomad Leather Laptop Backpack')._id, byName('The Design of Everyday Things')._id],
    });
    await Cart.create({
      user: alex._id,
      items: [
        { product: byName('Horizon Polarised Aviators')._id, quantity: 1 },
        { product: byName('PureSip Insulated Bottle 1L')._id, quantity: 2 },
      ],
    });

    console.log('\nShopSphere seed completed successfully.');
    console.log('----------------------------------------------------');
    console.log(`Categories : ${createdCategories.length}`);
    console.log(`Products   : ${createdProducts.length}`);
    console.log(`Orders     : ${createdOrders.length}`);
    console.log(`Reviews    : ${reviewSpecs.length}`);
    console.log('----------------------------------------------------');
    console.log('Admin login    :', adminEmail, '/', adminPassword);
    console.log('Customer login : customer@shopsphere.com /', customerPassword);
    console.log('Other customers: priya@example.com, rohan@example.com');
    console.log('----------------------------------------------------\n');
  } catch (error) {
    console.error('Seed failed:', error.message);
    if (error.errors) console.error(error.errors);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.connection.close().catch(() => {});
  }
};

seed();
