import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = "student@university.edu";
  const password = "Student@12345";
  const name = "Alex Johnson";
  const role = "STUDENT";

  try {
    console.log("Cleaning up existing user from public.User...");
    const existingPublic = await prisma.user.findUnique({ where: { email } });
    if (existingPublic) {
      await prisma.user.delete({ where: { email } });
    }

    console.log("Cleaning up existing user from auth.users...");
    await prisma.$executeRawUnsafe("DELETE FROM auth.users WHERE email = $1", email);

    const userId = randomUUID();
    const rawAppMetadata = JSON.stringify({
      provider: "email",
      providers: ["email"],
      role: role
    });

    const rawUserMetadata = JSON.stringify({
      sub: userId,
      email: email,
      email_verified: false,
      phone_verified: false
    });

    console.log("Inserting into auth.users...");
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
      email,
      password,
      rawAppMetadata,
      rawUserMetadata
    );

    console.log("Inserting into auth.identities...");
    const identityId = randomUUID();
    const identityData = JSON.stringify({
      email: email,
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
    `, identityId, userId, email, identityData);

    console.log("Creating user in public.User...");
    await prisma.user.create({
      data: {
        supabaseId: userId,
        name: name,
        email: email,
        role: role as any,
        status: "ACTIVE",
      },
    });

    console.log("User successfully created directly in database!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
