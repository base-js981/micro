import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Policy } from './policy.entity';

@Entity('policy_rules')
export class PolicyRule {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ name: 'policy_id', type: 'varchar2', length: 128 })
  policyId: string;

  @Column({ type: 'varchar2', length: 100 })
  attribute: string;

  @Column({ type: 'varchar2', length: 50 })
  operator: string;

  @Column({ type: 'clob' })
  value: string;

  @ManyToOne(() => Policy, (policy) => policy.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy: Policy;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

