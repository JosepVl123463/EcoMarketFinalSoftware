-- Script para actualizar la contraseña del administrador en una BD existente.
-- Contraseña: 123456789 (BCrypt strength 12)
-- Ejecutar con: docker exec -i ecomarket-postgres psql -U admin -d ecomarket_db < update_admin_password.sql

UPDATE users
SET provider_id = '$2b$12$pPrbIbV6l6uusWE.qTpTCuvIyZ.1TXKYrAMcU.VDPyvphxX7QXUVm',
    role        = 'admin',
    full_name   = 'Administrador Principal'
WHERE email = 'admin@ecomarket.pe';

-- Verificar el resultado
SELECT id, email, full_name, role, eco_score FROM users WHERE role = 'admin';
