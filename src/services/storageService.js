
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a resume PDF buffer to Supabase Storage.
 * @param {SupabaseClient} supabase - Authenticated Supabase client
 * @param {string} userId - ID of the user owning the resume
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} bucketName - storage bucket name, default 'resumes'
 * @returns {Promise<string>} - The path/ID of the uploaded file
 */
export const uploadResumePDF = async (supabase, userId, pdfBuffer, bucketName = 'resumes') => {
    const fileName = `${userId}/${Date.now()}_${uuidv4()}.pdf`;

    // Check if bucket exists
    const { error: getBucketError } = await supabase
        .storage
        .getBucket(bucketName);

    if (getBucketError) {
        // Bucket does not exist or is not accessible. Try to create it.
        console.log(`Bucket '${bucketName}' not found. Attempting to create...`);
        const { error: createBucketError } = await supabase
            .storage
            .createBucket(bucketName, {
                public: false,
                allowedMimeTypes: ['application/pdf'],
                fileSizeLimit: 5242880 // 5MB
            });

        if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            throw new Error(`Storage bucket '${bucketName}' not found and could not be created automatically. Please create a PRIVATE bucket named '${bucketName}' in your Supabase project dashboard.`);
        }
    }

    const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false // Avoid overwriting if by some miracle filename collides
        });

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    return data.path;
};
