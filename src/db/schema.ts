import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  timestamp,
  jsonb,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ----------------------------------------
// Document
// ----------------------------------------
export const document = pgTable("document", {
  id: serial("id").primaryKey(),
  documentName: varchar("document_name", { length: 200 }).notNull(),
  userId: integer("user_id").notNull(),     // generic: could be dealer/marketer
  status: varchar("status", { length: 40 }),
  link: text("link"),
});

// ----------------------------------------
// Dealer
// ----------------------------------------
export const dealer = pgTable("dealer", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  contact: varchar("contact", { length: 20 }),
  documentId: integer("document_id")
    .references(() => document.id),  
   jwttoken: varchar("jwttoken", { length: 200 }),  
   passWord: varchar("password", { length: 200 }),    // nullable FK
});

export const dealerRelations = relations(dealer, ({ many }) => ({
  marketers: many(marketer),
}));

// ----------------------------------------
// Marketer
// ----------------------------------------
export const marketer = pgTable("marketer", {
  id: serial("id").primaryKey(),

  dealerId: integer("dealer_id")
    .references(() => dealer.id)
    .notNull(),

  name: varchar("name", { length: 100 }).notNull(),
  contact: varchar("contact", { length: 20 }),

  documentsId: integer("documents_id")
    .references(() => document.id),        

  warehousesId: integer("warehouses_id"), 
  salesIds: integer("sales_ids"),          

  rating: integer("rating"),   
   jwtToken: varchar("jwttoken", { length: 200 }),
   passWord: varchar("password", { length: 200 }),          // optional rating ref
});

export const marketerRelations = relations(marketer, ({ one, many }) => ({
  dealer: one(dealer, {
    fields: [marketer.dealerId],
    references: [dealer.id],
  }),
  warehouses: many(warehouse),
}));

// ----------------------------------------
// Warehouse
// ----------------------------------------
export const warehouse = pgTable("warehouse", {
  id: serial("id").primaryKey(),

  marketerId: integer("marketer_id")
    .references(() => marketer.id)
    .notNull(),

  address: text("address"),
  geoPoint: jsonb("geo_point"),          // {lat, lng}
  ownerName: varchar("owner_name", { length: 100 }),
  contact: varchar("contact", { length: 20 }),
  quantity: integer("quantity").default(0),
});

export const warehouseRelations = relations(warehouse, ({ one, many }) => ({
  marketer: one(marketer, {
    fields: [warehouse.marketerId],
    references: [marketer.id],
  }),
  sales: many(sale),
}));

// ----------------------------------------
// Sale
// ----------------------------------------
export const sale = pgTable("sale", {
  id: serial("id").primaryKey(),

  warehouseId: integer("warehouse_id")
    .references(() => warehouse.id)
    .notNull(),

  quantity: integer("quantity").notNull(),
  price: numeric("price"),
  soldAt: timestamp("sold_at"),
  approval: boolean("approval").default(false),
});

export const saleRelations = relations(sale, ({ one }) => ({
  warehouse: one(warehouse, {
    fields: [sale.warehouseId],
    references: [warehouse.id],
  }),
}));

// ----------------------------------------
// Rating (polymorphic)
// ----------------------------------------
export const rating = pgTable("rating", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").notNull(),                        // which row
  entityType: varchar("entity_type", { length: 40 }).notNull(),   // dealer/marketer/warehouse
  score: integer("score").notNull(),
  computedAt: timestamp("computed_at").defaultNow(),
});


export * from '../../drizzle/src/db/schema';