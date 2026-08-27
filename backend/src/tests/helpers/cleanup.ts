import { prisma } from '../../config/database.js'

export async function cleanDatabase() {
  await prisma.providerProfile.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.estate.deleteMany()
  await prisma.user.deleteMany()
  await prisma.serviceCategory.deleteMany()
}