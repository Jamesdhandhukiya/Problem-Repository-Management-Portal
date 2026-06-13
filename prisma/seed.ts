import { PrismaClient, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const TOPICS = [
  { name: "DSA", slug: "dsa", subtopics: ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"] },
  { name: "DBMS", slug: "dbms", subtopics: ["SQL", "Normalization", "Transactions", "Indexing"] },
  { name: "OS", slug: "os", subtopics: ["Processes", "Memory Management", "Scheduling", "Deadlocks"] },
  { name: "CN", slug: "cn", subtopics: ["TCP/IP", "Routing", "DNS", "HTTP"] },
  { name: "OOP", slug: "oop", subtopics: ["Inheritance", "Polymorphism", "Design Patterns"] },
  { name: "Java", slug: "java", subtopics: ["Collections", "Streams", "Concurrency"] },
  { name: "Python", slug: "python", subtopics: ["Data Structures", "Decorators", "Async"] },
  { name: "JavaScript", slug: "javascript", subtopics: ["Closures", "Promises", "ES6+"] },
  { name: "React", slug: "react", subtopics: ["Hooks", "State Management", "Performance"] },
  { name: "NodeJS", slug: "nodejs", subtopics: ["Express", "Event Loop", "APIs"] },
  { name: "DevOps", slug: "devops", subtopics: ["CI/CD", "Docker", "Kubernetes"] },
  { name: "Cloud Computing", slug: "cloud-computing", subtopics: ["AWS", "Azure", "Serverless"] },
  { name: "AI/ML", slug: "ai-ml", subtopics: ["Neural Networks", "NLP", "Computer Vision"] },
];

const SEED_USERS = [
  { email: "admin@university.edu", password: "Admin@12345", name: "System Admin", role: "ADMIN" as UserRole },
  { email: "staff@university.edu", password: "Staff@12345", name: "Dr. Jane Smith", role: "STAFF" as UserRole },
  { email: "moderator@university.edu", password: "Mod@12345", name: "Prof. John Doe", role: "MODERATOR" as UserRole },
  { email: "student@university.edu", password: "Student@12345", name: "Alex Johnson", role: "STUDENT" as UserRole },
];

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding topics...");
  for (const topic of TOPICS) {
    const created = await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: { name: topic.name, slug: topic.slug },
    });

    for (const sub of topic.subtopics) {
      await prisma.subtopic.upsert({
        where: { topicId_name: { topicId: created.id, name: sub } },
        update: {},
        create: { name: sub, topicId: created.id },
      });
    }
  }

  console.log("Seeding users...");
  const userMap: Record<string, string> = {};

  for (const seedUser of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: seedUser.email },
    });

    if (existing) {
      userMap[seedUser.role] = existing.id;
      continue;
    }

    let supabaseUser: any = null;

    // Try admin API first
    const { data, error } = await supabase.auth.admin.createUser({
      email: seedUser.email,
      password: seedUser.password,
      email_confirm: true,
      app_metadata: { role: seedUser.role },
    });

    if (!error && data?.user) {
      supabaseUser = data.user;
    } else {
      console.warn(`Admin API signUp failed for ${seedUser.email} (${error?.message}). Trying direct SQL insertion fallback...`);
      
      // Clean up any partially created auth user to avoid duplicate key issues
      try {
        await prisma.$executeRawUnsafe("DELETE FROM auth.users WHERE email = $1", seedUser.email);
      } catch (e) {}

      const userId = randomUUID();
      const rawAppMetadata = JSON.stringify({
        provider: "email",
        providers: ["email"],
        role: seedUser.role
      });

      const rawUserMetadata = JSON.stringify({
        sub: userId,
        email: seedUser.email,
        email_verified: false,
        phone_verified: false
      });

      try {
        // 1. Insert directly into auth.users with all required fields to prevent scan errors
        await prisma.$executeRawUnsafe(`
          INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at,
            is_anonymous
          ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            $1::uuid,
            'authenticated',
            'authenticated',
            $2,
            extensions.crypt($3, extensions.gen_salt('bf')),
            NOW(),
            null,
            '',
            null,
            '',
            null,
            '',
            '',
            null,
            null,
            $4::jsonb,
            $5::jsonb,
            null,
            NOW(),
            NOW(),
            null,
            null,
            '',
            '',
            null,
            '',
            0,
            null,
            '',
            null,
            false,
            null,
            false
          )
        `,
          userId,
          seedUser.email,
          seedUser.password,
          rawAppMetadata,
          rawUserMetadata
        );

        // 2. Insert into auth.identities
        const identityId = randomUUID();
        const identityData = JSON.stringify({
          email: seedUser.email,
          email_verified: true,
          phone_verified: false,
          sub: userId
        });

        await prisma.$executeRawUnsafe(`
          INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            created_at,
            updated_at
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3,
            $4::jsonb,
            'email',
            NOW(),
            NOW()
          )
        `, identityId, userId, seedUser.email, identityData);

        supabaseUser = { id: userId };
      } catch (sqlError: any) {
        console.error(`Skipping ${seedUser.email}: Failed to run direct SQL insertion: ${sqlError.message}`);
        continue;
      }
    }

    const user = await prisma.user.create({
      data: {
        supabaseId: supabaseUser.id,
        name: seedUser.name,
        email: seedUser.email,
        role: seedUser.role,
        domain: (seedUser as any).domain,
        department: (seedUser as any).department,
        semester: (seedUser as any).semester,
        status: "ACTIVE",
      },
    });

    userMap[seedUser.role] = user.id;
  }



  const dsaTopic = await prisma.topic.findUnique({ where: { slug: "dsa" } });
  const arraysSub = dsaTopic
    ? await prisma.subtopic.findFirst({
        where: { topicId: dsaTopic.id, name: "Arrays" },
      })
    : null;

  if (userMap.STAFF && dsaTopic) {
    const existingQ = await prisma.question.findFirst({
      where: { title: "Two Sum" },
    });

    if (!existingQ) {
      console.log("Seeding sample questions...");
      await prisma.question.createMany({
        data: [
          {
            title: "Two Sum",
            statement:
              "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            difficulty: "EASY",
            topicId: dsaTopic.id,
            subtopicId: arraysSub?.id,
            constraints: "2 <= nums.length <= 10^4",
            inputFormat: "First line: n, target\nSecond line: n integers",
            outputFormat: "Two indices separated by space",
            sampleInput: "4 9\n2 7 11 15",
            sampleOutput: "0 1",
            solutionApproach: "Use a hash map to store complements.",
            tags: ["array", "hash-map"],
            companyTags: ["Google", "Amazon"],
            expectedTimeComplexity: "O(n)",
            expectedSpaceComplexity: "O(n)",
            status: "PUBLISHED",
            createdById: userMap.STAFF,
          },
          {
            title: "Binary Tree Level Order Traversal",
            statement:
              "Given the root of a binary tree, return the level order traversal of its nodes' values.",
            difficulty: "MEDIUM",
            topicId: dsaTopic.id,
            subtopicId: arraysSub?.id,
            constraints: "The number of nodes is in range [0, 2000]",
            tags: ["tree", "bfs"],
            companyTags: ["Microsoft"],
            expectedTimeComplexity: "O(n)",
            expectedSpaceComplexity: "O(n)",
            status: "SUBMITTED",
            createdById: userMap.STAFF,
          },
          {
            title: "Design LRU Cache",
            statement:
              "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
            difficulty: "HARD",
            topicId: dsaTopic.id,
            tags: ["design", "hash-map"],
            companyTags: ["Meta"],
            status: "DRAFT",
            createdById: userMap.STAFF,
          },
        ],
      });
    }
  }

  console.log("Seed completed successfully!");
  console.log("\nDefault credentials:");
  SEED_USERS.forEach((u) => {
    console.log(`  ${u.role}: ${u.email} / ${u.password}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
