import { PrismaClient } from './generated/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // 1. Create Roles
  console.log('📝 Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with limited access',
    },
  });

  const guestRole = await prisma.role.upsert({
    where: { name: 'guest' },
    update: {},
    create: {
      name: 'guest',
      description: 'Guest user with read-only access',
    },
  });

  console.log('✅ Roles created');

  // 2. Create Permissions
  console.log('📝 Creating permissions...');
  const permissions = [
    // Users permissions
    { name: 'users:read', resource: 'users', action: 'read', description: 'Read users' },
    { name: 'users:write', resource: 'users', action: 'write', description: 'Create and update users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    // Roles permissions
    { name: 'roles:read', resource: 'roles', action: 'read', description: 'Read roles' },
    { name: 'roles:write', resource: 'roles', action: 'write', description: 'Create and update roles' },
    { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
    // Permissions permissions
    { name: 'permissions:read', resource: 'permissions', action: 'read', description: 'Read permissions' },
    { name: 'permissions:write', resource: 'permissions', action: 'write', description: 'Create and update permissions' },
    { name: 'permissions:delete', resource: 'permissions', action: 'delete', description: 'Delete permissions' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      }),
    ),
  );

  console.log('✅ Permissions created');

  // 3. Assign Permissions to Roles
  console.log('📝 Assigning permissions to roles...');

  // Admin: all permissions
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // User: read permissions only
  const userReadPermissions = createdPermissions.filter((p) => p.action === 'read');
  for (const permission of userReadPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Guest: read permissions only (users:read, roles:read, permissions:read)
  const guestReadPermissions = createdPermissions.filter(
    (p) => p.action === 'read' && (p.resource === 'users' || p.resource === 'roles' || p.resource === 'permissions'),
  );
  for (const permission of guestReadPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: guestRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: guestRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Permissions assigned to roles');

  // 4. Create Users
  console.log('📝 Creating users...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashPassword('admin123'),
      name: 'Admin User',
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashPassword('user123'),
      name: 'Regular User',
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: {
      email: 'guest@example.com',
      password: hashPassword('guest123'),
      name: 'Guest User',
      roles: {
        create: {
          roleId: guestRole.id,
        },
      },
    },
  });

  console.log('✅ Users created');

  // 5. Create User Attributes (ABAC)
  console.log('📝 Creating user attributes...');

  await prisma.userAttribute.upsert({
    where: {
      userId_key: {
        userId: adminUser.id,
        key: 'department',
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      key: 'department',
      value: 'engineering',
    },
  });

  await prisma.userAttribute.upsert({
    where: {
      userId_key: {
        userId: adminUser.id,
        key: 'level',
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      key: 'level',
      value: 'senior',
    },
  });

  await prisma.userAttribute.upsert({
    where: {
      userId_key: {
        userId: regularUser.id,
        key: 'department',
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      key: 'department',
      value: 'engineering',
    },
  });

  await prisma.userAttribute.upsert({
    where: {
      userId_key: {
        userId: regularUser.id,
        key: 'level',
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      key: 'level',
      value: 'junior',
    },
  });

  await prisma.userAttribute.upsert({
    where: {
      userId_key: {
        userId: guestUser.id,
        key: 'department',
      },
    },
    update: {},
    create: {
      userId: guestUser.id,
      key: 'department',
      value: 'marketing',
    },
  });

  console.log('✅ User attributes created');

  // 6. Create ABAC Policies
  console.log('📝 Creating ABAC policies...');

  // Policy: Senior engineers can write users
  const seniorEngineerWritePolicy = await prisma.policy.upsert({
    where: { name: 'senior-engineer-write-users' },
    update: {},
    create: {
      name: 'senior-engineer-write-users',
      description: 'Senior engineers can write users in their department',
      resource: 'users',
      action: 'write',
      effect: 'allow',
      rules: {
        create: [
          {
            attribute: 'user.department',
            operator: 'equals',
            value: 'engineering',
          },
          {
            attribute: 'user.level',
            operator: 'equals',
            value: 'senior',
          },
        ],
      },
    },
  });

  // Policy: Users can only read their own department
  const departmentReadPolicy = await prisma.policy.upsert({
    where: { name: 'department-read-users' },
    update: {},
    create: {
      name: 'department-read-users',
      description: 'Users can read users in their own department',
      resource: 'users',
      action: 'read',
      effect: 'allow',
      rules: {
        create: [
          {
            attribute: 'user.department',
            operator: 'equals',
            value: 'engineering', // This would need to be evaluated against resource.department in real scenario
          },
        ],
      },
    },
  });

  // Assign policies to roles
  await prisma.policyAssignment.upsert({
    where: {
      policyId_roleId: {
        policyId: seniorEngineerWritePolicy.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      policyId: seniorEngineerWritePolicy.id,
      roleId: userRole.id,
    },
  });

  await prisma.policyAssignment.upsert({
    where: {
      policyId_roleId: {
        policyId: departmentReadPolicy.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      policyId: departmentReadPolicy.id,
      roleId: userRole.id,
    },
  });

  console.log('✅ ABAC policies created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Created data:');
  console.log(`   - Roles: ${adminRole.name}, ${userRole.name}, ${guestRole.name}`);
  console.log(`   - Permissions: ${createdPermissions.length} permissions`);
  console.log(`   - Users:`);
  console.log(`     * ${adminUser.email} (password: admin123) - Role: ${adminRole.name}`);
  console.log(`     * ${regularUser.email} (password: user123) - Role: ${userRole.name}`);
  console.log(`     * ${guestUser.email} (password: guest123) - Role: ${guestRole.name}`);
  console.log(`   - User Attributes: department, level`);
  console.log(`   - ABAC Policies: 2 policies`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

