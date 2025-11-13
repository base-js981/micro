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
    .setTitle('User Management Service API')
    .setDescription('User Management Service API')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
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
  const httpPort = configService.get<number>('PORT', 3004);
  await app.listen(httpPort);

  // Kafka Microservice (Async Events)
  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
  const kafkaClientId = configService.get<string>('KAFKA_CLIENT_ID', 'user-management-service');

  if (kafkaBrokers.length > 0 && kafkaBrokers[0]) {
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
  }

  // gRPC Microservice (Sync RPC)
  const grpcPort = configService.get<number>('GRPC_PORT', 50054);
  const protoPath = getProtoPath('services/user-management-service.proto');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user.management.service',
      protoPath,
      url: `0.0.0.0:${grpcPort}`,
      protoReflection: true,
    },
  });

  try {
    await app.startAllMicroservices();
  } catch (error) {
    console.error('Failed to start microservices:', error);
  }

  console.log(`User Management Service HTTP API is running on: http://localhost:${httpPort}`);
  console.log(`User Management Service Swagger is available at: http://localhost:${httpPort}/api`);
  if (kafkaBrokers.length > 0 && kafkaBrokers[0]) {
    console.log(`User Management Service Kafka is running on: ${kafkaBrokers.join(', ')}`);
  }
  console.log(`User Management Service gRPC is running on: 0.0.0.0:${grpcPort}`);
}

bootstrap();

