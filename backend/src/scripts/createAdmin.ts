import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from "bcryptjs";
import "dotenv/config";
import { stdin, stdout } from "process";
import readline from "readline/promises";
import { PrismaClient, Role } from '../generated/prisma/client';

const rl = readline.createInterface({ input: stdin, output: stdout });
const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = await rl.question("Enter your email: ");
  const password = await rl.question("Enter your password: ");

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: "admin",
      password: hashedPassword,
      role: Role.ADMIN,
      emailConfirmed: true,
    },
  });

  console.log("Admin created successfully");

  rl.close();
  await prisma.$disconnect();
}

main();
