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

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@resto.local'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const permissions = [] as { id: string; code: string }[]

  for (const [code, name] of permissionSeeds) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { name },
      create: {
        code,
        name,
      },
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
    data: permissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
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

  console.log(JSON.stringify({ email: adminEmail, password: adminPassword, role: role.code }))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
