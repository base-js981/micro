import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Unique(['userId', 'roleId'])
export class UserRole {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ name: 'user_id', type: 'varchar2', length: 128 })
  userId: string;

  @Column({ name: 'role_id', type: 'varchar2', length: 128 })
  roleId: string;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}

