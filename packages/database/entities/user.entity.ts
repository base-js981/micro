import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { UserAttribute } from './user-attribute.entity';
import { PolicyAssignment } from './policy-assignment.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ type: 'varchar2', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar2', length: 500 })
  password: string;

  @Column({ type: 'varchar2', length: 255, nullable: true })
  name?: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles: UserRole[];

  @OneToMany(() => UserAttribute, (userAttribute) => userAttribute.user)
  attributes: UserAttribute[];

  @OneToMany(() => PolicyAssignment, (policyAssignment) => policyAssignment.user)
  policyAssignments: PolicyAssignment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;
}

