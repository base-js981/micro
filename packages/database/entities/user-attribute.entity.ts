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
import { User } from './user.entity';

@Entity('user_attributes')
@Unique(['userId', 'key'])
export class UserAttribute {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ name: 'user_id', type: 'varchar2', length: 128 })
  userId: string;

  @Column({ type: 'varchar2', length: 100 })
  key: string;

  @Column({ type: 'varchar2', length: 500 })
  value: string;

  @ManyToOne(() => User, (user) => user.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

