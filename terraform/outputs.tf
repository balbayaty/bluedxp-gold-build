# BlueDXP Platform - Terraform Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.bluedxp.id
}

output "eks_cluster_id" {
  description = "EKS Cluster ID"
  value       = aws_eks_cluster.bluedxp.id
}

output "eks_cluster_endpoint" {
  description = "EKS Cluster endpoint"
  value       = aws_eks_cluster.bluedxp.endpoint
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.bluedxp.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.bluedxp.db_name
}

output "subnet_ids" {
  description = "Subnet IDs"
  value       = aws_subnet.bluedxp[*].id
}

