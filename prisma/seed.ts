import { prisma, disconnectDatabase } from "@/database";
import { users } from "@/prisma/tables/users";

const main = async () => {
  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        password: user.password,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        status: user.status,
        type: user.type,
      },
      create: user,
    });
  }

  console.log(`Seeded ${users.length} user(s)`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
