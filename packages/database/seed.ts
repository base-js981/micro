import 'reflect-metadata';
import { randomBytes, scryptSync } from 'crypto';
import { AppDataSource } from './data-source';
import { User, Role, Permission, RolePermission, UserRole } from './entities';
import { v4 as uuidv4 } from 'uuid';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const ROLES = [
  { name: 'admin', description: 'Administrator role with full access' },
  { name: 'user', description: 'Regular user role' },
  { name: 'guest', description: 'Guest user role with limited access' },
];

const PERMISSIONS = [
  { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'Read users' },
  { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create roles' },
  { name: 'roles.read', resource: 'roles', action: 'read', description: 'Read roles' },
  { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update roles' },
  { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
  { name: 'permissions.create', resource: 'permissions', action: 'create', description: 'Create permissions' },
  { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'Read permissions' },
  { name: 'permissions.update', resource: 'permissions', action: 'update', description: 'Update permissions' },
  { name: 'permissions.delete', resource: 'permissions', action: 'delete', description: 'Delete permissions' },
  { name: 'files.upload', resource: 'files', action: 'upload', description: 'Upload files' },
  { name: 'files.read', resource: 'files', action: 'read', description: 'Read files' },
  { name: 'files.delete', resource: 'files', action: 'delete', description: 'Delete files' },
  { name: 'catalog.create', resource: 'catalog', action: 'create', description: 'Create catalog items' },
  { name: 'catalog.read', resource: 'catalog', action: 'read', description: 'Read catalog items' },
  { name: 'catalog.update', resource: 'catalog', action: 'update', description: 'Update catalog items' },
  { name: 'catalog.delete', resource: 'catalog', action: 'delete', description: 'Delete catalog items' },
];

const USERS = [
  { email: 'admin@example.com', password: 'Admin123!@#', name: 'Administrator', roleName: 'admin' },
  { email: 'user@example.com', password: 'User123!@#', name: 'Regular User', roleName: 'user' },
  { email: 'guest@example.com', password: 'Guest123!@#', name: 'Guest User', roleName: 'guest' },
];

async function seed(): Promise<void> {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Database connected');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const roleRepo = queryRunner.manager.getRepository(Role);
    const permissionRepo = queryRunner.manager.getRepository(Permission);
    const userRepo = queryRunner.manager.getRepository(User);
    const rolePermissionRepo = queryRunner.manager.getRepository(RolePermission);
    const userRoleRepo = queryRunner.manager.getRepository(UserRole);

    // Seed Roles
    console.log('Seeding roles...');
    const roles = new Map<string, Role>();
    for (const roleData of ROLES) {
      let role = await roleRepo.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = roleRepo.create({ id: uuidv4(), ...roleData });
        role = await roleRepo.save(role);
      }
      roles.set(roleData.name, role);
    }

    // Seed Permissions
    console.log('Seeding permissions...');
    const permissions = new Map<string, Permission>();
    for (const permData of PERMISSIONS) {
      let permission = await permissionRepo.findOne({
        where: { resource: permData.resource, action: permData.action },
      });
      if (!permission) {
        permission = permissionRepo.create({ id: uuidv4(), ...permData });
        permission = await permissionRepo.save(permission);
      }
      permissions.set(`${permData.resource}.${permData.action}`, permission);
    }

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    const adminRole = roles.get('admin')!;
    const userRole = roles.get('user')!;
    const guestRole = roles.get('guest')!;

    // Admin: all permissions
    for (const permission of permissions.values()) {
      const exists = await rolePermissionRepo.findOne({
        where: { roleId: adminRole.id, permissionId: permission.id },
      });
      if (!exists) {
        await rolePermissionRepo.save(
          rolePermissionRepo.create({
            id: uuidv4(),
            roleId: adminRole.id,
            permissionId: permission.id,
          }),
        );
      }
    }

    // User: read permissions + file upload + catalog read
    for (const permission of permissions.values()) {
      if (
        permission.action === 'read' ||
        (permission.resource === 'files' && permission.action === 'upload') ||
        (permission.resource === 'catalog' && permission.action === 'read')
      ) {
        const exists = await rolePermissionRepo.findOne({
          where: { roleId: userRole.id, permissionId: permission.id },
        });
        if (!exists) {
          await rolePermissionRepo.save(
            rolePermissionRepo.create({
              id: uuidv4(),
              roleId: userRole.id,
              permissionId: permission.id,
            }),
          );
        }
      }
    }

    // Guest: read only
    for (const permission of permissions.values()) {
      if (permission.action === 'read') {
        const exists = await rolePermissionRepo.findOne({
          where: { roleId: guestRole.id, permissionId: permission.id },
        });
        if (!exists) {
          await rolePermissionRepo.save(
            rolePermissionRepo.create({
              id: uuidv4(),
              roleId: guestRole.id,
              permissionId: permission.id,
            }),
          );
        }
      }
    }

    // Seed Users
    console.log('Seeding users...');
    for (const userData of USERS) {
      let user = await userRepo.findOne({ where: { email: userData.email } });
      if (!user) {
        user = userRepo.create({
          id: uuidv4(),
          email: userData.email,
          password: hashPassword(userData.password),
          name: userData.name,
        });
        user = await userRepo.save(user);

        // Assign role to user
        const role = roles.get(userData.roleName)!;
        const exists = await userRoleRepo.findOne({
          where: { userId: user.id, roleId: role.id },
        });
        if (!exists) {
          await userRoleRepo.save(
            userRoleRepo.create({
              id: uuidv4(),
              userId: user.id,
              roleId: role.id,
            }),
          );
        }
      }
    }

    await queryRunner.commitTransaction();
    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest accounts:');
    USERS.forEach((u) => console.log(`${u.roleName}: ${u.email} / ${u.password}`));
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
