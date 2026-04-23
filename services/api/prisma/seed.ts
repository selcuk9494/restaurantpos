import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const permissionSeeds = [
  ['iam.users.view', 'Kullanicilari Goruntule'],
  ['iam.users.create', 'Kullanici Olustur'],
  ['iam.roles.view', 'Rolleri Goruntule'],
  ['iam.roles.create', 'Rol Olustur'],
  ['iam.permissions.view', 'Izinleri Goruntule'],
  ['iam.permissions.create', 'Izin Olustur'],
] as const

const categorySeeds = [
  { code: 'atistirmaliklar', name: 'Atistirmaliklar', sortOrder: 10 },
  { code: 'kahveler', name: 'Kahveler', sortOrder: 20 },
  { code: 'TEA', name: 'Caylar', sortOrder: 30 },
  { code: 'ekstralar', name: 'Ekstralar', sortOrder: 40 },
  { code: 'PACKAGED', name: 'Paket Urunler', sortOrder: 50 },
  { code: 'DESSERT', name: 'Tatli', sortOrder: 60 },
] as const

const productSeeds = [
  { code: 'SNACK-001', name: 'Karisik Sandvic', description: 'Hindi fume ve ozel sos', price: 129, categoryCode: 'atistirmaliklar' },
  { code: 'SNACK-002', name: 'Vejetaryen Sandvic', description: 'Izgara sebze ve pesto', price: 139, categoryCode: 'atistirmaliklar' },
  { code: 'SNACK-003', name: 'Tahinli Pogaca', description: 'Firindan yeni cikan urun', price: 79, categoryCode: 'atistirmaliklar' },
  { code: 'SNACK-004', name: 'Cikolatali Kruvasan', description: 'Tereyagli ve cikolatali', price: 114, categoryCode: 'atistirmaliklar' },
  { code: 'SNACK-005', name: 'Mini Pizza', description: 'Kasarli sicak atistirmalik', price: 149, categoryCode: 'atistirmaliklar' },
  { code: 'COFFEE-001', name: 'Caramel Latte', description: 'Buyuk boy ve ekstra surup', price: 159, categoryCode: 'kahveler' },
  { code: 'COFFEE-002', name: 'White Americano', description: '2 kahve alana 40 indirim', price: 119, categoryCode: 'kahveler' },
  { code: 'COFFEE-003', name: 'White Mocha', description: 'Beyaz cikolata ve espresso', price: 159, categoryCode: 'kahveler' },
  { code: 'COFFEE-004', name: 'Espresso', description: 'Yogun aromali tek cekim', price: 94, categoryCode: 'kahveler' },
  { code: 'COFFEE-005', name: 'Double Espresso', description: 'Cift shot espresso', price: 109, categoryCode: 'kahveler' },
  { code: 'COFFEE-006', name: 'Americano', description: 'Uzatilmis espresso', price: 129, categoryCode: 'kahveler' },
  { code: 'TEA-001', name: 'Ince Belli Cay', description: 'Demli klasik cay', price: 35, categoryCode: 'TEA' },
  { code: 'TEA-002', name: 'Yesil Cay', description: 'Limon aromali', price: 55, categoryCode: 'TEA' },
  { code: 'EXTRA-001', name: 'Ekstra Shot', description: 'Kahveye ek shot', price: 25, categoryCode: 'ekstralar' },
  { code: 'EXTRA-002', name: 'Badem Sut', description: 'Bitkisel sut secenegi', price: 20, categoryCode: 'ekstralar' },
  { code: 'PACK-001', name: 'Paket Filtre Kahve', description: '250g ozel harman', price: 280, categoryCode: 'PACKAGED' },
  { code: 'PACK-002', name: 'Termos Cay Seti', description: '4 kisilik servis seti', price: 320, categoryCode: 'PACKAGED' },
  { code: 'DESSERT-001', name: 'San Sebastian', description: 'Gunluk taze tatli', price: 165, categoryCode: 'DESSERT' },
  { code: 'DESSERT-002', name: 'Magnolia', description: 'Meyveli kuplu tatli', price: 145, categoryCode: 'DESSERT' },
] as const

const areaSeeds = [
  { code: 'SALON', name: 'Ana Salon', sortOrder: 10 },
  { code: 'TERAS', name: 'Teras', sortOrder: 20 },
] as const

const tableSeeds = [
  { code: 'M1', name: 'Masa 1', capacity: 4, sortOrder: 10, areaCode: 'SALON' },
  { code: 'M2', name: 'Masa 2', capacity: 4, sortOrder: 20, areaCode: 'SALON' },
  { code: 'M3', name: 'Masa 3', capacity: 2, sortOrder: 30, areaCode: 'SALON' },
  { code: 'M4', name: 'Masa 4', capacity: 6, sortOrder: 40, areaCode: 'SALON' },
  { code: 'T1', name: 'Teras 1', capacity: 4, sortOrder: 10, areaCode: 'TERAS' },
  { code: 'T2', name: 'Teras 2', capacity: 4, sortOrder: 20, areaCode: 'TERAS' },
] as const

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@resto.local'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const permissions = [] as { id: string; code: string }[]

  for (const [code, name] of permissionSeeds) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    })
    permissions.push({ id: permission.id, code: permission.code })
  }

  const role = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: {
      name: 'Super Admin',
      description: 'Tum yetkilere sahip varsayilan yonetici rolu',
      isSystem: true,
    },
    create: {
      code: 'super_admin',
      name: 'Super Admin',
      description: 'Tum yetkilere sahip varsayilan yonetici rolu',
      isSystem: true,
    },
  })

  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    skipDuplicates: true,
  })

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'System Admin',
      passwordHash,
      isActive: true,
    },
    create: {
      email: adminEmail,
      fullName: 'System Admin',
      passwordHash,
      isActive: true,
    },
  })

  await prisma.userRole.deleteMany({ where: { userId: user.id } })
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  })

  const categoryByCode = new Map<string, string>()
  for (const seed of categorySeeds) {
    const category = await prisma.category.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
    })
    categoryByCode.set(seed.code, category.id)
  }

  for (const seed of productSeeds) {
    const categoryId = categoryByCode.get(seed.categoryCode)
    if (!categoryId) {
      throw new Error(`Category not found for product seed: ${seed.code}`)
    }

    await prisma.product.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        description: seed.description,
        price: seed.price,
        isActive: true,
        categoryId,
      },
      create: {
        code: seed.code,
        name: seed.name,
        description: seed.description,
        price: seed.price,
        isActive: true,
        categoryId,
      },
    })
  }

  const areaByCode = new Map<string, string>()
  for (const seed of areaSeeds) {
    const area = await prisma.tableArea.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
    })
    areaByCode.set(seed.code, area.id)
  }

  for (const seed of tableSeeds) {
    const areaId = areaByCode.get(seed.areaCode)
    if (!areaId) {
      throw new Error(`Area not found for table seed: ${seed.code}`)
    }

    await prisma.restaurantTable.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        capacity: seed.capacity,
        sortOrder: seed.sortOrder,
        isActive: true,
        areaId,
      },
      create: {
        code: seed.code,
        name: seed.name,
        capacity: seed.capacity,
        sortOrder: seed.sortOrder,
        isActive: true,
        areaId,
      },
    })
  }

  console.log(
    JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      role: role.code,
      categories: categorySeeds.length,
      products: productSeeds.length,
      tables: tableSeeds.length,
    }),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
