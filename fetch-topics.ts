import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const topics = await prisma.topic.findMany();
  console.log(topics);
}
main().finally(() => prisma.$disconnect());
