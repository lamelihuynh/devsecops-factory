# infrastructure/terraform/main.tf — OWNED BY TEAM 1
# Cloud infrastructure (used when moving from local to AWS)
# Local equivalent: k3d cluster (free, zero AWS cost)
#
# Run: terraform init && terraform apply
# Prerequisites: AWS CLI configured, terraform installed

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Uncomment for team state sharing (requires S3 bucket created first)
  # backend "s3" {
  #   bucket         = "devsecops-tf-state"
  #   key            = "devsecops/terraform.tfstate"
  #   region         = var.aws_region
  #   dynamodb_table = "devsecops-tf-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "devsecops-factory"
      Environment = var.environment
      ManagedBy   = "terraform"
      Team        = "team-infra"
    }
  }
}

variable "aws_region"   { default = "us-east-1" }
variable "environment"  { default = "dev" }
variable "cluster_name" { default = "devsecops-dev" }

# ── VPC ───────────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true      # Cost saving: 1 NAT for dev
  enable_dns_hostnames = true

  # Required for EKS
  public_subnet_tags  = { "kubernetes.io/role/elb" = "1" }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = "1" }
}

# ── EKS ───────────────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    default = {
      instance_types = ["t3.medium"]
      capacity_type  = "SPOT"         # 60-80% cheaper than on-demand
      min_size       = 1
      max_size       = 4
      desired_size   = 2

      labels = { role = "worker" }
    }
  }
}

# ── ECR (backup registry — Harbor is primary) ─────────────
resource "aws_ecr_repository" "app" {
  name                 = "tetris-devsecops"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false  # We use Trivy instead — free + better
  }
}

# ── Outputs (used in .env.cloud) ──────────────────────────
output "eks_cluster_name"     { value = module.eks.cluster_name }
output "ecr_repository_url"   { value = aws_ecr_repository.app.repository_url }
output "kubeconfig_command"   {
  value = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}
