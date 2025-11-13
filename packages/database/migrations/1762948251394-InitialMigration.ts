import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1762948251394 implements MigrationInterface {
    name = 'InitialMigration1762948251394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" varchar2(128) NOT NULL, "name" varchar2(100) NOT NULL, "resource" varchar2(100) NOT NULL, "action" varchar2(100) NOT NULL, "description" varchar2(500), "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "UQ_7331684c0c5b063803a425001a0" UNIQUE ("resource", "action"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" varchar2(128) NOT NULL, "role_id" varchar2(128) NOT NULL, "permission_id" varchar2(128) NOT NULL, CONSTRAINT "UQ_25d24010f53bb80b78e412c9656" UNIQUE ("role_id", "permission_id"), CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "policy_rules" ("id" varchar2(128) NOT NULL, "policy_id" varchar2(128) NOT NULL, "attribute" varchar2(100) NOT NULL, "operator" varchar2(50) NOT NULL, "value" clob NOT NULL, "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "PK_64c7f7b8bb8abd8351075e774b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "policies" ("id" varchar2(128) NOT NULL, "name" varchar2(100) NOT NULL, "description" varchar2(500), "resource" varchar2(100) NOT NULL, "action" varchar2(100) NOT NULL, "effect" varchar2(10) DEFAULT 'allow' NOT NULL, "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "UQ_3d6f8d44a991b53e2899a65ebaf" UNIQUE ("name"), CONSTRAINT "PK_603e09f183df0108d8695c57e28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "policy_assignments" ("id" varchar2(128) NOT NULL, "policy_id" varchar2(128) NOT NULL, "role_id" varchar2(128), "user_id" varchar2(128), "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "UQ_740a79348b507cd8077baffd576" UNIQUE ("policy_id", "user_id"), CONSTRAINT "UQ_4f6acc24e829750aae150666192" UNIQUE ("policy_id", "role_id"), CONSTRAINT "PK_0927c9ee20892aa9ce621df8766" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" varchar2(128) NOT NULL, "name" varchar2(100) NOT NULL, "description" varchar2(500), "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" varchar2(128) NOT NULL, "user_id" varchar2(128) NOT NULL, "role_id" varchar2(128) NOT NULL, CONSTRAINT "UQ_23ed6f04fe43066df08379fd034" UNIQUE ("user_id", "role_id"), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_attributes" ("id" varchar2(128) NOT NULL, "user_id" varchar2(128) NOT NULL, "key" varchar2(100) NOT NULL, "value" varchar2(500) NOT NULL, "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "UQ_36e5ca7703ee4ec237c3bd9d3d0" UNIQUE ("user_id", "key"), CONSTRAINT "PK_043020ff63d30b1c03bafed7552" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar2(128) NOT NULL, "email" varchar2(255) NOT NULL, "password" varchar2(500) NOT NULL, "name" varchar2(255), "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "deleted_at" timestamp, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" varchar2(128) NOT NULL, "user_id" varchar2(128) NOT NULL, "token" varchar2(500) NOT NULL, "expires_at" timestamp NOT NULL, "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "policy_rules" ADD CONSTRAINT "FK_1874c21dbb631f4de52f7b9abd6" FOREIGN KEY ("policy_id") REFERENCES "policies" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "policy_assignments" ADD CONSTRAINT "FK_7ffe088a1f06503fc992d53ba01" FOREIGN KEY ("policy_id") REFERENCES "policies" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "policy_assignments" ADD CONSTRAINT "FK_9081826b24ae5878bc24cd0f1b6" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "policy_assignments" ADD CONSTRAINT "FK_f323b341303605074f810f95f97" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_attributes" ADD CONSTRAINT "FK_561897ae18add15d070f81ae6f0" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_attributes" DROP CONSTRAINT "FK_561897ae18add15d070f81ae6f0"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "policy_assignments" DROP CONSTRAINT "FK_f323b341303605074f810f95f97"`);
        await queryRunner.query(`ALTER TABLE "policy_assignments" DROP CONSTRAINT "FK_9081826b24ae5878bc24cd0f1b6"`);
        await queryRunner.query(`ALTER TABLE "policy_assignments" DROP CONSTRAINT "FK_7ffe088a1f06503fc992d53ba01"`);
        await queryRunner.query(`ALTER TABLE "policy_rules" DROP CONSTRAINT "FK_1874c21dbb631f4de52f7b9abd6"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_attributes"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "policy_assignments"`);
        await queryRunner.query(`DROP TABLE "policies"`);
        await queryRunner.query(`DROP TABLE "policy_rules"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
