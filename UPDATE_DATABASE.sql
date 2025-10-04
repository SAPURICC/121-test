-- Add month column to preparations table
ALTER TABLE preparations ADD COLUMN IF NOT EXISTS month VARCHAR(7);

-- Create index for month-based queries
CREATE INDEX IF NOT EXISTS idx_preparations_month ON preparations(month);

-- Update existing records to have a default month (current month)
UPDATE preparations 
SET month = TO_CHAR(CURRENT_DATE, 'YYYY-MM') 
WHERE month IS NULL;