import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';
import { PolicyAssignment } from './policy-assignment.entity';

@Entity('roles')
export class Role {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ type: 'varchar2', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description?: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  permissions: RolePermission[];

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  users: UserRole[];

  @OneToMany(() => PolicyAssignment, (policyAssignment) => policyAssignment.role)
  policyAssignments: PolicyAssignment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

