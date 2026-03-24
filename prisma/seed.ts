import { hash } from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("Visus@2026", 12);

  const user = await prisma.user.upsert({
    where: { email: "ai3@visus-ai.com.br" },
    update: {},
    create: {
      name: "Visus AI",
      email: "ai3@visus-ai.com.br",
      passwordHash,
    },
  });

  console.log("Usuario criado:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
