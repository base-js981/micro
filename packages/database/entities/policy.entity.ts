import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PolicyRule } from './policy-rule.entity';
import { PolicyAssignment } from './policy-assignment.entity';

@Entity('policies')
export class Policy {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ type: 'varchar2', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'varchar2', length: 100 })
  resource: string;

  @Column({ type: 'varchar2', length: 100 })
  action: string;

  @Column({ type: 'varchar2', length: 10, default: 'allow' })
  effect: string;

  @OneToMany(() => PolicyRule, (policyRule) => policyRule.policy)
  rules: PolicyRule[];

  @OneToMany(() => PolicyAssignment, (policyAssignment) => policyAssignment.policy)
  assignments: PolicyAssignment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

