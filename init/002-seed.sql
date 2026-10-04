-- Deterministic seed data: fixed ids, fixed UUIDs, fixed timestamps.
-- Passwords (bcryptjs, cost 10):
--   admin@example.com -> admin123
--   every other user  -> user123

INSERT INTO users (id, email, name, role, status, password_hash, created_at, updated_at, deleted_at) VALUES
  (1, 'admin@example.com', 'Admin User',     'admin', 'active',  '$2a$10$AkeXWvhvdJTT//7YpC.L9O7Bdv4HWkH/w6dCBsWcGW.mjTLNH9WI.', '2024-01-01T09:00:00.000Z', '2024-01-01T09:00:00.000Z', NULL),
  (2, 'alice@example.com', 'Alice Anderson', 'user',  'active',  '$2a$10$qDk1LEduG5rDTXe7u9IfweOQaMrcecb2FyJV5vebqlOniH/M/kaqG', '2024-01-02T10:15:30.123Z', '2024-01-05T08:00:00.000Z', NULL),
  (3, 'bob@example.com',   'Bob Brown',      'user',  'blocked', '$2a$10$qDk1LEduG5rDTXe7u9IfweOQaMrcecb2FyJV5vebqlOniH/M/kaqG', '2024-01-03T11:00:00.500Z', '2024-02-01T12:00:00.000Z', NULL),
  (4, 'carol@example.com', 'Carol Clark',    'user',  'active',  '$2a$10$qDk1LEduG5rDTXe7u9IfweOQaMrcecb2FyJV5vebqlOniH/M/kaqG', '2024-01-04T12:30:00.000Z', '2024-01-04T12:30:00.000Z', NULL),
  (5, 'dave@example.com',  'dave davis',     'user',  'active',  '$2a$10$qDk1LEduG5rDTXe7u9IfweOQaMrcecb2FyJV5vebqlOniH/M/kaqG', '2024-01-05T13:45:00.000Z', '2024-01-05T13:45:00.000Z', NULL),
  (6, 'eve@example.com',   'Eve Evans',      'user',  'active',  '$2a$10$qDk1LEduG5rDTXe7u9IfweOQaMrcecb2FyJV5vebqlOniH/M/kaqG', '2024-01-06T14:00:00.000Z', '2024-03-01T00:00:00.000Z', '2024-03-01T00:00:00.000Z');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO orders (id, user_id, status, amount, created_at) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 2, 'paid',    19.90,   '2024-02-01T10:00:00.000Z'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 2, 'pending', 5.00,    '2024-02-02T11:30:00.250Z'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 3, 'expired', 100.00,  '2024-02-03T09:15:00.000Z'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 4, 'paid',    1234.50, '2024-02-10T16:45:12.345Z'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 4, 'pending', 0.99,    '2024-03-01T08:00:00.000Z'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 1, 'paid',    250.00,  '2024-03-15T12:00:00.000Z'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 5, 'expired', 42.10,   '2024-04-01T00:00:00.000Z'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 2, 'paid',    7.25,    '2024-04-20T18:30:00.999Z');
