CREATE TYPE "public"."confidence_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('liability', 'termination', 'payment', 'jurisdiction', 'confidentiality');--> statement-breakpoint
CREATE TYPE "public"."risk_tier" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TABLE "clause_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"clause_id" text NOT NULL,
	"issue" text NOT NULL,
	"recommendation" text NOT NULL,
	"rewrite" text,
	"confidence" "confidence_level" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clause_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"clause_a_id" text NOT NULL,
	"clause_b_id" text NOT NULL,
	"relationship" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clause_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"clause_id" text NOT NULL,
	"tier" "risk_tier" NOT NULL,
	"category" "risk_category" NOT NULL,
	"reason" text NOT NULL,
	"confidence" "confidence_level" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"scenario" text NOT NULL,
	"outcome" text NOT NULL,
	"risk_level" "risk_tier" NOT NULL,
	"explanation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
