import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Password hashes
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // 1. Super Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@proquiz.com" },
    update: {},
    create: {
      name: "Admin Director",
      email: "admin@proquiz.com",
      phone: "+91 99999 88888",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });

  // 2. Default Payment Settings
  await prisma.paymentSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      feeAmount: 100.0,
      currency: "INR",
      upiId: "quizpro@upi",
      accountName: "ProQuiz Competitions Ltd",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quizpro@upi&pn=ProQuiz%20Competitions&am=100&cu=INR",
      instructions: "Scan the QR code using Google Pay, PhonePe, Paytm or any UPI app. Pay ₹100, save the screenshot, and enter your 12-digit UTR/Transaction ID below.",
      active: true,
    },
  });

  // 3. Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformName: "NATIONAL QUIZ CHAMPIONSHIP 2026",
      logoUrl: "",
      primaryColor: "#4F46E5",
      contactEmail: "support@proquiz.com",
      contactPhone: "+91 98765 43210",
    },
  });

  // 4. Sample Approved Participant User & Registration
  const participant = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      name: "Muhammed Rahil",
      email: "john@example.com",
      phone: "+91 98765 12345",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const reg = await prisma.registration.upsert({
    where: { registrationId: "REG-2026-001245" },
    update: {},
    create: {
      registrationId: "REG-2026-001245",
      userId: participant.id,
      place: "Bengaluru",
      gender: "Male",
      dob: "2000-05-15",
      institution: "National Institute of Technology",
      course: "Computer Science & Engineering",
      address: "123 Tech Park Avenue, Indiranagar, Bengaluru",
      status: "APPROVED",
    },
  });

  // Payment for approved participant
  const paymentCount = await prisma.payment.count({ where: { registrationId: reg.registrationId } });
  if (paymentCount === 0) {
    await prisma.payment.create({
      data: {
        registrationId: reg.registrationId,
        amount: 100.0,
        currency: "INR",
        transactionId: "UTR202608189876",
        screenshotUrl: "/sample-payment-proof.png",
        status: "APPROVED",
        submittedAt: new Date(),
        verifiedAt: new Date(),
        verifiedBy: admin.id,
      },
    });
  }

  // 5. Create Sample Quiz
  const existingQuiz = await prisma.quiz.findFirst({ where: { title: "General Knowledge & Tech Challenge 2026" } });
  let quizId = existingQuiz?.id;

  if (!existingQuiz) {
    const quiz = await prisma.quiz.create({
      data: {
        title: "General Knowledge & Tech Challenge 2026",
        description: "Test your skills in general awareness, technology, and logical reasoning to win certificates & cash prizes!",
        instructions: "1. The quiz contains 10 multiple-choice questions.\n2. You have 15 minutes to complete the test.\n3. Mandatory questions marked with (*) must be answered before submission.\n4. Do not switch browser tabs during the test.\n5. Answers are autosaved automatically.",
        durationMinutes: 15,
        totalQuestions: 10,
        passingPercentage: 50.0,
        negativeMarking: true,
        showResults: true,
        showAnswers: true,
        showLeaderboard: true,
        maxAttempts: 2,
        status: "ACTIVE",
        enableAntiCheat: true,
      },
    });
    quizId = quiz.id;

    const questionsData = [
      {
        questionText: "What is the capital of India?",
        optionA: "Mumbai",
        optionB: "New Delhi",
        optionC: "Kolkata",
        optionD: "Chennai",
        correctAnswer: "B",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: true,
        category: "General Knowledge",
        difficulty: "Easy",
        explanation: "New Delhi is the capital of India and the seat of all three branches of the Government of India.",
        orderIndex: 1,
      },
      {
        questionText: "Which programming language was developed by James Gosling at Sun Microsystems?",
        optionA: "Python",
        optionB: "C++",
        optionC: "Java",
        optionD: "JavaScript",
        correctAnswer: "C",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: true,
        category: "Technology",
        difficulty: "Easy",
        explanation: "Java was originally developed by James Gosling at Sun Microsystems and released in 1995.",
        orderIndex: 2,
      },
      {
        questionText: "Which element has the chemical symbol 'O' and atomic number 8?",
        optionA: "Osmium",
        optionB: "Oxygen",
        optionC: "Oganesson",
        optionD: "Oxide",
        correctAnswer: "B",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: true,
        category: "Science",
        difficulty: "Easy",
        explanation: "Oxygen is a chemical element with symbol O and atomic number 8.",
        orderIndex: 3,
      },
      {
        questionText: "What does HTTP stand for in web technology?",
        optionA: "HyperText Transfer Protocol",
        optionB: "High Transfer Text Process",
        optionC: "Hyperlink Text Technical Platform",
        optionD: "HyperText Tracking Program",
        correctAnswer: "A",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: false,
        category: "Technology",
        difficulty: "Easy",
        explanation: "HTTP stands for HyperText Transfer Protocol, the protocol used for transmitting web pages.",
        orderIndex: 4,
      },
      {
        questionText: "Which planet is known as the Red Planet?",
        optionA: "Venus",
        optionB: "Jupiter",
        optionC: "Mars",
        optionD: "Saturn",
        correctAnswer: "C",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: true,
        category: "Astronomy",
        difficulty: "Easy",
        explanation: "Mars is often called the Red Planet because iron minerals in the Martian soil oxidize or rust.",
        orderIndex: 5,
      },
      {
        questionText: "What is the primary architectural component of Next.js for server rendering components?",
        optionA: "Redux Store",
        optionB: "App Router & Server Components",
        optionC: "GraphQL Schema",
        optionD: "Webpack Dev Server",
        correctAnswer: "B",
        marks: 3.0,
        negativeMarks: 1.0,
        isMandatory: false,
        category: "Technology",
        difficulty: "Medium",
        explanation: "Next.js App Router relies on React Server Components (RSC) by default.",
        orderIndex: 6,
      },
      {
        questionText: "Which organ in the human body produces insulin?",
        optionA: "Liver",
        optionB: "Kidney",
        optionC: "Pancreas",
        optionD: "Heart",
        correctAnswer: "C",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: true,
        category: "Biology",
        difficulty: "Medium",
        explanation: "The pancreas contains beta cells that synthesize and secrete insulin into the bloodstream.",
        orderIndex: 7,
      },
      {
        questionText: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
        optionA: "O(1)",
        optionB: "O(n)",
        optionC: "O(log n)",
        optionD: "O(n^2)",
        correctAnswer: "C",
        marks: 3.0,
        negativeMarks: 1.0,
        isMandatory: false,
        category: "Computer Science",
        difficulty: "Medium",
        explanation: "Searching in a balanced BST takes logarithmic time O(log n) as each comparison eliminates half the remaining tree.",
        orderIndex: 8,
      },
      {
        questionText: "Who is known as the father of modern Computer Science?",
        optionA: "Charles Babbage",
        optionB: "Alan Turing",
        optionC: "John von Neumann",
        optionD: "Bill Gates",
        correctAnswer: "B",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: false,
        category: "Computer Science",
        difficulty: "Easy",
        explanation: "Alan Turing is widely considered to be the father of theoretical computer science and artificial intelligence.",
        orderIndex: 9,
      },
      {
        questionText: "Which gas makes up the majority of Earth's atmosphere?",
        optionA: "Oxygen",
        optionB: "Carbon Dioxide",
        optionC: "Nitrogen",
        optionD: "Hydrogen",
        correctAnswer: "C",
        marks: 2.0,
        negativeMarks: 0.5,
        isMandatory: false,
        category: "Science",
        difficulty: "Easy",
        explanation: "Nitrogen makes up approximately 78% of the Earth's atmosphere.",
        orderIndex: 10,
      },
    ];

    for (const q of questionsData) {
      await prisma.question.create({
        data: {
          ...q,
          quizId,
        },
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
