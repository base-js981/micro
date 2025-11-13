import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn({ type: 'varchar2', length: 128 })
  id: string;

  @Column({ name: 'user_id', type: 'varchar2', length: 128 })
  userId: string;

  @Column({ type: 'varchar2', length: 500, unique: true })
  token: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}

