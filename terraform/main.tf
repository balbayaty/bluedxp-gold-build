# BlueDXP Platform - Terraform Configuration
# Infrastructure as Code for Saudi Arabia deployment

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  backend "s3" {
    bucket = "bluedxp-terraform-state"
    key    = "bluedxp/terraform.tfstate"
    region = "me-south-1" # Bahrain (closest to Saudi Arabia)
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "BlueDXP"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region (must be in Saudi Arabia or nearby)"
  type        = string
  default     = "me-south-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "bluedxp-cluster"
}

# VPC for BlueDXP
resource "aws_vpc" "bluedxp" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames  = true
  enable_dns_support    = true

  tags = {
    Name = "bluedxp-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "bluedxp" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.bluedxp[*].id
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

# IAM Role for EKS Cluster
resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

# Subnets
resource "aws_subnet" "bluedxp" {
  count             = 2
  vpc_id            = aws_vpc.bluedxp.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "bluedxp-subnet-${count.index + 1}"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# RDS PostgreSQL
resource "aws_db_instance" "bluedxp" {
  identifier     = "bluedxp-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "bluedxp"
  username = "bluedxp"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.bluedxp.name
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "bluedxp-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  tags = {
    Name = "bluedxp-postgres"
  }
}

resource "aws_db_subnet_group" "bluedxp" {
  name       = "bluedxp-db-subnet-group"
  subnet_ids = aws_subnet.bluedxp[*].id

  tags = {
    Name = "bluedxp-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name        = "bluedxp-rds-sg"
  description = "Security group for BlueDXP RDS"
  vpc_id      = aws_vpc.bluedxp.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.bluedxp.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

