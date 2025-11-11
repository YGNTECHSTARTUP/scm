CREATE TABLE "dealer" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact" varchar(20),
	"document_id" integer
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_name" varchar(200) NOT NULL,
	"user_id" integer NOT NULL,
	"status" varchar(40),
	"link" text
);
--> statement-breakpoint
CREATE TABLE "marketer" (
	"id" serial PRIMARY KEY NOT NULL,
	"dealer_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact" varchar(20),
	"documents_id" integer,
	"warehouses_id" integer,
	"sales_ids" integer,
	"rating" integer
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"score" integer NOT NULL,
	"computed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric,
	"sold_at" timestamp,
	"approval" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "warehouse" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketer_id" integer NOT NULL,
	"address" text,
	"geo_point" jsonb,
	"owner_name" varchar(100),
	"contact" varchar(20),
	"quantity" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "dealer" ADD CONSTRAINT "dealer_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketer" ADD CONSTRAINT "marketer_dealer_id_dealer_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketer" ADD CONSTRAINT "marketer_documents_id_document_id_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_warehouse_id_warehouse_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_marketer_id_marketer_id_fk" FOREIGN KEY ("marketer_id") REFERENCES "public"."marketer"("id") ON DELETE no action ON UPDATE no action;