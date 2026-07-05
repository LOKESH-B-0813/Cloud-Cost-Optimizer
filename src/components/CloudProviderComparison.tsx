import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { 
  Search, ShieldAlert, Sparkles, Server, HardDrive, Check, HelpCircle, 
  ChevronDown, Sliders, ArrowUpDown, Star, Trophy, AlertTriangle, Cloud, Layers,
  Cpu, Database, ArrowRight, TrendingUp, Zap, Workflow
} from 'lucide-react';

// Pricing factors mapping matching the backend pricing_service.py exactly
const PROVIDER_FACTORS: Record<string, {
  name: string;
  logoUrl: string;
  computeName: string;
  blockName: string;
  objectName: string;
  dbName: string;
  factors: Record<string, number>;
  ratings: { perf: number; sec: number; scale: number; ent: number; startup: number; availability: string; };
  strengths: string;
  weaknesses: string;
  kubernetes: string;
  aiServices: string;
  recommendation: string;
}> = {
  aws: {
    name: 'Amazon Web Services (AWS)',
    logoUrl: 'https://img.icons8.com/color/48/000000/amazon-web-services.png',
    computeName: 'Amazon EC2',
    blockName: 'Amazon EBS',
    objectName: 'Amazon S3',
    dbName: 'Amazon RDS',
    factors: {
      compute_vcpu: 0.0300, compute_ram: 0.0040, block_storage: 0.100, object_storage: 0.023,
      db_vcpu: 0.0450, db_ram: 0.0060, load_balancer: 18.0, bandwidth_gb: 0.09,
      cdn_gb: 0.08, dns_million: 0.40, snapshot_gb: 0.05, tax_rate: 0.18
    },
    ratings: { perf: 4.9, sec: 4.9, scale: 5.0, ent: 5.0, startup: 3.8, availability: '99.99%' },
    strengths: 'Industry-leading breadth, global compliance, enterprise integration, deep AI models.',
    weaknesses: 'Extremely complex pricing structures, high data egress fees, steep learning curve.',
    kubernetes: 'Amazon EKS (Elastic Kubernetes Service) with Fargate.',
    aiServices: 'Amazon Bedrock, SageMaker, Amazon Q development assistant.',
    recommendation: 'Highly recommended for complex enterprise architectures requiring global compliance and high scalability.'
  },
  azure: {
    name: 'Microsoft Azure',
    logoUrl: 'https://img.icons8.com/color/48/000000/azure-1.png',
    computeName: 'Azure VMs',
    blockName: 'Azure Disk Storage',
    objectName: 'Azure Blob Storage',
    dbName: 'Azure SQL Database',
    factors: {
      compute_vcpu: 0.0320, compute_ram: 0.0042, block_storage: 0.120, object_storage: 0.024,
      db_vcpu: 0.0480, db_ram: 0.0065, load_balancer: 19.0, bandwidth_gb: 0.087,
      cdn_gb: 0.081, dns_million: 0.40, snapshot_gb: 0.05, tax_rate: 0.18
    },
    ratings: { perf: 4.8, sec: 4.9, scale: 4.9, ent: 4.9, startup: 3.5, availability: '99.99%' },
    strengths: 'Seamless Active Directory & Microsoft ecosystem bindings, powerful hybrid capability, OpenAI models.',
    weaknesses: 'Complicated portal console, variable CPU performances on standard tiers.',
    kubernetes: 'AKS (Azure Kubernetes Service) with virtual nodes.',
    aiServices: 'Azure OpenAI Service (GPT-4), Cognitive Services, Azure AI Studio.',
    recommendation: 'Best suited for enterprise hybrid architectures and Microsoft-centric software pipelines.'
  },
  gcp: {
    name: 'Google Cloud Platform (GCP)',
    logoUrl: 'https://img.icons8.com/color/48/000000/google-cloud.png',
    computeName: 'Google Compute Engine',
    blockName: 'Google Persistent Disk',
    objectName: 'Google Cloud Storage',
    dbName: 'Google Cloud SQL',
    factors: {
      compute_vcpu: 0.0280, compute_ram: 0.0038, block_storage: 0.080, object_storage: 0.020,
      db_vcpu: 0.0420, db_ram: 0.0055, load_balancer: 15.0, bandwidth_gb: 0.12,
      cdn_gb: 0.06, dns_million: 0.20, snapshot_gb: 0.045, tax_rate: 0.18
    },
    ratings: { perf: 4.8, sec: 4.8, scale: 4.9, ent: 4.7, startup: 4.5, availability: '99.95%' },
    strengths: 'Industry-leading Kubernetes engine (GKE), world-class analytics (BigQuery), state-of-the-art AI.',
    weaknesses: 'Smaller ecosystem compared to AWS/Azure, fewer legacy system connectors.',
    kubernetes: 'GKE (Google Kubernetes Engine) Autopilot.',
    aiServices: 'Google Vertex AI, Gemini Models, AutoML, BigQuery ML.',
    recommendation: 'Best choice for modern containerized microservices, big data, and generative AI systems.'
  },
  oracle: {
    name: 'Oracle Cloud Infrastructure (OCI)',
    logoUrl: 'https://img.icons8.com/color/48/000000/oracle.png',
    computeName: 'OCI Compute',
    blockName: 'OCI Block Volume',
    objectName: 'OCI Object Storage',
    dbName: 'OCI Autonomous Database',
    factors: {
      compute_vcpu: 0.0150, compute_ram: 0.0020, block_storage: 0.042, object_storage: 0.009,
      db_vcpu: 0.0250, db_ram: 0.0030, load_balancer: 8.0, bandwidth_gb: 0.008,
      cdn_gb: 0.02, dns_million: 0.10, snapshot_gb: 0.025, tax_rate: 0.18
    },
    ratings: { perf: 4.5, sec: 4.7, scale: 4.5, ent: 4.8, startup: 4.0, availability: '99.95%' },
    strengths: 'Extremely aggressive bare metal pricing, high performance database tuning, low egress costs.',
    weaknesses: 'Fewer managed features, smaller developer community.',
    kubernetes: 'OKE (OCI Container Engine for Kubernetes).',
    aiServices: 'OCI Generative AI (Cohere/Meta), Document Understanding.',
    recommendation: 'Outstanding choice for large relational database systems and high-throughput compute tasks on a budget.'
  },
  ibm: {
    name: 'IBM Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/ibm.png',
    computeName: 'IBM Virtual Server',
    blockName: 'IBM Block Storage',
    objectName: 'IBM Cloud Object Storage',
    dbName: 'IBM Cloud Databases',
    factors: {
      compute_vcpu: 0.0300, compute_ram: 0.0040, block_storage: 0.110, object_storage: 0.022,
      db_vcpu: 0.0450, db_ram: 0.0060, load_balancer: 18.0, bandwidth_gb: 0.08,
      cdn_gb: 0.07, dns_million: 0.35, snapshot_gb: 0.05, tax_rate: 0.18
    },
    ratings: { perf: 4.4, sec: 4.8, scale: 4.5, ent: 4.8, startup: 3.0, availability: '99.99%' },
    strengths: 'Industry-leading bare metal servers, financial services compliance registries.',
    weaknesses: 'High standard premium rates, legacy administrative paneling.',
    kubernetes: 'IBM Cloud Kubernetes Service (IKS).',
    aiServices: 'IBM WatsonX AI Studio, Watson Discovery, Watson Natural Language.',
    recommendation: 'Recommended for highly regulated industries, financial compliance, and mainframe integration.'
  },
  alibaba: {
    name: 'Alibaba Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/alibaba.png',
    computeName: 'Elastic Compute Service (ECS)',
    blockName: 'Alibaba Cloud Disk',
    objectName: 'Object Storage Service (OSS)',
    dbName: 'ApsaraDB RDS',
    factors: {
      compute_vcpu: 0.0210, compute_ram: 0.0029, block_storage: 0.085, object_storage: 0.016,
      db_vcpu: 0.0320, db_ram: 0.0045, load_balancer: 11.0, bandwidth_gb: 0.075,
      cdn_gb: 0.045, dns_million: 0.20, snapshot_gb: 0.04, tax_rate: 0.18
    },
    ratings: { perf: 4.3, sec: 4.3, scale: 4.6, ent: 4.3, startup: 3.8, availability: '99.95%' },
    strengths: 'Unrivaled dominance in China and Asia-Pacific, outstanding CDN delivery.',
    weaknesses: 'Western regulatory gaps, administrative documentation language limits.',
    kubernetes: 'Container Service for Kubernetes (ACK).',
    aiServices: 'Platform for AI (PAI), Tongyi Qianwen large language models.',
    recommendation: 'An essential, mandatory choice for businesses expanding operations into Asia-Pacific markets.'
  },
  digitalocean: {
    name: 'DigitalOcean',
    logoUrl: 'https://img.icons8.com/color/48/000000/digitalocean.png',
    computeName: 'Droplets',
    blockName: 'Block Storage Volumes',
    objectName: 'Spaces Object Storage',
    dbName: 'Managed Databases',
    factors: {
      compute_vcpu: 0.0100, compute_ram: 0.0015, block_storage: 0.100, object_storage: 0.020,
      db_vcpu: 0.0150, db_ram: 0.0025, load_balancer: 10.0, bandwidth_gb: 0.01,
      cdn_gb: 0.02, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.2, sec: 4.1, scale: 4.0, ent: 3.2, startup: 4.9, availability: '99.99%' },
    strengths: 'Incredible UI simplicity, flat transparent billing, fantastic startup support.',
    weaknesses: 'Lacks complex enterprise IAM control, no deep compliance frameworks.',
    kubernetes: 'DigitalOcean Kubernetes (DOKS).',
    aiServices: 'Paperspace GPU instances (AI model training).',
    recommendation: 'Excellent platform for startups, rapid app development, and small to medium scale software.'
  },
  linode: {
    name: 'Linode (Akamai)',
    logoUrl: 'https://img.icons8.com/color/48/000000/linode.png',
    computeName: 'Linode Instances',
    blockName: 'Block Storage',
    objectName: 'Object Storage',
    dbName: 'Managed Databases',
    factors: {
      compute_vcpu: 0.0100, compute_ram: 0.0015, block_storage: 0.100, object_storage: 0.020,
      db_vcpu: 0.0150, db_ram: 0.0025, load_balancer: 10.0, bandwidth_gb: 0.01,
      cdn_gb: 0.02, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.2, sec: 4.1, scale: 4.0, ent: 3.2, startup: 4.8, availability: '99.99%' },
    strengths: 'High performance SSD storage, robust global network spine backboned by Akamai.',
    weaknesses: 'Minimal enterprise compliance directories, basic PaaS catalogs.',
    kubernetes: 'Linode Kubernetes Engine (LKE).',
    aiServices: 'Akamai Connected Cloud GPU Clusters.',
    recommendation: 'Best for developers and startups wanting straightforward raw Linux servers with highly reliable throughput.'
  },
  vultr: {
    name: 'Vultr',
    logoUrl: 'https://img.icons8.com/external-flatart-icons-flat-flatarticons/48/000000/external-cloud-cloud-computing-flatart-icons-flat-flatarticons-4.png',
    computeName: 'Cloud Compute',
    blockName: 'Block Storage',
    objectName: 'Object Storage',
    dbName: 'Managed Databases',
    factors: {
      compute_vcpu: 0.0090, compute_ram: 0.0014, block_storage: 0.100, object_storage: 0.020,
      db_vcpu: 0.0140, db_ram: 0.0024, load_balancer: 10.0, bandwidth_gb: 0.01,
      cdn_gb: 0.02, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.1, sec: 4.1, scale: 4.0, ent: 3.1, startup: 4.8, availability: '99.99%' },
    strengths: 'Extensive worldwide server array, superb GPU configurations for AI workloads, low pricing.',
    weaknesses: 'Very minimal native higher level platform software structures.',
    kubernetes: 'Vultr Kubernetes Engine (VKE).',
    aiServices: 'Vultr GPU Cloud (NVIDIA H100/A100 instances).',
    recommendation: 'Superb option for edge configurations, high frequency CPU compute and AI modeling.'
  },
  hetzner: {
    name: 'Hetzner Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/server.png',
    computeName: 'Cloud Servers',
    blockName: 'Block Storage (SSD)',
    objectName: 'Unsupported (Use S3 compatible)',
    dbName: 'Self-hosted Databases',
    factors: {
      compute_vcpu: 0.0070, compute_ram: 0.0010, block_storage: 0.040, object_storage: 0.010,
      db_vcpu: 0.0120, db_ram: 0.0020, load_balancer: 5.0, bandwidth_gb: 0.001,
      cdn_gb: 0.01, dns_million: 0.05, snapshot_gb: 0.02, tax_rate: 0.0
    },
    ratings: { perf: 4.3, sec: 4.0, scale: 3.8, ent: 3.0, startup: 4.7, availability: '99.90%' },
    strengths: 'Virtually unbeatable hardware pricing, green European data centers, massive free bandwidth limits.',
    weaknesses: 'No out-of-the-box managed DB or native Object Storage.',
    kubernetes: 'Syself Autopilot or Kubeone integrations.',
    aiServices: 'None (Requires raw self-hosted GPU VM nodes).',
    recommendation: 'Highly recommended for European operations and bootstrap startups wanting top tier hardware value.'
  },
  ovh: {
    name: 'OVHcloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/cloud.png',
    computeName: 'Public Cloud Instances',
    blockName: 'Block Storage',
    objectName: 'Object Storage',
    dbName: 'Managed Databases',
    factors: {
      compute_vcpu: 0.0075, compute_ram: 0.0011, block_storage: 0.050, object_storage: 0.011,
      db_vcpu: 0.0120, db_ram: 0.0021, load_balancer: 6.0, bandwidth_gb: 0.00,
      cdn_gb: 0.012, dns_million: 0.05, snapshot_gb: 0.022, tax_rate: 0.0
    },
    ratings: { perf: 4.1, sec: 4.3, scale: 4.0, ent: 3.8, startup: 4.2, availability: '99.95%' },
    strengths: 'Unmetered bandwidth limits, superb DDoS protection integrated, European sovereignty alignment.',
    weaknesses: 'Network setup panel can feel complex, support response times can be variable.',
    kubernetes: 'Managed Kubernetes Service.',
    aiServices: 'AI Notebooks, AI Training pipelines.',
    recommendation: 'Best for European deployments looking for unmetered data transfers and cloud privacy safeguards.'
  },
  scaleway: {
    name: 'Scaleway',
    logoUrl: 'https://img.icons8.com/color/48/000000/server.png',
    computeName: 'Elastic Metal / Cloud',
    blockName: 'Block Storage',
    objectName: 'Object Storage',
    dbName: 'Managed Databases',
    factors: {
      compute_vcpu: 0.0080, compute_ram: 0.0012, block_storage: 0.080, object_storage: 0.015,
      db_vcpu: 0.0130, db_ram: 0.0022, load_balancer: 8.0, bandwidth_gb: 0.005,
      cdn_gb: 0.015, dns_million: 0.00, snapshot_gb: 0.03, tax_rate: 0.0
    },
    ratings: { perf: 4.2, sec: 4.2, scale: 4.0, ent: 3.5, startup: 4.6, availability: '99.90%' },
    strengths: 'Excellent European multi-zone reliability, nice serverless developer structures.',
    weaknesses: 'Fewer enterprise governance directories.',
    kubernetes: 'Kapsule (Managed Kubernetes Engine).',
    aiServices: 'Scaleway AI Copilot, GPU instances.',
    recommendation: 'Ideal for cost-conscious development teams targeting the European market with microservices.'
  },
  upcloud: {
    name: 'UpCloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/server.png',
    computeName: 'Cloud Servers',
    blockName: 'MaxIOPS Block Storage',
    objectName: 'Object Storage',
    dbName: 'Managed Databases',
    factors: {
      compute_vcpu: 0.0110, compute_ram: 0.0016, block_storage: 0.100, object_storage: 0.020,
      db_vcpu: 0.0160, db_ram: 0.0026, load_balancer: 10.0, bandwidth_gb: 0.01,
      cdn_gb: 0.02, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.6, sec: 4.2, scale: 4.1, ent: 3.6, startup: 4.3, availability: '100% SLA' },
    strengths: 'Ultra fast MaxIOPS SSD arrays, highly robust 100% SLA guarantees.',
    weaknesses: 'Slightly higher pricing than standard budget clouds, modest regional footprint.',
    kubernetes: 'UpCloud Managed Kubernetes (UKE).',
    aiServices: 'None built-in.',
    recommendation: 'Excellent for business applications requiring continuous high-speed SSD disk access and uptime.'
  },
  cloudflare: {
    name: 'Cloudflare',
    logoUrl: 'https://img.icons8.com/color/48/000000/cloudflare.png',
    computeName: 'Cloudflare Workers',
    blockName: 'Unsupported (KV Store)',
    objectName: 'Cloudflare R2 Storage',
    dbName: 'Cloudflare D1 Database',
    factors: {
      compute_vcpu: 0.0150, compute_ram: 0.0015, block_storage: 0.00, object_storage: 0.015,
      db_vcpu: 0.0100, db_ram: 0.0010, load_balancer: 5.0, bandwidth_gb: 0.00,
      cdn_gb: 0.00, dns_million: 0.00, snapshot_gb: 0.00, tax_rate: 0.0
    },
    ratings: { perf: 4.8, sec: 4.8, scale: 4.9, ent: 4.2, startup: 4.8, availability: '99.99%' },
    strengths: 'Global edge processing speed, zero data egress fees (R2), elite CDN and WAF security.',
    weaknesses: 'Not a general purpose VM framework, database sizes are restricted.',
    kubernetes: 'None (Serverless / Edge Workers only).',
    aiServices: 'Workers AI (Llama, Stable Diffusion edge models), Vectorize DB.',
    recommendation: 'Optimal for serverless edge web apps, secure static frontends, and asset-heavy pipelines.'
  },
  tencent: {
    name: 'Tencent Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/tencent-cloud.png',
    computeName: 'Cloud Virtual Server',
    blockName: 'Cloud Block Storage',
    objectName: 'Cloud Object Storage',
    dbName: 'TencentDB',
    factors: {
      compute_vcpu: 0.0220, compute_ram: 0.0030, block_storage: 0.090, object_storage: 0.018,
      db_vcpu: 0.0350, db_ram: 0.0048, load_balancer: 12.0, bandwidth_gb: 0.07,
      cdn_gb: 0.05, dns_million: 0.20, snapshot_gb: 0.04, tax_rate: 0.18
    },
    ratings: { perf: 4.4, sec: 4.4, scale: 4.5, ent: 4.4, startup: 3.6, availability: '99.95%' },
    strengths: 'Outstanding social and gaming service infrastructure, robust in mainland China.',
    weaknesses: 'Western integration console features are slightly delayed.',
    kubernetes: 'Tencent Kubernetes Engine (TKE).',
    aiServices: 'TI Platform (Machine Learning tool suite), Speech/Vision APIs.',
    recommendation: 'Best for web scale social apps, high-throughput gaming backends, and Asian digital scaling.'
  },
  huawei: {
    name: 'Huawei Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/huawei.png',
    computeName: 'Elastic Cloud Server',
    blockName: 'Elastic Volume Service',
    objectName: 'Object Storage Service',
    dbName: 'Relational Database Service',
    factors: {
      compute_vcpu: 0.0230, compute_ram: 0.0031, block_storage: 0.090, object_storage: 0.019,
      db_vcpu: 0.0360, db_ram: 0.0049, load_balancer: 12.0, bandwidth_gb: 0.07,
      cdn_gb: 0.05, dns_million: 0.20, snapshot_gb: 0.04, tax_rate: 0.18
    },
    ratings: { perf: 4.4, sec: 4.4, scale: 4.5, ent: 4.5, startup: 3.4, availability: '99.95%' },
    strengths: 'Powerful hardware optimization, strong government compliance alignments in Middle East/Asia.',
    weaknesses: 'West compliance boundaries can limit adoption.',
    kubernetes: 'Cloud Container Engine (CCE).',
    aiServices: 'Pangu Models (Weather, Medicine, General LLMs), ModelArts platform.',
    recommendation: 'Excellent choice for enterprise hybrid storage setups and public infrastructure projects in Africa/Asia/Middle East.'
  },
  wasabi: {
    name: 'Wasabi Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/cloud.png',
    computeName: 'N/A (Object Storage Only)',
    blockName: 'Unsupported',
    objectName: 'Wasabi Hot Cloud Storage',
    dbName: 'Unsupported',
    factors: {
      compute_vcpu: 99.0, compute_ram: 99.0, block_storage: 99.0, object_storage: 0.0068,
      db_vcpu: 99.0, db_ram: 99.0, load_balancer: 0.0, bandwidth_gb: 0.00,
      cdn_gb: 0.0, dns_million: 0.0, snapshot_gb: 0.0, tax_rate: 0.0
    },
    ratings: { perf: 4.1, sec: 4.5, scale: 4.5, ent: 4.0, startup: 4.2, availability: '99.99%' },
    strengths: 'Extremely cheap hot storage rates, zero data egress charges.',
    weaknesses: 'No VMs, compute servers, or managed databases available.',
    kubernetes: 'None.',
    aiServices: 'None.',
    recommendation: 'Perfect for large media archiving, deep database backups, and unmetered video assets.'
  },
  backblaze: {
    name: 'Backblaze B2',
    logoUrl: 'https://img.icons8.com/color/48/000000/cloud.png',
    computeName: 'N/A (Object Storage Only)',
    blockName: 'Unsupported',
    objectName: 'Backblaze B2 Storage',
    dbName: 'Unsupported',
    factors: {
      compute_vcpu: 99.0, compute_ram: 99.0, block_storage: 99.0, object_storage: 0.0060,
      db_vcpu: 99.0, db_ram: 99.0, load_balancer: 0.0, bandwidth_gb: 0.01,
      cdn_gb: 0.0, dns_million: 0.0, snapshot_gb: 0.0, tax_rate: 0.0
    },
    ratings: { perf: 4.0, sec: 4.4, scale: 4.4, ent: 3.9, startup: 4.5, availability: '99.9%' },
    strengths: 'Superb flat pricing, simple S3 compatible APIs, great documentation.',
    weaknesses: 'No VM compute structures, no managed DB layers.',
    kubernetes: 'None.',
    aiServices: 'None.',
    recommendation: 'Best for offsite disaster recovery, raw file backups, and low cost static data reservoirs.'
  },
  render: {
    name: 'Render',
    logoUrl: 'https://img.icons8.com/external-flatart-icons-flat-flatarticons/48/000000/external-cloud-cloud-computing-flatart-icons-flat-flatarticons-4.png',
    computeName: 'Render Web Services',
    blockName: 'Render Persistent Disk',
    objectName: 'Unsupported (Render Proxy S3)',
    dbName: 'Render PostgreSQL',
    factors: {
      compute_vcpu: 0.0200, compute_ram: 0.0025, block_storage: 0.100, object_storage: 0.030,
      db_vcpu: 0.0250, db_ram: 0.0030, load_balancer: 10.0, bandwidth_gb: 0.02,
      cdn_gb: 0.01, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.3, sec: 4.1, scale: 3.9, ent: 2.8, startup: 4.9, availability: '99.9%' },
    strengths: 'Outstanding git-integrated deployments, automatic SSL certificates and domain mapping.',
    weaknesses: 'High premiums on memory, lacks complex container registries.',
    kubernetes: 'None.',
    aiServices: 'None built-in.',
    recommendation: 'Excellent for web developers and startups wishing to escape direct container orchestrations.'
  },
  railway: {
    name: 'Railway',
    logoUrl: 'https://img.icons8.com/color/48/000000/railway.png',
    computeName: 'Railway Services',
    blockName: 'Railway Volumes',
    objectName: 'Unsupported',
    dbName: 'Railway Databases',
    factors: {
      compute_vcpu: 0.0150, compute_ram: 0.0020, block_storage: 0.100, object_storage: 0.030,
      db_vcpu: 0.0200, db_ram: 0.0025, load_balancer: 0.0, bandwidth_gb: 0.10,
      cdn_gb: 0.01, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.3, sec: 4.0, scale: 3.8, ent: 2.5, startup: 4.9, availability: '99.9%' },
    strengths: 'Dynamic resource scheduling, beautiful template catalogue, immediate local variables injection.',
    weaknesses: 'Not designed for massive enterprise load systems.',
    kubernetes: 'None.',
    aiServices: 'Templates with OpenAI, Pinecone integrations.',
    recommendation: 'Superb option for quick backend deployments, cron jobs, and database staging.'
  },
  flyio: {
    name: 'Fly.io',
    logoUrl: 'https://img.icons8.com/color/48/000000/cloud.png',
    computeName: 'Fly Machines',
    blockName: 'Fly Volumes',
    objectName: 'Fly Tigris Storage',
    dbName: 'Fly Postgres',
    factors: {
      compute_vcpu: 0.0120, compute_ram: 0.0016, block_storage: 0.150, object_storage: 0.020,
      db_vcpu: 0.0150, db_ram: 0.0020, load_balancer: 2.0, bandwidth_gb: 0.02,
      cdn_gb: 0.01, dns_million: 0.00, snapshot_gb: 0.05, tax_rate: 0.0
    },
    ratings: { perf: 4.4, sec: 4.1, scale: 4.0, ent: 2.8, startup: 4.8, availability: '99.9%' },
    strengths: 'Converts containers to micro-VMs in regions closest to active users, zero cold start times.',
    weaknesses: 'Global network routing setup has custom configs.',
    kubernetes: 'None (Uses custom Firecracker micro-VM orchestrator).',
    aiServices: 'Edge inference integrations.',
    recommendation: 'Highly recommended for modern low latency APIs, fast full stack frameworks, and global web services.'
  },
  hostinger: {
    name: 'Hostinger Cloud',
    logoUrl: 'https://img.icons8.com/color/48/000000/cloud.png',
    computeName: 'VPS Hosting',
    blockName: 'VPS Disk',
    objectName: 'Unsupported',
    dbName: 'Self-managed DB',
    factors: {
      compute_vcpu: 0.0080, compute_ram: 0.0010, block_storage: 0.080, object_storage: 0.030,
      db_vcpu: 0.0100, db_ram: 0.0015, load_balancer: 0.0, bandwidth_gb: 0.00,
      cdn_gb: 0.01, dns_million: 0.00, snapshot_gb: 0.04, tax_rate: 0.0
    },
    ratings: { perf: 4.0, sec: 3.9, scale: 3.5, ent: 2.2, startup: 4.4, availability: '99.9%' },
    strengths: 'Very low VM entry fees, intuitive user dashboard setups.',
    weaknesses: 'Bare bones features, no native load balancer or unmanaged containers.',
    kubernetes: 'None.',
    aiServices: 'None.',
    recommendation: 'Best suited for hosting simple static sites, individual developers, and staging demo configurations.'
  }
};

export default function CloudProviderComparison() {
  // Spec Form States (Default benchmark specs)
  const [vcpus, setVcpus] = useState(4);
  const [ram, setRam] = useState(16);
  const [hours, setHours] = useState(730);
  const [storageGb, setStorageGb] = useState(100);
  const [objectStorageGb, setObjectStorageGb] = useState(500);
  const [dbVcpus, setDbVcpus] = useState(2);
  const [dbRam, setDbRam] = useState(8);
  const [loadBalancers, setLoadBalancers] = useState(1);
  const [bandwidthGb, setBandwidthGb] = useState(1000);
  const [cdnGb, setCdnGb] = useState(2000);
  const [dnsQueries, setDnsQueries] = useState(1000000);
  const [snapshotsGb, setSnapshotsGb] = useState(50);
  const [baselineProvider, setBaselineProvider] = useState('aws');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'cost' | 'perf' | 'sec' | 'scale' | 'ent' | 'startup'>('cost');
  const [filterType, setFilterType] = useState<'all' | 'k8s' | 'ai' | 'hyperscaler' | 'budget'>('all');

  // Load the user's latest saved calculation as the baseline
  useEffect(() => {
    const fetchLatestBaseline = async () => {
      try {
        const calcs = await api.getCalculations();
        if (calcs && calcs.length > 0) {
          const latest = calcs[0];
          const config = typeof latest.configuration === 'string'
            ? JSON.parse(latest.configuration)
            : latest.configuration;
          
          if (config) {
            if (config.vcpus !== undefined) setVcpus(config.vcpus);
            if (config.ram !== undefined) setRam(config.ram);
            if (config.hours !== undefined) setHours(config.hours);
            if (config.storage_gb !== undefined) setStorageGb(config.storage_gb);
            if (config.object_storage_gb !== undefined) setObjectStorageGb(config.object_storage_gb);
            if (config.db_vcpus !== undefined) setDbVcpus(config.db_vcpus);
            if (config.db_ram !== undefined) setDbRam(config.db_ram);
            if (config.load_balancers !== undefined) setLoadBalancers(config.load_balancers);
            if (config.bandwidth_gb !== undefined) setBandwidthGb(config.bandwidth_gb);
            if (config.cdn_gb !== undefined) setCdnGb(config.cdn_gb);
            if (config.dns_queries !== undefined) setDnsQueries(config.dns_queries);
            if (config.snapshots_gb !== undefined) setSnapshotsGb(config.snapshots_gb);
            if (latest.provider_code) setBaselineProvider(latest.provider_code);
          }
        }
      } catch (err) {
        console.error('Failed to load latest calculation for comparison baseline:', err);
      }
    };
    fetchLatestBaseline();
  }, []);

  // Compute live comparison costs matching backend
  const calculatedProviders = useMemo(() => {
    const results: Array<{
      code: string;
      name: string;
      logoUrl: string;
      computeService: string;
      storageService: string;
      databaseService: string;
      objectService: string;
      monthlyCost: number;
      annualCost: number;
      ratings: typeof PROVIDER_FACTORS[string]['ratings'];
      strengths: string;
      weaknesses: string;
      kubernetes: string;
      aiServices: string;
      recommendation: string;
      estimatedSavings: number;
      isCheapest: boolean;
      ranking: number;
      factors: typeof PROVIDER_FACTORS[string]['factors'];
    }> = [];

    // Calculate subtotal for each provider
    Object.entries(PROVIDER_FACTORS).forEach(([code, data]) => {
      const factors = data.factors;

      // Check service availability
      const computeAvail = data.computeName !== 'N/A' && !data.computeName.includes('Only');
      const objectAvail = data.objectName !== 'Unsupported';
      const blockAvail = data.blockName !== 'Unsupported';
      const dbAvail = data.dbName !== 'Unsupported' && data.dbName !== 'Self-hosted Databases' && data.dbName !== 'Self-managed DB';

      // 1. Compute Cost
      let computeCost = 0.0;
      if (computeAvail && (vcpus > 0 || ram > 0)) {
        computeCost = (vcpus * factors.compute_vcpu + ram * factors.compute_ram) * hours;
      }

      // 2. Block Storage Cost
      let blockCost = 0.0;
      if (blockAvail && storageGb > 0) {
        blockCost = storageGb * factors.block_storage;
      }

      // 3. Object Storage Cost
      let objectCost = 0.0;
      if (objectAvail && objectStorageGb > 0) {
        objectCost = objectStorageGb * factors.object_storage;
      }

      // 4. Database Cost
      let dbCost = 0.0;
      if (dbAvail && (dbVcpus > 0 || dbRam > 0)) {
        dbCost = (dbVcpus * factors.db_vcpu + dbRam * factors.db_ram) * hours;
      } else if (!dbAvail && (dbVcpus > 0 || dbRam > 0)) {
        // Fallback for self managed databases: uses raw compute factors
        dbCost = (dbVcpus * factors.compute_vcpu + dbRam * factors.compute_ram) * hours;
      }

      // 5. Load Balancer Cost
      const lbCost = loadBalancers * factors.load_balancer;

      // 6. Bandwidth/Egress Cost
      let bwCost = 0.0;
      if (bandwidthGb > 0) {
        if (code === 'oracle') {
          const chargeableBw = Math.max(0, bandwidthGb - 10000); // 10TB free
          bwCost = chargeableBw * factors.bandwidth_gb;
        } else if (code === 'hetzner') {
          const chargeableBw = Math.max(0, bandwidthGb - 20000); // 20TB free
          bwCost = chargeableBw * factors.bandwidth_gb;
        } else {
          bwCost = bandwidthGb * factors.bandwidth_gb;
        }
      }

      // 7. CDN Cost
      const cdnCost = cdnGb * factors.cdn_gb;

      // 8. DNS Cost
      const dnsMillion = dnsQueries / 1000000.0;
      const dnsCost = dnsMillion * factors.dns_million;

      // 9. Snapshot/Backup Cost
      const snapCost = snapshotsGb * factors.snapshot_gb;

      // Subtotal & Tax
      const subtotal = computeCost + blockCost + objectCost + dbCost + lbCost + bwCost + cdnCost + dnsCost + snapCost;
      const tax = subtotal * factors.tax_rate;
      const monthlyCost = subtotal + tax;

      results.push({
        code,
        name: data.name,
        logoUrl: data.logoUrl,
        computeService: data.computeName,
        storageService: data.blockName,
        databaseService: data.dbName,
        objectService: data.objectName,
        monthlyCost: Number(monthlyCost.toFixed(2)),
        annualCost: Number((monthlyCost * 12).toFixed(2)),
        ratings: data.ratings,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        kubernetes: data.kubernetes,
        aiServices: data.aiServices,
        recommendation: data.recommendation,
        estimatedSavings: 0,
        isCheapest: false,
        ranking: 0,
        factors: data.factors
      });
    });

    // Sort by Cost to find cheapest and baseline
    const sortedByCost = [...results].sort((a, b) => a.monthlyCost - b.monthlyCost);
    const cheapestOption = sortedByCost[0];

    // Find baseline cost
    const baselineItem = results.find(r => r.code === baselineProvider) || results.find(r => r.code === 'aws')!;
    const baselineMonthly = baselineItem.monthlyCost;

    // Apply rankings and savings against baseline
    const rankedResults = results.map(item => {
      const savings = Math.max(0, baselineMonthly - item.monthlyCost);
      const isCheape = item.code === cheapestOption.code;
      return {
        ...item,
        estimatedSavings: Number(savings.toFixed(2)),
        isCheapest: isCheape
      };
    });

    // Dynamic sorting
    rankedResults.sort((a, b) => {
      if (sortBy === 'cost') return a.monthlyCost - b.monthlyCost;
      if (sortBy === 'perf') return b.ratings.perf - a.ratings.perf;
      if (sortBy === 'sec') return b.ratings.sec - a.ratings.sec;
      if (sortBy === 'scale') return b.ratings.scale - a.ratings.scale;
      if (sortBy === 'ent') return b.ratings.ent - a.ratings.ent;
      if (sortBy === 'startup') return b.ratings.startup - a.ratings.startup;
      return 0;
    });

    // Set rankings
    return rankedResults.map((item, idx) => ({
      ...item,
      ranking: idx + 1
    }));
  }, [vcpus, ram, hours, storageGb, objectStorageGb, dbVcpus, dbRam, loadBalancers, bandwidthGb, cdnGb, dnsQueries, snapshotsGb, baselineProvider, sortBy]);

  // Apply filters
  const filteredProviders = useMemo(() => {
    return calculatedProviders.filter(provider => {
      // Search
      const searchMatch = 
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.strengths.toLowerCase().includes(searchQuery.toLowerCase());

      if (!searchMatch) return false;

      // Filter types
      if (filterType === 'k8s') {
        return provider.kubernetes !== 'None.' && provider.kubernetes !== 'None';
      }
      if (filterType === 'ai') {
        return provider.aiServices !== 'None.' && provider.aiServices !== 'None' && provider.aiServices !== 'None built-in.';
      }
      if (filterType === 'hyperscaler') {
        return ['aws', 'azure', 'gcp', 'oracle', 'ibm', 'alibaba', 'tencent', 'huawei'].includes(provider.code);
      }
      if (filterType === 'budget') {
        return ['digitalocean', 'linode', 'vultr', 'hetzner', 'ovh', 'scaleway', 'upcloud', 'hostinger'].includes(provider.code);
      }

      return true;
    });
  }, [calculatedProviders, searchQuery, filterType]);

  // Quick Stats
  const cleanest = useMemo(() => {
    const list = [...calculatedProviders].sort((a, b) => a.monthlyCost - b.monthlyCost);
    return list[0];
  }, [calculatedProviders]);

  const mostSecure = useMemo(() => {
    const list = [...calculatedProviders].sort((a, b) => b.ratings.sec - a.ratings.sec);
    return list[0];
  }, [calculatedProviders]);

  return (
    <div id="comparison-dashboard" className="space-y-8 animate-fade-in text-xs">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cloud Provider Comparison</h1>
        <p className="text-sm text-slate-500">
          A dedicated directory benchmark tracking equivalent service costs, core ratings, and technical specs for all 22+ supported cloud providers.
        </p>
      </div>

      {/* Top 3 Spotlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-[-30%] right-[-10%] w-24 h-24 rounded-full bg-emerald-500/10 blur-xl" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Absolute Cheapest Choice
            </span>
            <span className="text-[10px] font-mono font-semibold text-emerald-300 uppercase">{cleanest.name.split(' ')[0]}</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-white tracking-tight">${cleanest.monthlyCost.toLocaleString()}/mo</h4>
            <p className="text-[10px] text-emerald-200 mt-1 truncate">Compute Equivalent: {cleanest.computeService}</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-[-30%] right-[-10%] w-24 h-24 rounded-full bg-blue-500/10 blur-xl" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-blue-400" /> Premium Security Grade
            </span>
            <span className="text-[10px] font-mono font-semibold text-blue-300 uppercase">{mostSecure.name.split(' ')[0]}</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-white tracking-tight">${mostSecure.monthlyCost.toLocaleString()}/mo</h4>
            <p className="text-[10px] text-slate-400 mt-1 truncate">Security: {mostSecure.ratings.sec}/5.0 • Availability: {mostSecure.ratings.availability}</p>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between h-36">
          <div className="absolute top-[-30%] right-[-10%] w-24 h-24 rounded-full bg-indigo-500/10 blur-xl" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Optimal FinOps Setup
            </span>
            <span className="text-[10px] font-mono font-semibold text-indigo-300 uppercase">Google Cloud</span>
          </div>
          <div>
            <h4 className="text-2xl font-black text-white tracking-tight">GKE Autopilot AI</h4>
            <p className="text-[10px] text-indigo-200 mt-1">Excellent performance with Gemini models and flexible discounts.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Spec Selector (Left) & Cards Dashboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Spec Selector and AI Analysis Workspace */}
        <div className="lg:col-span-4 space-y-6 h-fit">
          
          {/* Spec Controller Form */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">Benchmark Workload Inputs</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Baseline Provider</label>
                <select 
                  value={baselineProvider}
                  onChange={(e) => setBaselineProvider(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(PROVIDER_FACTORS).map(([code, p]) => (
                    <option key={code} value={code}>{p.name}</option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-400 mt-1 block">Used to calculate dynamic savings differences across other providers.</span>
              </div>

              {/* Compute */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">vCPUs</label>
                  <input 
                    type="number" 
                    value={vcpus}
                    onChange={(e) => setVcpus(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">RAM (GB)</label>
                  <input 
                    type="number" 
                    value={ram}
                    onChange={(e) => setRam(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Storage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SSD Storage (GB)</label>
                  <input 
                    type="number" 
                    value={storageGb}
                    onChange={(e) => setStorageGb(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Object Storage (GB)</label>
                  <input 
                    type="number" 
                    value={objectStorageGb}
                    onChange={(e) => setObjectStorageGb(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Database */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Database vCPU</label>
                  <input 
                    type="number" 
                    value={dbVcpus}
                    onChange={(e) => setDbVcpus(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Database RAM (GB)</label>
                  <input 
                    type="number" 
                    value={dbRam}
                    onChange={(e) => setDbRam(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Network Egress / CDN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Egress Data (GB)</label>
                  <input 
                    type="number" 
                    value={bandwidthGb}
                    onChange={(e) => setBandwidthGb(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CDN Data (GB)</label>
                  <input 
                    type="number" 
                    value={cdnGb}
                    onChange={(e) => setCdnGb(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Extras */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">LBs</label>
                  <input 
                    type="number" 
                    value={loadBalancers}
                    onChange={(e) => setLoadBalancers(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Snaps (GB)</label>
                  <input 
                    type="number" 
                    value={snapshotsGb}
                    onChange={(e) => setSnapshotsGb(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">DNS (M)</label>
                  <input 
                    type="number" 
                    value={dnsQueries / 1000000}
                    onChange={(e) => setDnsQueries(Math.max(0, Number(e.target.value) * 1000000))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Usage Hours</label>
                <input 
                  type="number" 
                  value={hours}
                  onChange={(e) => setHours(Math.min(730, Math.max(0, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* AI Analysis Workspace Card */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span className="font-bold text-slate-100 text-sm">AI Infrastructure Workspace</span>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase font-bold">GEMINI 3.5</span>
            </div>

            {/* Workload Profile Classification */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Real-time Workload Profile</span>
              {(() => {
                const totalVcpu = vcpus + dbVcpus;
                const totalRam = ram + dbRam;
                let profileTitle = "Micro Staging Sandbox";
                let profileDesc = "A single-node dev server or low-traffic test server configuration.";
                let profileBadge = "bg-amber-500/10 text-amber-300 border border-amber-500/20";
                
                if (totalVcpu >= 16 || totalRam >= 64) {
                  profileTitle = "Enterprise Production Cluster";
                  profileDesc = "High-performance big-data core cluster with high resource intensity.";
                  profileBadge = "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30";
                } else if (totalVcpu >= 8 || totalRam >= 32) {
                  profileTitle = "High-Availability Microservices";
                  profileDesc = "Multi-node Kubernetes cluster with dedicated database replication.";
                  profileBadge = "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
                } else if (totalVcpu >= 2 || totalRam >= 4) {
                  profileTitle = "Standard Tier-3 Web Stack";
                  profileDesc = "Balanced web servers and managed backend relational database nodes.";
                  profileBadge = "bg-blue-500/15 text-blue-300 border border-blue-500/30";
                }

                return (
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{profileTitle}</span>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${profileBadge}`}>
                        {vcpus + dbVcpus} Cores • {ram + dbRam} GB
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{profileDesc}</p>
                  </div>
                );
              })()}
            </div>

            {/* Dynamic CSS/SVG Interactive Architecture Diagram */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Interactive Architecture Diagram</span>
                <span className="text-[9px] text-indigo-400 font-mono">Dynamic Flow</span>
              </div>
              
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col items-center space-y-3 relative overflow-hidden">
                {/* SVG background grid or connector lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 50 45 L 145 45 M 145 45 L 145 105 M 145 45 L 240 45 M 145 105 L 50 105 M 145 105 L 240 105" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4 2" fill="none" />
                </svg>

                {/* Grid of micro-services */}
                <div className="flex justify-between w-full items-center z-10">
                  {/* CDN & Traffic */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 bg-slate-900 border border-indigo-500/40 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/5">
                      <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-wider font-mono">CDN ({cdnGb}GB)</span>
                  </div>

                  <div className="text-slate-600 text-xs font-bold font-mono">⟶</div>

                  {/* Load Balancer */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 bg-slate-900 border border-blue-500/40 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/5">
                      <Workflow className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-[8px] font-bold text-blue-300 uppercase tracking-wider font-mono">LB ({loadBalancers})</span>
                  </div>

                  <div className="text-slate-600 text-xs font-bold font-mono">⟶</div>

                  {/* Compute Cluster */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 bg-slate-900 border border-emerald-500/40 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/5">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider font-mono">VM ({vcpus}C)</span>
                  </div>
                </div>

                <div className="flex justify-between w-full items-center z-10 pt-1">
                  {/* S3 Object Storage */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 bg-slate-900 border border-amber-500/40 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/5">
                      <Cloud className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[8px] font-bold text-amber-300 uppercase tracking-wider font-mono">S3 ({objectStorageGb}GB)</span>
                  </div>

                  <div className="text-slate-600 text-xs font-bold font-mono">⟵</div>

                  {/* Block Storage */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 bg-slate-900 border border-pink-500/40 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/5">
                      <HardDrive className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-[8px] font-bold text-pink-300 uppercase tracking-wider font-mono">EBS ({storageGb}GB)</span>
                  </div>

                  <div className="text-slate-600 text-xs font-bold font-mono">⟵</div>

                  {/* Database Node */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-9 h-9 bg-slate-900 border border-cyan-500/40 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/5">
                      <Database className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-[8px] font-bold text-cyan-300 uppercase tracking-wider font-mono">DB ({dbVcpus}C)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider-Specific AI Optimization Workspace Recommendations */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Provider-Specific Advice Hub</span>
              
              {(() => {
                // Determine recommendation targets
                const isAws = baselineProvider === 'aws';
                const isGcp = baselineProvider === 'gcp';
                const isAzure = baselineProvider === 'azure';

                return (
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Card 1: AWS Specific */}
                    <div className={`p-3 rounded-xl border transition-all ${isAws ? 'bg-indigo-950/25 border-indigo-500/30' : 'bg-slate-950/40 border-slate-800'}`}>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <img src="https://img.icons8.com/color/48/000000/amazon-web-services.png" alt="" className="w-3.5 h-3.5" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-bold text-slate-200">Amazon Web Services Recommendation</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        For AWS deployments, purchasing standard **Compute Savings Plans** delivers a flat **32% price reduction** on EC2 and EKS. Additionally, automate the lifecycle of your **{objectStorageGb} GB S3 bucket** to migrate objects to Glacier Deep Archive after 30 days.
                      </p>
                    </div>

                    {/* Card 2: GCP Specific */}
                    <div className={`p-3 rounded-xl border transition-all ${isGcp ? 'bg-indigo-950/25 border-indigo-500/30' : 'bg-slate-950/40 border-slate-800'}`}>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <img src="https://img.icons8.com/color/48/000000/google-cloud.png" alt="" className="w-3.5 h-3.5" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-bold text-slate-200">Google Cloud Platform Recommendation</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Deploy your workloads on **GKE Autopilot** rather than standard GKE VMs to eliminate up to **45% of idle resource allocation overhead**. Leverage GCP's **Committed Use Discounts (CUDs)** for your continuous DB core allocation.
                      </p>
                    </div>

                    {/* Card 3: Azure Specific */}
                    <div className={`p-3 rounded-xl border transition-all ${isAzure ? 'bg-indigo-950/25 border-indigo-500/30' : 'bg-slate-950/40 border-slate-800'}`}>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <img src="https://img.icons8.com/color/48/000000/azure-1.png" alt="" className="w-3.5 h-3.5" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-bold text-slate-200">Microsoft Azure Recommendation</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Apply **Azure Hybrid Benefit (AHB)** to reuse pre-existing Windows Server & SQL Server core licenses for Azure VMs, bypassing runtime licensing surcharges. Configure **Azure Reservations** for stable databases.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Savings projection metrics */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-950 border border-indigo-500/20 p-4 rounded-xl space-y-3">
              <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block">Estimated Savings Matrix (Cheapest Option Transition)</span>
              
              {(() => {
                const currentMonthly = PROVIDER_FACTORS[baselineProvider].factors.compute_vcpu * vcpus * hours;
                const cheapestMonthly = PROVIDER_FACTORS['oracle'].factors.compute_vcpu * vcpus * hours; // estimation baseline
                const savingsBase = Math.max(15, cleanest.estimatedSavings);

                return (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Immediate Savings</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">${savingsBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Projected 1-Year</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">${(savingsBase * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Directory Dashboard - Right span 8 */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Search, Sort, and Filter Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search provider catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter types */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType('k8s')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'k8s' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Kubernetes
              </button>
              <button 
                onClick={() => setFilterType('ai')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'ai' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                AI Engines
              </button>
              <button 
                onClick={() => setFilterType('hyperscaler')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'hyperscaler' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Hyperscalers
              </button>
              <button 
                onClick={() => setFilterType('budget')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${filterType === 'budget' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Budget/Edge
              </button>
            </div>

            {/* Sorting */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select 
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cost">Sort: Cost (Cheapest)</option>
                <option value="perf">Sort: Performance</option>
                <option value="sec">Sort: Security Rating</option>
                <option value="scale">Sort: Scalability Score</option>
                <option value="ent">Sort: Enterprise Suitability</option>
                <option value="startup">Sort: Startup Suitability</option>
              </select>
            </div>
          </div>

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProviders.slice(0, 12).map((prov) => {
              const isSelected = prov.code === baselineProvider;
              return (
                <div 
                  key={prov.code} 
                  className={`bg-white border rounded-2xl shadow-sm p-5 space-y-4 transition-all relative flex flex-col justify-between ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  {/* Badge */}
                  {prov.isCheapest && (
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[8px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm">
                      Best Price
                    </span>
                  )}

                  <div className="space-y-3">
                    {/* Brand line */}
                    <div className="flex items-center space-x-3.5">
                      <img 
                        src={prov.logoUrl} 
                        alt={prov.name} 
                        className="w-8 h-8 object-contain bg-slate-50 p-1.5 rounded-xl border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          {prov.name}
                          {isSelected && <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-black uppercase">Baseline</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Rank #{prov.ranking}</p>
                      </div>
                    </div>

                    {/* Pricing details */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Benchmark Cost</span>
                        <span className="text-sm font-black text-slate-800 font-mono">${prov.monthlyCost.toLocaleString()}/mo</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Baseline Savings</span>
                        {prov.estimatedSavings > 0 ? (
                          <span className="text-sm font-black text-emerald-600 font-mono">+${prov.estimatedSavings.toLocaleString()}/mo</span>
                        ) : isSelected ? (
                          <span className="text-[10px] text-slate-500 font-bold">Baseline</span>
                        ) : (
                          <span className="text-sm font-black text-slate-400 font-mono">-${Math.abs(prov.monthlyCost - PROVIDER_FACTORS[baselineProvider].factors.compute_vcpu * 100).toLocaleString()}/mo</span>
                        )}
                      </div>
                    </div>

                    {/* Equivalent Service Mapping */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Service equivalents</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700 font-mono truncate">
                          💻 {prov.computeService}
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700 font-mono truncate">
                          💾 {prov.storageService}
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700 font-mono truncate">
                          🗄️ {prov.databaseService}
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700 font-mono truncate">
                          📦 {prov.objectService}
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="space-y-1.5 pt-1 text-[11px] leading-relaxed">
                      <p className="text-slate-700">
                        🟢 <strong className="text-slate-800">Strengths:</strong> {prov.strengths}
                      </p>
                      <p className="text-slate-700">
                        🔴 <strong className="text-slate-800">Weaknesses:</strong> {prov.weaknesses}
                      </p>
                    </div>

                    {/* Tech details (K8s / AI) */}
                    <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Kubernetes Support:</span>
                        <span className="text-slate-700 font-mono truncate max-w-[180px]">{prov.kubernetes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Native AI Services:</span>
                        <span className="text-slate-700 font-mono truncate max-w-[180px]">{prov.aiServices}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ratings Block */}
                  <div className="border-t border-slate-100 pt-3 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Perf: <strong>{prov.ratings.perf}</strong></span>
                    <span>Security: <strong>{prov.ratings.sec}</strong></span>
                    <span>Scale: <strong>{prov.ratings.scale}</strong></span>
                    <span>SLA: <strong>{prov.ratings.availability}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Tabular Comparison List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs">All Supported Cloud Catalog Benchmarks ({filteredProviders.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Provider / Compute Eq.</th>
                    <th className="py-3 px-3 text-right">Monthly Spend</th>
                    <th className="py-3 px-3 text-right">Annual Run Rate</th>
                    <th className="py-3 px-3 text-right">Egress Pricing</th>
                    <th className="py-3 px-4 text-center">Security Rating</th>
                    <th className="py-3 px-4 text-center">Startup Suit.</th>
                    <th className="py-3 px-4 text-center">SLA Uptime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProviders.map((prov) => {
                    const isSelected = prov.code === baselineProvider;
                    return (
                      <tr key={prov.code} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-blue-600/5 font-semibold' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-400 text-center">#{prov.ranking}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <img src={prov.logoUrl} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                            <span className="font-bold text-slate-800">{prov.name.split(' (')[0]}</span>
                            {prov.isCheapest && <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded uppercase font-bold">Cheapest</span>}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{prov.computeService}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          ${prov.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          ${prov.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {prov.factors.bandwidth_gb === 0 ? 'FREE' : `$${prov.factors.bandwidth_gb}/GB`}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{prov.ratings.sec}/5.0</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{prov.ratings.startup}/5.0</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-600">{prov.ratings.availability}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
