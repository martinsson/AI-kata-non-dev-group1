CREATE TABLE apartment (
    id          UUID PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    address     VARCHAR(500),
    surface     NUMERIC(8, 2),
    rooms       INTEGER,
    notes       TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant (
    id          UUID PRIMARY KEY,
    last_name   VARCHAR(200) NOT NULL,
    first_name  VARCHAR(200) NOT NULL,
    email       VARCHAR(320),
    phone       VARCHAR(50),
    notes       TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lease (
    id                UUID PRIMARY KEY,
    apartment_id      UUID NOT NULL REFERENCES apartment(id),
    tenant_id         UUID NOT NULL REFERENCES tenant(id),
    start_date        DATE NOT NULL,
    end_date          DATE,
    monthly_rent      NUMERIC(10, 2) NOT NULL,
    monthly_charges   NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deposit           NUMERIC(10, 2),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT lease_dates_chk CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT lease_amounts_chk CHECK (monthly_rent >= 0 AND monthly_charges >= 0)
);
CREATE INDEX idx_lease_apartment ON lease(apartment_id);
CREATE INDEX idx_lease_tenant ON lease(tenant_id);

CREATE TABLE payment (
    id          UUID PRIMARY KEY,
    lease_id    UUID NOT NULL REFERENCES lease(id),
    paid_on     DATE NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL,
    type        VARCHAR(20) NOT NULL,
    status      VARCHAR(20) NOT NULL,
    note        TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_type_chk CHECK (type IN ('RENT', 'CHARGES')),
    CONSTRAINT payment_status_chk CHECK (status IN ('PAID', 'PENDING')),
    CONSTRAINT payment_amount_chk CHECK (amount >= 0)
);
CREATE INDEX idx_payment_lease ON payment(lease_id);
CREATE INDEX idx_payment_status ON payment(status);
CREATE INDEX idx_payment_date ON payment(paid_on);

CREATE TABLE charge (
    id            UUID PRIMARY KEY,
    apartment_id  UUID NOT NULL REFERENCES apartment(id),
    incurred_on   DATE NOT NULL,
    amount        NUMERIC(10, 2) NOT NULL,
    category      VARCHAR(50) NOT NULL,
    label         VARCHAR(300),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT charge_amount_chk CHECK (amount >= 0)
);
CREATE INDEX idx_charge_apartment ON charge(apartment_id);
CREATE INDEX idx_charge_date ON charge(incurred_on);
