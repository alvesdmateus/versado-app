import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcrypt";
import { eq, and, sql } from "drizzle-orm";
import { users, decks, flashcards } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

const SYSTEM_EMAIL = "system@versado.app";
const SYSTEM_DISPLAY_NAME = "Versado";

interface AWSSAACard {
  front: string;
  back: string;
  tags: string[];
}

const AWS_SAA_CARDS: AWSSAACard[] = [
  // ── Domain 1: Design Secure Architectures (15 cards, 30%) ──
  {
    front: "What is the AWS Shared Responsibility Model?",
    back: "AWS is responsible for security OF the cloud (hardware, networking, data centers, hypervisor). The customer is responsible for security IN the cloud (OS patching, data encryption, IAM policies, security groups, NACLs, application-level security).",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is the difference between IAM Roles and IAM Users?",
    back: "IAM Users have long-term credentials (password, access keys) for specific people. IAM Roles provide temporary credentials via STS and are assumed by users, services, or applications. Best practice: use roles over access keys for EC2 instances, Lambda functions, and cross-account access.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What are the key differences between Security Groups and NACLs?",
    back: "Security Groups: stateful (return traffic auto-allowed), instance-level, allow rules only, evaluate all rules. NACLs: stateless (must explicitly allow return traffic), subnet-level, allow AND deny rules, evaluate rules in order by number. Use NACLs for subnet-wide blocking, SGs for instance-level access.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "How does AWS KMS work for encryption?",
    back: "KMS manages Customer Master Keys (CMKs) that generate data encryption keys. Supports envelope encryption: KMS encrypts a data key, which encrypts your data. Key types: AWS-managed (aws/service), Customer-managed (you control rotation/policies), Custom key stores (CloudHSM-backed). Supports automatic annual rotation for customer-managed keys.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is AWS Organizations and how does it enable multi-account security?",
    back: "AWS Organizations centrally manages multiple AWS accounts. Features: consolidated billing, Service Control Policies (SCPs) to restrict permissions across accounts, Organizational Units (OUs) for hierarchical grouping. SCPs set permission guardrails — they don't grant access, they limit what IAM policies in member accounts can do.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "How do you enforce encryption at rest for S3 buckets?",
    back: "Options: SSE-S3 (Amazon-managed keys), SSE-KMS (KMS-managed keys with audit trail via CloudTrail), SSE-C (customer-provided keys). Enforce via bucket policy denying `s3:PutObject` without `x-amz-server-side-encryption` header. Default encryption can be set at bucket level. S3 Bucket Keys reduce KMS costs.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is AWS CloudTrail and what does it log?",
    back: "CloudTrail records API calls across your AWS account — who did what, when, from where. Logs management events (control plane, e.g., creating EC2) and optionally data events (data plane, e.g., S3 GetObject). Logs go to S3; can send to CloudWatch Logs. Multi-region trails cover all regions. Essential for compliance and forensics.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is AWS WAF and when should you use it?",
    back: "AWS WAF is a web application firewall that filters HTTP/HTTPS requests at the application layer (Layer 7). Attach to ALB, CloudFront, or API Gateway. Create rules for IP filtering, rate limiting, SQL injection/XSS protection, geo-blocking, and string/regex matching. Use AWS Managed Rules for common threats (OWASP Top 10).",
    tags: ["aws-saa", "security"],
  },
  {
    front: "How do VPC endpoints improve security?",
    back: "VPC Endpoints allow private connectivity to AWS services without traversing the internet. Interface endpoints (powered by PrivateLink): ENI with private IP, supports most services. Gateway endpoints: route table entry, supports S3 and DynamoDB only (free). Eliminates need for NAT Gateway/internet for AWS API calls.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is IAM Identity Center (formerly AWS SSO)?",
    back: "Centralized access management for multiple AWS accounts and business applications. Integrates with external identity providers (Active Directory, Okta) via SAML 2.0. Provides single sign-on with permission sets that map to IAM roles in target accounts. Preferred over individual IAM users for workforce access.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is AWS Secrets Manager and how does it differ from Parameter Store?",
    back: "Secrets Manager: automatic rotation (e.g., RDS passwords via Lambda), cross-account sharing, $0.40/secret/month. Parameter Store: free tier (standard), no built-in rotation, supports hierarchical storage, integrates with CloudFormation. Use Secrets Manager for database credentials needing rotation; Parameter Store for config values and non-rotating secrets.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "How does S3 Block Public Access work?",
    back: "Four settings at account or bucket level: BlockPublicAcls (rejects PUT with public ACLs), IgnorePublicAcls (ignores existing public ACLs), BlockPublicPolicy (rejects bucket policies granting public access), RestrictPublicBuckets (restricts public/cross-account access). Enable all four at the account level as a safety net.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is the principle of least privilege in AWS IAM?",
    back: "Grant only the minimum permissions needed to perform a task. Start with no permissions and add as needed. Use IAM Access Analyzer to identify unused permissions. Use policy conditions (e.g., `aws:SourceIp`, `aws:RequestedRegion`) to further restrict. Avoid using `*` in resource/action fields. Review with IAM Access Advisor.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "How do you enable encryption in transit for AWS services?",
    back: "Use TLS/SSL: enforce HTTPS via S3 bucket policy (`aws:SecureTransport`), ALB HTTPS listeners with ACM certificates, RDS `require_ssl` parameter. CloudFront: viewer protocol policy (HTTPS only), origin protocol policy. API Gateway: TLS by default. VPN/Direct Connect: IPSec encryption. ELB: configure security policy for TLS version.",
    tags: ["aws-saa", "security"],
  },
  {
    front: "What is Amazon GuardDuty?",
    back: "Intelligent threat detection service that continuously monitors for malicious activity. Analyzes: VPC Flow Logs, CloudTrail events, DNS logs, and S3 data events. Detects: cryptocurrency mining, compromised instances, unauthorized access, reconnaissance. Machine learning-based, no agents needed. Findings go to EventBridge for automated remediation.",
    tags: ["aws-saa", "security"],
  },

  // ── Domain 2: Design Resilient Architectures (13 cards, 26%) ──
  {
    front: "What are the key components of a highly available architecture on AWS?",
    back: "Multi-AZ deployment (minimum 2 AZs), Elastic Load Balancer across AZs, Auto Scaling Groups for dynamic capacity, Multi-AZ RDS for database HA, S3 for durable storage (11 nines durability), Route 53 health checks with failover routing. Design for failure: assume any single component can fail.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is the difference between Multi-AZ and Read Replicas for RDS?",
    back: "Multi-AZ: synchronous replication to standby in another AZ, automatic failover (1-2 min), same endpoint, purpose is HA not performance. Read Replicas: asynchronous replication, separate endpoint, purpose is read scaling, can be cross-region, can be promoted to standalone DB. Use both together for HA + read scaling.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "How does Auto Scaling work and what are its key policies?",
    back: "Auto Scaling adjusts EC2 capacity based on demand. Policies: Target Tracking (maintain metric at target, e.g., 60% CPU), Step Scaling (scale by amount based on alarm threshold), Simple Scaling (single adjustment per alarm), Scheduled (time-based). Key settings: min/max/desired capacity, cooldown period, health check grace period.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is Amazon SQS and how does it enable decoupled architectures?",
    back: "SQS is a fully managed message queue. Standard: at-least-once delivery, best-effort ordering, nearly unlimited throughput. FIFO: exactly-once, strict ordering, 3,000 msg/s with batching. Enables decoupling: producers and consumers scale independently. Dead-letter queues capture failed messages. Visibility timeout prevents duplicate processing.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is the difference between RPO and RTO?",
    back: "RPO (Recovery Point Objective): maximum acceptable data loss measured in time — how far back you can afford to lose. RTO (Recovery Time Objective): maximum acceptable downtime — how fast you must recover. Example: RPO of 1 hour means hourly backups; RTO of 15 min means rapid failover (e.g., Multi-AZ, pilot light).",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What are the AWS disaster recovery strategies from cheapest to fastest?",
    back: "1. Backup & Restore: lowest cost, highest RTO (hours). 2. Pilot Light: core services running, scale up on failover (minutes-hours). 3. Warm Standby: scaled-down full environment, scale up on failover (minutes). 4. Multi-Site Active-Active: full production in multiple regions, near-zero RTO, highest cost.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "How does Route 53 support high availability?",
    back: "Routing policies: Simple, Weighted (A/B testing), Latency-based (nearest region), Failover (active-passive), Geolocation, Geoproximity, Multivalue Answer. Health checks monitor endpoints and trigger DNS failover. Alias records point to AWS resources (ALB, CloudFront, S3) with no charge for queries. Supports private hosted zones for VPCs.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is Amazon Aurora and why is it more resilient than standard RDS?",
    back: "Aurora is MySQL/PostgreSQL-compatible with cloud-native storage. 6 copies of data across 3 AZs, self-healing storage, up to 15 read replicas with sub-10ms lag. Aurora Serverless for variable workloads. Aurora Global Database: <1s replication across regions. Automatic failover to replica in <30 seconds. 5x throughput of MySQL.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is AWS Elastic Load Balancer and what types are available?",
    back: "ALB (Application): Layer 7, HTTP/HTTPS, path/host routing, gRPC, WebSocket. NLB (Network): Layer 4, TCP/UDP/TLS, ultra-low latency, static IPs, millions of requests/sec. GLB (Gateway): Layer 3, for third-party virtual appliances (firewalls, IDS). Classic (legacy): avoid for new workloads. All support cross-zone load balancing.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "How do you design for failure with S3?",
    back: "S3 provides 99.999999999% (11 nines) durability and 99.99% availability for Standard. Enable versioning to recover from accidental deletes/overwrites. Cross-Region Replication (CRR) for DR. S3 Object Lock for WORM compliance. Lifecycle policies to transition to cheaper tiers. S3 Intelligent-Tiering for unknown access patterns.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is Amazon EventBridge and how does it enable event-driven architectures?",
    back: "EventBridge is a serverless event bus. Routes events from AWS services, SaaS apps, and custom apps to targets (Lambda, SQS, Step Functions). Rules match events by pattern. Schema registry for event discovery. Supports event replay and archiving. Enables loose coupling between microservices. Replaces CloudWatch Events.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "How does Elastic Beanstalk simplify application deployment?",
    back: "Beanstalk is a PaaS that handles provisioning (EC2, ALB, ASG, RDS), deployment, scaling, and monitoring. You upload code; it manages infrastructure. Supports: Java, .NET, Node.js, Python, Go, Docker. Deployment policies: All at once, Rolling, Rolling with additional batch, Immutable, Blue/Green. You retain full control of underlying resources.",
    tags: ["aws-saa", "resilience"],
  },
  {
    front: "What is AWS Step Functions?",
    back: "Serverless orchestration service for coordinating distributed applications using visual workflows (state machines). Supports: Lambda, ECS, Fargate, DynamoDB, SNS, SQS, Glue, SageMaker. Built-in error handling, retries, and parallel execution. Standard workflows: up to 1 year execution. Express workflows: high-volume, up to 5 minutes. Integrates with EventBridge.",
    tags: ["aws-saa", "resilience"],
  },

  // ── Domain 3: Design High-Performing Architectures (12 cards, 24%) ──
  {
    front: "When should you use CloudFront vs S3 Transfer Acceleration?",
    back: "CloudFront: global CDN, caches content at 400+ edge locations, supports dynamic and static content, Lambda@Edge for customization. Use for serving websites/APIs globally. S3 Transfer Acceleration: speeds up S3 uploads from distant clients using edge locations as ingestion points. Use CloudFront for reads, Transfer Acceleration for writes.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What are the DynamoDB capacity modes and when to use each?",
    back: "On-Demand: pay per request, auto-scales instantly, no capacity planning. Best for unpredictable/spiky workloads. Provisioned: set RCU/WCU, use Auto Scaling, cheaper for predictable workloads. Reserved capacity for further savings. DAX (DynamoDB Accelerator): in-memory cache, microsecond reads. Global Tables: multi-region, active-active replication.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What is Amazon ElastiCache and when should you use Redis vs Memcached?",
    back: "ElastiCache is a managed in-memory cache. Redis: data persistence, replication, pub/sub, sorted sets, geospatial, Multi-AZ with auto-failover, backup/restore. Memcached: multi-threaded, simpler, no persistence, multi-node partitioning. Use Redis for complex data types, persistence, and HA. Use Memcached for simple caching with multi-threaded performance.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What EBS volume types should you choose for different workloads?",
    back: "gp3/gp2 (General Purpose SSD): balanced, boot volumes, dev/test (up to 16,000 IOPS). io2/io1 (Provisioned IOPS SSD): databases needing >16K IOPS (up to 64,000). st1 (Throughput Optimized HDD): big data, data warehouses, logs (500 MB/s). sc1 (Cold HDD): infrequent access, cheapest. Instance Store: ephemeral, highest IOPS for temp data.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "How does Amazon EFS differ from EBS and S3?",
    back: "EFS: shared NFS file system, multiple EC2 can mount simultaneously, auto-scales, regional, supports Linux only. EBS: block storage attached to single EC2 (except Multi-Attach io2), fixed size, AZ-scoped. S3: object storage, HTTP API, unlimited, cheapest. Use EFS for shared file access; EBS for database/OS volumes; S3 for unstructured data/backups.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What is AWS Lambda and what are its key limits?",
    back: "Serverless compute that runs code in response to events. Max: 15 min execution, 10 GB memory, 512 MB /tmp (10 GB with EFS), 1000 concurrent executions (adjustable). Triggers: API Gateway, S3, DynamoDB Streams, SQS, EventBridge, Kinesis. Pay per request + duration. Use Provisioned Concurrency for latency-sensitive workloads.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What is Amazon Kinesis and when to use each component?",
    back: "Kinesis Data Streams: real-time data streaming, custom consumers, 1-365 day retention. Kinesis Data Firehose: near-real-time ETL to S3/Redshift/OpenSearch, fully managed, no code needed. Kinesis Data Analytics: SQL/Flink on streaming data. Use Streams for real-time processing; Firehose for loading data into stores; Analytics for real-time dashboards.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "How do you choose between EC2 instance families?",
    back: "General Purpose (M/T): balanced compute/memory/network. Compute Optimized (C): batch processing, ML inference, gaming. Memory Optimized (R/X): databases, in-memory caches. Storage Optimized (I/D/H): data warehousing, distributed file systems. Accelerated (P/G/Inf): GPU/ML training, video. Burstable (T): variable workloads with baseline + credits.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What is Amazon API Gateway and its deployment types?",
    back: "Managed service for creating REST, HTTP, and WebSocket APIs. REST API: full features, request/response transformation, caching, WAF. HTTP API: simpler, cheaper, lower latency, JWT auth. Features: throttling, API keys, usage plans, Lambda authorizers, resource policies. Edge-optimized (CloudFront), Regional, or Private (VPC only) endpoints.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "How does S3 achieve high performance for large-scale workloads?",
    back: "S3 supports 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per prefix. Use multiple prefixes for parallelism. Multipart Upload: parallelize uploads >100 MB (required >5 GB). S3 Select / Glacier Select: query subsets with SQL (reduce data transfer). Byte-range fetches for parallel downloads.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What is AWS Global Accelerator and how does it differ from CloudFront?",
    back: "Global Accelerator provides static anycast IPs that route to optimal AWS endpoint via AWS global network. Improves availability and performance for TCP/UDP. Unlike CloudFront: no caching, works for non-HTTP (gaming, IoT, VoIP), provides static IPs, instant failover between regions. Use CloudFront for cacheable content; Global Accelerator for non-cacheable TCP/UDP.",
    tags: ["aws-saa", "performance"],
  },
  {
    front: "What is Amazon Redshift and when should you use it?",
    back: "Managed petabyte-scale data warehouse using columnar storage and massively parallel processing (MPP). Use for: OLAP queries, BI reporting, large aggregations across structured data. Redshift Spectrum: query S3 data without loading. Redshift Serverless: auto-scales. Not suitable for OLTP (use RDS/Aurora). Concurrency Scaling for burst read demand.",
    tags: ["aws-saa", "performance"],
  },

  // ── Domain 4: Design Cost-Optimized Architectures (10 cards, 20%) ──
  {
    front: "What are the EC2 purchasing options and when to use each?",
    back: "On-Demand: pay by second, no commitment, unpredictable workloads. Reserved (1/3 year): up to 72% savings, predictable usage. Savings Plans: flexible across instance families/regions. Spot: up to 90% savings, interruptible, batch/fault-tolerant workloads. Dedicated Hosts: compliance/licensing needs. Dedicated Instances: single-tenant hardware.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "What are the S3 storage classes and their use cases?",
    back: "Standard: frequently accessed. Intelligent-Tiering: unknown patterns, auto-moves between tiers. Standard-IA: infrequent, rapid access needed. One Zone-IA: infrequent, non-critical (single AZ). Glacier Instant: archive with ms retrieval. Glacier Flexible: archive, 1-12 hours. Glacier Deep Archive: cheapest, 12-48 hours. Use lifecycle policies to auto-transition.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "How do you use AWS Cost Explorer and Budgets for cost management?",
    back: "Cost Explorer: visualize, understand, and forecast AWS costs over time. Filter by service, account, tag, region. Shows Reserved Instance utilization and recommendations. AWS Budgets: set custom cost/usage thresholds, get alerts via SNS/email when exceeded. Budget Actions: auto-apply SCPs or IAM policies when budget is breached.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "How does AWS Savings Plans work?",
    back: "Commitment to consistent compute usage ($/hour) for 1 or 3 years. Compute Savings Plans: up to 66% off, flexible across EC2, Lambda, Fargate, any region/family/OS. EC2 Instance Savings Plans: up to 72% off, locked to specific instance family and region. More flexible than Reserved Instances. Unused commitment is still billed.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "When should you use AWS Lambda vs EC2 for cost optimization?",
    back: "Lambda: best for short-lived, event-driven, sporadic workloads. Pay per invocation + duration (no idle cost). EC2: better for long-running, steady-state workloads (especially with Reserved/Savings Plans). Break-even: if function runs >75% of time, EC2 is cheaper. Consider: cold starts, 15-min limit, memory constraints, and ecosystem integration.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "How do you optimize data transfer costs on AWS?",
    back: "Data IN is free. Data OUT to internet is charged. Same-AZ: free. Cross-AZ: $0.01/GB each way. Use VPC endpoints (free for Gateway, charged for Interface) to avoid NAT Gateway data charges. CloudFront can reduce data transfer costs vs direct from origin. Use S3 same-region replicas to avoid cross-region transfer. Compress data before transfer.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "What is AWS Trusted Advisor and which checks help with cost?",
    back: "Trusted Advisor provides real-time best practice recommendations across cost, performance, security, fault tolerance, and service limits. Cost checks: idle EC2, underutilized EBS, unassociated Elastic IPs, idle RDS, low-utilization Reserved Instances. Basic: 7 core checks (free). Business/Enterprise Support: full 50+ checks.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "How does DynamoDB pricing work and how do you optimize it?",
    back: "On-Demand: $1.25 per million WCU, $0.25 per million RCU. Provisioned: cheaper for predictable traffic, use Auto Scaling. Reserved Capacity: up to 77% savings (1/3 year). Reduce costs: use TTL to auto-delete expired items, use sparse indexes, compress large attributes, choose On-Demand for spiky workloads, Provisioned + Auto Scaling for steady workloads.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "What is S3 Lifecycle management and how does it save money?",
    back: "Lifecycle rules automatically transition objects between storage classes or expire them. Example: Standard → Standard-IA after 30 days → Glacier after 90 days → delete after 365 days. Can apply to entire bucket or by prefix/tag. Combine with Intelligent-Tiering for unknown patterns. Incomplete multipart uploads should be cleaned up via lifecycle rules.",
    tags: ["aws-saa", "cost"],
  },
  {
    front: "How does AWS Compute Optimizer help reduce costs?",
    back: "ML-based service that analyzes utilization metrics and recommends optimal AWS resources. Covers: EC2 instances, Auto Scaling groups, EBS volumes, Lambda functions, ECS on Fargate. Identifies over-provisioned and under-provisioned resources. Provides estimated monthly savings. Requires CloudWatch metrics (14-day minimum). Free to use.",
    tags: ["aws-saa", "cost"],
  },
];

async function seedAWSSAADecks() {
  console.log("Seeding AWS SAA deck...\n");

  await db
    .insert(users)
    .values({
      email: SYSTEM_EMAIL,
      passwordHash: await bcrypt.hash("system-not-a-real-password", 10),
      displayName: SYSTEM_DISPLAY_NAME,
      emailVerified: true,
      tier: "fluent",
      preferences: {
        darkMode: false,
        themeColor: "sky",
        dailyGoal: 0,
        reminderTimes: [],
        cardSortingLogic: "due_first",
        pushAlerts: false,
        favoriteDeckIds: [],
      },
    })
    .onConflictDoNothing({ target: users.email });

  const [systemUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SYSTEM_EMAIL))
    .limit(1);

  if (!systemUser) {
    console.error("Failed to create or find system user");
    process.exit(1);
  }

  console.log(`System user: ${SYSTEM_EMAIL} (${systemUser.id})`);

  const [existing] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(
      and(
        eq(decks.ownerId, systemUser.id),
        sql`${decks.tags} @> '["aws-saa"]'::jsonb`,
        eq(decks.tombstone, false),
      ),
    )
    .limit(1);

  if (existing) {
    console.log("  AWS SAA deck already exists — skipping");
    return;
  }

  const [deck] = await db
    .insert(decks)
    .values({
      ownerId: systemUser.id,
      name: "AWS Solutions Architect Associate Prep",
      description:
        "50 high-quality flashcards covering all SAA-C03 exam domains: Secure Architectures, Resilient Architectures, High-Performing Architectures, and Cost-Optimized Architectures.",
      tags: ["aws-saa"],
      visibility: "marketplace",
      marketplace: {
        listed: true,
        price: 0,
        purchaseCount: 0,
        rating: 0,
        reviewCount: 0,
      },
      stats: {
        totalCards: AWS_SAA_CARDS.length,
        newCards: AWS_SAA_CARDS.length,
        learningCards: 0,
        reviewCards: 0,
        masteredCards: 0,
      },
    })
    .returning();

  await db.insert(flashcards).values(
    AWS_SAA_CARDS.map((c) => ({
      deckId: deck!.id,
      front: c.front,
      back: c.back,
      tags: c.tags,
      source: { type: "manual" as const },
    })),
  );

  console.log(`  AWS SAA Prep — ${AWS_SAA_CARDS.length} cards created`);
  console.log(`\n========================================`);
  console.log(`  AWS SAA deck seeded!`);
  console.log(`  Domain breakdown (weighted to SAA-C03 exam):`);
  console.log(`    Design Secure Architectures: 15 cards (30%)`);
  console.log(`    Design Resilient Architectures: 13 cards (26%)`);
  console.log(`    Design High-Performing Architectures: 12 cards (24%)`);
  console.log(`    Design Cost-Optimized Architectures: 10 cards (20%)`);
  console.log(`========================================\n`);
}

async function main() {
  await seedAWSSAADecks();
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
