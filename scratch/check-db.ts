import { db } from "../src/lib/db";

async function check() {
  const quizzes = await db.quiz.findMany({
    include: { _count: { select: { questions: true, attempts: true } } }
  });
  console.log("Quizzes in DB:", JSON.stringify(quizzes, null, 2));

  const users = await db.user.findMany({
    include: { registration: { include: { payments: true } } }
  });
  console.log("Users in DB:", JSON.stringify(users.map(u => ({
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    regStatus: u.registration?.status,
    payments: u.registration?.payments
  })), null, 2));
}

check().catch(console.error);
