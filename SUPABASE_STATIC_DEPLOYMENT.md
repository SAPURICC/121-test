# Supabase Static Site Deployment Guide

## 🚀 Complete Setup for Static Deployment

### Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up/Login** (try with personal email if organization issues)
3. **Click "New Project"**
4. **Fill project details**:
   - Name: `one-to-one-catchup`
   - Database Password: (create strong password)
   - Region: Choose closest to users
5. **Click "Create new project"**

### Step 2: Create Database Tables

1. **Go to SQL Editor** in Supabase dashboard
2. **Run this SQL** to create tables:

```sql
-- Create preparations table
CREATE TABLE preparations (
    id SERIAL PRIMARY KEY,
    prep_key VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    partner VARCHAR(255) NOT NULL,
    ratings JSONB NOT NULL,
    comments JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    manager_name VARCHAR(255) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    session_date TIMESTAMP NOT NULL,
    employee_data JSONB NOT NULL,
    manager_data JSONB NOT NULL,
    categories JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_preparations_prep_key ON preparations(prep_key);
CREATE INDEX idx_sessions_names ON sessions(manager_name, employee_name);
CREATE INDEX idx_sessions_date ON sessions(session_date);

-- Enable Row Level Security (RLS)
ALTER TABLE preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for simplicity)
CREATE POLICY "Allow all operations on preparations" ON preparations FOR ALL USING (true);
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
```

### Step 3: Get Project Credentials

1. **Go to Settings** → **API**
2. **Copy these values**:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 4: Update Your Code

1. **Open `script.js`**
2. **Replace these lines** at the top:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Anon key
```

**With your actual values**:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Step 5: Deploy to Supabase Hosting

1. **In Supabase dashboard**, go to **Storage**
2. **Create new bucket**:
   - Name: `website`
   - Public: ✅ Yes
3. **Upload your files**:
   - `index.html`
   - `styles.css`
   - `script.js`
4. **Set up hosting**:
   - Go to **Settings** → **Storage**
   - Enable **Public access** for website bucket
   - Your site will be at: `https://xxxxx.supabase.co/storage/v1/object/public/website/index.html`

### Alternative: Deploy to Netlify/Vercel

Since Supabase hosting is limited, you can also:

#### Option A: Netlify
1. **Go to [netlify.com](https://netlify.com)**
2. **Drag and drop** your files (index.html, styles.css, script.js)
3. **Get instant URL**

#### Option B: Vercel
1. **Go to [vercel.com](https://vercel.com)**
2. **Import from GitHub** or drag files
3. **Deploy instantly**

#### Option C: GitHub Pages
1. **Push to GitHub repository**
2. **Go to Settings** → **Pages**
3. **Enable GitHub Pages**
4. **Access at**: `https://username.github.io/repository-name`

### Step 6: Test Your App

1. **Open your deployed URL**
2. **Test all features**:
   - ✅ Employee preparation form
   - ✅ Manager preparation form
   - ✅ Session creation
   - ✅ Data persistence
   - ✅ PDF export
   - ✅ History viewing

### Step 7: Share with Users

Your app is now live! Users can:
- **Access from any device** with the URL
- **Fill preparations** independently
- **Run sessions** together
- **View history** and export PDFs
- **Data syncs** across all devices

## 🔧 Troubleshooting

### Supabase Connection Issues
- Check URL and API key are correct
- Ensure tables are created
- Verify RLS policies are set

### CORS Issues
- Supabase should handle CORS automatically
- If issues persist, check Supabase dashboard settings

### Data Not Saving
- Check browser console for errors
- Verify Supabase credentials
- Test with simple data first

## 💰 Cost

- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Netlify/Vercel**: Free tier (perfect for static sites)
- **Total**: $0/month for most use cases

## 🎯 Your Final URLs

After setup, you'll have:
- **App URL**: `https://your-app.netlify.app` (or similar)
- **Database**: Managed by Supabase
- **All data synced** across users and devices