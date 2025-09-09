import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
  const triggeredBy = body.triggered_by || 'cron'
  const isManualCleanup = triggeredBy === 'admin_manual'
  
  console.log(`=== AGGRESSIVE STORAGE CLEANUP STARTED ===`)
  console.log(`Triggered by: ${triggeredBy}`)
  console.log(`Manual cleanup (DELETE EVERYTHING): ${isManualCleanup}`)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get ALL buckets
    const { data: allBuckets } = await supabaseClient.storage.listBuckets()
    const buckets = allBuckets?.map(bucket => bucket.name) || []
    console.log(`Found buckets: ${buckets.join(', ')}`)
    
    // Test for additional common bucket names
    const testBuckets = ['temp', 'uploads', 'cache', 'thumbnails', 'previews', 'generated']
    for (const testBucket of testBuckets) {
      if (!buckets.includes(testBucket)) {
        try {
          const { data } = await supabaseClient.storage.from(testBucket).list('', { limit: 1 })
          if (data && data.length > 0) {
            buckets.push(testBucket)
            console.log(`Found additional bucket: ${testBucket}`)
          }
        } catch (err) {
          // Bucket doesn't exist
        }
      }
    }

    let totalDeleted = 0
    let totalScanned = 0
    let totalFreed = 0
    let errors = []

    // Process each bucket AGGRESSIVELY
    for (const bucketName of buckets) {
      console.log(`\n🗂️ PROCESSING BUCKET: ${bucketName}`)
      
      try {
        // Method 1: Standard list
        let allFiles = []
        let page = 0
        const limit = 1000
        
        while (true) {
          const { data: files, error } = await supabaseClient.storage
            .from(bucketName)
            .list('', { 
              limit, 
              offset: page * limit,
              sortBy: { column: 'created_at', order: 'asc' }
            })

          if (error) {
            console.error(`Error listing ${bucketName}:`, error)
            break
          }

          if (!files || files.length === 0) break
          
          allFiles = allFiles.concat(files)
          console.log(`Found ${files.length} files in page ${page + 1}`)
          
          if (files.length < limit) break
          page++
        }

        // Method 2: Try without sorting (sometimes catches more files)
        try {
          const { data: altFiles } = await supabaseClient.storage
            .from(bucketName)
            .list('', { limit: 10000 })
            
          if (altFiles) {
            const existingNames = new Set(allFiles.map(f => f.name))
            const newFiles = altFiles.filter(f => !existingNames.has(f.name))
            if (newFiles.length > 0) {
              allFiles = allFiles.concat(newFiles)
              console.log(`Alternative method found ${newFiles.length} additional files`)
            }
          }
        } catch (err) {
          console.log('Alternative listing failed:', err.message)
        }

        totalScanned += allFiles.length
        console.log(`📁 Total files found in ${bucketName}: ${allFiles.length}`)
        
        if (allFiles.length === 0) {
          console.log(`No files in ${bucketName}`)
          continue
        }

        // Show first few files for debugging
        console.log(`First 5 files:`, allFiles.slice(0, 5).map(f => ({
          name: f.name,
          size: f.metadata?.size,
          created: f.created_at
        })))

        // DELETE EVERYTHING in manual cleanup
        let filesToDelete = allFiles
        if (!isManualCleanup) {
          // For automatic cleanup, only delete files older than 1 day
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - 1)
          filesToDelete = allFiles.filter(f => {
            if (!f.created_at) return true // Delete files without timestamp
            return new Date(f.created_at) < cutoff
          })
        }

        console.log(`🗑️ Files to delete: ${filesToDelete.length}`)
        
        if (filesToDelete.length === 0) continue

        // Delete in batches of 10 (smaller batches for reliability)
        const batchSize = 10
        let deleted = 0
        
        for (let i = 0; i < filesToDelete.length; i += batchSize) {
          const batch = filesToDelete.slice(i, i + batchSize)
          const paths = batch.map(f => f.name)
          
          console.log(`Deleting batch ${Math.floor(i/batchSize) + 1}: ${paths.join(', ')}`)
          
          try {
            const { error: batchError } = await supabaseClient.storage
              .from(bucketName)
              .remove(paths)
            
            if (batchError) {
              console.error(`Batch delete failed:`, batchError.message)
              
              // Try one by one
              for (const path of paths) {
                try {
                  const { error: singleError } = await supabaseClient.storage
                    .from(bucketName)
                    .remove([path])
                  
                  if (!singleError) {
                    deleted++
                    console.log(`✅ Deleted: ${path}`)
                  } else {
                    console.error(`❌ Failed to delete ${path}:`, singleError.message)
                    errors.push(`${bucketName}/${path}: ${singleError.message}`)
                  }
                } catch (err) {
                  console.error(`❌ Exception deleting ${path}:`, err.message)
                  errors.push(`${bucketName}/${path}: ${err.message}`)
                }
                
                await new Promise(r => setTimeout(r, 100)) // Small delay
              }
            } else {
              deleted += paths.length
              console.log(`✅ Batch deleted: ${paths.length} files`)
              
              // Calculate freed space
              const batchSize = batch.reduce((sum, f) => sum + (f.metadata?.size || 500000), 0)
              totalFreed += batchSize
            }
            
          } catch (err) {
            console.error(`Batch error:`, err.message)
            errors.push(`Batch error in ${bucketName}: ${err.message}`)
          }
          
          await new Promise(r => setTimeout(r, 200)) // Delay between batches
        }
        
        totalDeleted += deleted
        console.log(`✅ Bucket ${bucketName} completed: ${deleted}/${filesToDelete.length} deleted`)
        
      } catch (bucketError) {
        const msg = `Error processing bucket ${bucketName}: ${bucketError.message}`
        console.error(msg)
        errors.push(msg)
      }
    }

    const duration = Date.now() - startTime
    const freedMB = totalFreed / (1024 * 1024)
    
    console.log(`\n🎉 CLEANUP COMPLETED`)
    console.log(`Files scanned: ${totalScanned}`)
    console.log(`Files deleted: ${totalDeleted}`)
    console.log(`Space freed: ${freedMB.toFixed(2)}MB`)
    console.log(`Errors: ${errors.length}`)
    console.log(`Duration: ${duration}ms`)

    // Log to database
    try {
      await supabaseClient
        .from('storage_cleanup_logs')
        .insert({
          total_files: totalScanned,
          deleted_files: totalDeleted,
          freed_space_mb: parseFloat(freedMB.toFixed(2)),
          errors: errors,
          success: errors.length === 0,
          triggered_by: triggeredBy
        })
    } catch (logErr) {
      console.error('Failed to log to database:', logErr)
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted ${totalDeleted} files, freed ${freedMB.toFixed(2)}MB`,
      stats: {
        totalFiles: totalScanned,
        deletedFiles: totalDeleted,
        freedSpaceMB: parseFloat(freedMB.toFixed(2)),
        errors: errors,
        durationMs: duration
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('CLEANUP FAILED:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})