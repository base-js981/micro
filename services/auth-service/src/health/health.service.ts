import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<{ status: string; timestamp: string; database: string }> {
    let databaseStatus = 'disconnected';
    
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1 FROM DUAL');
        databaseStatus = 'connected';
      }
    } catch (error) {
      databaseStatus = 'error';
    }

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
    };
  }
}

