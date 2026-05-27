# Arquitectura Cloud EcoMarket (AWS)

## Diagrama de Red y Servicios

```mermaid
graph TD
    subgraph "AWS Region (us-east-1)"
        subgraph "VPC (10.0.0.0/16)"
            
            subgraph "Public Subnets"
                ALB[Application Load Balancer HTTPS/443]
                WAF[AWS WAF OWASP Rules]
                NAT[NAT Gateway]
                Bastion[Bastion Host]
            end

            subgraph "Private Subnets"
                EKS[Amazon EKS Cluster]
                subgraph "Microservicios (Pods)"
                    AuthSvc[Auth Service - Spring Boot]
                    ProductSvc[Product Service - Spring Boot]
                    PaymentSvc[Payment Service - Spring Boot]
                    AuditSvc[Audit Service - Spring Boot]
                    AINLP[AI/NLP Engine - FastAPI]
                    NotifSvc[Notification Service - FastAPI]
                end
            end

            subgraph "Data Persistence Subnet"
                RDS[(Amazon RDS PostgreSQL Multi-AZ)]
                DocDB[(Amazon DocumentDB)]
                ElastiCache[(Amazon ElastiCache Redis)]
            end
            
            ALB -->|Ruta de tráfico| EKS
            WAF --> ALB
            EKS --> RDS
            EKS --> DocDB
            EKS --> ElastiCache
            EKS --> NAT
        end

        subgraph "Servicios Globales y Administrados"
            CloudFront[Amazon CloudFront CDN]
            Route53[Amazon Route 53]
            ACM[AWS Certificate Manager]
            S3[Amazon S3 Buckets]
            QLDB[(Amazon QLDB Ledger)]
            SecretsManager[AWS Secrets Manager]
            KMS[AWS KMS AES-256]
        end

        Route53 --> CloudFront
        CloudFront --> ALB
        CloudFront --> S3
        AuditSvc --> QLDB
        AuthSvc --> SecretsManager
    end

    User((Usuarios y Proveedores)) -->|HTTPS| Route53
```

## Componentes Principales

1. **API Gateway & Routing**: El tráfico de usuarios llega a Route 53, pasa por CloudFront (CDN para PWA) y luego al Application Load Balancer. Un WAF protege contra ataques OWASP.
2. **Compute**: Amazon EKS gestiona contenedores para los microservicios en Spring Boot y FastAPI dentro de subredes privadas, asegurando que no haya exposición a internet pública.
3. **Persistencia**:
    - **PostgreSQL (RDS)**: Para transacciones, usuarios, pagos.
    - **DocumentDB**: Para resultados NLP de ingredientes y JSON dinámicos.
    - **Amazon QLDB**: Libro mayor inmutable para trazabilidad y auditoría de productos.
4. **Seguridad**: Secretos y claves (MFA, Webhooks) almacenados en AWS Secrets Manager, encriptación con KMS.
