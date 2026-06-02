# Data Model



### DATA.001 — Canonical Entity Registry
The de-duplicated list of domain entities and their canonical names.

### DATA.002 — Database Schema
The canonical relational schema the executor builds and migrates against.

### DATA.003 — Client Table
clients(id, name, contact, created_at).

### DATA.004 — Staff Table
staff(id, name, role, active).

### DATA.005 — Service Table
services(id, name, minutes, price_cents).

### DATA.006 — Appointment Table
bookings(id, staff_id, client_id, service_id, starts_at, ends_at, status).

### DATA.007 — Payment Table
payments(id, booking_id, amount_cents, kind).

