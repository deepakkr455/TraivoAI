-- Create StartJourney table
CREATE TABLE IF NOT EXISTS start_journey (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  departure_location TEXT NOT NULL,
  departure_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  joined_members_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at if needed, but usually journey start is a one-time event or just an insert.
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_start_journey_trip_id ON start_journey(trip_id);
