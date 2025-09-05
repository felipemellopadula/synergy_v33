import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupStats {
  totalFiles: number
  deletedFiles: number
  freedSpace: number
  errors: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const buckets = ['images', 'documents', 'user-videos', 'video-refs']
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7) // Remove files older than 7 days

    let totalStats: CleanupStats = {
      totalFiles: 0,
      deletedFiles: 0,
      freedSpace: 0,
      errors: []
    }

    console.log(`Starting storage cleanup for files older than ${cutoffDate.toISOString()}`)

    for (const bucketName of buckets) {
      console.log(`Processing bucket: ${bucketName}`)
      
      try {
        // List all files in bucket
        const { data: files, error: listError } = await supabaseClient.storage
          .from(bucketName)
          .list('', {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'asc' }
          })

        if (listError) {
          console.error(`Error listing files in ${bucketName}:`, listError)
          totalStats.errors.push(`Error listing ${bucketName}: ${listError.message}`)
          continue
        }

        if (!files || files.length === 0) {
          console.log(`No files found in bucket ${bucketName}`)
          continue
        }

        totalStats.totalFiles += files.length
        console.log(`Found ${files.length} files in ${bucketName}`)

        // Filter files older than cutoff date
        const filesToDelete = files.filter(file => {
          const fileDate = new Date(file.created_at)
          return fileDate < cutoffDate
        })

        console.log(`Found ${filesToDelete.length} files to delete in ${bucketName}`)

        if (filesToDelete.length === 0) {
          continue
        }

        // Delete files in batches of 50
        const batchSize = 50
        for (let i = 0; i < filesToDelete.length; i += batchSize) {
          const batch = filesToDelete.slice(i, i + batchSize)
          const pathsToDelete = batch.map(file => file.name)

          console.log(`Deleting batch of ${pathsToDelete.length} files from ${bucketName}`)

          const { error: deleteError } = await supabaseClient.storage
            .from(bucketName)
            .remove(pathsToDelete)

          if (deleteError) {
            console.error(`Error deleting batch from ${bucketName}:`, deleteError)
            totalStats.errors.push(`Error deleting batch from ${bucketName}: ${deleteError.message}`)
          } else {
            totalStats.deletedFiles += pathsToDelete.length
            // Estimate freed space (rough calculation based on file metadata)
            const estimatedSize = batch.reduce((sum, file) => sum + (file.metadata?.size || 1000000), 0)
            totalStats.freedSpace += estimatedSize
            console.log(`Successfully deleted ${pathsToDelete.length} files from ${bucketName}`)
          }

          // Small delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Clean up database records for deleted images
        if (bucketName === 'images' && filesToDelete.length > 0) {
          const imagePaths = filesToDelete.map(file => file.name)
          const { error: dbError } = await supabaseClient
            .from('user_images')
            .delete()
            .in('image_path', imagePaths)

          if (dbError) {
            console.error('Error cleaning up user_images records:', dbError)
            totalStats.errors.push(`Error cleaning user_images: ${dbError.message}`)
          } else {
            console.log(`Cleaned up ${imagePaths.length} user_images records`)
          }
        }

        // Clean up database records for deleted videos
        if (bucketName === 'user-videos' && filesToDelete.length > 0) {
          const videoPaths = filesToDelete.map(file => file.name)
          const { error: dbError } = await supabaseClient
            .from('user_videos')
            .delete()
            .in('video_url', videoPaths.map(path => `${bucketName}/${path}`))

          if (dbError) {
            console.error('Error cleaning up user_videos records:', dbError)
            totalStats.errors.push(`Error cleaning user_videos: ${dbError.message}`)
          } else {
            console.log(`Cleaned up ${videoPaths.length} user_videos records`)
          }
        }

      } catch (error) {
        console.error(`Unexpected error processing bucket ${bucketName}:`, error)
        totalStats.errors.push(`Unexpected error in ${bucketName}: ${error.message}`)
      }
    }

    // Log final stats
    console.log('Storage cleanup completed:', {
      totalFiles: totalStats.totalFiles,
      deletedFiles: totalStats.deletedFiles,
      freedSpaceMB: Math.round(totalStats.freedSpace / 1024 / 1024),
      errorCount: totalStats.errors.length
    })

    const response = {
      success: true,
      message: 'Storage cleanup completed',
      stats: {
        totalFiles: totalStats.totalFiles,
        deletedFiles: totalStats.deletedFiles,
        freedSpaceMB: Math.round(totalStats.freedSpace / 1024 / 1024),
        errors: totalStats.errors
      },
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Storage cleanup failed:', error)
    
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