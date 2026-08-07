-- Seoul Trip Planner 2026 - Supabase schema
-- Run this SQL in Supabase SQL Editor before enabling cloud sync.

create table if not exists trips (
  id text primary key,
  title text,
  start_date text,
  end_date text,
  budget numeric,
  data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists trip_members (
  id text primary key,
  trip_id text references trips(id) on delete cascade,
  name text,
  avatar text
);

create table if not exists hotels (
  id text primary key,
  trip_id text references trips(id) on delete cascade,
  name text,
  address text,
  location_id text,
  check_in text,
  check_out text,
  note text
);

create table if not exists flights (
  id text primary key,
  trip_id text references trips(id) on delete cascade,
  type text,
  flight_no text,
  date text,
  time text
);

create table if not exists events (
  id text primary key,
  trip_id text references trips(id) on delete cascade,
  date text,
  time text,
  title text,
  location_id text,
  restaurant_id text
);

create table if not exists expenses (
  id text primary key,
  trip_id text references trips(id) on delete cascade,
  payer text,
  amount_krw text,
  amount_rmb numeric,
  category text
);

create index if not exists idx_trip_members_trip on trip_members(trip_id);
create index if not exists idx_hotels_trip on hotels(trip_id);
create index if not exists idx_flights_trip on flights(trip_id);
create index if not exists idx_events_trip on events(trip_id);
create index if not exists idx_expenses_trip on expenses(trip_id);

-- Row Level Security: enable if you use Supabase Auth.
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table hotels enable row level security;
alter table flights enable row level security;
alter table events enable row level security;
alter table expenses enable row level security;

-- Default open policy for anon key demo. Replace with authenticated policies in production.
drop policy if exists "public read trips" on trips;
create policy "public read trips" on trips for select using (true);
drop policy if exists "public write trips" on trips;
create policy "public write trips" on trips for insert with check (true);
drop policy if exists "public update trips" on trips;
create policy "public update trips" on trips for update using (true);

drop policy if exists "public read trip_members" on trip_members;
create policy "public read trip_members" on trip_members for select using (true);
drop policy if exists "public write trip_members" on trip_members;
create policy "public write trip_members" on trip_members for insert with check (true);
drop policy if exists "public update trip_members" on trip_members;
create policy "public update trip_members" on trip_members for update using (true);

drop policy if exists "public read hotels" on hotels;
create policy "public read hotels" on hotels for select using (true);
drop policy if exists "public write hotels" on hotels;
create policy "public write hotels" on hotels for insert with check (true);
drop policy if exists "public update hotels" on hotels;
create policy "public update hotels" on hotels for update using (true);

drop policy if exists "public read flights" on flights;
create policy "public read flights" on flights for select using (true);
drop policy if exists "public write flights" on flights;
create policy "public write flights" on flights for insert with check (true);
drop policy if exists "public update flights" on flights;
create policy "public update flights" on flights for update using (true);

drop policy if exists "public read events" on events;
create policy "public read events" on events for select using (true);
drop policy if exists "public write events" on events;
create policy "public write events" on events for insert with check (true);
drop policy if exists "public update events" on events;
create policy "public update events" on events for update using (true);

drop policy if exists "public read expenses" on expenses;
create policy "public read expenses" on expenses for select using (true);
drop policy if exists "public write expenses" on expenses;
create policy "public write expenses" on expenses for insert with check (true);
drop policy if exists "public update expenses" on expenses;
create policy "public update expenses" on expenses for update using (true);
