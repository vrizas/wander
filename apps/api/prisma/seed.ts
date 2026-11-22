import '../src/env.js';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { databaseUrl } from '../src/database-url.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl() }),
});

const img = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=700`;

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@wander.test' },
    update: {},
    create: {
      email: 'admin@wander.test',
      name: 'Admin',
      role: 'ADMIN',
      password: await bcrypt.hash('admin123', 10),
    },
  });
  await prisma.user.upsert({
    where: { email: 'customer@wander.test' },
    update: {},
    create: {
      email: 'customer@wander.test',
      name: 'Customer Demo',
      password: await bcrypt.hash('customer123', 10),
    },
  });

  const categories = [
    { name: 'Pria', slug: 'pria' },
    { name: 'Wanita', slug: 'wanita' },
    { name: 'Unisex', slug: 'unisex' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const cat = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  const products = [
    { name: 'Aeroflex Runner 21', slug: 'aeroflex-runner-21', imageUrl: img(1456733), price: 1299000, stock: 24, categoryId: cat['pria'], description: 'Sepatu lari ringan dengan midsole empuk dan upper mesh yang bernapas.' },
    { name: 'Urban Court Low', slug: 'urban-court-low', imageUrl: img(533442), price: 899000, stock: 31, categoryId: cat['pria'], description: 'Sneaker low-top bergaya court klasik, cocok untuk harian.' },
    { name: 'Trail Master GTX', slug: 'trail-master-gtx', imageUrl: img(4314202), price: 1549000, stock: 4, categoryId: cat['pria'], description: 'Sepatu trail tahan air dengan outsole bergerigi untuk medan basah.' },
    { name: 'Classic Leather Derby', slug: 'classic-leather-derby', imageUrl: img(15557045), price: 1199000, stock: 15, categoryId: cat['pria'], description: 'Sepatu kulit formal dengan sol karet anti-slip.' },
    { name: 'Urban Leather Boot', slug: 'urban-leather-boot', imageUrl: img(32644167), price: 1349000, stock: 12, categoryId: cat['pria'], description: 'Boots kulit cokelat dengan sol karet tebal, kokoh untuk dipakai sehari-hari.' },
    { name: 'Luna Knit Slip-On', slug: 'luna-knit-slip-on', imageUrl: img(38154580), price: 799000, stock: 28, categoryId: cat['wanita'], description: 'Slip-on rajut elastis, ringan dan mudah dipakai.' },
    { name: 'Aurora Pastel Sneaker', slug: 'aurora-pastel-sneaker', imageUrl: img(38154599), price: 1099000, stock: 3, categoryId: cat['wanita'], description: 'Sneaker warna pastel dengan sol tebal yang nyaman.' },
    { name: 'Breeze Mesh Trainer', slug: 'breeze-mesh-trainer', imageUrl: img(17930823), price: 949000, stock: 20, categoryId: cat['wanita'], description: 'Sepatu latihan dengan mesh tipis agar kaki tetap sejuk.' },
    { name: 'Rose Bow Flat', slug: 'rose-bow-flat', imageUrl: img(5168531), price: 699000, stock: 22, categoryId: cat['wanita'], description: 'Flat shoes suede merah muda dengan pita, nyaman untuk kerja maupun acara santai.' },
    { name: 'Terra Strap Flat', slug: 'terra-strap-flat', imageUrl: img(36581188), price: 749000, stock: 16, categoryId: cat['wanita'], description: 'Flat sandal kulit cokelat dengan tali pergelangan, ringan dan elegan.' },
    { name: 'Retro Wave 90s', slug: 'retro-wave-90s', imageUrl: img(9250037), price: 1399000, stock: 17, categoryId: cat['unisex'], description: 'Siluet retro 90-an dengan panel berlapis dan sol chunky.' },
    { name: 'Canvas Daily Low', slug: 'canvas-daily-low', imageUrl: img(12526086), price: 549000, stock: 45, categoryId: cat['unisex'], description: 'Sneaker kanvas low-top serbaguna dengan sol vulkanisir.' },
    { name: 'Cloud Slide Sandal', slug: 'cloud-slide-sandal', imageUrl: img(18186215), price: 299000, stock: 60, categoryId: cat['unisex'], description: 'Sandal slide super empuk untuk santai di rumah atau jalan-jalan.' },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: { imageUrl: p.imageUrl }, create: p });
  }
  console.log('Seed completed');
}

main().finally(() => prisma.$disconnect());
