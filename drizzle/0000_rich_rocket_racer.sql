CREATE TYPE "public"."loan_status" AS ENUM('ACTIVE', 'RETURNED');--> statement-breakpoint
CREATE TABLE "books" (
	"isbn" varchar(20) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"area" varchar(100) NOT NULL,
	"total_copies" integer NOT NULL,
	"available_copies" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_copies_positive" CHECK ("books"."total_copies" > 0),
	CONSTRAINT "chk_available_non_neg" CHECK ("books"."available_copies" >= 0),
	CONSTRAINT "chk_available_lte_total" CHECK ("books"."available_copies" <= "books"."total_copies")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isbn" varchar(20) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"loan_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"status" "loan_status" DEFAULT 'ACTIVE' NOT NULL,
	CONSTRAINT "chk_due_after_loan" CHECK ("loans"."due_date" > "loans"."loan_date")
);
--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_isbn_books_isbn_fk" FOREIGN KEY ("isbn") REFERENCES "public"."books"("isbn") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_loans_isbn" ON "loans" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "idx_loans_user" ON "loans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_loans_status" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_loans_active_due" ON "loans" USING btree ("due_date") WHERE "loans"."status" = 'ACTIVE';