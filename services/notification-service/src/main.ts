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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('Notification Service API')
    .setVersion('1.0')
    .addTag('notification', 'System administration endpoints')
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

  const httpPort = configService.get<number>('PORT', 3007);
  await app.listen(httpPort);

  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
  const kafkaClientId = configService.get<string>('KAFKA_CLIENT_ID', 'notification-service');

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

  const grpcPort = configService.get<number>('GRPC_PORT', 50057);
  const protoPath = getProtoPath('services/notification-service.proto');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'notification.service',
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

  console.log(`System Administration Service HTTP API is running on: http://localhost:${httpPort}`);
  console.log(`System Administration Service Swagger is available at: http://localhost:${httpPort}/api`);
  if (kafkaBrokers.length > 0 && kafkaBrokers[0]) {
    console.log(`System Administration Service Kafka is running on: ${kafkaBrokers.join(', ')}`);
  }
  console.log(`System Administration Service gRPC is running on: 0.0.0.0:${grpcPort}`);
}

bootstrap();

