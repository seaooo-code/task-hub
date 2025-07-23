import {
  bigint,
  int,
  mysqlTable,
  primaryKey,
  timestamp,
  tinyint,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core';

export const dutiesTable = mysqlTable(
  'duties_table',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    enabled: tinyint().default(0).notNull(),
    receiveId: varchar('receive_id', { length: 255 }).notNull(),
    templateId: varchar('template_id', { length: 255 }).notNull(),
    cronSchedule: varchar('cron_schedule', { length: 255 }).notNull(),
    lastRunTime: timestamp('last_run_time', { mode: 'string' }),
    createAt: timestamp('create_at', { mode: 'string' }).defaultNow().notNull(),
    updateAt: timestamp('update_at', { mode: 'string' })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    personIndex: int('person_index').notNull(),
    startTimeHour: int('start_time_hour').notNull(),
    startTimeMinute: int('start_time_minute').notNull(),
    endTimeMinute: int('end_time_minute').notNull(),
    endTimeHour: int('end_time_hour').notNull(),
    dayOfWeek: int('day_of_week').notNull(),
    creatorId: varchar('creator_id', { length: 255 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'duties_table_id' })],
);

export const dutiesUsers = mysqlTable(
  'duties_users',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    dutyId: bigint('duty_id', { mode: 'number' }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    orderIndex: int('order_index').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'duties_users_id' }),
    unique('duty_user').on(table.dutyId, table.userId),
  ],
);

export const templatesTable = mysqlTable(
  'templates_table',
  {
    id: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    createAt: timestamp('create_at', { mode: 'string' }).defaultNow().notNull(),
    updateAt: timestamp('update_at', { mode: 'string' })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    imageUrl: varchar('image_url', { length: 255 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'templates_table_id' })],
);

export const usersTable = mysqlTable(
  'users_table',
  {
    id: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    avatar: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    createAt: timestamp('create_at', { mode: 'string' }).defaultNow().notNull(),
    updateAt: timestamp('update_at', { mode: 'string' })
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'users_table_id' }),
    unique('email').on(table.email),
  ],
);
