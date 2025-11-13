import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Policy } from './policy.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('policy_assignments')
@Unique(['policyId', 'roleId'])
@Unique(['policyId', 'userId'])
export class PolicyAssignment {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ name: 'policy_id', type: 'varchar2', length: 128 })
  policyId: string;

  @Column({ name: 'role_id', type: 'varchar2', length: 128, nullable: true })
  roleId?: string;

  @Column({ name: 'user_id', type: 'varchar2', length: 128, nullable: true })
  userId?: string;

  @ManyToOne(() => Policy, (policy) => policy.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @ManyToOne(() => Role, (role) => role.policyAssignments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ManyToOne(() => User, (user) => user.policyAssignments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

