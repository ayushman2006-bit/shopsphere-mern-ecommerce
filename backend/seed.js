// Run this file with: npm run seed
// It clears the database and inserts demo users, products and one order.

require('dotenv').config();

const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const products = [
  {
    name: 'Aurora Wireless Headphones',
    description:
      'Comfortable over-ear headphones with clear sound, soft ear cushions and up to 30 hours of battery life.',
    price: 2499,
    image: '/uploads/seed/p01-1.jpg',
    category: 'Electronics',
    stock: 25,
  },
  {
    name: 'Pulse Smartwatch',
    description:
      'A lightweight smartwatch with heart-rate tracking, step counting and a bright colour display.',
    price: 1999,
    image: '/uploads/seed/p03-1.jpg',
    category: 'Electronics',
    stock: 30,
  },
  {
    name: 'Echo 360 Bluetooth Speaker',
    description:
      'Portable speaker with rich 360-degree sound, a waterproof body and 20 hours of playtime.',
    price: 1499,
    image: '/uploads/seed/p05-1.jpg',
    category: 'Electronics',
    stock: 40,
  },
  {
    name: 'Nova 27-inch 4K Monitor',
    description:
      'A sharp 4K IPS monitor with slim bezels, perfect for study, design work and entertainment.',
    price: 18999,
    image: '/uploads/seed/p08-1.jpg',
    category: 'Electronics',
    stock: 12,
  },
  {
    name: 'Urban Flex Running Sneakers',
    description:
      'Breathable everyday sneakers with a cushioned sole that keeps you comfortable all day.',
    price: 1299,
    image: '/uploads/seed/p09-1.jpg',
    category: 'Fashion',
    stock: 35,
  },
  {
    name: 'Heritage Denim Jacket',
    description:
      'A classic blue denim jacket made from durable cotton, easy to pair with any casual outfit.',
    price: 1799,
    image: '/uploads/seed/p10-1.jpg',
    category: 'Fashion',
    stock: 18,
  },
  {
    name: 'Organic Cotton T-Shirt',
    description:
      'A soft, breathable everyday t-shirt made from 100% organic cotton.',
    price: 499,
    image: '/uploads/seed/p11-1.jpg',
    category: 'Fashion',
    stock: 60,
  },
  {
    name: 'AeroBrew Coffee Maker',
    description:
      'A compact coffee maker that brews fresh coffee in minutes, with a reusable filter and easy controls.',
    price: 3499,
    image: '/uploads/seed/p15-1.jpg',
    category: 'Home & Kitchen',
    stock: 15,
  },
  {
    name: 'Halo Ambient Table Lamp',
    description:
      'A minimal bedside lamp with warm light and a simple touch control. Ideal for reading and studying.',
    price: 899,
    image: '/uploads/seed/p17-1.jpg',
    category: 'Home & Kitchen',
    stock: 22,
  },
  {
    name: 'Atomic Habits (Paperback)',
    description:
      'A practical guide to building good habits and breaking bad ones, written by James Clear.',
    price: 399,
    image: '/uploads/seed/p23-1.jpg',
    category: 'Books',
    stock: 50,
  },
  {
    name: 'Flow Anti-Slip Yoga Mat',
    description:
      'A cushioned, non-slip yoga mat that is easy to roll up and carry to the gym or park.',
    price: 699,
    image: '/uploads/seed/p29-1.jpg',
    category: 'Sports',
    stock: 28,
  },
  {
    name: 'Nomad Laptop Backpack',
    description:
      'A water-resistant backpack with a padded laptop sleeve, multiple pockets and a comfortable fit.',
    price: 1599,
    image: '/uploads/seed/p31-1.jpg',
    category: 'Accessories',
    stock: 20,
  },
];

const seedDatabase = async () => {
  await connectDB();

  // Start with empty collections so the seed can be run again safely.
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  // User.create() runs the pre-save hook in models/User.js, so passwords are hashed.
  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Store Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@shopsphere.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Demo Customer',
    email: process.env.SEED_CUSTOMER_EMAIL || 'customer@shopsphere.com',
    password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123',
    role: 'user',
  });

  const insertedProducts = await Product.insertMany(products);

  // Add one sample order so the "My Orders" page is not empty on the first login.
  const headphones = insertedProducts[0];
  const book = insertedProducts[9];

  await Order.create({
    userId: customer._id,
    products: [
      {
        productId: headphones._id,
        name: headphones.name,
        price: headphones.price,
        quantity: 1,
        image: headphones.image,
      },
      {
        productId: book._id,
        name: book.name,
        price: book.price,
        quantity: 2,
        image: book.image,
      },
    ],
    totalAmount: headphones.price + book.price * 2,
    status: 'Delivered',
  });

  // Keep the stock consistent with the sample order.
  await Product.updateOne({ _id: headphones._id }, { $inc: { stock: -1 } });
  await Product.updateOne({ _id: book._id }, { $inc: { stock: -2 } });

  console.log('Database seeded successfully.');
  console.log(`Admin login:    ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(`Customer login: ${customer.email} / ${process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123'}`);
  console.log(`${insertedProducts.length} products inserted.`);

  await disconnectDB();
  process.exit(0);
};

seedDatabase().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
