# Migration Guide

This guide will help you apply the Supabase schema to your project and set up the necessary TypeScript types.

## Prerequisites

- A Supabase project created (https://supabase.com/dashboard)
- Your Supabase project URL and anon key
- Node.js and npm installed

## Step 1: Apply the Schema

### Option A: Using Supabase Dashboard (Recommended for most users)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

### Option B: Using Supabase CLI (Recommended for developers)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Apply the schema:
   ```bash
   supabase db push
   ```

## Step 2: Generate TypeScript Types

### Option A: Using Supabase CLI (Recommended)

1. Generate types:
   ```bash
   supabase gen types typescript --project-id YOUR_PROJECT_ID > web/lib/supabase/types.ts
   ```

2. Replace the existing `web/lib/supabase/types.ts` with the generated content

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Find the **TypeScript** section
4. Copy the generated types
5. Replace the content of `web/lib/supabase/types.ts` with the copied types

## Step 3: Configure Environment Variables

Create a `.env.local` file in the `web/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project under **Settings** > **API**.

## Step 4: Verify the Setup

1. Start the development server:
   ```bash
   cd web
   npm run dev
   ```

2. Check that the application loads without TypeScript errors

3. Test basic database operations by using the example functions in `web/lib/supabase/examples.ts`

## Step 5: Test Row Level Security

The schema includes Row Level Security (RLS) policies. To verify they work:

1. Create a test user in Supabase Auth
2. Try to insert data using that user's ID
3. Verify that users can only access their own data

## Common Issues and Solutions

### Issue: "relation 'auth.users' does not exist"
**Solution**: Make sure you've enabled Authentication in your Supabase project before applying the schema.

### Issue: Permission denied errors
**Solution**: Ensure you're running the SQL as the project owner or with sufficient privileges.

### Issue: TypeScript errors after generating types
**Solution**: Make sure the generated types match your schema. You may need to manually adjust the types if you modify the schema.

### Issue: RLS policies not working
**Solution**: Verify that:
1. RLS is enabled on all tables (should be in the schema)
2. The user is authenticated (has a valid JWT)
3. The policies reference the correct user ID column

## Next Steps

- Review the example functions in `web/lib/supabase/examples.ts`
- Implement your specific business logic using the typed database client
- Consider adding additional indexes based on your query patterns
- Set up database backups and monitoring in production

## Support

If you encounter issues:

1. Check the Supabase documentation: https://supabase.com/docs
2. Review the schema in `supabase/schema.sql` for any custom modifications
3. Verify your environment variables are correctly set
4. Check the Supabase dashboard logs for any error messages