import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { getProtoPath } from '@micro/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('File Storage Service API')
    .setDescription('File Storage Service with S3-compatible and Local storage support')
    .setVersion('1.0')
    .addTag('files', 'File management endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // HTTP API
  const httpPort = configService.get<number>('PORT', 5001);
  await app.listen(httpPort);

  // Kafka Microservice (Async Events)
  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
  const kafkaClientId = configService.get<string>('KAFKA_CLIENT_ID', 'file-storage-service');
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaClientId,
        brokers: kafkaBrokers,
      },
      consumer: {
        groupId: `${kafkaClientId}-consumer-group`,
      },
      producer: {
        allowAutoTopicCreation: true,
      },
    },
  });

  // gRPC Microservice (Sync RPC)
  const grpcPort = configService.get<number>('GRPC_PORT', 50052);
  const protoPath = getProtoPath('services/file-service.proto');
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'file.service',
      protoPath,
      url: `0.0.0.0:${grpcPort}`,
      protoReflection: true, // Enable gRPC reflection for service discovery
    },
  });

  await app.startAllMicroservices();

  console.log(`File Storage Service HTTP API is running on: http://localhost:${httpPort}`);
  console.log(`File Storage Service Swagger is available at: http://localhost:${httpPort}/api`);
  console.log(`File Storage Service Kafka is running on: ${kafkaBrokers.join(', ')}`);
  console.log(`File Storage Service gRPC is running on: 0.0.0.0:${grpcPort}`);
}

bootstrap();

