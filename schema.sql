CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('owner','vet','caretaker','admin')),
  phone VARCHAR(15),
  profile_image TEXT,
  username VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE pets (
  id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES users(id),
  name VARCHAR(100),
  type VARCHAR(50),
  breed VARCHAR(50),
  age INT
);

CREATE TABLE providers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type VARCHAR(50),
  specialization TEXT,
  experience INT
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  provider_id INT REFERENCES providers(id),
  pet_id INT REFERENCES pets(id),
  booking_date TIMESTAMP,
  status VARCHAR(20)
);

CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  visit_time TIMESTAMP,
  notes TEXT
);

CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  provider_id INT REFERENCES providers(id),
  booking_id INT REFERENCES bookings(id)
);

CREATE TABLE public.pet_assignments (
    assignment_id integer NOT NULL,
    pet_id integer NOT NULL,
    assigned_user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'ASSIGNED'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    service_fee numeric(10,2) DEFAULT 0,
    payment_status character varying(20) DEFAULT 'PENDING'::character varying
);

CREATE SEQUENCE public.pet_assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.pet_assignments_assignment_id_seq OWNED BY public.pet_assignments.assignment_id;
ALTER TABLE ONLY public.pet_assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.pet_assignments_assignment_id_seq'::regclass);
ALTER TABLE ONLY public.pet_assignments ADD CONSTRAINT pet_assignments_pkey PRIMARY KEY (assignment_id);
ALTER TABLE ONLY public.pet_assignments ADD CONSTRAINT fk_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pet_assignments ADD CONSTRAINT fk_pet FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;