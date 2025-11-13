import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
@Unique(['resource', 'action'])
export class Permission {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ type: 'varchar2', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar2', length: 100 })
  resource: string;

  @Column({ type: 'varchar2', length: 100 })
  action: string;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  description?: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  roles: RolePermission[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

