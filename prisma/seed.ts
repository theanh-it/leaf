import { prisma } from "@/database";
import { users } from "@/prisma/tables/users";

const main = async () => {
  try {
    await prisma.user.createMany({ data: users });
    console.log("Inserted users");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
